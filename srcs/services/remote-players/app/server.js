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

const generalConnections = new Map();

app.get('/', async () => {
    return { status: 'ok', service: 'remote-players' };
});

// Create Socket.IO server
const io = new Server(app.server, {
    cors: {
        origin: `https://${base_url}`,
        credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
});

console.log("✅ Socket.IO server created");

<<<<<<< Updated upstream
// Socket.IO authentication middleware
io.use(async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            console.log("No cookies found");
            return next(new Error('No cookies'));
        }
        
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (!tokenMatch) {
            console.log("No token found");
            return next(new Error('No token'));
        }
        
        const token = tokenMatch[1];
        const val = jwt.decode(token, process.env.JWT_SECRET);
        
        if (!val || !val.jti) {
            console.log("Invalid token structure");
            return next(new Error('Invalid token'));
        }
        
        const exists = await redis.get(`jwt:${val.jti}`);
        if (!exists || exists === "not valid") {
            console.log("Token not valid in Redis");
            return next(new Error('Token not valid'));
        }
        
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ User authenticated:", payload);
        socket.user = payload;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        next(new Error('Unauthorized'));
    }
});

// Socket.IO connection handler
io.on('connection', async (socket) => {
    console.log("🎯 Socket.IO client connected");
    
    const userId = socket.user.id || socket.user.sub || socket.user.jti;
    console.log("User ID:", userId);
    
    generalConnections.set(userId, socket);
    await redis.set(`online:${userId}`, 'true');
    
    socket.emit('welcome', { message: 'Bienvenue sur le canal global' });
    
    socket.on('add-friend', async (data) => {
        const { senderId, receiverId } = data;
=======
function setupSocketIO(){
	const io = socketio;
	io.of('/general2').use(socketAuthMiddleware)
	io.of('/general2').on('connection',  (socket) => setupGeneralGameSocket(socket));
}

function setupGeneralGameSocket(socket){
	console.log('✅ Utilisateur authentifié:', socket.userId);
	socket.emit("welcome", {message : "welcome !", userId: socket.userId, user: socket.user})
	socket.broadcast.emit("user-joined", {userId: socket.id});
	socket.on("new-game", (data) => newGameSocket(socket, data))
}

function newGameSocket(socket, data){
	console.log("data : ", data);
}
>>>>>>> Stashed changes

async function socketAuthMiddleware(socket, next) {
  try {

    const cookies = socket.handshake.headers.cookie;    
    if (!cookies) {
		   console.log("E")
      return next(new Error('No cookies'));
    }
    const token = parseCookie(cookies, 'token');
    
    if (!token) {
		   console.log("D")
      return next(new Error('No token'));
    }

    const val = jwt.decode(token, process.env.JWT_SECRET);
    
    if (!val || !val.jti) {
		   console.log("C")
      return next(new Error('Invalid token'));
    }
    
    const exists = await redis.get(`jwt:${val.jti}`);
    
    if (!exists || exists === "not valid") {
	   console.log("B")
      return next(new Error('Token not valid in Redis'));
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    socket.userId = payload.user_id;
    socket.user = payload.pseudo;
	console.log("payload : ", payload)
    console.log("A")
    next();
    
  } catch (err) {
    console.error('Auth error:', err);
    next(new Error('Authentication failed'));
  }
}


function parseCookie(cookieString, name) {
  const cookies = cookieString.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

        console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);
        
        try {

            const cookies = socket.handshake.headers.cookie;
            const tokenMatch = cookies.match(/token=([^;]+)/);
            const token = tokenMatch ? tokenMatch[1] : null;
            
            const resDB = await fetch('http://live-chat_app:3002/friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId, token })
            });

            const resData = await resDB.json();
            
            if (!resDB.ok) {
                console.error('Failed to request friend in DB:', resData);
                socket.emit('friend-request-status', { 
                    success: false, 
                    message: 'Failed to send request' 
                });
                return;
            }
            
            const receiverSocket = generalConnections.get(receiverId);
            if (receiverSocket) {
                receiverSocket.emit('friend-request', {
                    senderId,
                    message: `${senderId} wants to be your friend!`
                });
            } else {
                await redis.set(`friend-request:${receiverId}:${senderId}`, 'pending');
                console.log(`Friend request from ${senderId} saved in Redis for ${receiverId}`);
            }
            
            socket.emit('friend-request-status', { 
                success: true, 
                message: 'Friend request sent' 
            });
        } catch (error) {
            console.error("Error with friend request:", error);
            socket.emit('friend-request-status', { 
                success: false, 
                message: 'Error occurred' 
            });
        }
    });
    
    socket.on('disconnect', () => {
        generalConnections.delete(userId);
        redis.del(`online:${userId}`);
        console.log('Socket.IO client disconnected');
    });
});

const start = async () => {
<<<<<<< Updated upstream
    try {
        console.log(app.printRoutes());
        await app.listen({ port: 3003, host: '0.0.0.0' });
        console.log('✅ Remote-player service running on port 3003 with Socket.IO');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
=======
	try {
		console.log(app.printRoutes());
		 await app.listen({ port: 3003, host: '0.0.0.0' });

		socketio = new Server(app.server, {
		path: '/socket.io/',
		cors: { origin: true, credentials: true }
		});

console.log('Socket.IO path:', '/socket.io/');
		setupSocketIO();
		console.log('Remote-player service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
>>>>>>> Stashed changes
};

start();
