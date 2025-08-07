import { 
		reset_password_route, 
		get_csrf_route, 
		otp_validation_route, 
		login_route,
		logout_route, 
		update_password_route,
		reset_forgotten_password_route,
		reset_forgotten_password_request_route,
		signup_route } from "../controleurs/controleurs.js";


export function routes(server, options)
{
	// login process
	server.post('/login', async (request, reply) => login_route(request, reply))
	server.post('/otp-validation', async (request, reply) => otp_validation_route(request,reply));	
	server.get('/csrf-token', async (request, reply) => get_csrf_route(request, reply));
	
	// logout process
	server.post('/logout', async (request, reply) => logout_route(request, reply))
	
	// signup process
	server.post('/signup', async (request, reply) => signup_route(request, reply));
	/// debuggin process ----
	/**
	 * flow : signup request... validation  link sended...
	 * route requested : 
	 * /auth/signup -> a mail is sended via rabbitmq...
	 * 
	 * 
	 */

	////



	server.post('/password', async (request, reply) => reset_password_route(request, reply));
	server.patch('/password', async (request, reply) => update_password_route(request, reply));


	// reset-password (forget password process)

	server.get('/reset-password/:email/:uuid', async (request, reply) => reset_forgotten_password_request_route(request, reply));
	server.patch('/reset-password/:email/:uuid', async (request, reply) =>reset_forgotten_password_route(request, reply));
	


	
	

	

}