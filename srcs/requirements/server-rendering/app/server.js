import Fastify from 'fastify';
import pointOfView from '@fastify/view'
import ejs from 'ejs'
import { join, resolve } from 'path';


const app = Fastify();

app.register(pointOfView, {
    engine: { ejs },
    root: resolve( 'srcs', 'ejs-templates')

})

app.get('/', (req, reply) => {
    reply.view('index.ejs')
})


const start = async () => {
	try {
		app.listen({ port: 3005, host: '0.0.0.0' });
		console.log('server-rendering service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
