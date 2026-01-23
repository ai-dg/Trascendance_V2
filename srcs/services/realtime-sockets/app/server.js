import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
//import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'crypto';
import fs from 'fs';
import { Game } from '../../game-engine/app/srcs/js/Game.js';
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

// Subscribe to Redis notifications
await subscriber.subscribe('notifications', (message) => {
    const { targetUserId, event, payload } = JSON.parse(message);

    const userSockets = generalConnections.get(targetUserId);
    if (userSockets) {
        console.log(`Relaying ${event} to user ${targetUserId}`);
        userSockets.forEach(socket => socket.emit(event, payload));
    }
});

await subscriber.subscribe('game-updates', (message) => {
	const data = JSON.parse(message);
	const gameUUID = data.gameUUID || data.uuid;
	io.of('/game').to(`game-${gameUUID}`).emit('game-update', data);
});

// Socket authentication middleware
function parseCookie(cookieString, name) {
  const cookies = cookieString.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

async function socketAuthMiddleware(socket, next) {
  try {
    const cookies = socket.handshake.headers.cookie;

    // Allow guests for game sockets
    if (!cookies) {
      socket.userId = `guest:${socket.id}`;
      socket.user = "Guest";
      return next();
    }

    const token = parseCookie(cookies, 'token');

    if (!token) {
      // Allow guests for game sockets
      socket.userId = `guest:${socket.id}`;
      socket.user = "Guest";
      return next();
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

    socket.userId = payload.user_id || payload.id;
    socket.user = payload.pseudo || payload;
    console.log("payload : ", payload)
    console.log("A")
    next();

  } catch (err) {
    console.error('Auth error:', err);
    next(new Error('Authentication failed'));
  }
}

// Socket.IO authentication middleware
io.use(async (socket, next) => {
	socketAuthMiddleware(socket, next).catch(err => {
		next(new Error('Authentication middleware error'));
	});
});

io.on('connection', async (socket) => {
	console.log("🎯 Socket.IO client connected");
	const userId = socket.userId;
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
gameNamespace.on('connection', (socket) => setupGeneralGameSocket(socket));

function setupGeneralGameSocket(socket) {
	const userId = socket.userId;
	console.log('✅ Utilisateur authentifié:', userId);
	socket.emit("welcome", {message : "welcome in the game !", userId: userId, user: socket.user})
	socket.join(`user-${userId}`);

	socket.on("request-game-uid", (data) => requestGameUID(socket, data) );

	socket.on("join-game", (data) => {
		console.log("Joining game : ", data);
		socket.join(`game-${data.UUID}`);
		socket.emit("joined-game", {UUID: data.UUID});
	});

	socket.on("new-game", (data) => newGameSocket(socket, data) );
	socket.on("paddle-move", (data) => {
		console.log("Paddle move data : ", data);
		redis.publish(`game-input-${data.UUID}`, JSON.stringify({
			gameUUID: data.UUID,
			userId: userId,
			position: data.position
		}));

	});
}

function requestGameUID(socket, data){
	let uuid = crypto.randomUUID()
	console.log("Before type")
	if (data.type === "local")
	{
		console.log("Local activated")
		console.log("data: ", data, "uuid : ", uuid)

		runningGames[uuid] = new Game(socket, {
			uuid: uuid,
			type: data.type
		});

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "ai")
	{
		console.log("AI Activated")
		console.log("data: ", data, "uuid : ", uuid)

		runningGames[uuid] = new Game(socket, {
			uuid: uuid,
			type: data.type,
			difficulty: data.difficulty || 'medium'
		}, undefined, redis);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "remote")
		console.log("Remote Activated")
}

function gameHandler(uuid, data){
	const game = runningGames[uuid];

	if (!game)
	{
		console.error(`Game ${uuid} not found!`);
		return;
	}

	if (data.action === "player-ready")
		game.setPlayerReady(data.player);
	else if (data.action === "pause-game")
		game.pauseGame();
	else if (data.action === "resume-game")
		game.resumeGame();
	else if (data.action === "reset-game")
		game.resetGame();
	else if (data.state)
		game.updatePlayerMove(data.state.paddle1, data.state.paddle2);
}



function newGameSocket(socket, data){
	console.log("data : ", data);
}

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
