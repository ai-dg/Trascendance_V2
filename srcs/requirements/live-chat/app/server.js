import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = Fastify();

async function setupDatabase() {
	const db = await open({
		filename: '/data/live-chat.sqlite',
		driver: sqlite3.Database
	})

	await db.exec(`
		CREATE TABLE IF NOT EXISTS "live-chat" (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		context TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	return db;
}

app.get('/', async () => {
	return { status: 'ok', service: 'live-chat' };
});

app.get('/live-chat', async (request, reply) => {
	const rows = await app.db.all('SELECT * FROM "live-chat" ORDER BY created_at DESC');
	return rows;
})

app.post('/live-chat', async (request, reply) => {
	console.log('Body: ', request.body);
	const { context } = request.body;
	await app.db.run('INSERT INTO live-chat (context) VALUES (?)', [context]);
	return { ok: true };
});

const start = async () => {
	try {
		app.db = await setupDatabase();
		await app.listen({ port: 3000, host: '0.0.0.0' });
		console.log('live-chat service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

