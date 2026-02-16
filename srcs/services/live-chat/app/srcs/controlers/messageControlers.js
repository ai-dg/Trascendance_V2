import { app, authData, redis } from '../../server.js';
import jwt from 'jsonwebtoken';

export async function send_message_route(request, reply) {
    const { receiverId, message } = request.body;
    const token = request.cookies.token || request.body.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });

    let payload;
        try {
            payload = jwt.verify(token, authData.jwt);
        } catch (err) {
            console.log("payload live-chat error:", err);
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }
    const senderId = payload.user_id;

    try {
        const relation = await app.db.get(`
            SELECT status, requester_id 
            FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);

        if (!relation || relation.status !== 'accepted') {
            
            if (relation && relation.status === 'blocked') {
                if (relation.requester_id === senderId) {
                    return reply.code(200).send({ success: false, message: "You blocked this user. Unblock to send messages." });
                } 
                else {
                    return reply.code(200).send({ success: false, message: "You cannot send messages to this user." });
                }
            }
            
            return reply.code(200).send({ success: false, message: "You are not friends with this user." });
        }
        
        await app.db.run(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (?, ?, ?)
        `, [senderId, receiverId, message]);


        await redis.publish('notifications', JSON.stringify({
            targetUserId: receiverId,
            event: 'notifications',
            payload: {
                type: 'new-message',
                senderId: senderId,
                message: message
            }
        }));

        return reply.send({ success: true });
    } catch (err) {
        console.error("DB error:", err);
        return reply.code(500).send({ success: false, message: "Error to save message" });
    }
}

export async function get_messages_route(request, reply) {
    const { friendId } = request.query;
    if (!friendId) return reply.send({ success: true, messages: [] });

    const token = request.cookies.token || request.body.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    let payload;
        try {
            payload = jwt.verify(token, authData.jwt);
        } catch (err) {
            console.log("payload live-chat error:", err);
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }
    const userId = payload.user_id;

    try {
        const messages = await app.db.all(`
            SELECT sender_id, content, sent_at 
            FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY sent_at ASC
        `, [userId, friendId, friendId, userId]);

        return reply.send({ success: true, messages });
    } catch (err) {
        return reply.code(500).send({ success: false });
    }
};

export async function mark_as_read_route(request, reply) {
    const { senderId } = request.body;
    const token = request.cookies.token || request.body.token;

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.log("payload live-chat error:", err);
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
    const userId = payload.user_id;
    try {
        await app.db.run(`
            UPDATE messages
            SET is_read = 1
            WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
            `, [senderId, userId]);
        
        await redis.publish('notifications', JSON.stringify({
            targetUserId: senderId,
            event: 'notifications',
            payload: {
                type: 'message-read',
                readerId: userId
            }
    }));
        return reply.send({ success: true });
    } catch (err) {
        console.error("DB error:", err);
        return reply.code(500).send({ success: false, message: "Error to mark messages as read" });
    }
}

export async function typing_route(request, reply) {
    const { receiverId } = request.body;
    const token = request.cookies.token || request.body.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });

    let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.log("payload live-chat error:", err);
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }
    const senderId = payload.user_id;

    try {
        await redis.publish('notifications', JSON.stringify({
            targetUserId: receiverId,
            event: 'notifications',
            payload: {
                type: 'typing',
                senderId: senderId
            }
        }));
        return reply.send({ success: true });
    } catch (err) {
        console.error("Redis error:", err);
        return reply.code(500).send({ success: false, message: "Error to send typing notification" });
    }
}
