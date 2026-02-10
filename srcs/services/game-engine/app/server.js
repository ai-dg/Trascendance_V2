import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { setupMetrics } from '/monitoring/metrics.js';

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
	app.log.info('HTTPS certs not found, running on HTTP');
}

const app = Fastify({https: httpsOptions, logger: { level: process.env.LOG_LEVEL || 'info' }});
export { app };
setupMetrics(app, 'game-engine');

app.get('/', async () => {
	return { status: 'ok', service: 'game-engine_app' };
});


const start = async () => {
	try {
		app.listen({ port: 3007, host: '0.0.0.0' });
		app.log.info('Service game-engine running');
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();

