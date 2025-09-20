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
		validate_otp_route,
		auth_me_route

} from "../controlers/controlers.js";
import { update_avatar_route } from "../controlers/updateProfileControlers.js";


export function routes(app, options)
{
	// OTP validation only
	app.post('/verify', async (request, reply) => verify_otp_route(request, reply));
	app.post('/verify/otp-validation', async (request, reply) => validate_otp_route(request, reply));

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
	
	// update profile
	app.put('/update-avatar', async (request, reply) => update_avatar_route(request, reply));

	

}