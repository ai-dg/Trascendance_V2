import Fastify from 'fastify';

const app = Fastify();

app.get('/', async () => {
	return { status: 'ok', service: 'remote-players' };
});

const start = async () => {
	try {
		app.listen({ port: 3003, host: '0.0.0.0' });
		console.log('Remote-player service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();



