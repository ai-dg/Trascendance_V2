import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const app = Fastify({trustProxy: true});
const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"

export async function setupLanguagedb() {
	try {
		const db = await open({
			filename: '/data/live-chat.sqlite',
			driver: sqlite3.Database
		});

		await db.exec(`
			CREATE TABLE IF NOT EXISTS friendships (
			    user_id INTEGER NOT NULL,
			    friend_id INTEGER NOT NULL,
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

		console.log("Live-chat db ready");
		return db;
	} catch (err) {
		console.error("Failed to open live-chat database: ", err);
		process.exit(1);
	}
}

// app.register(cookie, {
//   secret: process.env.COOKIE_SECRET,
// });

app.get('/', async () => {
	return { status: 'ok', service: 'live-chat' };
});	

// app.register(routes,{});

const start = async () => {
	app.db = await setupLanguagedb();
	if (!app.db) process.exit(1);
	try {
		app.listen({ port: 3002, host: '0.0.0.0' });
		console.log('live-chat service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

