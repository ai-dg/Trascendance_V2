import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { routes } from './srcs/routes/routes.js';
import fs from 'fs';
import path from 'path';

// // HTTPS options
// let httpsOptions = {};
// try {
// 	const certPath = path.join('/certs', 'cert.pem');
// 	const keyPath = path.join('/certs', 'key.pem');
// 	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
// 		httpsOptions = {
// 			key: fs.readFileSync(keyPath),
// 			cert: fs.readFileSync(certPath)
// 		};
// 	}
// } catch (err) {
// 	console.log('HTTPS certs not found, running on HTTP');
// }

const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"

// HTTPS options
let httpsOptions = null;
try {
	const certPath = '/certs/cert.pem';
	const keyPath = '/certs/key.pem';

	// console.log('Cert exists:', fs.existsSync(certPath));
	// console.log('Key exists:', fs.existsSync(keyPath));

	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
		httpsOptions = {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath)
		};
		console.log('HTTPS certs loaded');
	} else {
		console.log('HTTPS certs not found');
	}
} catch (err) {
	console.error('Error loading HTTPS certs:', err);
}


export const app = Fastify({trustProxy: true, https: httpsOptions});

export async function setupLanguagedb() {
	try {
		const db = await open({
			filename: '/data/lang.sqlite',
			driver: sqlite3.Database
		});

		await db.exec(`
			CREATE TABLE IF NOT EXISTS user_lang (
				user_id INTEGER PRIMARY KEY, 
				lang TEXT NOT NULL DEFAULT 'en'
			);
		`);

		console.log("Lang db ready");
		return db;
	} catch (err) {
		console.error("Failed to open language databse: ", err);
		process.exit(1);
	}
}

app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});

app.get('/', async () => {
	return { status: 'ok', service: 'language-manager' };
});	

app.register(routes,{});

const start = async () => {
	app.db = await setupLanguagedb();
	if (!app.db) process.exit(1);
	try {
		app.listen({ port: 3001, host: '0.0.0.0' });
		console.log('Language-manager service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

