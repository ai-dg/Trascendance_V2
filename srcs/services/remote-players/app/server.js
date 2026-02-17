import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import { Server } from 'socket.io';
import crypto from 'crypto';
import fs from 'fs';
import { Game } from '../../game-engine/app/srcs/js/Game.js';
import { handleMatchmaking, cancelSearch } from './matchmaking.js';
import { setupMetrics } from '/monitoring/metrics.js';


const is_prod = process.env.NODE_ENV === "PROD";
export const base_url = is_prod ? "www.transcendance.com" : "localhost";

const AUTH_INTERNAL_URL = process.env.AUTH_INTERNAL_URL || 'https://auth_app:3000';

function isNumericUserId(userId) {
	if (userId === null || userId === undefined) return false;
	if (typeof userId === 'number') return Number.isFinite(userId);
	if (typeof userId !== 'string') return false;
	return /^\d+$/.test(userId);
}

async function fetchAuthUserById(userId) {
	if (!isNumericUserId(userId)) {
		return { username: null, avatar: null };
	}

	try {
		const serviceToken = jwt.sign(
			{ service: 'remote-players' },
			process.env.JWT_SECRET,
			{ expiresIn: '5m' }
		);

		const res = await fetch(`${AUTH_INTERNAL_URL}/username-id`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${serviceToken}`
			},
			body: JSON.stringify({ id: String(userId) })
		});

		if (!res.ok) {
			return { username: null, avatar: null };
		}
		const data = await res.json();
		return {
			username: data?.data?.user?.pseudo ?? null,
			avatar: data?.data?.user?.avatar ?? null
		};
	} catch (err) {
		console.warn('[remote-players] Failed to fetch user from auth:', err?.message || err);
		return { username: null, avatar: null };
	}
}

// Track active games and which users are in them
const runningGames = new Map();
const userGames = new Map(); // userId -> gameUUID mapping

// HTTPS options
let httpsOptions = null;
try {
    const certPath = '/certs/cert.pem';
    const keyPath = '/certs/key.pem';

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
    return { status: 'ok', service: 'remote-players' };
});

// Setup Prometheus metrics
setupMetrics(app, 'remote-players');

// Create Socket.IO server
const io = new Server(app.server, {
	cors: {
		origin: `https://${base_url}`,
		credentials: true
	},
	path: '/remote-players/socket.io/',
	transports: ['websocket', 'polling'],
	// Faster ping for real-time games - detect disconnects quickly
	pingInterval: 5000,   // Ping every 5 seconds (default: 25s)
	pingTimeout: 3000     // Timeout after 3 seconds (default: 20s)
});

console.log("✅ Socket.IO server created for remote players");

// Subscribe to Redis game updates
await subscriber.subscribe('game-updates', (message) => {
	const data = JSON.parse(message);
	const gameUUID = data.gameUUID || data.uuid;
	io.to(`game-${gameUUID}`).emit('game-update', data);
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

    // Get persistent guest ID and info from handshake auth (sent by client)
    const persistentGuestId = socket.handshake.auth?.guestId;
    const guestNickname = socket.handshake.auth?.guestNickname;
    const guestAvatar = socket.handshake.auth?.guestAvatar;

    // Allow guests for game sockets
    if (!cookies) {
      socket.userId = persistentGuestId || `guest:${socket.id}`;
      socket.user = guestNickname || "Guest";
      socket.avatar = guestAvatar || null;
      return next();
    }

    const token = parseCookie(cookies, 'token');

    if (!token) {
      socket.userId = persistentGuestId || `guest:${socket.id}`;
      socket.user = guestNickname || "Guest";
      socket.avatar = guestAvatar || null;
      return next();
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
    socket.avatar = null; // Will be fetched from auth service when needed
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

io.on('connection', (socket) => setupGameSocket(socket));

function setupGameSocket(socket) {
	const userId = socket.userId;
	console.log('✅ Game player connected:', userId);
	socket.emit("welcome", {message : "welcome in the game !", userId: userId, user: socket.user})
	socket.join(`user-${userId}`);

	socket.on("request-game-uid", async (data) => {
		await requestGameUID(socket, data);
	});

	socket.on("join-game", async (data) => {
		console.log("Joining game : ", data);
		const gameUUID = data?.UUID;
		if (!gameUUID) return;
		socket.join(`game-${gameUUID}`);
		socket.emit("joined-game", { UUID: gameUUID });

		// Invite flow: if Redis has game-invite:<gameUUID> = this user, add as player 2
		const allowedToJoin = await redis.get(`game-invite:${gameUUID}`);
		if (allowedToJoin != null && String(userId) === String(allowedToJoin)) {
			const game = runningGames.get(gameUUID);
			if (game && game.isRemoteGame && !game.player2Id) {
				await redis.del(`game-invite:${gameUUID}`);
				game.addPlayer2(socket, userId);
				userGames.set(userId, gameUUID);
				socket.on(gameUUID, (eventData) => gameHandler(gameUUID, eventData, socket));
				if (process.env.DEBUG_INVITE === '1' || process.env.DEBUG_INVITE === 'true') {
					console.log('[INVITE_OPPONENT_FOUND]', { gameUUID, player2UserId: userId });
				}
				Promise.all([
					fetchAuthUserById(game.player1Id),
					fetchAuthUserById(userId)
				]).then(([player1Info, player2Info]) => {
					const player1Socket = game.player1Socket;
					const player1Username = player1Info?.username || player1Socket?.user || 'Player 1';
					const player2Username = player2Info?.username || socket.user || 'Player 2';
					const player1Avatar = (player1Info?.avatar && String(player1Info.avatar).trim()) || player1Socket?.avatar || 'default';
					const player2Avatar = (player2Info?.avatar && String(player2Info.avatar).trim()) || socket.avatar || 'default';
					player1Socket.emit(gameUUID, {
						type: "opponent-found",
						playerNumber: 1,
						opponentId: userId,
						opponentUsername: player2Username,
						opponentAvatar: player2Avatar,
						yourUsername: player1Username,
						yourAvatar: player1Avatar
					});
					socket.emit(gameUUID, {
						type: "opponent-found",
						playerNumber: 2,
						opponentId: game.player1Id,
						opponentUsername: player1Username,
						opponentAvatar: player1Avatar,
						gameUUID: gameUUID,
						yourUsername: player2Username,
						yourAvatar: player2Avatar
					});
				}).catch((err) => {
					console.warn('[remote-players] invite opponent-found enrich failed:', err?.message || err);
					const p1 = game.player1Socket;
					p1.emit(gameUUID, {
						type: "opponent-found",
						playerNumber: 1,
						opponentId: userId,
						opponentUsername: socket.user || 'Player 2',
						opponentAvatar: 'default',
						yourUsername: p1.user || 'Player 1',
						yourAvatar: 'default'
					});
					socket.emit(gameUUID, {
						type: "opponent-found",
						playerNumber: 2,
						opponentId: game.player1Id,
						opponentUsername: p1.user || 'Player 1',
						opponentAvatar: 'default',
						gameUUID: gameUUID,
						yourUsername: socket.user || 'Player 2',
						yourAvatar: 'default'
					});
				});
			}
		}
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
				// If it's a remote game AND player 2 has joined, wait for reconnection
				if (game.isRemoteGame && game.player2Id) {
					console.log(`[Game Socket] Remote game with 2 players - waiting for reconnection`);
					game.handlePlayerDisconnect(userId, async (expiredGameUUID) => {
						// Cleanup callback when reconnection timeout expires
						console.log(`[Game Socket] Reconnection timeout - cleaning up game ${expiredGameUUID}`);
						const expiredGame = runningGames.get(expiredGameUUID);
						if (expiredGame) {
							await expiredGame.destroy();
							runningGames.delete(expiredGameUUID);
							if (expiredGame.player1Id) userGames.delete(expiredGame.player1Id);
							if (expiredGame.player2Id) userGames.delete(expiredGame.player2Id);
						}
					});
					// Don't delete game or user tracking - keep for reconnection
					return;
				}

				// For non-remote games or remote games without player 2, clean up immediately
				await game.destroy();
				runningGames.delete(gameUUID);

				// Clean up user tracking for both players
				if (game.player1Id) userGames.delete(game.player1Id);
				if (game.player2Id) userGames.delete(game.player2Id);
			}
		}
	});

	// Check if user has a game waiting for reconnection when they connect
	socket.on('check-reconnection', () => {
		console.log(`[Game Socket] User ${userId} checking for reconnection opportunities`);

		// Find any game waiting for this user to reconnect
		for (const [gameUUID, game] of runningGames.entries()) {
			if (game.isWaitingForPlayer && game.isWaitingForPlayer(userId)) {
				socket.emit('reconnection-available', {
					gameUUID: gameUUID,
					gameState: game.getGameState(),
					message: 'You have an ongoing game. Would you like to reconnect?'
				});
				return;
			}
		}

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

			// Determine which player is reconnecting and get opponent info
			const isPlayer1 = userId === game.player1Id;
			const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
			const opponentSocket = isPlayer1 ? game.player2Socket : game.player1Socket;

			// Fetch opponent info
			Promise.resolve().then(async () => {
				const opponentInfo = await fetchAuthUserById(opponentId);
				const opponentUsername = opponentInfo?.username || opponentSocket?.user || 'Player ' + (isPlayer1 ? 2 : 1);
				const opponentAvatar = opponentInfo?.avatar || opponentSocket?.avatar || null;

				// Notify reconnecting player
				const response = {
					gameUUID: gameUUID,
					gameState: game.getGameState(),
					playerNumber: isPlayer1 ? 1 : 2,
					opponentId: opponentId,
					opponentUsername: opponentUsername,
					opponentAvatar: opponentAvatar
				};
				socket.emit('reconnection-success', response);

				// Notify opponent that player has reconnected
				const reconnectingPlayerInfo = await fetchAuthUserById(userId);
				const reconnectingPlayerUsername = reconnectingPlayerInfo?.username || socket?.user || 'Player ' + (isPlayer1 ? 1 : 2);
				const reconnectingPlayerAvatar = reconnectingPlayerInfo?.avatar || socket?.avatar || null;

				opponentSocket?.emit(gameUUID, {
					type: 'opponent-reconnected',
					opponentUsername: reconnectingPlayerUsername,
					opponentAvatar: reconnectingPlayerAvatar
				});
			}).catch((err) => {
				console.warn('[Game Socket] Failed to fetch opponent info on reconnection:', err?.message || err);
				socket.emit('reconnection-success', {
					gameUUID: gameUUID,
					gameState: game.getGameState(),
					playerNumber: userId === game.player1Id ? 1 : 2
				});
			});
		} else {
			socket.emit('reconnection-failed', { message: 'Reconnection failed' });
		}
	});
}

async function requestGameUID(socket, data){
	const userId = socket.userId;

	function clampNumber(value, min, max) {
		const num = typeof value === 'number' ? value : Number(value);
		if (!Number.isFinite(num)) return undefined;
		return Math.min(max, Math.max(min, num));
	}

	function normalizeGameSettings(raw) {
		if (!raw || typeof raw !== 'object') return undefined;
		const settings = {};
		const ballSpeed = clampNumber(raw.ballSpeed, 3, 12);
		const paddleSpeed = clampNumber(raw.paddleSpeed, 4, 15);
		if (ballSpeed !== undefined) settings.ballSpeed = ballSpeed;
		if (paddleSpeed !== undefined) settings.paddleSpeed = paddleSpeed;
		return Object.keys(settings).length ? settings : undefined;
	}

	let uuid = crypto.randomUUID()

	if (data.type === "local")
	{
		console.log("Local game")
		const settings = normalizeGameSettings(data.settings);

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type
		}, settings);

		game.player1Id = socket.userId;
		runningGames.set(uuid, game);
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));
		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "ai")
	{
		console.log("AI game")
		const settings = normalizeGameSettings(data.settings);

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type,
			difficulty: data.difficulty || 'medium'
		}, settings, redis);

		game.player1Id = socket.userId;
		runningGames.set(uuid, game);
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));
		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
	else if (data.type === "remote")
	{
		console.log("Remote game")
		const settings = normalizeGameSettings(data.settings);

		const game = new Game(socket, {
			uuid: uuid,
			type: data.type
		}, settings);

		game.player1Id = socket.userId;
		runningGames.set(uuid, game);
		userGames.set(socket.userId, uuid);

		socket.on(uuid, (eventData) => gameHandler(uuid, eventData, socket));
		socket.emit("new-game", {UUID: uuid, type: data.type});
	}
}

/**
 * onMatchFound - Callback when matchmaking finds two players
 */
function onMatchFound(matchData) {
	const { game, gameUUID, player1Socket, player1UserId, player2Socket, player2UserId, player2GameUUID } = matchData;

	Promise.all([
		fetchAuthUserById(player1UserId),
		fetchAuthUserById(player2UserId)
	]).then(([player1Info, player2Info]) => {

	const player1Username = player1Info?.username || player1Socket.user || 'Player 1';
	const player2Username = player2Info?.username || player2Socket.user || 'Player 2';
	const player1Avatar = (player1Info?.avatar && String(player1Info.avatar).trim()) || player1Socket?.avatar || 'default';
	const player2Avatar = (player2Info?.avatar && String(player2Info.avatar).trim()) || player2Socket?.avatar || 'default';

	// Add player 2 to the game
	game.addPlayer2(player2Socket, player2UserId);

	// Track both players in this game
	userGames.set(player1UserId, gameUUID);
	userGames.set(player2UserId, gameUUID);

	// Remove player 2's old game listener
	player2Socket.removeAllListeners(player2GameUUID);

	// Set up socket listener for player 2's inputs on the MATCHED game
	player2Socket.on(gameUUID, (eventData) => gameHandler(gameUUID, eventData, player2Socket));

	// Notify Player 1 (include yourUsername/yourAvatar so player 1 sees their own avatar on the left)
	player1Socket.emit(gameUUID, {
		type: "opponent-found",
		playerNumber: 1,
		opponentId: player2UserId,
		opponentUsername: player2Username,
		opponentAvatar: player2Avatar,
		yourUsername: player1Username,
		yourAvatar: player1Avatar
	});

	// Notify Player 2 (include yourUsername/yourAvatar so player 2 sees their own avatar)
	player2Socket.emit(player2GameUUID, {
		type: "opponent-found",
		playerNumber: 2,
		opponentId: player1UserId,
		opponentUsername: player1Username,
		opponentAvatar: player1Avatar,
		gameUUID: gameUUID,
		yourUsername: player2Username,
		yourAvatar: player2Avatar
	});

	console.log(`[Server] Match ready! Game: ${gameUUID}`);
	}).catch((err) => {
		console.warn('[Server] Failed to enrich opponent-found payload:', err?.message || err);

		player1Socket.emit(gameUUID, {
			type: "opponent-found",
			playerNumber: 1,
			opponentId: player2UserId,
			opponentUsername: player2Socket.user || 'Player 2',
			opponentAvatar: player2Socket.avatar || 'default',
			yourUsername: player1Socket.user || 'Player 1',
			yourAvatar: player1Socket.avatar || 'default'
		});
		player2Socket.emit(player2GameUUID, {
			type: "opponent-found",
			playerNumber: 2,
			opponentId: player1UserId,
			opponentUsername: player1Socket.user || 'Player 1',
			opponentAvatar: player1Socket.avatar || 'default',
			gameUUID: gameUUID,
			yourUsername: player2Socket.user || 'Player 2',
			yourAvatar: player2Socket.avatar || 'default'
		});
	});
}

async function gameHandler(uuid, data, socket){
	const game = runningGames.get(uuid);

	if (!game)
	{
		if (!data.state) {
			console.warn(`[Game ${uuid}] Game not found (may have ended)`);
		}
		return;
	}

	if (data.action === "player-2-joined") {
		console.log(`[Game ${uuid}] Player 2 joined and ready to receive events`);
		game.setPlayer2Joined();
	}
	else if (data.action === "player-ready")
		game.setPlayerReady(data.player);
	else if (data.action === "pause-game") {
		game.pauseGame();
	}
	else if (data.action === "resume-game") {
		game.resumeGame();
	}
	else if (data.action === "reset-game")
		game.resetGame();
	else if (data.action === "play-against-random-player") {
		const odileUserId = socket.userId || socket.id;
		handleMatchmaking(redis, socket, odileUserId, uuid, runningGames, onMatchFound);
	}
	else if (data.action === "play-against-friend")
		game.playAgainstFriend();
	else if (data.action === "cancel-matchmaking") {
		const odileUserId = socket.userId || socket.id;
		cancelSearch(redis, odileUserId);
	}
	else if (data.action === "reject-reconnection") {
		const rejectingUserId = socket.userId || socket.id;

		if (game && game.isRemoteGame && game.player2Id) {
			const otherPlayerId = game.player1Id === rejectingUserId ? game.player2Id : game.player1Id;
			const otherSocket = game.player1Id === rejectingUserId ? game.player2Socket : game.player1Socket;

			if (otherSocket && otherSocket.connected) {
				otherSocket.emit(uuid, {
					type: 'opponent-abandoned',
					message: 'Your opponent has started a new game. This game has been ended.'
				});
			}

			// Clean up the game
			await game.destroy();
			runningGames.delete(uuid);
			if (game.player1Id) userGames.delete(game.player1Id);
			if (game.player2Id) userGames.delete(game.player2Id);
		}
	}
	else if (data.action === "player-left") {
		const leavingUserId = socket.userId || socket.id;

		if (game && game.isRemoteGame && game.player2Id) {
			game.handlePlayerDisconnect(leavingUserId, (expiredGameUUID) => {
				const expiredGame = runningGames.get(expiredGameUUID);
				if (expiredGame) {
					expiredGame.destroy();
					runningGames.delete(expiredGameUUID);
					if (expiredGame.player1Id) userGames.delete(expiredGame.player1Id);
					if (expiredGame.player2Id) userGames.delete(expiredGame.player2Id);
				}
			});
		} else {
			if (game) {
				await game.destroy();
				runningGames.delete(uuid);
				if (game.player1Id) userGames.delete(game.player1Id);
				if (game.player2Id) userGames.delete(game.player2Id);
			}
		}
	}
	else if (data.action === "destroy-game") {
		const odileUserId = socket.userId || socket.id;

		// Cancel any matchmaking search
		cancelSearch(redis, odileUserId);

		// Clean up the game
		if (game) {
			await game.destroy();
			runningGames.delete(uuid);

			if (game.player1Id) userGames.delete(game.player1Id);
			if (game.player2Id) userGames.delete(game.player2Id);
		}
	}
	else if (data.state)
		game.updatePlayerMove(data.state.paddle1, data.state.paddle2, socket.id);
}

function newGameSocket(socket, data){
	console.log("data : ", data);
}

const start = async () => {
	try {
		console.log(app.printRoutes());
		 await app.listen({ port: 3004, host: '0.0.0.0' });
		console.log('✅ Remote-players service running on port 3004 with Socket.IO');
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

start();
