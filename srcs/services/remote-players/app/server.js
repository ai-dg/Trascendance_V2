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
		console.log('Remote-player service running');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
