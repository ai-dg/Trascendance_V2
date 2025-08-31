import { 
		get_csrf_route,
		login_route,
		logout_route, 
		reset_forgotten_password_route,
		reset_password_request_route,
		signup_route,
		login_otp_validation_route,
		signup_otp_validation_route,
		is_connected

} from "../controlers/controlers.js";


export function routes(app, options)
{
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
	


	
	
	

	

}