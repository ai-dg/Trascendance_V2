import { 
		get_csrf_route,
		login_route,
		logout_route, 
		reset_forgotten_password_route,
		reset_password_request_route,
		signup_route,
		login_otp_validation_route,
		signup_otp_validation_route,
		is_connected,
		verify_otp_route,
		verify_otp_email_route,
		validate_otp_route,
		auth_me_route,
		get_id_by_username_route,
		get_username_by_id_route

} from "../controlers/controlers.js";
import {
		update_avatar_route,
		update_email_route,
		update_password_route,
		update_username_route,
		verify_email_route,
		delete_account_route,
		verify_update_email_route
} from "../controlers/updateProfileControlers.js";
import {
		oauth_login_route,
		oauth_callback_route,
		oauth_update_profile_route
} from "../controlers/42auth.js";


export function routes(app, options)
{
	// OTP validation only
	app.post('/verify', async (request, reply) => verify_otp_route(request, reply));
	app.post('/verify/otp-validation', async (request, reply) => validate_otp_route(request, reply));

	// OTP validation email only
	app.post('/verify-email', async (request, reply) => verify_otp_email_route(request, reply));
	app.post('/verify-email/otp-validation', async (request, reply) => validate_otp_route(request, reply));

	// login process
	app.post('/login', async (request, reply) => login_route(request, reply))
	app.post('/login/otp-validation', async (request, reply) => login_otp_validation_route(request,reply));	
	app.get('/csrf-token', async (request, reply) => get_csrf_route(request, reply));

	app.post('/is-connected', async (request, reply) => is_connected(request,reply));	

	
	// signup process
	app.post('/signup', async (request, reply) => signup_route(request, reply));
	app.post('/signup/otp-validation', async (request, reply) => signup_otp_validation_route(request,reply));	
	
	// logout process

	app.post('/logout', async (request, reply) => logout_route(request, reply))
	

	// reset-password (forget password process)

	app.post('/reset-password', async (request, reply) => reset_password_request_route(request, reply));
	app.post('/reset-password/otp-validation', async (request, reply) => reset_forgotten_password_route(request, reply));
	

	// get auth data
	app.get('/me', async (request, reply) => auth_me_route(request, reply));
	app.post('/id-username', async (request, reply) => get_id_by_username_route(request, reply));
	app.post('/username-id', async (request, reply) => get_username_by_id_route(request, reply));
	
	// update profile
	app.get('/verify-username', async (request, reply) => verify_update_email_route(request, reply));
	app.put('/update-avatar', async (request, reply) => update_avatar_route(request, reply));
	app.put('/update-username', async (request, reply) => update_username_route(request, reply));
	app.put('/update-email', async (request, reply) => update_email_route(request, reply));
	app.post('/verify-email-valid', async (request, reply) => verify_email_route(request, reply));
	app.put('/update-password', async (request, reply) => update_password_route(request, reply));

	// delete account
	app.delete('/delete-account', async (request, reply) => delete_account_route(request, reply));

	// 42auth 
	app.get('/42/login', async (request, reply) => oauth_login_route(request, reply));
	app.get('/42/callback', async (request, reply) => oauth_callback_route(request, reply));
	app.put('/42/update', async (request, reply) => oauth_update_profile_route(request, reply));
}