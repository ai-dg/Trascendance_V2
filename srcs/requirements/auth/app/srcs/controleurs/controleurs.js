import { server, redis, base_url} from '../../server.js';
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
/*** 																	Login controlers		  											  			***/
/**********************************************************************************************************************************************************/


export async function login_route(request, reply){
	
		const [rows] = await server.db.query(`SELECT * FROM users WHERE user_mail= ?`, [request.body.email])
		 
		if (rows.length === 0)
			return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));
		const user = rows[0];
	
		let isValidPassword = await compare(request.body.password, user.user_password);	
		if (isValidPassword)
		{
			const email = request.body.email;
			const otp = generateOTP();
			const otp_hashed = await hash(otp, 10);
			const user_agent = request.headers["user-agent"];
			const id = crypto.randomUUID();
			const expire_at = Date.now() + 5 * 60 * 1000;
	
			const validate = {
				otp_hashed : otp_hashed,
				user_agent,
				email: email,
				user_id: user.user_id,
				pseudo: user.pseudo,
				expire_at : expire_at,
				ip: request.ip
			}
			await redis.set(id, JSON.stringify(validate), { EX: 300 });
			const mailOptions = {
			from: '"GT Trainer" <no-reply@gt-trainer.com>',
			to: `${email}`,
			subject: "Tentative de connexion",  
			text: `Votre code de connexion est : ${otp}`,
			html: `<p>Votre code de connexion est : ${otp}</p>`
			};
			if (! server.mailChannel)
				console.log("fastify CHANNEL UNDEFINED")
			server.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
					persistent: true,
				});
			return reply.send({success:true, status:"otp-validation", otp_id: id, expire_at})		
		}
		else 
			return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));
	}


/**
 * 
 * Controller for the /csrf-token route
 *
 * Checks whether the user is authenticated.
 * If so:
 *   - Generates a random CSRF token.
 *   - Signs it cryptographically and stores it in a `csrf` cookie (httpOnly, secure, sameSite).
 *   - Also returns the raw token in the JSON response.
 *
 * If the user is not authenticated, responds with:
 *   { success: false, message: "user is not authenticated" }
 *
 * If token signing fails, responds with status code 500 and includes the unsigned token.
 *
 * Successful response (200):
 * {
 *   success: true,
 *   data: {
 *     csrfToken: "..."
 *   }
 * }
 * 
 * @param {import('fastify').FastifyRequest<{ Body: { email: string } }>} request
 * @param {import('fastify').FastifyReply} reply
 * @returns {Promise<void>}
 */


export async function get_csrf_route(request, reply){
		
		const { success, jti } = await is_auth(request);
		let signed_token = null;
		if (!success)
			return reply.send({success:false, message: "User is not authenticated"}, 401)
		let csrf_token = generateCSRFToken();
		try{
			signed_token = signCSRFToken(csrf_token)
		}
		catch(err){
			return reply.send({success:false, message: "server can't serve csrf token, try again later"}, 500)
		}
		reply.setCookie('csrf', signed_token, {
			httpOnly: true,
			sameSite: 'none',
			secure: true,
			path: '/',
			maxAge: 3600
		})
		.send({success:true, data:{csrfToken : csrf_token}}, 200)
}


export async function otp_validation_route(request, reply)
{
	const user_agent =  request.headers["user-agent"];
	console.log("user agent", user_agent);
	console.log("ip : ", request.ip);

	const { otp, otp_id } = JSON.parse(request.body);
	const row = await redis.get(otp_id);
	const data = JSON.parse(row)
	if (!data)
		return reply.send(get_error_message(e.AUTH_INVALID_TOKEN), 401);
	if (typeof(otp) !== "string" && otp.length != 6)
		return reply.send(get_error_message(e.AUTH_INVALID_TOKEN), 401);
	const is_valid = await compare(otp, data.otp_hashed);
	try {

		if (!is_valid)
			return reply.send(get_error_message(e.AUTH_INVALID_TOKEN), 401);

		const jti = crypto.randomUUID();
		console.log('DATA :  ',data);
		const payload = {
			user_id: data.user_id,
			email: data.email,
			pseudo: data.pseudo,
			jti
		};		
		const secretKey = process.env.JWT_SECRET;	
		const token = sign(payload, secretKey, { expiresIn: '1h' });

		await redis.set(`jwt:${jti}`, 'valid', { EX: 3600 });
		
	
		reply.setCookie('token', token, {
			httpOnly: true,
			sameSite: 'none',
			secure: true,
			path: '/',
			maxAge: 3600
		}).send(get_success_message(data.email, data.pseudo), 200)
		}
	catch(err)
		{
			return reply.send(get_error_message(e.SERVER_ERROR, 500))
		}
		return reply.send(get_error_message(e.SERVER_ERROR, 500))

	
}


/**********************************************************************************************************************************************************/
/*** 																	Logout controlers		  											  			***/
/**********************************************************************************************************************************************************/



export async function logout_route(request, reply){
		const token = request.cookies.token;
		try{
			const payload = verify(token, process.env.JWT_SECRET);
			if (!payload)
				return reply.send({success: true, message:"user not authenticated"}, 401)
			else
			{
				await redis.set(`jwt:${payload.jti}`, "not valid", { EX: 1});
				return reply.send({success: true, message:"user logged out"})
			}		
		}
		catch (err){
			return reply.send ({success:false, message: "Internal server error"}, 500)
	}
}


/**********************************************************************************************************************************************************/
/*** 																	signup controlers		  											  			***/
/**********************************************************************************************************************************************************/


export async function signup_route(request, reply)
{
		let email =  request.body.email;
		let password = request.body.password;
		let pseudo = request.body.pseudo;
		let message = ""
		if (!email || !pseudo || !password)
			message += "missing "
		if (!email || email.length === 0)
			message += "email "
		if (!pseudo || pseudo.length === 0)
		{
			if (message.length > 0 && message != "missing ")
				message += ", "
			message += "pseudo"
		}
		if (!password || pseudo.length === 0)
		{
			if (message.length > 0 && message != "missing ")
				message += " and "
			message += "password"
		}
		if (message.length > 0)
		{
			message += " !";
			return reply.send({success: false, message})
		}
		
		console.log(email)
		const is_mail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
	
		email = validator.normalizeEmail(email);
		pseudo = xss(pseudo);
		if (!email.match(is_mail))
			return reply.send({success: false, message:"Oops ! Seems your email is not valid" }, 400)	
		const [m] = await server.db.query(`SELECT * FROM users WHERE user_mail= ?` , [email])
		console.log(m)
		if (m.length > 0)
			return reply.send({success: false, message:"Oops! Your mail seems to be already used. Please try to reset your password"}, 400);
		const [u] = await server.db.query(`SELECT * FROM users WHERE pseudo= ? `, [pseudo])
		console.log(u)
		if (u.length > 0)
			return reply.send({success: false, message:"Oops! pseudo already used... "}, 400);
		
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/
		if (!password.match(regex))
			return reply.send({success: false, message:"Your password is not safe. Should have at least digits, uppercase, lowercase and special caracters."}, 400);
		
		if (password.length < 12)
			return reply.send({success: false, message:"Oops! Your password needs to be at least 12 characters long."}, 400);
		
		let passwordHash = await hash(password, 10);
	
		const token = crypto.randomUUID();
		await redis.set(token, JSON.stringify({email, pseudo, passwordHash}, {EX: 120}));
		// get_mail_options
		const mailOptions = {
				from: '"GT Trainer" <no-reply@gt-trainer.com>',
				to: `${email}`,
				subject: "Bienvenue ! Confirme ton adresse email ✨",  
				text: `Bienvenue sur GT Trainer ! Pour activer ton compte, clique sur le lien suivant dans les 24h : https://${base_url}/confirm-email/${token}`,
				html: `	<p>Bienvenue sur <strong>GT Trainer</strong> !</p>
				<p>Pour finaliser ton inscription, il te suffit de confirmer ton adresse email en cliquant sur le lien ci-dessous :</p>
				<p><a href='https://${base_url}/confirm-email/${token}'>Confirmer mon adresse</a></p>
				<p>Ce lien est valable pendant 24 heures.</p>
				<p>À très vite sur GT Trainer ! 👋</p>`
			};
			if (!server.mailChannel)
				return reply.send({success: false, message:"Unknown server error, please try again later"}, 500);
			server.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
					persistent: true,
			});
	
		return reply.send(get_message(true, e.MAIL_SENDED), 200)
}
	

export async function reset_forgotten_password_route(request, reply)
{
		const { email, uuid } = request.params;
		const { password } = request.body;
		const is_valid = await is_valid_path(email, uuid);
		if (!is_valid)
			return reply.send({success: false, message: "The reset link has expired or is corrupted and is no longer valid."}, 401)
			const [row] = await server.db.query("SELECT * FROM users WHERE user_mail= ?", [email]);
		if (row.length === 0)
			return reply.send({success: false, message: "invalid mail"}, 401)
		const { success, response } = is_valid_password(password)
		if (!success)
			return reply.send(response, 401);
		const passwordHash = await hash(password, 10);
		await server.db.query("UPDATE users SET user_password= ? WHERE user_mail= ?", [passwordHash, email])
		await redis.del(`${email}:reset-password`)
		return reply.send({success: true, message: "password changed"}, 401)
	}


export async function reset_forgotten_password_request_route(request, reply)
{

		console.log("in auth/reset-password/ : " , request.url)
		const { email, uuid } = request.params;	
		const is_valid = await is_valid_path(email, uuid);
		if (!is_valid)
			return reply.send({success: false, message: "The reset link has expired or is corrupted and is no longer valid."}, 401)
		const [row] = await server.db.query("SELECT * FROM users WHERE user_mail= ?", [email]);
		if (row.length === 0)
			return reply.send({success: false, message: "invalid mail"}, 401)
		return reply.send({success:true, message: "user is registered"})
	}


export async function update_password_route(request, reply)
{
	
		let csrf = await redis.get(`${user.user_mail}-csrf`)
		const {oldPassword, newPassword} = request.body;
		csrfTokenReceived = request.headers["gt-csrfToken"]
		const token = request.cookies.token;
		if (!token || !csrf || csrf != csrfTokenReceived) {
			console.log("no token found")
			return reply.send(get_error_message(e.USER_NOT_AUTHENTICATED, 403));
		}
		try {
			const payload = verify(token, process.env.JWT_SECRET);
			console.log(payload)
		} catch (err) {
			console.log("here....", err.message)	
		}
}





/**
 * 
 * @param {import('fastify').FastifyRequest<{ Body: { email: string } }>} request
 * @param {import('fastify').FastifyReply} reply
 * @returns {Promise<void>}
 */


export async function reset_password_route(request, reply)  {
		const email = request.body.email;
		const [row] = await server.db.query("SELECT * FROM users WHERE user_mail= ?", [email]);
		if (row.length > 0)
		{
			const UUID = crypto.randomUUID();
			await redis.set(`${email}:reset-password`, UUID, {EX:600})
			const mailOptions = {
			from: '"GT Trainer" <no-reply@gt-trainer.com>',
			to: `${email}`,
			subject: "Réinitialisation de votre mot de passe",  
			text: `Voici le lien pour réinitialiser votre mot de passe : https://${base_url}/reset-password/${email}/${UUID}`,
			html: `<p>Voici le lien pour réinitialiser votre mot de passe : <a href='https://${base_url}/reset-password/${email}/${UUID}'>Cliquez ici</a></p>`
			};
			if (! server.mailChannel)
				console.log("FASTIFY CHANNEL UNDEFINED")
			server.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
					persistent: true,
				});
		}	
		return reply.send(get_message(true, e.MAIL_SENDED));
	}