import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import fs from 'fs';
import { setupMetrics } from '/monitoring/metrics.js';

const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

// HTTPS options
let httpsOptions = null;
try {
    const certPath = '/certs/cert.pem';
    const keyPath = '/certs/key.pem';

    // app.log.info('Cert exists:', fs.existsSync(certPath));
    // app.log.info('Key exists:', fs.existsSync(keyPath));

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

export const app = Fastify({trustProxy: true, https: httpsOptions, logger: { level: process.env.LOG_LEVEL || 'info' }});
setupMetrics(app, 'realtime-sockets');

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

// Create Socket.IO server
const io = new Server(app.server, {
	cors: {
		origin: `https://${base_url}`,
		credentials: true
	},
	path: '/realtime-sockets/socket.io/',
	transports: ['websocket', 'polling']
});

app.log.info("✅ Socket.IO server created");

// Subscribe to Redis notifications
await subscriber.subscribe('notifications', (message) => {
    const { targetUserId, event, payload } = JSON.parse(message);

    const userSockets = generalConnections.get(targetUserId);
    if (userSockets) {
        app.log.info(`Relaying ${event} to user ${targetUserId}`);
        userSockets.forEach(socket => socket.emit(event, payload));
    }
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

    if (!cookies) {
      return next(new Error('No authentication cookie'));
    }

    const token = parseCookie(cookies, 'token');

    if (!token) {
      return next(new Error('No token found'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || !payload.jti) {
      return next(new Error('Invalid token'));
    }

    const exists = await redis.get(`jwt:${payload.jti}`);

    if (!exists || exists === "not valid") {
      return next(new Error('Token not valid in Redis'));
    }

    socket.userId = payload.user_id || payload.id;
    socket.user = payload.pseudo || payload;
    next();

  } catch (err) {
    app.log.error('Auth error:', err);
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
	app.log.info("🎯 Socket.IO client connected");
	const userId = socket.userId;
	app.log.info("User ID:", userId);
	if (!userId) {
		app.log.error("❌ No user ID found in token!");
		socket.disconnect();
		return;
	}
	if (!generalConnections.has(userId)) {
		generalConnections.set(userId, new Set());
	}
	generalConnections.get(userId).add(socket);
	app.log.info(`🌐 User ${userId} connected. Total connections for this user: ${generalConnections.get(userId).size}`);
	// generalConnections.set(userId, socket);
	await redis.set(`online:${userId}`, 'true');
	socket.emit('welcome', { message: 'Bienvenue sur le canal global' });

	socket.on('disconnect', () => {
		const userSockets = generalConnections.get(userId);
		if (userSockets) {
			userSockets.delete(socket);
			app.log.info(`🌐 User ${userId} disconnected. Remaining connections: ${userSockets.size}`);

			if (userSockets.size === 0) {
				generalConnections.delete(userId);
				redis.del(`online:${userId}`);
				app.log.info('Socket.IO client disconnected');
			}
		}
	});
});

const start = async () => {
	try {
		app.log.info(app.printRoutes());
		 await app.listen({ port: 3003, host: '0.0.0.0' });
		app.log.info('✅ Realtime-sockets service running on port 3003 with Socket.IO');
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
