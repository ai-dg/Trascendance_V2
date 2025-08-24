import fastify from 'fastify';
import view from '@fastify/view';
import ejs from 'ejs';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { routes } from './routes.js';
import amqp from 'amqplib'

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export let base_url = "localhost:8080";
const is_prod = process.env.NODE_ENV === "PROD"

export const validation_queue = "email-validation-queue"


async function connect_message_queue(){
	const user = process.env.RABBITMQ_DEFAULT_USER;
	const password = process.env.RABBITMQ_DEFAULT_PASSWORD;
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


export const app = fastify();

app.register(fastifyStatic, {
  root: join(__dirname, 'srcs/public'),
  prefix: '/public/',
});

app.register(view, {
  engine: { ejs },
  root: join(__dirname, 'srcs/views')
});


export function loadTranslations(lang = 'en') {
  const filePath = join(__dirname, `srcs/locales/${lang}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath));
  } else {
    return JSON.parse(fs.readFileSync(join(__dirname, 'srcs/locales/en.json')));
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