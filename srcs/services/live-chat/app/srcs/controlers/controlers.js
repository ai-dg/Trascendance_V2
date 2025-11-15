import { app, redis } from '../../server.js';
import jwt from 'jsonwebtoken';
// import { verify } from 'jsonwebtoken';



export async function friend_request_route(request, reply) {
    const token = request.cookies.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
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