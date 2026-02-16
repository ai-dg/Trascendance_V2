import crypto from 'crypto';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { base_url, validation_queue } from './server.js';
import { resolve, dirname } from 'path';
import { __dirname, __filename, app } from './server.js';
import { loadTranslations } from './server.js';

/**
 * Handles the password reset route.
 * Fetches reset password data from the auth service using email and UUID.
 * Renders the reset password page if successful, otherwise shows an error page.
 *
 * @param {object} request - The HTTP request object.
 * @param {object} request.params - Route parameters containing email and uuid.
 * @param {string} request.params.email - The email of the user requesting password reset.
 * @param {string} request.params.uuid - The unique identifier for password reset.
 * @param {object} reply - The HTTP reply object used to send the response.
 * @returns {Promise<void>} Renders the appropriate view depending on the reset status.
 */

export async function reset_password_route (request, reply){
  const { email, uuid } = request.params;
  try {
	const res = await fetch(`https://auth_app:3000/reset-password/${email}/${uuid}`);
	const data = await res.json();
	console.log(data);

	if (data.success)
	  return reply.view('reset-password.ejs', {base_url});
	else
	  return reply.view('reset-error.ejs', { message: data.message, base_url });
  } catch (err) {

	return reply.view('index.ejs', { base_url, message: "The password reset link is invalid or has expired. You’ve been redirected to the index page." });
  }
}



export async function root_route(req, reply)
{
	const lang = req.query.lang || 'en';
	const text = loadTranslations(lang);
	const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.BASE_URL || "localhost";
	return reply.view('index.ejs', { text, lang, base_url: host });
}


/**
 * Handles email confirmation route.
 * Validates the token, sets up a temporary queue to listen for validation response.
 * Sends a message to the validation queue and waits for a response or timeout.
 * Renders success or error views based on the validation result.
 *
 * @param {object} request - The HTTP request object.
 * @param {object} request.params - Route parameters containing the token.
 * @param {string} request.params.token - The email confirmation token.
 * @param {object} reply - The HTTP reply object used to send the response.
 * @returns {Promise<void>} Renders email confirmation result pages.
 */

export async function confirm_email(request, reply)
{

	let replyQueue = null
	const { token } = request.params;
	if (!token)
		return reply.view('index.ejs', { message: "Invalid link", base_url }, 404);
	const correlationId = crypto.randomUUID();
	try
	{
		replyQueue = await server.channel.assertQueue('', { exclusive: true, autoDelete:true});
		if (! replyQueue)
			return reply.view('index.ejs', { message: "unkown server problem, please try again later", base_url }, 500);

	}catch(err)
	{
		console.log("ERRROOOOOR : ", err)
		return reply.view('index.ejs', { message: "unkown server problem, please try again later", base_url }, 500);
	}

	const waitForResponse = async () => {
		return new Promise(async (resolve, reject) => {
			let consumerTag;
			let timeout;
			try {
				// Create consumer
				const { consumerTag: tag } = await server.channel.consume(
					replyQueue.queue,
					async (msg) => {
						if (msg && msg.properties.correlationId === correlationId) {
							if (timeout)
								clearTimeout(timeout);
							try {
								resolve(JSON.parse(msg.content.toString()));
								await server.channel.cancel(tag);
							} catch (parseError) {
								reject(new Error('Error parsing response'));
							}
						}
					},
					{ noAck: true }
				);
				consumerTag = tag;
				timeout = setTimeout(async () => {
					try {
						if (consumerTag) {
							await server.channel.cancel(consumerTag);
						}
					} catch (error) {
						console.error('Error cancelling consumer:', error);
					}
					reject(new Error('Timeout waiting for response'));
				}, 5000);

			} catch (error) {
				if (timeout) clearTimeout(timeout);
				await server.channel.cancel(consumerTag);
				reject(error);
			}
		});
	};

	try {
		await server.channel.sendToQueue(
			validation_queue,
			Buffer.from(JSON.stringify({ action: "confirm-email", token })),
			{
				correlationId,
				replyTo: replyQueue.queue,
			}
		);
		const response = await waitForResponse();
		if (response.success) {
			return reply.view('confirm-email.ejs', { message: response.message , base_url});
		} else {
			return reply.view('index.ejs', { message: response.message, base_url });
		}
	} catch (err) {
		console.error('Email confirmation error:', err);
		return reply.view('index.ejs', {
			message: "An error occurred or the server did not respond in time.",
			base_url: base_url
		});
	} finally {
		try {
			await server.channel.deleteQueue(replyQueue.queue);
		} catch (cleanupError) {
			console.error('Error cleaning up queue:', cleanupError);
		}
	}
}


export async function translate_route(req, reply){
		console.log("Cookie param: ", req.cookies);
  		const lang = req.cookies.lang || 'en';
  		const text = loadTranslations(lang);
  		reply.send({ text, lang });
}
