

import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { createClient } from 'redis';
import { setupMessageQueues } from './srcs/services/message-broker.js';
import { routes } from './srcs/routes/routes.js';
import fs from 'fs';
import path from 'path';
import { vaultClient } from './srcs/services/vault.js';



/************************************************************************************************* */
//										     AUTH SERVER                                           //
/************************************************************************************************* */


const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"

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

await vaultClient.loadSecrets();
const redisConfig = vaultClient.get('redis');
export const rabbitmqAuth = vaultClient.get('rabbitmq')
export const fortytwoAuth = vaultClient.get('fortytwo')
export const authData = vaultClient.get('auth')

export const app = Fastify({trustProxy: true, https: httpsOptions});
export const redis = createClient({
	socket: {
	host: redisConfig.host,
	port: redisConfig.port
	},
	password: redisConfig.password
});

redis.on('connect', () => {
  console.log('🔄 Redis: Connexion en cours...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Connecté et prêt !');
});

redis.on('error', (err) => {
  console.error('❌ Redis erreur:', err);
});

redis.on('end', () => {
  console.log('🔌 Redis: Déconnecté');
});

await redis.connect();
console.log('🎉 Redis connect() terminé');



await app.register(cors, {
	origin: `https://${base_url}`,
	credentials: true
});


await app.register(cookie, {
	secret: authData.cookie,
	parseOptions: {}
});


async function setupDatabase() {
	try{
		const db = await open({
			filename: '/data/auth.sqlite',
			driver: sqlite3.Database
		})

		await db.exec(`
			CREATE TABLE IF NOT EXISTS users (
			user_id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_mail TEXT NOT NULL UNIQUE,
			pseudo TEXT NOT NULL UNIQUE,
			user_password TEXT NOT NULL,		avatar TEXT,			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);`);
		return db;
	}
	catch(err){
		console.log("fail opening db");
		return null;
	}
}


app.addHook('onRequest', async (request, reply) => {
	console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
	// console.log('Origine :', request.headers.origin);
});



app.register(routes,{});


app.get('/test-route', async () => {
	return { status: 'ok', service: 'auth' };
});



const start = async () => {
	try {
		const port = 3000;
		app.db = await setupDatabase();
		await app.listen({ port: port, host: '0.0.0.0'});
		await setupMessageQueues();
		console.log(`Auth service running on port ${port}`);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start()

