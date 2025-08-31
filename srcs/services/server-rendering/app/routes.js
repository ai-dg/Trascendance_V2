import { app } from './server.js'
import { reset_password_route, root_route, confirm_email, translate_route} from './controlers.js'


export function routes()
{
	app.get('/', async (req, reply) => root_route(req, reply));
	
	app.get('/api/translations', (req, reply) => translate_route(req, reply));
	
	app.get('/reset-password/:email/:uuid', async (request, reply) => reset_password_route(request, reply));
	app.get('/confirm-email/:token', async (request, reply) => confirm_email(request, reply));
}