import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import crypto from 'crypto';

export const app = Fastify({trustProxy: true});
const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

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

app.get('/', async () => {
    return { status: 'ok', service: 'remote-players' };
});


function setupSocketIO(){
	const io = socketio;
	io.of('/general').use(socketAuthMiddleware)
	io.of('/general').on('connection',  (socket) => setupGeneralGameSocket(socket));
}

function setupGeneralGameSocket(socket){
	console.log('✅ Utilisateur authentifié:', socket.userId);
	socket.emit("welcome", {message : "welcome !", userId: socket.userId, user: socket.user})
	socket.broadcast.emit("user-joined", {userId: socket.id});
	socket.on("new-game", (data) => newGameSocket(socket, data))
	socket.on("game-request", (data) => requestGameUID(socket, data))
}

function requestGameUID(socket, data){
	/////////// attention valable uniquement pour jeu local pour le moment... a transformer pour ia, remote et tournois...
	//// data.type = "local", "ia", "remote"
	let uuid = crypto.randomUUID()
	if (data.type === "local")
	{
		console.log(uuid)	
		socket.on(uuid, (data) => gameHandler(socket, data))
		socket.emit("new-game", {UUID:uuid, type:data.type})
	}
}


function gameHandler(socket, data){
	console.log(data)
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

