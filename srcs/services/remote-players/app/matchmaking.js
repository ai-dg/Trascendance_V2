/**
 * ============================================
 * MATCHMAKING SYSTEM
 * ============================================
 *
 * This module handles finding opponents for remote multiplayer games.
 *
 * HOW IT WORKS:
 * 1. Player clicks "Play Against Random Player"
 * 2. We check Redis queue for someone waiting
 * 3. If found -> Match them! Both join the same game
 * 4. If not found -> Add player to queue and wait
 *
 * REDIS QUEUE STRUCTURE:
 * Key: "matchmaking:random"
 * Value: List of JSON strings with player data
 * Each entry: { odileUserId, socketId, gameUUID, timestamp }
 */

// Redis key for the matchmaking queue
const MATCHMAKING_QUEUE = 'matchmaking:random';

// Track players currently searching (odileUserId -> { socket, gameUUID })
// This lets us notify them when a match is found
const searchingPlayers = new Map();

/**
 * handleMatchmaking - Main entry point when a player searches for opponent
 *
 * @param {Object} redis - Redis client for queue operations
 * @param {Object} socket - The socket of the player searching
 * @param {string} odileUserId - The user ID of the player
 * @param {string} gameUUID - The game UUID created for this player
 * @param {Object} runningGames - Map of all running games
 * @param {Function} onMatchFound - Callback when match is found
 */
async function handleMatchmaking(redis, socket, odileUserId, gameUUID, runningGames, onMatchFound) {
	console.log(`[Matchmaking] Player ${odileUserId} is searching for opponent...`);

	// Step 1: Try to find a waiting opponent in the Redis queue
	// lPop removes and returns the first element (FIFO - first in, first out)
	const waitingPlayerData = await redis.lPop(MATCHMAKING_QUEUE);

	if (waitingPlayerData) {
		// Someone is waiting! Parse their data
		const opponent = JSON.parse(waitingPlayerData);
		console.log(`[Matchmaking] Found waiting player: ${opponent.odileUserId}`);

		// Edge case: Make sure we're not matching with ourselves
		// (can happen if player opens two tabs or same JWT token on multiple devices)
		if (opponent.odileUserId === odileUserId) {
			// Check if the waiting player is still actually connected
			const waitingPlayerInfo = searchingPlayers.get(opponent.odileUserId);

			if (waitingPlayerInfo && waitingPlayerInfo.socket.connected) {
				// They're still connected - this is a duplicate search attempt
				console.log(`[Matchmaking] Same player detected! User ${odileUserId} is already searching.`);
				// Put the original entry back in the queue
				await redis.rPush(MATCHMAKING_QUEUE, waitingPlayerData);

				// Notify the client that they're already searching
				socket.emit(gameUUID, {
					type: 'matchmaking-error',
					error: 'already-searching',
					message: 'You are already searching for an opponent. Please wait or cancel your existing search.'
				});
				return;
			} else {
				// Stale entry - the original player disconnected
				// Discard the stale entry and let this player search normally
				console.log(`[Matchmaking] Found stale entry for user ${odileUserId}, discarding...`);
				searchingPlayers.delete(opponent.odileUserId);
				// Continue to check for more players in queue or add this player
				await addToQueue(redis, socket, odileUserId, gameUUID);
				return;
			}
		}

		// MATCH FOUND! Create the game with both players
		await createMatch(redis, socket, odileUserId, gameUUID, opponent, runningGames, onMatchFound);

	} else {
		// No one waiting - add this player to the queue
		console.log(`[Matchmaking] No opponent found, adding player to queue...`);
		await addToQueue(redis, socket, odileUserId, gameUUID);
	}
}

/**
 * addToQueue - Add a player to the waiting queue
 */
async function addToQueue(redis, socket, odileUserId, gameUUID) {
	const playerData = JSON.stringify({
		odileUserId: odileUserId,
		socketId: socket.id,
		gameUUID: gameUUID,
		timestamp: Date.now()
	});

	// rPush adds to the end of the list (queue)
	await redis.rPush(MATCHMAKING_QUEUE, playerData);

	// Track this player so we can notify them when match is found
	searchingPlayers.set(odileUserId, { socket, gameUUID });

	console.log(`[Matchmaking] Player ${odileUserId} added to queue (game: ${gameUUID})`);
}

/**
 * createMatch - Two players found each other! Set up the game.
 *
 * Player assignment:
 * - Player 1 (waiting player) = paddle1 (left side)
 * - Player 2 (searching player) = paddle2 (right side)
 *
 * The mirror effect happens on the frontend - each player
 * sees themselves on the left side of their screen.
 */
async function createMatch(redis, player2Socket, player2UserId, player2GameUUID, player1Data, runningGames, onMatchFound) {
	console.log(`[Matchmaking] Creating match: ${player1Data.odileUserId} vs ${player2UserId}`);

	// Get player 1's socket from our tracking map
	const player1Info = searchingPlayers.get(player1Data.odileUserId);

	if (!player1Info || !player1Info.socket.connected) {
		// Player 1 disconnected while waiting - add player 2 to queue instead
		console.log(`[Matchmaking] Player 1 disconnected, adding player 2 to queue`);
		searchingPlayers.delete(player1Data.odileUserId);
		await addToQueue(redis, player2Socket, player2UserId, player2GameUUID);
		return;
	}

	const player1Socket = player1Info.socket;
	const gameUUID = player1Data.gameUUID; // Use player 1's game UUID

	// Remove both players from searching map
	searchingPlayers.delete(player1Data.odileUserId);
	searchingPlayers.delete(player2UserId);

	// Delete player 2's unused game (they'll join player 1's game)
	if (runningGames.has(player2GameUUID)) {
		runningGames.delete(player2GameUUID);
	}

	// Get the game that player 1 created
	const game = runningGames.get(gameUUID);

	if (!game) {
		console.error(`[Matchmaking] Game ${gameUUID} not found!`);
		return;
	}

	// Call the callback to set up player 2 in the game
	if (onMatchFound) {
		onMatchFound({
			game,
			gameUUID,
			player1Socket,
			player1UserId: player1Data.odileUserId,
			player2Socket,
			player2UserId,
			player2GameUUID  // Pass player 2's original game UUID so server can notify them
		});
	}

	console.log(`[Matchmaking] Match created successfully!`);
	console.log(`[Matchmaking] Game UUID: ${gameUUID}`);
	console.log(`[Matchmaking] Player 1: ${player1Data.odileUserId}`);
	console.log(`[Matchmaking] Player 2: ${player2UserId}`);
}

/**
 * cancelSearch - Remove a player from the matchmaking queue
 * Called when player clicks "Cancel" or disconnects
 */
async function cancelSearch(redis, odileUserId) {
	console.log(`[Matchmaking] Canceling search for player ${odileUserId}`);

	// Remove from our tracking map
	const playerInfo = searchingPlayers.get(odileUserId);
	searchingPlayers.delete(odileUserId);

	// Remove from Redis queue
	const queueLength = await redis.lLen(MATCHMAKING_QUEUE);

	for (let i = 0; i < queueLength; i++) {
		const data = await redis.lIndex(MATCHMAKING_QUEUE, i);
		if (data) {
			const player = JSON.parse(data);
			if (player.odileUserId === odileUserId) {
				await redis.lRem(MATCHMAKING_QUEUE, 1, data);
				console.log(`[Matchmaking] Removed ${odileUserId} from queue`);
				return playerInfo; // Return info so caller can clean up game
			}
		}
	}

	return playerInfo;
}

/**
 * isPlayerSearching - Check if a player is currently in the queue
 */
function isPlayerSearching(odileUserId) {
	return searchingPlayers.has(odileUserId);
}

/**
 * getQueueSize - Get the current number of players waiting
 * Useful for debugging and stats
 */
async function getQueueSize(redis) {
	return await redis.lLen(MATCHMAKING_QUEUE);
}

/**
 * clearQueue - Clear the entire matchmaking queue
 * Useful for testing and server restart
 */
async function clearQueue(redis) {
	await redis.del(MATCHMAKING_QUEUE);
	searchingPlayers.clear();
	console.log(`[Matchmaking] Queue cleared`);
}

// Export all functions
export {
	handleMatchmaking,
	cancelSearch,
	isPlayerSearching,
	getQueueSize,
	clearQueue,
	MATCHMAKING_QUEUE
};
