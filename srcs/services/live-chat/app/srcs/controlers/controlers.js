import { app, redis } from '../../server.js';
import jwt from 'jsonwebtoken';



export async function friend_request_route(request, reply) {
    const token = request.cookies.token || request.body.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        app.log.info("payload live-chat error:", err);
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
    const{ receiverId } = request.body;
    const userId = payload.user_id;

    try {
        app.log.info(`User ${userId} is sending a friend request to ${receiverId}`);
        const exiting = await app.db.get(`
            SELECT * FROM friendships
            WHERE (user_id = ? AND friend_id = ?)
               OR (user_id = ? AND friend_id = ?)
        `, [userId, receiverId, receiverId, userId]);

        if (exiting) {
            app.log.info("Friendship already exists:", exiting);
            return reply.code(400).send({ success: false, message: "Friendship already exists or pending" });
        }

        await app.db.run(`
            INSERT INTO friendships (user_id, friend_id, status, requester_id)
            VALUES (?, ?, 'pending', ?)
            ON CONFLICT(user_id, friend_id) DO NOTHING
        `, [userId, receiverId, userId]);

        let username = `User ${userId}`;
        try {
        const res = await fetch(`https://auth_app:3000/username-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId }),
        });
        if (res.ok) {
            const userData = await res.json();
            app.log.info(`Username found for user ${userId}:`, userData.data?.user?.pseudo);
            if (userData.data?.user?.pseudo) {
                username = userData.data.user.pseudo;
            }
        }
        else {
            app.log.info(`Failed to fetch username for user ${userId}:`, res.status);
        }
        } catch (error) {
            app.log.error(`Error fetching user ${userId}:`, error);
        }

        app.log.info("Publishing friend-request via Redis");

        await redis.publish('notifications', JSON.stringify({
            targetUserId: receiverId,
            event: 'notifications',
            payload: {
                type: 'friend-request',
                userId: userId,
                message: `User ${username} wants to be your friend!`
            }
        }));

        return reply.send({ success: true, message: "friend requested", receiverId });
    } catch (dbErr) {
         if (dbErr.code === "SQLITE_CONSTRAINT") {
            return reply.code(400).send({ success: false, message: dbErr.message });
        }
    }

}


export async function friend_request_response_route(request, reply) {
    let token = request.cookies.token || request.body.token;

    if (!token) {
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }

    const userId = payload.user_id;
    const { senderId, action } = request.body;

    try {
        app.log.info(`User ${userId} is trying to ${action} friend request from ${senderId}`);
        if (action === 'accept') {
            // Update status to 'accepted'
            const res = await app.db.run(`
                UPDATE friendships
                SET status = 'accepted'
                WHERE user_id = ? AND friend_id = ? AND status = 'pending'
            `, [senderId, userId]);

            if (res.changes === 0) {
                app.log.info("No pending friend request found to accept");
                return reply.code(400).send({ success: false, message: "No pending friend request found" });
            }
        } else {
            app.log.info(`User ${userId} is rejecting friend request from ${senderId}`);
            // Delete the request if rejected
            const data = await app.db.run(`
                DELETE FROM friendships
                WHERE (user_id = ? AND friend_id = ? AND status = 'pending')
                OR (friend_id = ? AND user_id = ? AND status = 'pending')
            `, [senderId, userId, senderId, userId]);
            app.log.info(`Delete operation result:`, data);
            app.log.info("Friend request rejected and removed from DB");
        }
        app.log.info("Publishing notifications via Redis");

        await redis.publish('notifications', JSON.stringify({
            targetUserId: senderId,
            event: 'notifications',
            payload: {
                type: 'friend-request-accepted',
                userId: userId,
                action: action,
                message: `User ${userId} ${action === 'accept' ? 'accepted' : 'rejected'} your request.`
            }
        }));
        app.log.info("Publishing clear-notification via Redis");

        await redis.publish('notifications', JSON.stringify({
            targetUserId: userId,
            event: 'notifications',
            payload: {
                type: 'clear-notification',
                senderId: senderId
            }
        }));

        return reply.send({
            success: true,
            message: action === 'accept' ? "Friend request accepted" : "Friend request rejected"
        });
    } catch (dbErr) {
        app.log.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}


export async function get_friends_route(request, reply) {
    const token = request.cookies.token || request.body.token;
    if (!token) {
        return { success: false, message: "Not authenticated" };
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { success: false, message: "Invalid or expired token" };
    }

    const userId = payload.user_id;

    try {
        const friendships = await app.db.all(`
            SELECT DISTINCT
                CASE
                    WHEN user_id = ? THEN friend_id
                    ELSE user_id
                END as friend_id
            FROM friendships
            WHERE (user_id = ? OR friend_id = ?)
              AND status = 'accepted'
        `, [userId, userId, userId]);

        if (!friendships || friendships.length === 0) {
            return { success: true, friends: [] };
        }

        const friends = await Promise.all(
            friendships.map(async (friendship) => {
                try {
                    const res = await fetch(`https://auth_app:3000/username-id`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ id: friendship.friend_id }),
                    });
                    if (!res.ok) {
                        app.log.info(`Failed to fetch username for user ${friendship.friend_id}:`, res.status);
                    }
                    if (res.ok) {
                        const userData = await res.json();
                        app.log.info(`Username found for user ${friendship.friend_id}:`, userData);
                        const username = userData.data?.user?.pseudo || `User ${friendship.friend_id}`;
                        const avatar = userData.data?.user?.avatar || null;
                        return {
                            id: friendship.friend_id,
                            username: username,
                            avatar: avatar
                        };
                    }
                } catch (error) {
                    app.log.error(`Error fetching user ${friendship.friend_id}:`, error);
                }
                return {
                    id: friendship.friend_id,
                    username: `User ${friendship.friend_id}`,
                    avatar: `User ${friendship.friend_id}`
                };
            })
        );

        return { success: true, friends };
    } catch (err) {
        app.log.error("DB error:", err);
        return { success: false, message: "Database error" };
    }
}


export async function get_pending_requests_route(request, reply) {
    app.log.info('Fetching pending requests');

    const token = request.cookies.token;
    if (!token) {
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { success: false, message: "Invalid or expired token" };
    }

    const userId = payload.user_id;

    app.log.info('🔍 Loading pending requests for user:', userId);

    try {
        const pendingRequests = await app.db.all(`
            SELECT
                CASE
                    WHEN user_id = ? THEN friend_id
                    ELSE user_id
                END as senderId,
                requester_id
            FROM friendships
            WHERE (user_id = ? OR friend_id = ?)
              AND status = 'pending'
              AND requester_id != ?
        `, [userId, userId, userId, userId]);

        app.log.info('Found pending requests from DB:', pendingRequests);

        if (!pendingRequests || pendingRequests.length === 0) {
            return reply.send({ success: true, requests: [] });
        }

        const oldKeys = await redis.keys(`friend-request:${userId}:*`);
        if (oldKeys.length > 0) {
            app.log.info(`Cleaning up ${oldKeys.length} old Redis keys for user ${userId}`);
            await redis.del(oldKeys);
        }

        const requests = await Promise.all(
            pendingRequests.map(async (req) => {
                const currentSenderId = req.senderId || req.senderid;
                app.log.info(`Processing pending request from senderId: ${currentSenderId}`);
                try {
                    const res = await fetch(`https://auth_app:3000/username-id`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ id: currentSenderId }),
                    });
                    if (!res.ok) {
                        app.log.info(`Failed to fetch username for user ${currentSenderId}:`, res.status);
                    }
                    if (res.ok) {
                        const userData = await res.json();
                        app.log.info(`Username found for user ${currentSenderId}:`, userData.data?.user?.pseudo);
                        const username = userData.data?.user?.pseudo || `User ${currentSenderId}`;
                        return {
                            senderId: currentSenderId,
                            message: `${username} wants to be your friend!`
                        };
                    }
                } catch (error) {
                    app.log.error(`Error fetching user ${currentSenderId}:`, error);
                }
                return {
                    senderId: currentSenderId,
                    message: `User ${currentSenderId} wants to be your friend!`
                };
            })
        );

        app.log.info('Returning pending requests:', requests);
        return reply.send({ success: true, requests });

    } catch (error) {
        app.log.error('Error fetching pending requests:', error);
        return reply.code(500).send({ success: false, message: "Server error" });
    }
}

export async function block_friend_route(request, reply) {
    const { friendId } = request.body;
    const token = request.cookies.token || request.body.token;

    if (!token) {
        return { success: false, message: "Not authenticated" };
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { success: false, message: "Invalid or expired token" };
    }

    const userId = payload.user_id;
    app.log.info(`User ${userId} is trying to block friend ${friendId}`);

    try {

        const currentRelation = await app.db.get(`
            SELECT status, requester_id
            FROM friendships
            WHERE (user_id = ? AND friend_id = ?)
               OR (user_id = ? AND friend_id = ?)
        `, [userId, friendId, friendId, userId]);

        app.log.info("Current relation fetched:", currentRelation);

        if (!currentRelation) {
            return reply.code(400).send({ success: false, message: "No existing friendship to block" });
        }

        if (currentRelation.status === 'blocked') {
            if (currentRelation.requester_id === userId) {
                return reply.code(400).send({ success: false, message: "User is already blocked" });
            } else {
                return reply.code(400).send({ success: false, message: "You have been blocked by this user" });
            }
        }

        if (currentRelation.status === 'pending') {
            return reply.code(400).send({ success: false, message: "Cannot block a pending friend request" });
        }


        app.log.info(`Blocking friendship between ${userId} and ${friendId}`);
            const friendship = await app.db.run(`
                UPDATE friendships
                SET status = 'blocked', requester_id = ?
                WHERE (user_id = ? AND friend_id = ?)
                OR (user_id = ? AND friend_id = ?)
            `, [userId, userId, friendId, friendId, userId]);

            if (friendship.changes === 0) {
                return reply.code(400).send({ success: false, message: "No active friendship to block" });
            }

                await app.db.run(`
                    INSERT INTO friendships (user_id, friend_id, status, requester_id)
                    VALUES (?, ?, 'blocked', ?)
                    ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'blocked', requester_id = ?
                `, [userId, friendId, userId, userId]);

            await redis.publish('notifications', JSON.stringify({
                targetUserId: userId,
                event: 'friend-blocked',
                payload: { friendId }
            }));
            return reply.code(200).send({
                success: true,
                message: "Friend blocked"
            });
    } catch (dbErr) {
        app.log.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}

export async function remove_friend(request, reply) {
    app.log.info('Remove friend route called');
    const { friendId } = request.body;
    const token = request.cookies.token || request.body.token;

    if (!token) {
        return { success: false, message: "Not authenticated" };
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { success: false, message: "Invalid or expired token" };
    }

    const userId = payload.user_id;
    app.log.info(`User ${userId} is trying to remove friend ${friendId}`);
    try {
            const res = await app.db.run(`
                DELETE FROM friendships
                WHERE (user_id = ? AND friend_id = ?)
                    OR (user_id = ? AND friend_id = ?)
            `, [userId, friendId, friendId, userId]);
            app.log.info(`Friendship removal result:`, res);
            if (res.changes === 0) {
                return reply.code(400).send({ success: false, message: "No active friendship to remove" });
            }
            app.log.info("Successfully removed friendship from DB");

            await redis.publish('notifications', JSON.stringify({
                targetUserId: userId,
                event: 'friend-removed',
                payload: { friendId }
            }));
            return reply.code(200).send({
                success: true,
                message: "Friend removed"
            });
    } catch (dbErr) {
        app.log.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: dbErr.message });
    }
}

export async function add_friend(request, reply) {
			const senderId = request.user.user_id || request.user.id || request.user.sub;
            const { receiverId } = request.body;
            const token = request.cookies.token || request.body.token;

			app.log.info(`User ${senderId} wants to add user ${receiverId} as a friend`);

			try {
				const resData = await createFriendRequest(token, receiverId);

				if (!resData.success) {
					app.log.error('Failed to request friend in DB:', resData);
					return reply.code(400).send({
						success: false,
						message: resData.message ||'Failed to send request'
					});
				}

                    let username = `User ${senderId}`;
                    const res = await fetch(`https://auth_app:3000/username-id`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ id: senderId }),
                    });
                    if (!res.ok) {
                        app.log.info(`Failed to fetch username for user ${senderId}:`, res.status);
                    }
                    if (res.ok) {
                        const userData = await res.json();
                        app.log.info(`Username found for user ${senderId}:`, userData.data?.user?.pseudo);
                        if (userData.data?.user?.pseudo) {
                            username = userData.data.user.pseudo;
                        }
                    }
				const isOnline = await redis.get(`online:${receiverId}`);

                if (isOnline === 'true') {
                    app.log.info(`Receiver ${receiverId} is online, publishing to Redis`);
                    await redis.publish('notifications', JSON.stringify({
                        targetUserId: receiverId,
                        event: 'friend-request',
                        payload: {
                            senderId,
                            message: `User ${username} wants to be your friend!`
                        }
                    }));
				} else {
				    app.log.info('Receiver offline, saving to Redis');
				    await redis.set(`friend-request:${receiverId}:${senderId}`, 'pending');
				    app.log.info(`Friend request from ${senderId} saved in Redis for ${receiverId}`);
				}

				return reply.code(200).send({
                    success: true,
                    message: 'Friend request sent',
                    senderId
                });
			} catch (error) {
				app.log.error("Error with friend request:", error);
				return reply.code(500).send({
                    success: false,
                    message: 'Server error'
                });
			}

        }

export async function get_blocked_users_route(request, reply) {
    const token = request.cookies.token || request.body.token;
    if (!token) {
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }

    const userId = payload.user_id;

    try {
        const blockedUsers = await app.db.all(`
            SELECT DISTINCT
                CASE
                    WHEN user_id = ? THEN friend_id
                    ELSE user_id
                END as blocked_user_id
            FROM friendships
            WHERE (user_id = ? OR friend_id = ?)
              AND status = 'blocked'
              AND requester_id = ?
        `, [userId, userId, userId, userId]);

        const blockedUsersDetails = [];

        for (const row of blockedUsers) {
            const BId = row.blocked_user_id;
            try {
                const res = await fetch(`https://auth_app:3000/username-id`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ id: BId }),
                });
                if (res.ok) {
                    const userData = await res.json();
                    blockedUsersDetails.push({
                        id: BId,
                        username: userData.data?.user?.pseudo || `User ${BId}`,
                        avatar: userData.data?.user?.avatar || null
                    });
                }
            } catch (error) {
                app.log.error(`Error fetching user ${BId}:`, error);
            }
        }

        return reply.send({ success: true, blockedUsers: blockedUsersDetails });
    } catch (err) {
        app.log.error("DB error:", err);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}

export async function unblock_user_route(request, reply) {
    const { blockedId } = request.body;
    const token = request.cookies.token || request.body.token;

    if (!token) {
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }

    const userId = payload.user_id;

    try {
            const res = await app.db.run(`
                UPDATE friendships
                SET status = 'accepted'
                WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
                      AND status = 'blocked'
                      AND requester_id = ?
                `, [userId, blockedId, blockedId, userId, userId]);

            if (res.changes === 0) {
                return reply.code(400).send({ success: false, message: "No blocked user to unblock" });
            }

            await redis.publish('notifications', JSON.stringify({
            targetUserId: userId,
                event: 'notifications',
                payload: {
                    type: 'unblocked',
                    message: `User unblocked.`
                }
            }));
            return reply.code(200).send({
                success: true,
                message: "User unblocked"
            });
    } catch (dbErr) {
        app.log.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}

