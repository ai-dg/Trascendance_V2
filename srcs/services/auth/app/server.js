

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

export const app = Fastify({trustProxy: true, https: httpsOptions});

export const redis = createClient({
	socket: {
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT
	},
	password: process.env.REDIS_PASSWORD
});

await redis.connect();


// Allow dev origins so cookies are accepted when using http://localhost:8080 etc.
const allowedOrigins = [
	`https://${base_url}`,
	`http://${base_url}`,
	'http://localhost',
	'https://localhost',
	'http://localhost:8080',
	'https://localhost:8080',
	'http://127.0.0.1',
	'http://127.0.0.1:8080'
];
await app.register(cors, {
	origin: (origin, cb) => {
		if (!origin) return cb(null, allowedOrigins[0]);
		if (allowedOrigins.includes(origin)) return cb(null, true);
		try {
			const u = new URL(origin);
			if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return cb(null, true);
		} catch (_) {}
		cb(null, false);
	},
	credentials: true,
	allowedHeaders: ['Content-Type', 'Authorization']
});


await app.register(cookie, {
	secret: process.env.COOKIE_SECRET,
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

