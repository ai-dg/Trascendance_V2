import Fastify from 'fastify';

const app = Fastify();

app.get('/', async () => {
	return { status: 'ok', service: 'language-manager' };
});


const start = async () => {
	try {
		app.listen({ port: 3001, host: '0.0.0.0' });
		console.log('Language-manager service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

