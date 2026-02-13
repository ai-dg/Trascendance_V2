
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
import { setupMetrics } from '/monitoring/metrics.js';

const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

export const app = Fastify({trustProxy: true, https: httpsOptions, logger: { level: process.env.LOG_LEVEL || 'info' }});
setupMetrics(app, 'live-chat');

export const redis = createClient({
	socket: {
	host: process.env.REDIS_HOST || 'redis',
	port: process.env.REDIS_PORT
	},
	password: process.env.REDIS_PASSWORD
});

try {
  await redis.connect();
  app.log.info("Connected to Redis");
} catch (err) {
  app.log.error("Failed to connect to Redis:", err);
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

		// --- MIGRATION: Add columns to messages table if not exist ---
		const columns = await db.all(`PRAGMA table_info(messages);`);
		const colNames = columns.map(c => c.name);
		if (!colNames.includes('message_type')) {
			await db.exec(`ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text';`);
		}
		if (!colNames.includes('game_state')) {
			await db.exec(`ALTER TABLE messages ADD COLUMN game_state TEXT DEFAULT NULL;`);
		}
		if (!colNames.includes('game_uuid')) {
			await db.exec(`ALTER TABLE messages ADD COLUMN game_uuid TEXT DEFAULT NULL;`);
		}
		if (!colNames.includes('game_metadata')) {
			await db.exec(`ALTER TABLE messages ADD COLUMN game_metadata TEXT DEFAULT NULL;`);
		}
		if (!colNames.includes('expires_at')) {
			await db.exec(`ALTER TABLE messages ADD COLUMN expires_at DATETIME DEFAULT NULL;`);
		}

		// --- MIGRATION: Create game_invitations table ---
		await db.exec(`
			CREATE TABLE IF NOT EXISTS game_invitations (
				invitation_id INTEGER PRIMARY KEY AUTOINCREMENT,
				message_id INTEGER NOT NULL,
				game_uuid TEXT UNIQUE,
				inviter_id INTEGER NOT NULL,
				invitee_id INTEGER NOT NULL,
				state TEXT DEFAULT 'pending',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				expires_at DATETIME,
				FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
			);
		`);
		await db.exec(`CREATE INDEX IF NOT EXISTS idx_game_invitations_uuid ON game_invitations(game_uuid);`);
		await db.exec(`CREATE INDEX IF NOT EXISTS idx_game_invitations_users ON game_invitations(inviter_id, invitee_id);`);

		app.log.info("Live-chat db ready (migrated)");
		return db;
	} catch (err) {
		app.log.error("Failed to open live-chat database: ", err);
		process.exit(1);
	}
}

app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {}
});

process.on('unhandledRejection', (reason) => {
  app.log.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  app.log.error('Uncaught Exception:', err);
});


app.register(routes,{});

app.get('/live-chat', async () => {
	return { status: 'ok', service: 'live-chat' };
});



const start = async () => {
	try {
		app.db = await setupLiveChatdb();
		if (!app.db) {
			app.log.error('Database live-chat not up');
			process.exit(1);
		}

		// --- TTL expiry background job for pending invites ---
		setInterval(async () => {
			try {
				const expiredInvites = await app.db.all(`
					SELECT invitation_id, message_id, inviter_id, invitee_id
					FROM game_invitations
					WHERE state = 'pending' AND expires_at < datetime('now')
				`);

				for (const invite of expiredInvites) {
					await app.db.run(`
						UPDATE game_invitations SET state = 'expired' WHERE invitation_id = ?
					`, [invite.invitation_id]);

					await app.db.run(`
						UPDATE messages SET game_state = 'expired' WHERE message_id = ?
					`, [invite.message_id]);

					// Notify both users
					await redis.publish('notifications', JSON.stringify({
						targetUserId: invite.inviter_id,
						event: 'notifications',
						payload: {
							type: 'game-invite-expired',
							messageId: invite.message_id,
							state: 'expired'
						}
					}));

					await redis.publish('notifications', JSON.stringify({
						targetUserId: invite.invitee_id,
						event: 'notifications',
						payload: {
							type: 'game-invite-expired',
							messageId: invite.message_id,
							state: 'expired'
						}
					}));
				}
			} catch (err) {
				app.log.error("Error checking expired invites:", err);
			}
		}, 60000); // Check every minute

		await app.listen({ port: 3002, host: '0.0.0.0' });
		app.log.info('live-chat service running on port 3002');
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();

