import fastify from 'fastify';
import view from '@fastify/view';
import ejs from 'ejs';
import fastifyStatic from '@fastify/static';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = fastify();

app.register(fastifyStatic, {
  root: join(__dirname, 'srcs/public'),
  prefix: '/public/',
});

app.register(view, {
    engine: { ejs },
    root: join(__dirname, 'srcs/views')

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
