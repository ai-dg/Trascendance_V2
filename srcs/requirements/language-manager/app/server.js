import Fastify from 'fastify';

const app = Fastify();

app.get('/', async () => {
	return { status: 'ok', service: 'language-manager' };
});

app.listen({ port: 3000, host: '0.0.0.0' });
