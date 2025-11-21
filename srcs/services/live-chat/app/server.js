
import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';
import cookie from '@fastify/cookie';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { routes } from './srcs/routes/routes.js';

export const app = Fastify({trustProxy: true});
const is_prod = process.env.NODE_ENV === "PROD"
export const base_url = is_prod ? "www.transcendance.com" : "localhost"

export const redis = createClient({
	socket: {
	host: process.env.REDIS_HOST || 'redis',
	port: process.env.REDIS_PORT
	},
	password: process.env.REDIS_PASSWORD
});

try {
  await redis.connect();
  console.log("Connected to Redis");
} catch (err) {
  console.error("Failed to connect to Redis:", err);
}

async function setupLiveChatdb() {
	try {
		const db = await open({
			filename: '/data/live-chat.sqlite',
			driver: sqlite3.Database
		});

		await db.exec(`
			CREATE TABLE IF NOT EXISTS friendships (
			    user_id INTEGER NOT NULL,
			    friend_id INTEGER NOT NULL,
			    status TEXT DEFAULT 'pending',
			    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			    UNIQUE(user_id, friend_id)
			  );

			  CREATE TABLE IF NOT EXISTS messages (
			    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
			    sender_id INTEGER NOT NULL,
			    receiver_id INTEGER NOT NULL,
			    content TEXT NOT NULL,
			    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
			  );
			`);

			console.log("Live-chat db ready");
		return db;
	} catch (err) {
		console.error("Failed to open live-chat database: ", err);
		process.exit(1);
	}
}

app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {}
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});


app.register(routes,{});

app.get('/live-chat', async () => {
	return { status: 'ok', service: 'live-chat' };
});	

const generalConnections = new Map();


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
		
		
			console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);

			try {
			
				const cookies = socket.handshake.headers.cookie;
				const tokenMatch = cookies.match(/token=([^;]+)/);
				const token = tokenMatch ? tokenMatch[1] : null;

				// don't need to fetch
				// const resDB = await fetch('http://live-chat_app:3002/friend-request', {
				// 	method: 'POST',
				// 	headers: { 'Content-Type': 'application/json' },
				// 	body: JSON.stringify({ receiverId, token })
				// });
			
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

		socket.on('friend-request-response', async (data) => {
			const { senderId, action } = data;
		const userId = socket.user.id || socket.user.sub || socket.user.jti;
		
		console.log(`User ${userId} ${action}ed friend request from ${senderId}`);
		
		try {
			// Get token
			const cookies = socket.handshake.headers.cookie;
			const tokenMatch = cookies?.match(/token=([^;]+)/);
			const token = tokenMatch ? tokenMatch[1] : null;
			
			// Update in database -- don't need to fetch juste call the function
			// const resDB = await fetch('http://live-chat_app:3002/friend-request-response/', {
			// 	method: 'POST',
			// 	headers: { 
			// 		'Content-Type': 'application/json'
			// 	},
			// 	body: JSON.stringify({ 
			// 		senderId,
			// 		action,  // 'accept' or 'reject'
			// 		token
			// 	})
			// });
			
			const responseData = await resDB.json();
			
			// Notify both users
			socket.emit('friend-request-response-status', { 
				success: responseData.success, 
				message: responseData.message 
			});
			
			// Notify the sender
			const senderSocket = generalConnections.get(senderId);
			if (senderSocket) {
				senderSocket.emit('friend-request-result', {
					userId,
					action,
					message: `User ${userId} ${action}ed your friend request`
				});
			}
			
		} catch (error) {
			console.error("Error handling friend request response:", error);
			socket.emit('friend-request-response-status', { 
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
	try {
		app.db = await setupLiveChatdb();
		if (!app.db) {
			console.error('Database live-chat not up');
			process.exit(1);
		}
		await app.listen({ port: 3002, host: '0.0.0.0' });
		console.log('live-chat service running on port 3002');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();

