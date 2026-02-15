import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import fs from 'fs';

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

/** Game invite state: inviteId -> { fromUserId, toUserId, gameUUID, createdAt } */
const gameInvites = new Map();
const INVITE_TTL_SEC = 120;
const DEBUG_INVITE = process.env.DEBUG_INVITE === '1' || process.env.DEBUG_INVITE === 'true';

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

    const val = jwt.decode(token, process.env.JWT_SECRET);

    if (!val || !val.jti) {
      return next(new Error('Invalid token'));
    }

    const exists = await redis.get(`jwt:${val.jti}`);

    if (!exists || exists === "not valid") {
      return next(new Error('Token not valid in Redis'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = payload.user_id || payload.id;
    socket.user = payload.pseudo || payload;
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
	socket.emit('welcome', { message: 'Welcome to the global channel' });

	socket.on('game-invite', async (data) => {
		if (!userId) return;
		const { friendId, gameUUID, inviteId, message } = data || {};
		if (!friendId || !gameUUID || !inviteId) {
			if (DEBUG_INVITE) console.log('[INVITE_SEND] invalid payload', { friendId, gameUUID, inviteId });
			return;
		}
		const fromUserId = userId;
		const toUserId = Number(friendId);
		if (fromUserId === toUserId) {
			if (DEBUG_INVITE) console.log('[INVITE_SEND] self-invite blocked', { fromUserId });
			return;
		}
		const createdAt = new Date().toISOString();
		gameInvites.set(inviteId, { fromUserId, toUserId, gameUUID, createdAt, status: 'pending' });
		if (DEBUG_INVITE) console.log('[INVITE_SEND]', { inviteId, fromUserId, toUserId, gameUUID });
		const payload = { type: 'game-invite', inviteId, fromUserId, toUserId, gameUUID, fromUsername: socket.user || null, createdAt, message: message || null };
		await redis.publish('notifications', JSON.stringify({ targetUserId: toUserId, event: 'notifications', payload }));
	});

	socket.on('game-invite-accept', async (data) => {
		if (!userId) return;
		const { inviteId } = data || {};
		if (!inviteId) return;
		const invite = gameInvites.get(inviteId);
		if (!invite || invite.status !== 'pending') {
			if (DEBUG_INVITE) console.log('[INVITE_ACCEPT] invalid or expired', { inviteId });
			return;
		}
		if (Number(userId) !== Number(invite.toUserId)) {
			if (DEBUG_INVITE) console.log('[INVITE_ACCEPT] wrong receiver', { userId, toUserId: invite.toUserId });
			return;
		}
		invite.status = 'accepted';
		const { fromUserId, toUserId, gameUUID } = invite;
		if (DEBUG_INVITE) console.log('[INVITE_ACCEPT]', { inviteId, fromUserId, toUserId, gameUUID });
		await redis.set(`game-invite:${gameUUID}`, String(toUserId), { EX: 60 });
		const payload = { type: 'game-invite-accepted', inviteId, fromUserId, toUserId, gameUUID };
		await redis.publish('notifications', JSON.stringify({ targetUserId: fromUserId, event: 'notifications', payload }));
		await redis.publish('notifications', JSON.stringify({ targetUserId: toUserId, event: 'notifications', payload }));
	});

	socket.on('game-invite-decline', async (data) => {
		if (!userId) return;
		const { inviteId } = data || {};
		if (!inviteId) return;
		const invite = gameInvites.get(inviteId);
		if (!invite || invite.status !== 'pending') return;
		if (Number(userId) !== Number(invite.toUserId)) return;
		invite.status = 'declined';
		const { fromUserId, toUserId, gameUUID } = invite;
		if (DEBUG_INVITE) console.log('[INVITE_DECLINE]', { inviteId, fromUserId, toUserId });
		const payload = { type: 'game-invite-declined', inviteId, fromUserId, toUserId, gameUUID };
		await redis.publish('notifications', JSON.stringify({ targetUserId: fromUserId, event: 'notifications', payload }));
	});

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

const start = async () => {
	try {
		console.log(app.printRoutes());
		 await app.listen({ port: 3003, host: '0.0.0.0' });
		console.log('✅ Realtime-sockets service running on port 3003 with Socket.IO');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
