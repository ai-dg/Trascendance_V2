
import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';
import cookie from '@fastify/cookie';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { routes } from './srcs/routes/routes.js';
import fs from 'fs';
import path from 'path';
import { vaultClient } from './srcs/services/vault.js';

const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

await vaultClient.loadSecrets()
export const redisAuth = vaultClient.get('redis');
export const authData = vaultClient.get('auth')

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
	host: redisAuth.host || 'redis',
	port: redisAuth.port
	},
	password: redisAuth.password
});

try {
  await redis.connect();
  console.log("Connected to Redis");
} catch (err) {
  console.error("Failed to connect to Redis:", err);
}

async function setupLiveChatdb() {
	try {
		const db = await open({
			filename: '/data/live-chat.sqlite',
			driver: sqlite3.Database
		});

		await db.exec(`
			CREATE TABLE IF NOT EXISTS friendships (
			    user_id INTEGER NOT NULL,
			    friend_id INTEGER NOT NULL,
				requester_id INTEGER NOT NULL,
			    status TEXT DEFAULT 'pending',
			    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			    UNIQUE(user_id, friend_id)
			  );

			  CREATE TABLE IF NOT EXISTS messages (
			    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
			    sender_id INTEGER NOT NULL,
			    receiver_id INTEGER NOT NULL,
			    content TEXT NOT NULL,
			    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
			  );
			`);
		await db.exec(`
		    CREATE INDEX IF NOT EXISTS idx_messages_participants 
		    ON messages (sender_id, receiver_id);
		`);

			console.log("Live-chat db ready");
		return db;
	} catch (err) {
		console.error("Failed to open live-chat database: ", err);
		process.exit(1);
	}
}

app.register(cookie, {
  secret: authData.cookie,
  parseOptions: {}
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});


app.register(routes,{});

app.get('/live-chat', async () => {
	return { status: 'ok', service: 'live-chat' };
});	


const start = async () => {
	try {
		app.db = await setupLiveChatdb();
		if (!app.db) {
			console.error('Database live-chat not up');
			process.exit(1);
		}
		await app.listen({ port: 3002, host: '0.0.0.0' });
		console.log('live-chat service running on port 3002');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

