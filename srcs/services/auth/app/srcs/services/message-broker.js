import amqp from 'amqplib';
import { app } from '../../server.js';
import { confirm_email_token } from '../auth.js';


export const mail_queue = 'send-mail-queue';
export const validation_queue = "email-validation-queue"

export async function connect_message_queue() {
  const user = process.env.RABBITMQ_DEFAULT_USER;
  const password = process.env.RABBITMQ_DEFAULT_PASSWORD;
  const connection = await amqp.connect(`amqp://${user}:${password}@rabbitmq:5672`);
  
  // Channel for transactional mail (fast)
  const mailChannel = await connection.createChannel();
  await mailChannel.assertQueue(mail_queue, { durable: true });
  await mailChannel.prefetch(10);
  
  const validationChannel = await connection.createChannel();
  await validationChannel.assertQueue(validation_queue, { durable: true });
  await validationChannel.prefetch(10);
  
  return {
	connection,
	mailChannel,
	validationChannel
  };
}


export async function setupMessageQueues() {
  const { connection, mailChannel, validationChannel } = await connect_message_queue();
  
  // Attach channels to Fastify app
  app.mailChannel = mailChannel;
  app.validationChannel = validationChannel;
  app.rabbitConnection = connection;
  

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
	  
	  
	  const result = await confirm_email_token(token);
	  
	  await validationChannel.sendToQueue(
		msg.properties.replyTo,
		Buffer.from(JSON.stringify(result)),
		{ correlationId: msg.properties.correlationId }
	  );
	  
	  shouldAck = true;
	  
	} catch (error) {
	  console.error("Validation error:", error);
	  
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
		  console.error("Error sending response:", sendError);
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
	console.log('Closing RabbitMQ connections...');
	await mailChannel.close();
	await validationChannel.close();
	await connection.close();
	process.exit(0);
  });
}
