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
import { update_avatar_route } from './updateProfileControlers.js';
// import { Agent } from 'undici';

// const agent = new Agent({
//   connect: {
//     rejectUnauthorized: false
//   }
// });

///
/// https://localhost/confirm-email/e90401a3-0356-4292-bc36-14ace9a3611b



///
/**********************************************************************************************************************************************************/
/*** 																	OTP validation only		  											  			***/
/**********************************************************************************************************************************************************/


export async function validate_otp_route(request, reply) {
  	const { otp_id, otp } = request.body;

  	if (!otp_id || !otp) {
  	  return reply.code(400).send({ success: false, message: 'OTP required' });
  	}

  	let row;
	try {
	  row = await redis.get(otp_id);
	} catch (err) {
	  console.error("Redis error:", err);
	  return reply.code(500).send({ success: false, message: 'Server error' });
	}


  	let data;
	try {
	  data = JSON.parse(row);
	} catch (err) {
	  console.error("Failed to parse Redis data:", err);
	  return reply.code(500).send({ success: false, message: 'Server error' });
	}

	if (!data.otp_hashed) {
	  return reply.code(500).send({ success: false, message: 'Server error' });
	}

  	const is_valid = await compare(otp, data.otp_hashed);
  	if (!is_valid) {
  	  return reply.code(401).send({ success: false, message: 'OTP invalid' });
  	}

  	// await redis.del(otp_id);

  	return reply.send({ success: true, message: 'OTP valid', email: data.email });
}


export async function verify_otp_route(request, reply) {

  	const { email } = request.body;

  	if (!email)
  	  return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));

  	let user = null;
  	try {
		console.log(email);
  	  user = await app.db.get(`SELECT * FROM users WHERE user_mail = ?`, [email]);
		console.log("user verified: ", user);
	} catch (err) {
  	  return reply.send(get_error_message(e.SQL_ERROR, 500));
  	}

  	if (!user)
  	  return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));

  	const otp = generateOTP();
  	const otp_hashed = await hash(otp, 10);
  	const id = crypto.randomUUID();
  	const expire_at = Date.now() + 5 * 60 * 1000;

  	const data = {
  	  email: user.user_mail,
  	  otp_hashed,
  	  user_id: user.user_id,
  	  expire_at,
  	  ip: request.ip,
  	  user_agent: request.headers["user-agent"]
  	};

  	await redis.set(id, JSON.stringify(data), { EX: 300 });

  	const mailOptions = {
  	  from: '"Transcendance 42" <no-reply@transcendance.42.com>',
  	  to: user.user_mail,
  	  subject: "Code de vérification",
  	  text: `Votre code est : ${otp}`,
  	  html: `<p>Votre code est : <b>${otp}</b></p>`
  	};

  	if (!app.mailChannel)
  	  return reply.send(get_error_message(e.SQL_ERROR, 500));

  	app.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
  	  persistent: true,
  	});

  	return reply.send({ success: true, status: "otp-validation", otp_id: id, expire_at });

}

export async function verify_otp_email_route(request, reply) {

  	const token = request.cookies.token;
	if (!token)
		return reply.code(401).send({ success: false, message: "Not authenticated" });

	let payload;
	try {
	    payload = verify(token, process.env.JWT_SECRET);
		console.log(payload.user_id);
	} catch {
	    return reply.code(401).send({ success: false, message: "Invalid or expired token" });
	}

  	let user = null;
  	try {
		const info = await app.db.all(`PRAGMA table_info(users)`);
		console.log(info);

		console.log("Payload user_id:", payload.user_id);
		const test = await app.db.all("SELECT * FROM users");
		console.log("All users:", test);


		const user_id = Number(payload.user_id);
		console.log("user_id as number:", user_id);

  	  	user = await app.db.get(`SELECT * FROM users WHERE user_id = ?`, [user_id]);
		console.log("user verified: ", user);
	} catch (err) {
		console.log("User id not found");
  	  return reply.send(get_error_message(e.SQL_ERROR, 500));
  	}

  	if (!user)
  	  return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));

	const { email: newEmail } = request.body;

  	const otp = generateOTP();
  	const otp_hashed = await hash(otp, 10);
  	const id = crypto.randomUUID();
  	const expire_at = Date.now() + 5 * 60 * 1000;

  	const data = {
  	  email: newEmail,
  	  otp_hashed,
  	  user_id: user.user_id,
  	  expire_at,
  	  ip: request.ip,
  	  user_agent: request.headers["user-agent"]
  	};

  	await redis.set(id, JSON.stringify(data), { EX: 300 });

  	const mailOptions = {
  	  from: '"Transcendance 42" <no-reply@transcendance.42.com>',
  	  to: newEmail,
  	  subject: "Code de vérification",
  	  text: `Votre code est : ${otp}`,
  	  html: `<p>Votre code est : <b>${otp}</b></p>`
  	};

  	if (!app.mailChannel) {
		console.log("mailChannel error");
  	  return reply.send(get_error_message(e.SQL_ERROR, 500));
	}

  	app.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
  	  persistent: true,
  	});

  	return reply.send({ success: true, status: "otp-validation", otp_id: id, expire_at });

}

///
/**********************************************************************************************************************************************************/
/*** 																	Middleware for sessionID and token		  											  			***/
/**********************************************************************************************************************************************************/



async function validateSession(request, reply) {
  const token = request.cookies.token;
  const sessionId = request.cookies.sessionId;

  if (!token || !sessionId) {
    throw { statusCode: 401, message: "Unauthorized" };
  }

  try {
    const payload = verify(token, process.env.JWT_SECRET);

    const validSession = await redis.get(`session:user:${payload.user_id}`);

    if (!validSession || validSession !== sessionId) {
      throw { statusCode: 401, message: "Session expired or invalid" };
    }

    request.user = payload;
  } catch (err) {
    throw { statusCode: 401, message: "Unauthorized" };
  }
}





///
/**********************************************************************************************************************************************************/
/*** 																	Login controlers		  											  			***/
/**********************************************************************************************************************************************************/


export async function login_route(request, reply){



		let user = null;
		const {pseudo, password} = request.body;
		console.log(pseudo, password)
		if (!pseudo || ! password)
			return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));
		try{
			user = await app.db.get(`SELECT * FROM users WHERE pseudo= ?`, [pseudo])
		}
		catch(err)
		{
			return reply.send(get_error_message(e.SQL_ERROR, 500));
		}

		if (!user)
			return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));

		let isValidPassword = await compare(request.body.password, user.user_password);
		if (isValidPassword)
		{
			const otp = generateOTP();
			const otp_hashed = await hash(otp, 10);
			const user_agent = request.headers["user-agent"];
			const id = crypto.randomUUID();
			const expire_at = Date.now() + 5 * 60 * 1000;

			const validate = {
				email: user.user_mail,
				otp_hashed : otp_hashed,
				user_agent,
				user_id: user.user_id,
				pseudo: user.pseudo,
				expire_at : expire_at,
				ip: request.ip
			}

			await redis.set(id, JSON.stringify(validate), { EX: 300 });
			const mailOptions = {
			from: '"Transcendance 42" <no-reply@transcendance.42.com>',
			to: `${user.user_mail}`,
			subject: "Tentative de connexion",
			text: `Votre code de connexion est : ${otp}`,
			html: `<p>Votre code de connexion est : ${otp}</p>`
			};
			if (! app.mailChannel)
				return reply.send(get_error_message(e.SQL_ERROR, 500))
			app.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
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

		const { success, jwt } = await is_auth(request);

		let signed_token = null;
		if (!success)
			return reply.send({success:false, message: "User is not authenticated"}, 401)
		let csrf_token = generateCSRFToken();
		try{
			signed_token = signCSRFToken(csrf_token)
		}
		catch(err){
			return reply.send({success:false, message: "app can't serve csrf token, try again later"}, 500)
		}
		reply.setCookie('csrf', signed_token, getMainStyleCookieOptions(3600).token)
		.send({success:true, data:{csrfToken : csrf_token}}, 200)
}



export async function is_connected(request, reply) {
	const {success, jwt} = await is_auth(request);
	if (! success)
		return reply.send({success:false, message : "User is not authenticated"}, 401);
	return reply.send({success:true, message: "user is connected", pseudo:jwt.pseudo});

}



export async function login_otp_validation_route(request, reply)
{
	const user_agent =  request.headers["user-agent"];

	const { otp, otp_id } = request.body;
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
		const payload = {
			user_id: data.user_id,
			email: data.email,
			pseudo: data.pseudo,
			jti
		};
		const secretKey = process.env.JWT_SECRET;
		const token = sign(payload, secretKey, { expiresIn: '1h' });
		await redis.set(`jwt:${jti}`, 'valid', { EX: 3600 });

		let userLang = 'en';
		console.log("USER_ID:", data.user_id);
		try {
			const langRes = await fetch(`https://language-manager:3001/get-lang?user_id=${data.user_id}`);
			const langData = await langRes.json();
			userLang = langData.lang || 'en';
		} catch (err) {
			console.error("Error fetching user language:", err);
			userLang = 'en';
		}

		const sessionId = crypto.randomUUID();

		await redis.set(`session:user:${data.user_id}`, sessionId, { EX: 3600 });

		const opts = getMainStyleCookieOptions(3600, request);
		return reply.setCookie('token', token, opts.token)
		.setCookie('sessionId', sessionId, opts.sessionId)
		.setCookie('lang', userLang, opts.lang)
		.send({...get_success_message(data.email, data.pseudo)}, 200)
	} catch(err) {
		return reply.send(get_error_message(e.app_ERROR, 500))
	}
}



/**********************************************************************************************************************************************************/
/*** 																	Cookie options (from request protocol so cookies persist on refresh)		  			***/
/**********************************************************************************************************************************************************/

/** Cookie options matching main branch: token with sameSite lax (no secure) so it persists on refresh. */
function getMainStyleCookieOptions(maxAge = 3600, request = null) {
	const isSecure = request ? (request.headers['x-forwarded-proto'] || 'http') === 'https' : true;
	return {
		token: { path: '/', httpOnly: true, sameSite: 'lax', maxAge },
		sessionId: { path: '/', httpOnly: true, sameSite: isSecure ? 'none' : 'lax', secure: isSecure, maxAge },
		lang: { path: '/', httpOnly: false, sameSite: 'lax', maxAge }
	};
}

/** Cookie options from X-Forwarded-Proto (fallback when INSECURE_COOKIES set). */
export function getCookieOptions(request, maxAge = 3600) {
	const forceInsecure = process.env.INSECURE_COOKIES === '1' || process.env.INSECURE_COOKIES === 'true';
	const protocol = request.headers['x-forwarded-proto'] || 'http';
	const isSecure = !forceInsecure && protocol === 'https';
	const opts = {
		httpOnly: true,
		sameSite: isSecure ? 'none' : 'lax',
		secure: isSecure,
		path: '/',
		maxAge
	};
	if (process.env.NODE_ENV !== 'PROD') {
		console.log('[AUTH_COOKIE] getCookieOptions proto=', protocol, 'isSecure=', isSecure, 'sameSite=', opts.sameSite);
	}
	return opts;
}

/**********************************************************************************************************************************************************/
/*** 																	Logout controlers		  											  			***/
/**********************************************************************************************************************************************************/


export async function logout_route(request, reply) {
  const token = request.cookies.token;

  try {
    if (!token) {
      return reply.code(200).send({ success: true, message: "Guest logged out" });
    }
	let payload;
	try {
		payload = verify(token, process.env.JWT_SECRET);
	}
	catch {
		payload = null;
	}

	if (payload?.jti)
    	await redis.set(`jwt:${payload.jti}`, "revoked");


	const user_id = payload?.user_id;
	if (user_id)
		await redis.del(`session:user:${user_id}`);

    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const isSecure = protocol === 'https';

    reply.clearCookie('token', { path: '/', httpOnly: true, secure: isSecure, sameSite: isSecure ? 'None' : 'Lax' });
	reply.clearCookie('csrf', { path: '/', httpOnly: true, secure: isSecure, sameSite: isSecure ? 'None' : 'Lax' });
	reply.clearCookie('sessionId', { path: '/', httpOnly: true, secure: isSecure, sameSite: isSecure ? 'none' : 'lax' });

    return reply.send({ success: true, message: "User logged out" });

  } catch (err) {
    console.error(err);
    return reply.code(500).send({ success: false, message: "Internal server error" });
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
		let avatar = request.body.avatar;
		let message = ""
		if (!email || !pseudo || !password || !avatar)
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
		const m = await app.db.get(`SELECT * FROM users WHERE user_mail= ?` , [email])
		if (m)
			return reply.send({success: false, message:"Oops! Your mail seems to be already used. Please try to reset your password"}, 400);
		const u = await app.db.get(`SELECT * FROM users WHERE pseudo= ? `, [pseudo])
		console.log("check pseudo : ",u)
		if (u)
			return reply.send({success: false, message:"Oops! pseudo already used... "}, 400);

		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/
		if (!password.match(regex))
			return reply.send({success: false, message:"Your password is not safe. Should have at least digits, uppercase, lowercase and special caracters."}, 400);

		if (password.length < 12)
			return reply.send({success: false, message:"Oops! Your password needs to be at least 12 characters long."}, 400);

		let passwordHash = await hash(password, 10);
		const otp = generateOTP();
		const otp_id = crypto.randomUUID();
		const otp_hashed = await hash(otp, 10);
		const user_agent = request.headers["user-agent"];
		const expire_at = Date.now() + 5 * 60 * 1000;
		const validate = {
			otp_hashed : otp_hashed,
			user_agent,
			email: email,
			pseudo: pseudo,
			expire_at : expire_at,
			ip: request.ip,
			passwordHash
		}
		await redis.set(otp_id, JSON.stringify(validate, {EX: 120}));
		// get_mail_options
		const mailOptions = {
				from: '"Transcendance 42" <no-reply@transcendance.42.com>',
				to: `${email}`,
				subject: "Bienvenue ! Confirme ton adresse email ✨",
				text: `Pour finaliser ton inscription, il te suffit de confirmer ton adresse email en entrant le code de connextion :  ${otp} .`,
				html: `	<p>Bienvenue sur <strong>Transcendance 42</strong> !</p>
				<p>Pour finaliser ton inscription, il te suffit de confirmer ton adresse email en entrant le code de connextion :  ${otp} .</p>
				<p>Ce lien est valable 2mn
				<p>À très vite sur Transcendance 42 ! 👋</p>`
			};
			// html: `<p>Votre code de connexion est : ${otp}</p>`
			if (!app.mailChannel)
				return reply.send({success: false, message:"Unknown app error, please try again later"}, 500);
			app.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
					persistent: true,
			});
		return reply.send({success:true, status:"otp-validation", otp_id, expire_at})
}


export async function signup_otp_validation_route(request, reply)
{
	const user_agent =  request.headers["user-agent"];

	const { otp, otp_id } = request.body;
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
		const insert = await app.db.run('INSERT INTO "users" ("user_mail", "pseudo", "user_password", "avatar") VALUES (?, ?, ?, ?)', [data.email, data.pseudo, data.passwordHash, data.avatar])

		if (insert && insert.changes > 0) {
			console.log("insert: ", insert);
		const userId = insert.lastID;
		console.log("userId: " + userId);
		const langRes = await fetch('https://language-manager:3001/create-lang', {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ user_id: userId, lang: "en" })
			// agent:
			// {
			// 	dispatcher: new (await import('undici')).Agent({ connect: { rejectUnauthorized: false } })
			// }
		});
		if (!langRes.ok) {
			console.error("Failed to create user language entry", langRes.status, langRes.statusText);
		}
		const lang = await langRes.json();
		if (!lang.success) {
			return { succes: false, message: "Couldn't reache lang database" };
		}
		console.log("SUCESSSSSSS");
		}

		return reply.send({...get_success_message(data.email, data.pseudo), message: 'user created'}, 200)
	}
	catch(err)
	{
		console.error(err.message)
		return reply.send(get_error_message(e.SERVER_ERROR, 500))
	}
}

/**********************************************************************************************************************************************************/
/*** 																	reset passwords 		  											  			***/
/**********************************************************************************************************************************************************/


export async function reset_forgotten_password_route(request, reply) {



  const { otp_id, password } = request.body;
  console.log("Body got:", { otp_id, password });

  if (!password) {
    console.log("Password missing");
    return reply.status(400).send({ success: false, message: "Password missing" });
  }

  let row;
  try {
    row = await redis.get(otp_id);
  } catch (err) {
    console.error("Redis.get error:", err);
    return reply.send(get_error_message(e.SERVER_ERROR, 500));
  }

  if (!row) {
    console.error("No OTP found");
    return reply.send({ success: false, message: "Invalid token" }, 401);
  }

  let data;
  try {
    data = JSON.parse(row);
  } catch (err) {
    return reply.send(get_error_message(e.AUTH_INVALID_TOKEN), 401);
  }

  try {
    const passwordHash = await hash(password, 10);

    await app.db.run(
      "UPDATE users SET user_password = ? WHERE user_mail = ?",
      [passwordHash, data.email]
    );

	const userRow = await app.db.get(`SELECT user_id FROM users WHERE user_mail = ?`, [data.email]);
	await redis.del(`session:user:${userRow.user_id}`);

    await redis.del(otp_id);

    console.log("Password changed");
    return reply.send({ success: true, message: "password changed" }, 201);
  } catch (err) {
    return reply.send(get_error_message(e.SERVER_ERROR, 500));
  }
}




/**
 *
 * @param {import('fastify').FastifyRequest<{ Body: { email: string } }>} request
 * @param {import('fastify').FastifyReply} reply
 * @returns {Promise<void>}
 */


export async function reset_password_request_route(request, reply)  {

		const email = request.body.email;
		console.log("email: ", email);
		let user = null;
		try{
			user = await app.db.get("SELECT * FROM users WHERE user_mail= ?", [email]);
		}
		catch(err)
		{
			console.error(err)
			return reply.send(get_error_message(e.SQL_ERROR, 500))
		}
		if (user)
		{
			// const sessionId = crypto.randomUUID();
			// await redis.set(`session:user:${user.user_id}`, sessionId, { EX: 3600 });

			// try {
			// 	await validateSession(request, reply);
			// } catch (err) {
			// 	return reply.code(err.statusCode || 401).send({ error: err.message });
			// }

			const otp = generateOTP();
			const otp_hashed = await hash(otp, 10);

			const id = crypto.randomUUID();
			const expire_at = Date.now() + 5 * 60 * 1000;
			const validate = {
				email: user.user_mail,
				otp_hashed : otp_hashed,
				user_id: user.user_id,
				pseudo: user.pseudo,
				expire_at : expire_at,
			}
			await redis.set(id, JSON.stringify(validate), { EX: 300 });
			const mailOptions = {
			from: '"Transcendance 42" <no-reply@transcendance.42.com>',
			to: `${user.user_mail}`,
			subject: "Mise a jour du mot de passe",
			text: `Votre code est : ${otp}`,
			html: `<p>Votre code est : ${otp}</p>`
			};
			if (! app.mailChannel)
				return reply.send(get_error_message(e.SQL_ERROR, 500))
			app.mailChannel.sendToQueue(mail_queue, Buffer.from(JSON.stringify(mailOptions)), {
					persistent: true,
				});
			return reply.send({success:true, status:"otp-validation", otp_id: id, expire_at})
		}
		else
			return reply.send(get_error_message(e.AUTH_INVALID_CREDENTIALS, 401));
	}



/**********************************************************************************************************************************************************/
/*** 																	get auth data 		  											  			***/
/**********************************************************************************************************************************************************/


/** Debug: return cookie presence only (no values). For frontend REFRESH_DEBUG. */
export async function debug_cookies_route(request, reply) {
  const origin = request.headers.origin || request.headers.referer || '(none)';
  const cookieLen = (request.headers.cookie || '').length;
  console.log('[AUTH_DEBUG] debug-cookies Origin=', origin, 'Cookie header length=', cookieLen);
  const tokenPresent = !!request.cookies.token;
  const sessionIdPresent = !!request.cookies.sessionId;
  const langPresent = !!request.cookies.lang;
  return reply.send({
    tokenPresent,
    sessionIdPresent,
    langPresent,
    note: 'token and sessionId are httpOnly so not visible in document.cookie; this shows what the server received'
  });
}

export async function auth_me_route(request, reply) {
  try {
    const origin = request.headers.origin || request.headers.referer || '(none)';
    const cookieLen = (request.headers.cookie || '').length;
    const token = request.cookies.token;
    console.log('[AUTH_DEBUG] /me Origin=', origin, 'Cookie header length=', cookieLen, 'token present=', !!token, 'NODE_ENV=', process.env.NODE_ENV);
    if (!token) {
      console.log('[AUTH_DEBUG] /me 401 → no token in request');
      return reply.code(401).send({ success: false, message: "Not authenticated" });
    }

    let payload;
    try {
      payload = verify(token, process.env.JWT_SECRET);
      console.log('[AUTH_DEBUG] /me JWT verify ok. user_id=', payload.user_id, 'jti=', payload.jti);
    } catch (e) {
      console.log('[AUTH_DEBUG] /me 401 → JWT verify failed:', (e && e.message) || String(e));
      return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }

    const isProduction = process.env.NODE_ENV === 'PROD';
    if (isProduction && payload.jti) {
      const redisVal = await redis.get(`jwt:${payload.jti}`);
      console.log('[AUTH_DEBUG] /me Redis jwt:' + payload.jti + ' =', redisVal === null ? 'null (expired?)' : redisVal);
      if (redisVal !== 'valid') {
        console.log('[AUTH_DEBUG] /me 401 → Redis not valid (revoked or expired)');
        return reply.code(401).send({ success: false, message: "Token revoked or expired" });
      }
    }

    const user = await app.db.get(
      "SELECT user_id, pseudo, user_mail, avatar FROM users WHERE user_id = ?",
      [payload.user_id]
    );
    if (!user) {
      console.log('[AUTH_DEBUG] /me 401 → user_id not in DB (e.g. after DB reset):', payload.user_id);
      return reply.code(401).send({ success: false, message: "User not found or session invalid" });
    }
    console.log('[AUTH_DEBUG] /me 200 → sending user_id=', user.user_id);
    return reply.send({ success: true, data: { user } });

  } catch (err) {
    console.error('[AUTH_DEBUG] /me 500 error:', err);
    return reply.code(500).send({ success: false, message: "Internal app error" });
  }
}


export async function get_id_by_username_route(request, reply) {
  try {
    const token = request.cookies.token;
    if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });

    let payload;
    try {
      payload = verify(token, process.env.JWT_SECRET);
    } catch {
      return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
	const isProduction = process.env.NODE_ENV === 'PROD';
    if (isProduction && payload.jti) {
      const redisVal = await redis.get(`jwt:${payload.jti}`);
      if (redisVal !== 'valid') {
        return reply.code(401).send({ success: false, message: "Token revoked or expired" });
      }
    }

	const { username } = request.body;

    const user = await app.db.get(
      "SELECT user_id FROM users WHERE pseudo = ?",
      [username]
    );
    if (!user) return reply.code(404).send({ success: false, message: "User not found" });

    return reply.send({ success: true, data: { user } });

  } catch (err) {
    console.error("auth/me error:", err);
    return reply.code(500).send({ success: false, message: "Internal app error" });
  }
}


export async function get_username_by_id_route(request, reply) {
  try {
    // const token = request.cookies.token;

	const authHeader = request.headers.authorization;
	const token =
	  request.cookies.token ||
	  authHeader?.replace('Bearer ', '');
    if (!token) return reply.code(401).send({ success: false, message: "Not authenticated" });

    let payload;
    try {
      payload = verify(token, process.env.JWT_SECRET);
    } catch {
      return reply.code(401).send({ success: false, message: "Invalid or expired token" });
    }
	const isProduction = process.env.NODE_ENV === 'PROD';
    if (isProduction && payload.jti) {
      const redisVal = await redis.get(`jwt:${payload.jti}`);
      if (redisVal !== 'valid') {
        return reply.code(401).send({ success: false, message: "Token revoked or expired" });
      }
    }

	const { id } = request.body;

    const user = await app.db.get(
      "SELECT pseudo, avatar FROM users WHERE user_id = ?",
      [id]
    );
    if (!user) return reply.code(404).send({ success: false, message: "User not found" });

    return reply.send({ success: true, data: { user } });

  } catch (err) {
    console.error("auth/me error:", err);
    return reply.code(500).send({ success: false, message: "Internal app error" });
  }
}


