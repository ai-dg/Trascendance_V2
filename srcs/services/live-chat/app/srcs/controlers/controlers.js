import { app, redis } from '../../server.js';
import jwt from 'jsonwebtoken';
// import { verify } from 'jsonwebtoken';



export async function friend_request_route(request, reply) {
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
    const{ receiverId } = request.body;
    const userId = payload.user_id;

    try {
        console.log(`User ${userId} is sending a friend request to ${receiverId}`);
        await app.db.run(`
            INSERT INTO friendships (user_id, friend_id, status, requester_id)
            VALUES (?, ?, 'pending', ?)
            ON CONFLICT(user_id, friend_id) DO NOTHING
        `, [userId, receiverId, userId]);

        console.log("Publishing friend-request via Redis");

        await redis.publish('notifications', JSON.stringify({
            targetUserId: receiverId,
            event: 'notifications',
            payload: {
                type: 'friend-request',
                userId: userId,
                message: `User ${userId} wants to be your friend!`
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
    
    const { senderId, action } = request.body;
    const userId = payload.user_id;
    
    try {
        console.log(`User ${userId} is trying to ${action} friend request from ${senderId}`);
        if (action === 'accept') {
            // Update status to 'accepted'
            await app.db.run(`
                UPDATE friendships 
                SET status = 'accepted' 
                WHERE user_id = ? AND friend_id = ?
            `, [userId, senderId]);
        } else {
            // Delete the request if rejected
            await app.db.run(`
                DELETE FROM friendships 
                WHERE user_id = ? AND friend_id = ?
            `, [userId, senderId]);
        }
        console.log("Publishing notifications via Redis");

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
        console.log("Publishing clear-notification via Redis");

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
        console.error('DB error:', dbErr);
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
            SELECT 
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
                        console.log(`Failed to fetch username for user ${friendship.friend_id}:`, res.status);
                    }
                    if (res.ok) {
                        const userData = await res.json();
                        console.log(`Username found for user ${friendship.friend_id}:`, userData);
                        const username = userData.data?.user?.pseudo || `User ${friendship.friend_id}`;
                        const avatar = userData.data?.user?.avatar || null;
                        return {
                            id: friendship.friend_id,
                            username: username,
                            avatar: avatar
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching user ${friendship.friend_id}:`, error);
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
        console.error("DB error:", err);
        return { success: false, message: "Database error" };
    }
}


export async function get_pending_requests_route(request, reply) {
    console.log('Fetching pending requests');

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

    console.log('🔍 Loading pending requests for user:', userId);
    
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
        
        console.log('Found pending requests from DB:', pendingRequests);
        
        if (!pendingRequests || pendingRequests.length === 0) {
            return reply.send({ success: true, requests: [] });
        }

        const oldKeys = await redis.keys(`friend-request:${userId}:*`);
        if (oldKeys.length > 0) {
            console.log(`Cleaning up ${oldKeys.length} old Redis keys for user ${userId}`);
            await redis.del(oldKeys);
        }
        
        const requests = await Promise.all(
            pendingRequests.map(async (req) => {
                try {
                    const res = await fetch(`https://auth_app:3000/username-id`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ id: req.senderId }),
                    });
                    if (!res.ok) {
                        console.log(`Failed to fetch username for user ${req.senderId}:`, res.status);
                    }
                    if (res.ok) {
                        const userData = await res.json();
                        console.log(`Username found for user ${req.senderId}:`, userData.user);
                        const username = userData.data?.user?.pseudo || `User ${req.senderId}`;
                        return {
                            senderId: req.senderId,
                            message: `${username} wants to be your friend!`
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching user ${req.senderId}:`, error);
                }
                return {
                    senderId: req.senderId,
                    message: `User ${req.senderId} wants to be your friend!`
                };
            })
        );
        
        console.log('Returning pending requests:', requests);
        return reply.send({ success: true, requests });
        
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return reply.code(500).send({ success: false, message: "Server error" });
    }
}

export async function block_friend_route(request, reply) {
    const userId = request.user.user_id || request.user.id || request.user.sub;
    const { friendId } = request.body;
    const token = request.cookies.token || request.body.token;
    
    if (!token) {
        return { success: false, message: "Not authenticated" };
    }
    
    try {
            const friendship = await app.db.run(`
                UPDATE friendships 
                SET status = 'blocked', requester_id = ?
                WHERE (user_id = ? AND friend_id = ?)
                OR (user_id = ? AND friend_id = ?)
            `, [userId, userId, friendId, friendId, userId]);
        
            
            if (!friendship.changes == 0) {
                return reply.code(400).send({ success: false, message: "No active friendship to block" });
            }

            await redis.publish('notifications', JSON.stringify({
                targetUserId: userId,
                event: 'friend-blocked',
                payload: { friendId}
            }));
            return reply.code(200).send({ 
                success: true, 
                message: "Friend blocked"
            });
    } catch (dbErr) {
        console.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}

export async function remove_friend(request, reply) {
    const userId = request.user.user_id || request.user.id || request.user.sub;
    const friendId = request.body;
    const token = request.cookies.token || request.body.token;
    
    if (!token) {
        return { success: false, message: "Not authenticated" };
    }
    
    try {
            const friendship = await app.db.run(`
                DELETE FROM friendships
                WHERE (user_id = ? AND friend_id = ?)
                    OR (user_id = ? AND friend_id = ?)
            `, [userId, friendId, friendId, userId]);

            if (!friendship.changes == 0) {
                return reply.code(400).send({ success: false, message: "No active friendship to remove" });
            }

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
        console.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: dbErr.message });
    }
}

// export async function find_pending_requests(request, reply) {
//     const { userId } = request.user.user_id;
//     try {
//         	const pendingRequests = await app.db.all(`
//         	    SELECT 
//         	        CASE 
//         	            WHEN user_id = ? THEN friend_id 
//         	            ELSE user_id 
//         	        END as senderId,
//         	        requester_id
//         	    FROM friendships 
//         	    WHERE (user_id = ? OR friend_id = ?) 
//         	      AND status = 'pending'
//         	      AND requester_id != ?
//         	`, [userId, userId, userId, userId]);
        
//         	console.log(`Found ${pendingRequests.length} pending friend requests for user ${userId}`);
//             const oldKeys = await redis.keys(`friend-request:${userId}:*`);
//             if (oldKeys.length > 0) {
//                 console.log(`Cleaning up ${oldKeys.length} old Redis keys for user ${userId}`);
//                 for (const key of oldKeys) {
//                     await redis.del(key);
//                 }
//             }
//     		return reply.code(200).send({ 
//                 success: true, 
//                 count: pendingRequests.length,
//                 requests: pendingRequests 
//             });
// 	} catch (error) {
//         console.error("Error loading pending friend requests on connection:", error);
//         return reply.code(500).send({ success: false, message: "Server error" });
//     }
// }


export async function add_friend(request, reply) {
			const senderId = request.user.user_id || request.user.id || request.user.sub;
            const { receiverId } = request.body;
            const token = request.cookies.token || request.body.token;
		
			console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);

			try {				
				const resData = await createFriendRequest(token, receiverId);

				if (!resData.success) {
					console.error('Failed to request friend in DB:', resData);
					return reply.code(400).send({ 
						success: false, 
						message: resData.message ||'Failed to send request' 
					});
				}

				const isOnline = await redis.get(`online:${receiverId}`);

                if (isOnline === 'true') {
                    console.log(`Receiver ${receiverId} is online, publishing to Redis`);
                    await redis.publish('notifications', JSON.stringify({
                        targetUserId: receiverId,
                        event: 'friend-request',
                        payload: {
                            senderId,
                            message: `User ${senderId} wants to be your friend!`
                        }
                    }));
				} else {
				    console.log('Receiver offline, saving to Redis');
				    await redis.set(`friend-request:${receiverId}:${senderId}`, 'pending');
				    console.log(`Friend request from ${senderId} saved in Redis for ${receiverId}`);
				}

				return reply.code(200).send({ 
                    success: true, 
                    message: 'Friend request sent', 
                    senderId 
                });
			} catch (error) {
				console.error("Error with friend request:", error);
				return reply.code(500).send({ 
                    success: false, 
                    message: 'Server error' 
                });
			}
}


