import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'crypto';
import fs from 'fs';
// import { GameManager } from '../../game-engine/app/srcs/js/GameManager.js';
import path from 'path';


const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

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

let socketio = null;

/* Redis Client Setup */

export const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD
});

export const subscriber = redis.duplicate();

await redis.connect();
await subscriber.connect();

/* End Redis Client Setup */

await app.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {}
});

app.get('/', async () => {
    return { status: 'ok', service: 'realtime-sockets' };
});

const generalConnections = new Map();
const runningGames = new Map();


// Create Socket.IO server
const io = new Server(app.server, {
	cors: {
		origin: `https://${base_url}`,
		credentials: true
	},
	path: '/realtime-sockets/socket.io/',
	transports: ['websocket', 'polling']
});

console.log("✅ Socket.IO server created");


await subscriber.subscribe('notifications', (message) => {
    const { targetUserId, event, payload } = JSON.parse(message);
    
    const userSockets = generalConnections.get(targetUserId);
    if (userSockets) {
        console.log(`Relaying ${event} to user ${targetUserId}`);
        userSockets.forEach(socket => socket.emit(event, payload));
    }
});


// Socket.IO authentication middleware
io.use(async (socket, next) => {
	try {
		const cookies = socket.handshake.headers.cookie;
		if (!cookies) {
			console.log("No cookies found");
			throw new Error('No cookies');
		}
		
		const tokenMatch = cookies.match(/token=([^;]+)/);
		if (!tokenMatch) {
			console.log("No token found");
			throw new Error('No token');
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

io.on('connection', async (socket) => {
	console.log("🎯 Socket.IO client connected");
	const userId = socket.user.user_id || socket.user.id || socket.user.sub;
	console.log("User ID:", userId);
	if (!userId) {
		console.error("❌ No user ID found in token!");
		socket.disconnect();
		return;
	}
	if (!generalConnections.has(userId)) {
		generalConnections.set(userId, new Set());
	}
	generalConnections.get(userId).add(socket);
	console.log(`🌐 User ${userId} connected. Total connections for this user: ${generalConnections.get(userId).size}`);
	// generalConnections.set(userId, socket);
	await redis.set(`online:${userId}`, 'true');
	socket.emit('welcome', { message: 'Bienvenue sur le canal global' });

	socket.on('disconnect', () => {
		const userSockets = generalConnections.get(userId);
		if (userSockets) {
			userSockets.delete(socket);
			console.log(`🌐 User ${userId} disconnected. Remaining connections: ${userSockets.size}`);
			
			if (userSockets.size === 0) {
				generalConnections.delete(userId);
				redis.del(`online:${userId}`);
				console.log('Socket.IO client disconnected');
			}
		}
	});
});

const gameNamespace = io.of('/game');

gameNamespace.use(socketAuthMiddleware);

gameNamespace.on('connection',  (socket) => setupGeneralGameSocket(socket));



function setupSocketIO(){
	const io = socketio;
	io.of('/general').use(socketAuthMiddleware)
	io.of('/general').on('connection',  (socket) => setupGeneralGameSocket(socket));
}

function setupGeneralGameSocket(socket){
	console.log('✅ Utilisateur authentifié:', socket.userId);
	socket.emit("welcome", {message : "welcome in the game !", userId: socket.userId, user: socket.user})
	socket.broadcast.emit("user-joined", {userId: socket.id});
	socket.on("new-game", (data) => newGameSocket(socket, data))
	socket.on("game-request", (data) => requestGameUID(socket, data))
}

function requestGameUID(socket, data){
	let uuid = crypto.randomUUID()
	if (data.type === "local")
	{
		console.log("data: ", data, "uuid : ", uuid)
		
		// runningGames[uuid] = new GameManager(socket, {
		// 	uuid: uuid,
		// 	type: data.type
		// });
		
		socket.on(uuid, (eventData) => gameHandler(uuid, eventData));
		
		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
}

function gameHandler(uuid, data){
	const game = runningGames[uuid];
	
	if (!game) {
		console.error(`Game ${uuid} not found!`);
		return;
	}
	
	if (data.action === "player-ready") {
		game.setPlayerReady(data.player);
	}

	if (data.state) {
		game.updatePlayerMove(data.state.paddle1, data.state.paddle2);
	}
}

function newGameSocket(socket, data){
	console.log("data : ", data);
}

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

const start = async () => {
	try {
		console.log(app.printRoutes());
		 await app.listen({ port: 3003, host: '0.0.0.0' });

		// socketio = new Server(app.server, {
		// path: '/socket.io/',
		// cors: { origin: true, credentials: true }
		// });

		// console.log('Socket.IO path:', '/socket.io/');
		// setupSocketIO();
		console.log('✅ Remote-player service running on port 3003 with Socket.IO');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

