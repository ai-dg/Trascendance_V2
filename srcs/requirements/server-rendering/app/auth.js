import { redis, app } from './server.js'
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { e } from './messages.js';


const { verify } = jwt;

/**
 * Generates a one-time password.
 *
 * @returns {string} A 6-digit integer as a string.
 */

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


/**
 * Generates a CSRF Token.
 *
 * @returns {string} A 32-byte hexadecimal string.
 */

export function generateCSRFToken()
{
	return crypto.randomBytes(32).toString('hex');
}


/**
 * Signs a CSRF Token.
 * @param {string} token - The CSRF token to sign.
 * @returns {string} A hashed 32-byte hexadecimal string using SHA-256.
 * @throws {Error} If the token is invalid or the secret is not defined.
 */

export function signCSRFToken(token) {

	if (!token || typeof token !== 'string') {
		throw new Error('Token must be a non-empty string');
	}	
	const secret = process.env.CSRF_SECRET;
	if (!secret) {
		throw new Error('CSRF_SECRET environment variable is not defined');
	}		
	return crypto.createHmac('sha256', secret)
				.update(token)
				.digest('hex');
}


/**
 * Verifies a CSRF token by comparing the signed hash with the expected value.
 *
 * @param {string} token - The original unencrypted CSRF token.
 * @param {string} signed - A 32-byte hexadecimal HMAC string (SHA-256).
 * @returns {boolean} True if the token is valid and matches the signature, otherwise false.
 */

export function verifyCSRFToken(token, signed)
{ 
	if (!token || !signed)
		return false;
	const expected = signCSRFToken(token)
	return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected))
}


/**
 * Brief description of the function.
 *
 * @param {string} param - Description of the parameter.
 * @returns {string} Description of the return value.
 * @throws {Error} Condition when error is thrown.
 */

export async function is_auth(request){
	const token = request.cookies.token;
	let is_valid = false;
	let val = null;
	let exists = null;

	if (!token)
		return {success:false, jti:{}}
	try{
		is_valid = verify(token, process.env.JWT_SECRET)
		if (!is_valid)
			return {success:false, jti:{}, message: e.AUTH_INVALID_TOKEN}
	}
	catch(err)
	{
		console.error(err.message);
		return {success:false, jti:{}, message: e.SERVER_ERROR}
	}

	try
	{
		val = jwt.decode(token, process.env.JWT_SECRET);
		exists = await redis.get(`jwt:${val.jti}`)
	}
	catch(err)
	{
		console.error(err.message);
		return {success:false, jti:{}}
	}
	if (!exists || exists != "valid")
		return {success:false, jti:{}}
	return {success:true, jti:val}
}


/**
 * Checks whether the given UUID matches the reset-password token stored in Redis.
 *
 * @param {string} email - The email address used as the Redis key prefix.
 * @param {string} uuid - The UUID to verify against the stored token.
 * @returns {boolean} True if the UUID matches the stored Redis value, false otherwise.
 */

export async function is_valid_path(email, uuid)
{
	const row = await redis.get(`${email}:reset-password`)
	if (!row || row != uuid)
		return false;
	return true;
}


/**
 * Checks if the provided password is strong enough.  
 * The password must be between 12 and 64 characters and contain at least:  
 *  - one uppercase letter  
 *  - one lowercase letter  
 *  - one digit  
 *  - one special character  
 *
 * @param {string} password - The password provided by the user.
 * @returns {object} An object with a `success` boolean and a `response` key.  
 *                   `success` is true if the password passes the validation.
 */


export function is_valid_password(password)
{
	const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/
	if (!password.match(regex))
		return {success: false, response : {success:false, status:"error", message:"Your password is not safe. Should have at least digits, uppercases, lowercases and special caracters and to be at least 12 characters long."}};
	return { success:true, response : {}}
}


/**
 * Registers user credentials and pseudo if the provided token (from Redis) is valid.
 * Returns an object indicating whether the procedure succeeded or failed, with a message.
 *
 * @param {string} token - Token from the email validation link, used to retrieve user data from Redis.
 * @returns {object} Object with `success` (boolean) and `message` (string).
 */


export async function confirm_email_token(token)
{
	let res = null;
	let result = null;
	try
	{
		res = await redis.get(token);
		if (!res)
			return { success: false, message : "Link has expired... try again" };
	}
	catch (err)
	{
		console.error("Redis error:", err);
		return { success: false, message: "Temporary server error. Please try again later." };
	}

	try{
		result = JSON.parse(res); 
	}
	catch(err){
		console.error("Parse error:", err); 
		return {success : false, message : err.message};
	}
	const email = result.email;
	const passwordHash = result.passwordHash;
	const pseudo = result.pseudo;
	if (! email || ! passwordHash || ! pseudo)
	{
		return  { success: false, message : "Oops, something went wrong !  bad request !" };
	}
	const query_result = await app.db.query(`INSERT INTO users (user_mail, user_password, pseudo) VALUES (?, ?, ?)`,	[email, passwordHash, pseudo]);
	const insert = query_result[0];
	if (insert && insert.affectedRows > 0)
	return { success: true, message: "Account created !" };
}