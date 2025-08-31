import Fastify from 'fastify';

const app = Fastify();

app.get('/', async () => {	

	return { status: 'ok', service: 'match-maker' };
});


const start = async () => {
	try {
		app.listen({ port: 3004, host: '0.0.0.0' });
		console.log('Match maker service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
