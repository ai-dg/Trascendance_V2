import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
//import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'crypto';
import { Game } from './srcs/Game.js';
import fs from 'fs';
import path from 'path';


const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

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

export const app = Fastify({trustProxy: true, https: httpsOptions});

let socketio = null;

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
const runningGames = new Map();

app.get('/', async () => {
    return { status: 'ok', service: 'realtime-sockets' };
});


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
		});

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "remote")
	{
		console.log("Remote Activated")
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

	if (data.action === "pause") {
		game.pauseGame();
	}

	if (data.action === "resume") {
		game.resumeGame();
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

		socketio = new Server(app.server, {
		path: '/socket.io/',
		cors: { origin: true, credentials: true }
		});

		console.log('Socket.IO path:', '/socket.io/');
		setupSocketIO();
		console.log('✅ Remote-player service running on port 3003 with Socket.IO');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

