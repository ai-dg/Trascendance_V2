import { 
		reset_password_route, 
		get_csrf_route,
		login_route,
		logout_route, 
		update_password_route,
		reset_forgotten_password_route,
		reset_forgotten_password_request_route,
		signup_route,
		login_otp_validation_route,
		signup_otp_validation_route

} from "../controlers/controlers.js";


export function routes(app, options)
{
	// login process
	app.post('/login', async (request, reply) => login_route(request, reply))
	app.post('/login/otp-validation', async (request, reply) => login_otp_validation_route(request,reply));	
	app.get('/csrf-token', async (request, reply) => get_csrf_route(request, reply));
	
	// signup process
	app.post('/signup', async (request, reply) => signup_route(request, reply));
	app.post('/signup/otp-validation', async (request, reply) => signup_otp_validation_route(request,reply));	
	
	// logout process

	app.post('/logout', async (request, reply) => logout_route(request, reply))
	
	/// debuggin process ----
	/**
	 * flow : signup request... validation  link sended...
	 * route requested : 
	 * /auth/signup -> a mail is sended via rabbitmq...
	 * 
	 * 
	 */

	////



	app.post('/password', async (request, reply) => reset_password_route(request, reply));
	app.patch('/password', async (request, reply) => update_password_route(request, reply));


	// reset-password (forget password process)

	app.get('/reset-password/:email/:uuid', async (request, reply) => reset_forgotten_password_request_route(request, reply));
	app.patch('/reset-password/:email/:uuid', async (request, reply) =>reset_forgotten_password_route(request, reply));
	


	
	
	

	

}