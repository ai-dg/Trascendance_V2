import { app, redis, base_url} from '../../server.js';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto'
import xss from 'xss';
import validator from 'validator';
import { get_error_message, get_success_message, get_message, e, } from '../messages.js';
import { is_auth, signCSRFToken, generateCSRFToken, generateOTP, is_valid_path, is_valid_password  } from '../auth.js';
import { mail_queue } from '../services/message-broker.js';


///
/// https://localhost/confirm-email/e90401a3-0356-4292-bc36-14ace9a3611b



///
/**********************************************************************************************************************************************************/
/*** 																	update profile		  											  			***/
/**********************************************************************************************************************************************************/


export async function update_avatar_route(request, reply) {
    try {
        
        const token = request.cookies.token;
        if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });
        
        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }
        console.log("Payload:", payload);
        console.log("Cookies:", request.cookies);
        console.log("Body:", request.body);
        
        const { avatar } = request.body;
        if (!avatar) return reply.code(400).send({ success: false, message: "No avatar provided" });

        const result = await app.db.run(
            "UPDATE users SET avatar = ? WHERE user_id = ?",
            [avatar, payload.user_id]
        );
        console.log("Update result:", result);

        return reply.send({ success: true, message: "Avatar updated", avatar });

    } catch (err) {
        console.error("update_avatar error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

