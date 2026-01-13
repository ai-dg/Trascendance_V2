import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';

// HTTPS options
let httpsOptions = {};
try {
	const certPath = path.join('/certs', 'cert.pem');
	const keyPath = path.join('/certs', 'key.pem');
	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
		httpsOptions = {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath)
		};
	}
} catch (err) {
	console.log('HTTPS certs not found, running on HTTP');
}

const app = Fastify({https: httpsOptions});

app.get('/', async () => {	

	return { status: 'ok', service: 'backend-ai' };
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
