// Core business logic for game invites: send, accept/decline, state updates, HTTP callback handler
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// Using Node 20 built-in fetch
import { app, redis } from '../../server.js';

// Helper: verify JWT and return userId
async function verifyUserJWT(token) {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return payload.user_id;
    } catch {
        return null;
    }
}

// Helper: check friendship status (friendships stored as single row, check both directions)
async function areFriends(userId, friendId) {
    const row = await app.db.get(`
        SELECT status FROM friendships
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);
    return row && row.status === 'accepted';
}

// Helper: get username by userId
async function getUsername(userId) {
    // You may want to cache this or fetch from auth service
    return `User${userId}`;
}

export async function send_game_invite_route(request, reply) {
    const { receiverId, token } = request.body;
    const senderToken = token || request.cookies?.token;
    const senderId = await verifyUserJWT(senderToken);
    if (!senderId) return reply.code(401).send({ success: false, message: 'Unauthorized' });
    if (senderId === receiverId) return reply.code(400).send({ success: false, message: 'Cannot invite yourself' });
    if (!await areFriends(senderId, receiverId)) return reply.code(403).send({ success: false, message: 'Not friends' });

    // Check for duplicate pending invite
    const existingInvite = await app.db.get(`
        SELECT invitation_id FROM game_invitations
        WHERE (inviter_id = ? AND invitee_id = ? OR inviter_id = ? AND invitee_id = ?)
          AND state = 'pending' AND expires_at > datetime('now')
    `, [senderId, receiverId, receiverId, senderId]);
    if (existingInvite) return reply.code(409).send({ success: false, message: 'Invite already pending' });

    // --- Check if either user is already in a game (call remote-players internal API) ---
    try {
        const serviceToken = jwt.sign({ service: 'live-chat' }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const checkRes = await fetch('https://remote-players_app:3004/check-in-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceToken}` },
            body: JSON.stringify({ userIds: [senderId, receiverId] })
        });
        if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData && checkData.inGame && checkData.inGame.length > 0) {
                return reply.code(409).send({ success: false, message: 'One or both users are already in a game' });
            }
        } else {
            // If the check fails, be safe and block the invite
            return reply.code(500).send({ success: false, message: 'Failed to check in-game status' });
        }
    } catch (err) {
        return reply.code(500).send({ success: false, message: 'Error checking in-game status' });
    }

    // Insert message
    const res = await app.db.run(`
        INSERT INTO messages (sender_id, receiver_id, content, message_type, game_state, expires_at)
        VALUES (?, ?, ?, 'game-invite', 'pending', datetime('now', '+5 minutes'))
    `, [senderId, receiverId, '',]);
    const messageId = res.lastID;

    // Insert game_invitations
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const invitationRes = await app.db.run(`
        INSERT INTO game_invitations (message_id, inviter_id, invitee_id, state, expires_at)
        VALUES (?, ?, ?, 'pending', ?)
    `, [messageId, senderId, receiverId, expiresAt]);
    const invitationId = invitationRes.lastID;

    // Notify invitee
    const username = await getUsername(senderId);
    await redis.publish('notifications', JSON.stringify({
        targetUserId: receiverId,
        event: 'notifications',
        payload: {
            type: 'game-invite',
            messageId,
            senderId,
            senderUsername: username,
            state: 'pending'
        }
    }));
    return reply.send({ success: true, messageId, invitationId });
}

export async function respond_to_game_invite_route(request, reply) {
    const { messageId, action, token } = request.body;
    const userToken = token || request.cookies?.token;
    const userId = await verifyUserJWT(userToken);
    if (!userId) return reply.code(401).send({ success: false, message: 'Unauthorized' });
    const invitation = await app.db.get(`
        SELECT * FROM game_invitations WHERE message_id = ?
    `, [messageId]);
    if (!invitation) return reply.code(404).send({ success: false, message: 'Invite not found' });
    if (invitation.invitee_id !== userId) return reply.code(403).send({ success: false, message: 'Not invitee' });
    if (invitation.state !== 'pending') return reply.code(409).send({ success: false, message: 'Invite not pending' });
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) return reply.code(410).send({ success: false, message: 'Invite expired' });

    // TODO: Check if either user is already in a game (call remote-players internal API)

    if (action === 'decline') {
        await app.db.run(`UPDATE game_invitations SET state = 'declined' WHERE invitation_id = ?`, [invitation.invitation_id]);
        await app.db.run(`UPDATE messages SET game_state = 'declined' WHERE message_id = ?`, [messageId]);
        // Notify inviter
        await redis.publish('notifications', JSON.stringify({
            targetUserId: invitation.inviter_id,
            event: 'notifications',
            payload: {
                type: 'game-invite-declined',
                messageId,
                state: 'declined'
            }
        }));
        return reply.send({ success: true });
    }
    if (action === 'accept') {
        const gameUUID = crypto.randomUUID();
        // Create game on remote-players
        const serviceToken = jwt.sign({ service: 'live-chat' }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const gameRes = await fetch('https://remote-players_app:3004/create-private-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceToken}` },
            body: JSON.stringify({
                gameUUID,
                player1Id: invitation.inviter_id,
                player2Id: invitation.invitee_id
            })
        });
        if (!gameRes.ok) return reply.code(500).send({ success: false, message: 'Failed to create game' });
        await app.db.run(`UPDATE game_invitations SET state = 'accepted', game_uuid = ? WHERE invitation_id = ?`, [gameUUID, invitation.invitation_id]);
        await app.db.run(`UPDATE messages SET game_uuid = ?, game_state = 'accepted' WHERE message_id = ?`, [gameUUID, messageId]);
        // Notify both users
        for (const targetUserId of [invitation.inviter_id, invitation.invitee_id]) {
            await redis.publish('notifications', JSON.stringify({
                targetUserId,
                event: 'notifications',
                payload: {
                    type: 'game-invite-accepted',
                    messageId,
                    gameUUID,
                    state: 'accepted'
                }
            }));
        }
        return reply.send({ success: true, gameUUID });
    }
    return reply.code(400).send({ success: false, message: 'Invalid action' });
}

export async function join_game_route(request, reply) {
    const { messageId, token } = request.body;
    const userToken = token || request.cookies?.token;
    const userId = await verifyUserJWT(userToken);
    if (!userId) return reply.code(401).send({ success: false, message: 'Unauthorized' });
    const invitation = await app.db.get(`SELECT * FROM game_invitations WHERE message_id = ?`, [messageId]);
    if (!invitation) return reply.code(404).send({ success: false, message: 'Invite not found' });
    if (![invitation.inviter_id, invitation.invitee_id].includes(userId)) return reply.code(403).send({ success: false, message: 'Not a participant' });
    return reply.send({ success: true, gameUUID: invitation.game_uuid });
}

export async function update_game_state_route(request, reply) {
    const { gameUUID, state, metadata } = request.body;
    // Accept token from Authorization header or body
    const authHeader = request.headers.authorization;
    const serviceToken = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.substring(7)
        : request.body.serviceToken;
    if (!serviceToken) return reply.code(401).send({ success: false, message: 'Missing service token' });
    try {
        const payload = jwt.verify(serviceToken, process.env.JWT_SECRET);
        if (payload.service !== 'remote-players') return reply.code(403).send({ success: false, message: 'Forbidden' });
    } catch {
        return reply.code(401).send({ success: false, message: 'Invalid token' });
    }
    const invitation = await app.db.get(`SELECT * FROM game_invitations WHERE game_uuid = ?`, [gameUUID]);
    if (!invitation) return reply.code(404).send({ success: false, message: 'Invite not found' });
    await app.db.run(`UPDATE game_invitations SET state = ?, updated_at = CURRENT_TIMESTAMP WHERE invitation_id = ?`, [state, invitation.invitation_id]);
    await app.db.run(`UPDATE messages SET game_state = ?, game_metadata = ? WHERE message_id = ?`, [state, JSON.stringify(metadata || {}), invitation.message_id]);
    // Notify both users
    for (const targetUserId of [invitation.inviter_id, invitation.invitee_id]) {
        await redis.publish('notifications', JSON.stringify({
            targetUserId,
            event: 'notifications',
            payload: {
                type: 'game-state-update',
                messageId: invitation.message_id,
                gameUUID,
                state,
                metadata
            }
        }));
    }
    return reply.send({ success: true });
}
