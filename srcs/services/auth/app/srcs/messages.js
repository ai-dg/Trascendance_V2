const LOG = true

const ERRORS_MESSAGES = {
	AUTH_INVALID_CREDENTIALS : "Adresse e-mail ou mot de passe incorrect",
	USER_NOT_AUTHENTICATED : "Accès non autorisé",
	AUTH_INVALID_TOKEN : "invalid token",
	SERVER_ERROR : "unknown server error",
	SQL_ERROR : "database error"
}

const SUCCESS_MESSAGES = {
	MAIL_SENDED: "An email has been sent."	
}



export const e = Object.freeze({
	SQL_ERROR : "SQL_ERROR",
	AUTH_INVALID_CREDENTIALS : "AUTH_INVALID_CREDENTIALS",
	USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED",
	MAIL_SENDED: "MAIL_SENDED",
	AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN",
	SERVER_ERROR: "SERVER_ERROR"
})


export function get_error_message(message=AUTH_INVALID_CREDENTIALS, log=LOG)
{	
	let msg = {
			success:false,
			error: {
    			code: message,
    			message: ERRORS_MESSAGES[message],
				}
			}
	if (log)
		console.log(msg);
	return msg;
}



export function get_message(success, key, table=SUCCESS_MESSAGES)
{
	let msg = {
			success,
    		message: table[key],
	}
	return msg;
}



export function get_success_message(email, username,log=LOG)
{	
	let msg = {
			success: true,
			data: {
				user: {
					email,
					username
				},
				meta: {
					timestamp: new Date().toISOString()
				}
			}
	};
	return msg;
}
