import { app } from '../../server.js';
import jwt from 'jsonwebtoken';


export async function createFriendRequest(token, receiverId) {

    if (!token) {
        return { success: false, message: "Not authenticated" };
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { success: false, message: "Invalid or expired token" };
    }

    const senderId = payload.user_id;
    if (senderId == receiverId) {
        return {
            success: false,
            message: "You cannot add yourself as a friend!"
        };
    }

    try {
        const existing = await app.db.get(`
            SELECT * FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);
        
        if (existing) {
            if (existing.status === 'pending') {
                return { success: false, message: "Friend request already pending" };
            } else if (existing.status === 'accepted') {
                return { success: false, message: "Already friends" };
            }
        }
        
        // Store friendship with canonical order (smaller ID first)
        const [smallerId, largerId] = senderId < receiverId 
            ? [senderId, receiverId] 
            : [receiverId, senderId];

        await app.db.run(`
            INSERT INTO friendships (user_id, friend_id, requester_id, status)
            VALUES (?, ?, ?, 'pending')
        `, [smallerId, largerId, senderId]);

        return { success: true, message: "Friend request created", senderId };
    } catch (err) {
        console.error("DB error:", err);
        return { success: false, message: "Database error" };
    }
}

export async function responseFriendRequest(token, senderId, action) {
    
    if (!token) {
        return { success: false, message: "Not authenticated" };
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
    
    const userId = payload.user_id;
    
    try {
        const [smallerId, largerId] = userId < senderId 
            ? [userId, senderId] 
            : [senderId, userId];

        if (action === 'accept') {
            // Update status to 'accepted'
            await app.db.run(`
                UPDATE friendships 
                SET status = 'accepted' 
                WHERE user_id = ? AND friend_id = ?
            `, [smallerId, largerId]);
        } else {
            // Delete the request if rejected
            await app.db.run(`
                DELETE FROM friendships 
                WHERE user_id = ? AND friend_id = ?
            `, [smallerId, largerId]);
        }
        
        return { 
            success: true, 
            message: action === 'accept' ? "Friend request accepted" : "Friend request rejected"
        };
    } catch (dbErr) {
        console.error('DB error:', dbErr);
        return reply.code(500).send({ success: false, message: "Database error" });
    }
}



