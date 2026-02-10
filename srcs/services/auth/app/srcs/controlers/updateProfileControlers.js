import { app, redis, base_url} from '../../server.js';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import { compare, hash } from 'bcryptjs';
import bcrypt from 'bcryptjs';
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
        
        const { avatar } = request.body;
        if (!avatar) return reply.code(400).send({ success: false, message: "No avatar provided" });

        const result = await app.db.run(
            "UPDATE users SET avatar = ? WHERE user_id = ?",
            [avatar, payload.user_id]
        );
        app.log.info("Update result:", result);

        return reply.send({ success: true, message: "Avatar updated", avatar });

    } catch (err) {
        app.log.error("update_avatar error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

export async function update_username_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token) {
            return reply.code(401).send({ success: false, message: "Not authenticated" });
        }

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }


        const { username } = request.body;
        if (!username) {
            return reply.code(400).send({ success: false, message: "No username provided" });
        }

        try {
            const result = await app.db.run(
                "UPDATE users SET pseudo = ? WHERE user_id = ?",
                [username, payload.user_id]
            );
            app.log.info("Update result:", result);
            return reply.send({ success: true, message: "Username updated", username });
        } catch (dbErr) {
             if (dbErr.code === "SQLITE_CONSTRAINT") {
                return reply.code(400).send({ success: false, message: "Username already taken" });
            }
            throw dbErr;
        }



    } catch (err) {
        app.log.error("update_username error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

export async function update_email_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token)
            return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }


        const{ email } = request.body;
        if (!email)
            return reply.code(400).send({ success: false, message: "No email provided" });
        

        try {
            const result = await app.db.run(
                "UPDATE users SET user_mail = ? WHERE user_id = ?",
                [email, payload.user_id]
            );
            app.log.info("Update result:", result);
            return reply.send({ success: true, message: "Email updated", email });
        } catch (dbErr) {
             if (dbErr.code === "SQLITE_CONSTRAINT") {
                return reply.code(400).send({ success: false, message: "Email already taken" });
            }
            throw dbErr;
        }
            
            
            
    } catch (err) {
        app.log.error("update_email error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

export async function verify_update_email_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token)
            return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }


        const{ email } = request.body;
        if (!email)
            return reply.code(400).send({ success: false, message: "No email provided" });
        

        try {
            const result = await app.db.get(
                "SELECT user_id FROM users WHERE user_mail = ?",
                [email]
            );
            if (result) {
                return reply.code(400).send({ success: false, message: "Email already taken"});
            }
        } catch (dbErr) {
             if (dbErr.code === "SQLITE_CONSTRAINT") {
                return reply.code(400).send({ success: false, message: "SQLite error" });
            }
            throw dbErr;
        }
        return reply.code(200).send({ success: true, message: "Email available"});
            
    } catch (err) {
        app.log.error("update_email error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

export async function verify_email_route(request, reply) {

    const token = request.cookies.token;
    if (!token)
        return reply.code(401).send({ success: false, message: "Not authenticated" });
    let payload;
    try {
        payload = verify(token, process.env.JWT_SECRET);
    } catch {
        return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
    const{ email } = request.body;
    if (!email)
        return reply.code(400).send({ success: false, message: "No email provided" });
    
    const user = await app.db.get("SELECT * FROM users WHERE user_mail = ?", [email]);
    if (user) {
        return reply.send({ succes: false, message: "There's already an account with this email" });
    }
    else {
        return reply.send({ success: true, message: "Email available" });
    }
}


export async function update_password_route(request, reply) {
    try {
        const token = request.cookies.token;
        if (!token)
            return reply.code(401).send({ success: false, message: "Not authenticated" });

        let payload;
        try {
            payload = verify(token, process.env.JWT_SECRET);
        } catch {
            return reply.code(401).send({ success: false, message: "Invalid or expired token" });
        }


        const{ password } = request.body;
        if (!password)
            return reply.code(400).send({ success: false, message: "No password provided" });
        
        const hashed = await hash(password, 10);
        try {
            const result = await app.db.run(
                "UPDATE users SET user_password = ? WHERE user_id = ?",
                [hashed, payload.user_id]
            );
            app.log.info("Update result:", result);
            return reply.send({ success: true, message: "password updated" });
        } catch (dbErr) {
             if (dbErr.code === "SQLITE_CONSTRAINT") {
                return reply.code(400).send({ success: false, message: "sqlite error" });
            }
            throw dbErr;
        }
            
            
            
    } catch (err) {
        app.log.error("update_password error:", err);
        return reply.code(500).send({ success: false, message: "Internal server error" });
    }
}

export async function delete_account_route(request, reply) {
    try {
        const { email, password } = request.body;

        if (!email || !password)
            return reply.send({ success: false, message: "Missing email or password "});

        const user = await app.db.get(`SELECT * FROM users WHERE user_mail = ?`, [email]);
        if (!user)
			return reply.send({ success: false, message: "User not found." }, 404);
        const isValid = await bcrypt.compare(password, user.user_password);
		if (!isValid)
			return reply.status(401).send({ success: false, message: "Incorrect password." });
       
        app.log.info("Before deleting");
        await app.db.run(`DELETE FROM users WHERE user_mail = ?`, [email]);
        app.log.info("After deleting");
       
        try {
            const langRes = await fetch('http://language-manager:3001/delete-lang', {
                method: 'DELETE',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.user_id })
            });
            const lang = await langRes.json();
            if (!langRes.succes)
                app.log.warn("Could not remove language record:", lang.message);
		    } catch (langErr) {
			    app.log.warn("Language microservice unreachable:", langErr.message);
		    }

            return reply.send({ success: true, message: 'Account for ${email} deleted successfully.'}, 200);
        } catch (err) {
            app.log.error("delete_account_route error:", err.message);
            return reply.send({ success: false, message: "Server error while deleting account." });
        }
}
