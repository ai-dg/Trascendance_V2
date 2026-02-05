import Fastify from 'fastify';
import 'dotenv/config';
import nodemailer from "nodemailer";
import { vaultClient } from './vault.js';
import amqp from 'amqplib';
import fs from 'fs';
import path from 'path';



await vaultClient.loadSecrets();
const rabbitmq = vaultClient.get('rabbitmq')
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

const app = Fastify({https: httpsOptions});

const mail_queue = 'send-mail-queue';


async function connect_message_queue() {
  const user = rabbitmq.user
  const password = rabbitmq.password
  const connection = await amqp.connect(`amqp://${user}:${password}@rabbitmq:5672`);
  const channel = await connection.createChannel();
  await channel.assertQueue(mail_queue, { durable : true });
  return channel;
}


const mailer = nodemailer.createTransport({
  host: "mailpit",
  port: 1025,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});



const start = async () => {
	try {
		const port = 3300;
		app.channel = await connect_message_queue()

		await app.listen({ port: port, host: '0.0.0.0'});
		console.log(`Auth service running on port ${port}`);

		app.channel.consume(mail_queue, async(msg) => {
			if (msg !== null)
			{
				const payload = JSON.parse(msg.content.toString());

				console.log(payload);
				mailer.sendMail(payload)
					.then(info => {console.log("✔ Mail envoyé :", info.response)
								app.channel.ack(msg);

					})
					.catch(error => console.error("❌ Erreur mail :", error));
			}
		})

	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
