// import Fastify from 'fastify';
// import websocket from '@fastify/websocket';
// import cookie from '@fastify/cookie';
// import jwt from 'jsonwebtoken';
// import { createClient } from 'redis';
// import cors from '@fastify/cors';
// import { Server } from 'socket.io';
// import fastifySocketIO from '@fastify/socket.io';


// export const app = Fastify({trustProxy: true});
// const is_prod = process.env.NODE_ENV === "PROD"
// export const base_url = is_prod ? "www.transcendance.com" : "localhost"

// export const redis = createClient({
// 	socket: {
// 	host: process.env.REDIS_HOST,
// 	port: process.env.REDIS_PORT
// 	},
// 	password: process.env.REDIS_PASSWORD
// });

// await redis.connect();


// // await app.register(cors, {
// // 	origin: `https://${base_url}`,
// // 	credentials: true
// // });


// await app.register(cookie, {
// 	secret: process.env.COOKIE_SECRET,
// 	parseOptions: {}
// });

// // app.register(websocket);
// const io = new Server(app.server, {
// 	cors: {
// 		origin: `https://${base_url}`,
// 		credentials: true
// 	},
// 	path: '/socket.io/',
// 	transports: ['websocket', 'polling']
// });
// console.log("✅ WebSocket plugin enregistré");



// const generalConnections = new Map();

// app.get('/', async () => {
// 	return { status: 'ok', service: 'remote-players' };
// });


// // async function isConnectedWSSHook(request, reply) {
// // 	const isWebSocket = request.headers.upgrade === 'websocket';
// // 	const token = request.cookies.token;
// //     if (!token)
// // 	{
// // 		console.log("no token found")
// // 		if (isWebSocket)
// // 			throw new Error("Unauthorized")
// // 		return reply.code(401).send({ error: 'Non autorisé' });
// // 	}
// //     try {
// //     	const val = jwt.decode(token, process.env.JWT_SECRET);
// // 		console.log(val)
// //     	if (!val || !val.jti)
// // 		{
// // 			if (isWebSocket)
// // 				throw new Error("Unauthorized")
// // 			return reply.code(401).send({ error: 'Non autorisé' });
// // 		}
// // 		const exists = await redis.get(`jwt:${val.jti}`);
// // 		if (!exists || exists === "not valid")
// // 		{
// // 			if (isWebSocket)
// // 				throw new Error("Unauthorized")
// // 			return reply.code(401).send({ error: 'Non autorisé' });
// // 		}
// // 		const payload = jwt.verify(token, process.env.JWT_SECRET);
// // 		console.log( "payload:", payload)
// // 		request.user = payload;
// //     } catch (err) {
// // 		console.log(err)
// // 		if (isWebSocket)
// // 			throw new Error("Unauthorized")
// //         return reply.code(401).send({ error: 'Non autorisé' });
// //     }	
// // 	console.log("END OK CONNECTED WSSHOOK")
// // }


// // // app.get('/general', { websocket: true }, generalSocketHandler);




// // async function generalSocketRoute(socket, req){
// // 	 console.log("🎯 🎯 🎯 HANDLER APPELÉ 🎯 🎯 🎯");
// // 	try
// // 	{
// // 		const userId = req.user
// // 		console.log(userId)
// // 		generalConnections.set(userId, socket)

	

// // 	// connection.socket est le WebSocket


// // 		await redis.set(`online:${userId}`, 'true');
		
// // 		socket.emit('welcome', { message: 'Bienvenue sur le canal global' });
		
// // 		// Exemple : recevoir des messages
// // 		socket.on('message', message => {
// // 			console.log('Message reçu du client :', message.toString());
// // 		});

// // 		socket.on('add-friend', async(data) => {
// // 			const { senderId, receiverId } = data;

// // 			// socket.send(JSON.stringify({
// // 			// 	type: 'message',
// // 			// 	payload: { 
// // 			// 		senderId,
// // 			// 		receiverId,
// // 			// 		message: `User ${senderId} wants to add user ${receiverId} as a friend`
// // 			// 	}
// // 			// }));

// // 			console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);

// // 			try {
// // 				const resDB = await fetch('http://live-chat_app:3002/friend-request/', {
// // 					method: 'POST',
// // 					headers: { 'Content-Type': 'application/json' },
// // 					body: JSON.stringify({ receiverId })
// // 				});

// // 				if (!resDB.ok) {
// // 					console.error('Failed to request friend in DB');
// // 					return ;
// // 				}
// // 			} catch (error) {
// // 				console.error("Error to friend request: ", error);
// // 				return ;
// // 			}

// // 			const receiverSocket = generalConnections.get(receiverId);
// // 			if (receiverSocket) {
// // 				receiverSocket.emit('friend-request', {
// //                     senderId,
// //                     message: `${senderId} wants to be your friend!`
// //                 });
// // 			} else {
// // 				await redis.set('friend-request:${receiverId}:${senderId}', 'pending');
// // 				console.log(`Friend request from ${senderId} saved in Redis for ${receiverId}`);
// // 			}
// // 		})
	
// // 		// Exemple : envoyer un message au client
		
// // 		socket.emit('friend-request-status', { 
// //                 success: true, 
// //                 message: 'Friend request sent' 
// //         });
// // 		// Gestion de la fermeture
// // 		socket.on('close', () => {
// // 			generalConnections.delete(userId);
// // 			redis.del(`online:${userId}`);
// // 			console.log('Connexion WebSocket fermée');
// // 		});

// // 	}
// // 	catch(err){
// // 		console.error(err);		
// // 	}
// // }


// // async function gameSocketRoute(socket, req){
// // 	 console.log("🎯 🎯 🎯 HANDLER APPELÉ 🎯 🎯 🎯");
// // 	try
// // 	{
// // 		const userId = req.user
// // 		console.log(userId)
// // 		generalConnections.set(userId, socket)

	

// // 	// connection.socket est le WebSocket


// // 		redis.set(`online:${userId}`, 'true');
	
// // 		// Exemple : recevoir des messages
// // 		socket.on('message', message => {
// // 			console.log('Message reçu du client :', message.toString());
// // 		});
	
// // 		// Exemple : envoyer un message au client
		
// // 		socket.send(JSON.stringify({ type: 'welcome', payload: 'Bienvenue sur le canal game' }));

// // 		// Gestion de la fermeture
// // 		socket.on('close', () => {
// // 			generalConnections.delete(userId);
// // 			redis.del(`online:${userId}`);
// // 			console.log('Connexion WebSocket fermée');
// // 		});

// // 	}
// // 	catch(err){
// // 		console.error(err);		
// // 	}

// // }

// io.on('connection', async (socket) => {
//     console.log("🎯 Socket.IO client connected");
    
//     const userId = socket.user.id || socket.user.sub;
//     generalConnections.set(userId, socket);
//     await redis.set(`online:${userId}`, 'true');
    
//     socket.emit('welcome', { message: 'Bienvenue sur le canal global' });
    
//     socket.on('add-friend', async (data) => {
//         const { senderId, receiverId } = data;
//         console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);
        
//         try {
//             const resDB = await fetch('http://live-chat_app:3002/friend-request/', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ receiverId })
//             });
            
//             if (!resDB.ok) {
//                 console.error('Failed to request friend in DB');
//                 socket.emit('friend-request-status', { 
//                     success: false, 
//                     message: 'Failed to send request' 
//                 });
//                 return;
//             }
            
//             const receiverSocket = generalConnections.get(receiverId);
//             if (receiverSocket) {
//                 receiverSocket.emit('friend-request', {
//                     senderId,
//                     message: `${senderId} wants to be your friend!`
//                 });
//             } else {
//                 await redis.set(`friend-request:${receiverId}:${senderId}`, 'pending');
//                 console.log(`Friend request from ${senderId} saved in Redis for ${receiverId}`);
//             }
            
//             socket.emit('friend-request-status', { 
//                 success: true, 
//                 message: 'Friend request sent' 
//             });
//         } catch (error) {
//             console.error("Error with friend request:", error);
//             socket.emit('friend-request-status', { 
//                 success: false, 
//                 message: 'Error occurred' 
//             });
//         }
//     });
    
//     socket.on('disconnect', () => {
//         generalConnections.delete(userId);
//         redis.del(`online:${userId}`);
//         console.log('Socket.IO client disconnected');
//     });
// });


// await app.register(async function (fastify) {
// 	console.log("🔧 Enregistrement du contexte WebSocket");
//     fastify.get('/general', { websocket: true , preHandler: isConnectedWSSHook, logLevel: 'debug'}, async (socket, req) => generalSocketRoute(socket, req));
//     fastify.get('/game', { websocket: true , preHandler: isConnectedWSSHook, logLevel: 'debug'}, async (socket, req) => gameSocketRoute(socket, req));
// 	console.log("✅ Route /general enregistrée");
// });



// const start = async () => {
// 	try {
// 		console.log(app.printRoutes());
// 		 await app.listen({ port: 3003, host: '0.0.0.0' });
// 		console.log('Remote-player service running');
// 	} catch (err) {
// 		console.error(err);
// 		process.exit(1);
// 	}
// };

// start();



import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import { Server } from 'socket.io';

export const app = Fastify({trustProxy: true});
const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

export const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD
});

await redis.connect();

await app.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {}
});


app.get('/', async () => {
    return { status: 'ok', service: 'remote-players' };
});


const start = async () => {
    try {
        console.log(app.printRoutes());
        await app.listen({ port: 3003, host: '0.0.0.0' });
        console.log('✅ Remote-player service running on port 3003 with Socket.IO');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
