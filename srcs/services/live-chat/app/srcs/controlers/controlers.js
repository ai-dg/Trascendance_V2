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
        await app.db.run(`
            INSERT INTO friendships (user_id, friend_id, status)
            VALUES (?, ?, 'pending')
            ON CONFLICT(user_id, friend_id) DO NOTHING
        `, [userId, receiverId]);
        
        return reply.send({ success: true, message: "friend requested", receiverId });
    } catch (dbErr) {
         if (dbErr.code === "SQLITE_CONSTRAINT") {
            return reply.code(400).send({ success: false, message: "sqlite error" });
        }
        throw dbErr;
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
        if (action === 'accept') {
            // Update status to 'accepted'
            await app.db.run(`
                UPDATE friendships 
                SET status = 'accepted' 
                WHERE user_id = ? AND friend_id = ?
            `, [senderId, userId]);
        } else {
            // Delete the request if rejected
            await app.db.run(`
                DELETE FROM friendships 
                WHERE user_id = ? AND friend_id = ?
            `, [senderId, userId]);
        }
        
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
                    const res = await fetch(`http://auth_app:3000/username-id`, {
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
                        return {
                            id: friendship.friend_id,
                            username: username
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching user ${friendship.friend_id}:`, error);
                }
                return {
                    id: friendship.friend_id,
                    username: `User ${friendship.friend_id}`
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
    console.log('🔍 Fetching pending requests');
    
    const token = request.cookies.token;
    if (!token) {
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    }
    
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid token" });
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
        
        console.log('🔍 Found pending requests from DB:', pendingRequests);
        
        if (!pendingRequests || pendingRequests.length === 0) {
            return reply.send({ success: true, requests: [] });
        }
        
        const requests = await Promise.all(
            pendingRequests.map(async (req) => {
                try {
                    const res = await fetch(`http://auth_app:3000/username-id`, {
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
        
        console.log('🔍 Returning pending requests:', requests);
        return reply.send({ success: true, requests });
        
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return reply.code(500).send({ success: false, message: "Server error" });
    }
}

