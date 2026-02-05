import fastify from 'fastify';
import view from '@fastify/view';
import ejs from 'ejs';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { routes } from './routes.js';
import amqp from 'amqplib'
import path from 'path';
import { vaultClient } from '../../auth/app/srcs/services/vault.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export let base_url = "localhost";
const is_prod = process.env.NODE_ENV === "PROD"

export const validation_queue = "email-validation-queue"


await vaultClient.loadSecrets();
export const rabbitmqAuth = vaultClient.get('rabbitmq')
export const authData = vaultClient.get('auth')


async function connect_message_queue(){
	const user = rabbitmqAuth.user;
	const password = rabbitmqAuth.password;
	const connection = await amqp.connect(`amqp://${user}:${password}@rabbit:5672`);
	const channel = await connection.createChannel();
	await channel.assertQueue(validation_queue, { durable : true });
	connection.on('error', (err) => {
    	console.error('Connexion RabbitMQ error:', err);
		});
	connection.on('close', () => {
		console.log('Connexion RabbitMQ fermée !');
		});
	channel.on('error', (err) => {
		console.error('Channel error:', err);
		});
	channel.on('close', () => {
		console.log('Channel fermé !');
		});
	return channel;
} 


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

export const app = fastify({https: httpsOptions});

app.register(fastifyStatic, {
  root: join(__dirname, '../../public'),
  prefix: '/public/',
});

app.register(view, {
  engine: { ejs },
  root: join(__dirname, '../../views')
});


export function loadTranslations(lang = 'en') {
  const filePath = join(__dirname, `../../locales/${lang}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    return JSON.parse(fs.readFileSync(join(__dirname, '../../locales/en.json')));
  }
}


app.register(routes, {});

const start = async () => {
  try {
    await app.listen({ port: 3005, host: '0.0.0.0' });
	app.channel = await connect_message_queue()
    console.log('server-rendering service running');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

