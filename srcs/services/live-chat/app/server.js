
import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';
import cookie from '@fastify/cookie';
import { createClient } from 'redis';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { routes } from './srcs/routes/routes.js';
import { createFriendRequest, responseFriendRequest } from './srcs/js/friendships.js';
import { block_friend, remove_friend } from './srcs/controlers/controlers.js';

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
				requester_id INTEGER NOT NULL,
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
			throw new Error('Invalid token');
		}
		
		const exists = await redis.get(`jwt:${val.jti}`);
		if (!exists || exists === "not valid") {
			console.log("Token not valid in Redis");
			throw new Error('Token not valid');
		}
		
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		console.log("✅ User authenticated:", payload);
		socket.user = payload;
		next();
		} catch (err) {
			console.error('Auth error:', err);
			throw new Error('Unauthorized');
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
		
		try {
        	const pendingRequests = await app.db.all(`
        	    SELECT 
        	        CASE 
        	            WHEN user_id = ? THEN friend_id 
        	            ELSE user_id 
        	        END as senderId,
        	        requester_id
        	    FROM friendships 
        	    WHERE (user_id = ? OR friend_id = ?) 
        	      AND status = 'pending'
        	      AND requester_id != ?
        	`, [userId, userId, userId, userId]);
        
        	console.log(`📬 Found ${pendingRequests.length} pending friend requests for user ${userId}`);
    		for (const request of pendingRequests) {
        	    socket.emit('friend-request', {
        	        senderId: request.senderId,
        	        message: `User ${request.senderId} wants to be your friend!`
        	    });
        	}
		} catch (error) {
        console.error("Error loading pending friend requests on connection:", error);
    	}


		const oldKeys = await redis.keys(`friend-request:${userId}:*`);
        if (oldKeys.length > 0) {
            console.log(`🧹 Cleaning up ${oldKeys.length} old Redis keys for user ${userId}`);
            for (const key of oldKeys) {
                await redis.del(key);
            }
        }


		socket.on('add-friend', async (data) => {
			const { senderId, receiverId } = data;
		
		
			console.log(`User ${senderId} wants to add user ${receiverId} as a friend`);

			try {
			
				const cookies = socket.handshake.headers.cookie;
				const tokenMatch = cookies.match(/token=([^;]+)/);
				const token = tokenMatch ? tokenMatch[1] : null;

				
				const resData = await createFriendRequest(token, receiverId);

				if (!resData.success) {
					console.error('Failed to request friend in DB:', resData);
					socket.emit('friend-request-status', { 
						success: false, 
						message: 'Failed to send request' 
					});
					return;
				}

				const receiverSocket = generalConnections.get(receiverId);
				console.log('🎯 Looking for receiver socket:', receiverId);
				console.log('🎯 Available connections:', Array.from(generalConnections.keys()));

				if (receiverSocket && receiverSocket.size > 0) {
				    console.log('✅ Receiver is online, sending notification');
					receiverSocket.forEach(receiverSocket => {

						receiverSocket.emit('friend-request', {
							senderId,
							message: `User ${senderId} wants to be your friend!`
						});
					});
				} else {
				    console.log('❌ Receiver offline, saving to Redis');
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
			const userId = socket.user.user_id || socket.user.id || socket.user.sub;
			console.log("User ID:", userId);

			if (!userId) {
				console.error("❌ No user ID found in token!");
				socket.disconnect();
				return;
			}

			console.log(`User ${userId} ${action}ed friend request from ${senderId}`);
			
			try {
				// Get token
				const cookies = socket.handshake.headers.cookie;
				const tokenMatch = cookies?.match(/token=([^;]+)/);
				const token = tokenMatch ? tokenMatch[1] : null;

				const responseData = await responseFriendRequest(token, senderId, action);

				// Notify both users
				socket.emit('friend-request-response-status', { 
					success: responseData.success, 
					message: responseData.message 
				});

				// Notify the sender
				const senderSocket = generalConnections.get(senderId);
				if (senderSocket && senderSocket.size > 0) {
					console.log('✅ Notifying sender ${senderId} across ${senderSocket.size} about the response');
					senderSocket.forEach(senderSocket => {
						senderSocket.emit('friend-request-result', {
							userId,
							action,
							message: `User ${userId} ${action}ed your friend request`
						});
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

		socket.on('block-friend', async (data) => {
		    const { friendId } = data;
		    const userId = socket.user.user_id || socket.user.id || socket.user.sub;
		    console.log(`User ${userId} wants to block user ${friendId}`);
		
		    try {
		        const cookies = socket.handshake.headers.cookie;
		        const tokenMatch = cookies.match(/token=([^;]+)/);
		        const token = tokenMatch ? tokenMatch[1] : null;
		
		        const resData = await block_friend(token, friendId);
		
				console.log(`Backend: block_friend result:`, resData);
		        if (!resData.success) {
		            console.error('Failed to block friend in DB:', resData);
		            socket.emit('block-friend-status', { 
		                success: false, 
		                message: 'Failed to block friend' 
		            });
		            return;
		        }
				console.log(`✅ Backend: Friend blocked successfully`);
		        socket.emit('block-friend-status', { 
		            success: true, 
		            message: 'Friend blocked successfully' 
		        });
		    } catch (error) {
		        console.error("Error blocking friend:", error);
		        socket.emit('block-friend-status', { 
		            success: false, 
		            message: 'Error occurred' 
		        });
		    }

	});

	socket.on('remove-friend', async (data) => {
		    const { friendId } = data;
		    const userId = socket.user.user_id || socket.user.id || socket.user.sub;
		    console.log(`User ${userId} wants to remove user ${friendId}`);
		
		    try {
		        const cookies = socket.handshake.headers.cookie;
		        const tokenMatch = cookies.match(/token=([^;]+)/);
		        const token = tokenMatch ? tokenMatch[1] : null;
		
		        const resData = await remove_friend(token, friendId);
				console.log(`Backend: remove_friend result:`, resData);
		        if (!resData.success) {
		            console.error('Failed to remove friend in DB:', resData);
		            socket.emit('remove-friend-status', { 
		                success: false, 
		                message: 'Failed to remove friend' 
		            });
		            return;
		        }
				console.log(`✅ Backend: Friend removed successfully`);
		        socket.emit('remove-friend-status', { 
		            success: true, 
		            message: 'Friend removed successfully' 
		        });
		    } catch (error) {
		        console.error("Error removing friend:", error);
		        socket.emit('remove-friend-status', { 
		            success: false, 
		            message: 'Error occurred removing friend' 
		        });
		    }

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

