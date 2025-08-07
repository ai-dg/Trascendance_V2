import amqp from 'amqplib';
import { server } from '../../server.js';
import { confirm_email_token } from '../auth.js';


export const mail_queue = 'send-mail-queue';
export const validation_queue = "email-validation-queue"

export async function connect_message_queue() {
  const user = process.env.RABBITMQ_DEFAULT_USER;
  const password = process.env.RABBITMQ_DEFAULT_PASSWORD;
  const connection = await amqp.connect(`amqp://${user}:${password}@rabbitmq:5672`);
  
  // Canal pour les emails (rapide)
  const mailChannel = await connection.createChannel();
  await mailChannel.assertQueue(mail_queue, { durable: true });
  // Préfetch élevé pour les emails rapides
  await mailChannel.prefetch(10);
  
  const validationChannel = await connection.createChannel();
  await validationChannel.assertQueue(validation_queue, { durable: true });
  // Préfetch bas pour les validations lentes
  await validationChannel.prefetch(10);
  
  return {
	connection,
	mailChannel,
	validationChannel
  };
}


export async function setupMessageQueues() {
  const { connection, mailChannel, validationChannel } = await connect_message_queue();
  
  // Attacher les canaux a fastify
  server.mailChannel = mailChannel;
  server.validationChannel = validationChannel;
  server.rabbitConnection = connection;
  

  validationChannel.consume(validation_queue, async (msg) => {
	
	if (!msg)
	{
		console.log("returned....")
		return;
	}
   
	let shouldAck = false;
	
	try {
	  const messageData = JSON.parse(msg.content.toString());
	  const { token } = messageData;
	  
	  if (!token || !msg.properties.replyTo || !msg.properties.correlationId) {
		validationChannel.ack(msg);
		return;
	  }
	  
	  
	  // Traitement lent de la validation
	  const result = await confirm_email_token(token);
	  
	  await validationChannel.sendToQueue(
		msg.properties.replyTo,
		Buffer.from(JSON.stringify(result)),
		{ correlationId: msg.properties.correlationId }
	  );
	  
	  shouldAck = true;
	  
	} catch (error) {
	  console.error("Erreur validation:", error);
	  
	  if (msg.properties.replyTo && msg.properties.correlationId) {
		try {
		  await validationChannel.sendToQueue(
			msg.properties.replyTo,
			Buffer.from(JSON.stringify({
			  success: false,
			  message: error.message
			})),
			{ correlationId: msg.properties.correlationId }
		  );
		  shouldAck = true;
		} catch (sendError) {
		  console.error("Erreur envoi réponse:", sendError);
		}
	  } else {
		shouldAck = true;
	  }
	} finally {
	  if (shouldAck) {
		validationChannel.ack(msg);
	  }
	}
  });
  
  process.on('SIGINT', async () => {
	console.log('Fermeture des connexions RabbitMQ...');
	await mailChannel.close();
	await validationChannel.close();
	await connection.close();
	process.exit(0);
  });
}
