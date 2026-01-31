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
//import { handleMatchmaking, cancelSearch } from './matchmaking.js';


const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

// Track active games and which users are in them
const runningGames = new Map();
const userGames = new Map(); // userId -> gameUUID mapping

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

	// Handle disconnect - clean up matchmaking and games
	socket.on('disconnect', async () => {
		console.log(`[Game Socket] User ${userId} disconnected`);

		// Cancel matchmaking search if they were searching
		await cancelSearch(redis, userId);

		// Check if this user was in an active game
		const gameUUID = userGames.get(userId);
		if (gameUUID) {
			const game = runningGames.get(gameUUID);
			if (game) {
				console.log(`[Game Socket] User ${userId} was in game ${gameUUID}`);
				console.log(`[Game Socket] Game type: ${game.type}, isRemoteGame: ${game.isRemoteGame}`);

				// If it's a remote game, wait for reconnection instead of destroying
				if (game.isRemoteGame) {
					console.log(`[Game Socket] Remote game - waiting for reconnection`);
					game.handlePlayerDisconnect(userId, (expiredGameUUID) => {
						// Cleanup callback when reconnection timeout expires
						console.log(`[Game Socket] Reconnection timeout - cleaning up game ${expiredGameUUID}`);
						const expiredGame = runningGames.get(expiredGameUUID);
						if (expiredGame) {
							expiredGame.destroy();
							runningGames.delete(expiredGameUUID);
							if (expiredGame.player1Id) userGames.delete(expiredGame.player1Id);
							if (expiredGame.player2Id) userGames.delete(expiredGame.player2Id);
						}
					});
					// Don't delete game or user tracking - keep for reconnection
					return;
				}

				// For non-remote games, clean up immediately
				await game.destroy();
				runningGames.delete(gameUUID);

				// Clean up user tracking for both players
				if (game.player1Id) userGames.delete(game.player1Id);
				if (game.player2Id) userGames.delete(game.player2Id);

				console.log(`[Game Socket] Cleaned up game ${gameUUID} for disconnected player`);
			}
		}
	});

	// Check if user has a game waiting for reconnection when they connect
	socket.on('check-reconnection', () => {
		console.log(`[Game Socket] User ${userId} checking for reconnection opportunities`);

		// Find any game waiting for this user to reconnect
		for (const [gameUUID, game] of runningGames.entries()) {
			if (game.isWaitingForPlayer && game.isWaitingForPlayer(userId)) {
				console.log(`[Game Socket] Found game ${gameUUID} waiting for user ${userId}`);
				socket.emit('reconnection-available', {
					gameUUID: gameUUID,
					gameState: game.getGameState(),
					message: 'You have an ongoing game. Would you like to reconnect?'
				});
				return;
			}
		}

		// No game found
		socket.emit('no-reconnection-available', {});
	});

	// Handle reconnection request
	socket.on('reconnect-to-game', (data) => {
		const { gameUUID } = data;
		console.log(`[Game Socket] User ${userId} attempting to reconnect to game ${gameUUID}`);

		const game = runningGames.get(gameUUID);
		if (!game) {
			socket.emit('reconnection-failed', { message: 'Game no longer exists' });
			return;
		}

		if (!game.isWaitingForPlayer(userId)) {
			socket.emit('reconnection-failed', { message: 'Game is not waiting for you' });
			return;
		}

		// Reconnect the player
		const success = game.reconnectPlayer(userId, socket);
		if (success) {
			// Set up socket listener for this game
			socket.on(gameUUID, (eventData) => gameHandler(gameUUID, eventData, socket));

			// Update user tracking
			userGames.set(userId, gameUUID);

			socket.emit('reconnection-success', {
				gameUUID: gameUUID,
				gameState: game.getGameState(),
				playerNumber: userId === game.player1Id ? 1 : 2
			});
			console.log(`[Game Socket] User ${userId} reconnected to game ${gameUUID}`);
		} else {
			socket.emit('reconnection-failed', { message: 'Reconnection failed' });
		}
	});
}

function requestGameUID(socket, data){
	let uuid = crypto.randomUUID()
	console.log("Before type")
	if (data.type === "local")
	{
		console.log("Local activated")
		console.log("data: ", data, "uuid : ", uuid)

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type
		});

		// Set player 1 ID
		game.player1Id = socket.userId;
		runningGames.set(uuid, game);

		// Track that this user is in this game
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "ai")
	{
		console.log("AI Activated")
		console.log("data: ", data, "uuid : ", uuid)

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type,
			difficulty: data.difficulty || 'medium'
		}, undefined, redis);

		// Set player 1 ID
		game.player1Id = socket.userId;
		runningGames.set(uuid, game);

		// Track that this user is in this game
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "remote")
	{
		console.log("Remote Activated")
		console.log("data: ", data, "uuid : ", uuid)

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type
		});

		// Set player 1 ID immediately
		game.player1Id = socket.userId;
		runningGames.set(uuid, game);

		// Track that this user is in this game
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));

		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
}

/**
 * onMatchFound - Callback when matchmaking finds two players
 * Sets up player 2 in the game and notifies both players
 */
function onMatchFound(matchData) {
	const { game, gameUUID, player1Socket, player1UserId, player2Socket, player2UserId, player2GameUUID } = matchData;

	// Add player 2 to the game (we'll implement this in Game.js)
	game.addPlayer2(player2Socket, player2UserId);

	// Track both players in this game
	userGames.set(player1UserId, gameUUID);
	userGames.set(player2UserId, gameUUID);
	console.log(`[Server] Both players tracked in game ${gameUUID}`)

	// Remove player 2's old game listener (memory leak prevention)
	player2Socket.removeAllListeners(player2GameUUID);
	console.log(`[Server] Removed player 2's old listener: ${player2GameUUID}`);

	// Set up socket listener for player 2's inputs on the MATCHED game
	player2Socket.on(gameUUID, (eventData) => gameHandler(gameUUID, eventData, player2Socket));

	// Notify Player 1: "Opponent found!" (emit on player 1's game channel)
	player1Socket.emit(gameUUID, {
		type: "opponent-found",
		playerNumber: 1,
		opponentId: player2UserId
	});

	// Notify Player 2: "Opponent found!"
	// IMPORTANT: Emit on player 2's ORIGINAL game channel (they're still listening there)
	// They will then switch to the matched game
	player2Socket.emit(player2GameUUID, {
		type: "opponent-found",
		playerNumber: 2,
		opponentId: player1UserId,
		gameUUID: gameUUID  // The game they should switch to
	});

	console.log(`[Server] Match ready! Game: ${gameUUID}`);
	console.log(`[Server] Player 2 notified on their channel: ${player2GameUUID}`);
}

function gameHandler(uuid, data, socket){
	const game = runningGames.get(uuid);

	if (!game)
	{
		// Game may have been destroyed - this is normal after game ends
		// Only log if it's not a state update (paddle movement)
		if (!data.state) {
			console.warn(`[Game ${uuid}] Game not found (may have ended)`);
		}
		return;
	}

	if (data.action === "player-2-joined") {
		// Player 2 confirms they've switched to this game channel
		console.log(`[Game ${uuid}] Player 2 joined and ready to receive events`);
		game.setPlayer2Joined();
	}
	else if (data.action === "player-ready")
		game.setPlayerReady(data.player);
	else if (data.action === "pause-game")
		game.pauseGame();
	else if (data.action === "resume-game")
		game.resumeGame();
	else if (data.action === "reset-game")
		game.resetGame();
	else if (data.action === "play-against-random-player") {
		// Call matchmaking system instead of the game method
		const odileUserId = socket.userId || socket.id; // Use userId if authenticated, else socket.id
		handleMatchmaking(redis, socket, odileUserId, uuid, runningGames, onMatchFound);
	}
	else if (data.action === "play-against-friend")
		game.playAgainstFriend();
	else if (data.action === "cancel-matchmaking") {
		// New action: cancel search
		const odileUserId = socket.userId || socket.id;
		cancelSearch(redis, odileUserId);
	}
	else if (data.action === "destroy-game") {
		// Clean up game when frontend destroys it
		console.log(`[Game ${uuid}] Destroy request received`);
		const odileUserId = socket.userId || socket.id;

		// Cancel any matchmaking search
		cancelSearch(redis, odileUserId);

		// Clean up the game
		if (game) {
			game.destroy();
			runningGames.delete(uuid);

			// Clean up user tracking
			if (game.player1Id) userGames.delete(game.player1Id);
			if (game.player2Id) userGames.delete(game.player2Id);

			console.log(`[Game ${uuid}] Game destroyed and cleaned up`);
		}
	}
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
