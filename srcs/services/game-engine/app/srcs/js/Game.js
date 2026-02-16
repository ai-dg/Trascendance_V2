import { Ball } from './Ball.js';
import { Paddle } from './Paddle.js';
import { Score } from './Score.js';
import {
  DEFAULT_SETTINGS,
  INITIAL_PADDLE1_STATE,
  INITIAL_PADDLE2_STATE,
  INITIAL_BALL_STATE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PADDLE_HEIGHT
} from './Data.js';

export class Game {
  constructor(socket, data, settings = DEFAULT_SETTINGS, redis = null) {
    this.uuid = data.uuid;
    this.type = data.type;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.gameLoopInterval = null;

    // ============================================
    // PLAYER SOCKETS (for remote multiplayer)
    // ============================================
    // For local/AI: only player1Socket is used
    // For remote: both sockets are used
    this.player1Socket = socket;
    this.player2Socket = null;
    this.player1Id = null;
    this.player2Id = null;
    this.isRemoteGame = data.type === 'remote';
    this.player2Joined = false; // True when Player 2 confirms they're listening on this channel

    // Reconnection state
    this.waitingForReconnection = false;
    this.disconnectedPlayerId = null;
    this.reconnectionTimeout = null;

    // Countdown state to prevent duplicates
    this.countdownInProgress = false;
    this.countdownInterval = null;

    // Legacy support: this.socket for backwards compatibility
    this.socket = socket;

    // Redis for AI/Remote player communication
    this.redis = redis;
    this.isAiGame = data.type === 'ai';
    this.difficulty = data.difficulty || 'medium';
    this.redisSubscriber = null;

    this.playersReady = {
      player1: false,
      player2: false
    };

    this.playerInputs = {
      paddle1Dir: 0,
      paddle2Dir: 0
    };

    // Initialise game components
    this.paddle1 = new Paddle(INITIAL_PADDLE1_STATE);
    this.paddle2 = new Paddle(INITIAL_PADDLE2_STATE);
    this.ball = new Ball(INITIAL_BALL_STATE, this.settings.ballSpeed);
    this.score = new Score(this.settings.winningScore);
    this.gameRunning = false;

    // Reset ball with random initial velocity
    this.ball.reset();

    // Setup Redis subscription for AI input
    if (this.isAiGame && this.redis) {
      this.setupAiSubscription();
    }
  }

  /**
   * addPlayer2 - Add the second player to a remote game
   * Called by matchmaking when an opponent is found
   */
  addPlayer2(socket, odileUserId) {
    console.log(`[Game ${this.uuid}] Adding player 2: ${odileUserId}`);
    this.player2Socket = socket;
    this.player2Id = odileUserId;
  }

  /**
   * setPlayer2Joined - Called when Player 2 confirms they've switched to this game channel
   * This ensures Player 2 won't miss any events
   */
  setPlayer2Joined() {
    console.log(`[Game ${this.uuid}] Player 2 confirmed joined`);
    this.player2Joined = true;

    // If Player 1 already clicked ready while Player 2 was switching, send the ready status now
    if (this.playersReady.player1) {
      this.emitReadyStatus();
    }
  }

  /**
   * handlePlayerDisconnect - Called when a player disconnects from remote game
   * Pauses the game and waits for reconnection
   */
  handlePlayerDisconnect(disconnectedPlayerId, onReconnectionTimeout) {
    console.log(`[Game ${this.uuid}] handlePlayerDisconnect called for player: ${disconnectedPlayerId}`);
    console.log(`[Game ${this.uuid}] player1Id: ${this.player1Id}, player2Id: ${this.player2Id}`);
    console.log(`[Game ${this.uuid}] player1Socket connected: ${this.player1Socket?.connected}, player2Socket connected: ${this.player2Socket?.connected}`);

    // Pause the game
    this.gameRunning = false;
    this.countdownInProgress = false; // Reset countdown state so it can start again after reconnection

    // Stop countdown if in progress
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
      console.log(`[Game ${this.uuid}] Countdown stopped due to disconnect`);
    }

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    // Set reconnection state
    this.waitingForReconnection = true;
    this.disconnectedPlayerId = disconnectedPlayerId;

    // Reset ready states - both players need to click Ready after reconnection
    this.playersReady.player1 = false;
    this.playersReady.player2 = false;

    // Notify the remaining player
    const remainingSocket = disconnectedPlayerId === this.player1Id ? this.player2Socket : this.player1Socket;
    const remainingPlayerId = disconnectedPlayerId === this.player1Id ? this.player2Id : this.player1Id;

    console.log(`[Game ${this.uuid}] Remaining player: ${remainingPlayerId}, socket exists: ${!!remainingSocket}, connected: ${remainingSocket?.connected}`);

    if (remainingSocket && remainingSocket.connected) {
      console.log(`[Game ${this.uuid}] Emitting opponent-disconnected to remaining player`);
      remainingSocket.emit(this.uuid, {
        type: 'opponent-disconnected',
        message: 'Your opponent has disconnected.',
        waitingForReconnection: true,
        gameState: this.getGameState() // Send current score etc.
      });
    } else {
      console.log(`[Game ${this.uuid}] WARNING: Cannot notify remaining player - socket not connected`);
    }

    // Set timeout for reconnection (2 minutes)
    this.reconnectionTimeout = setTimeout(() => {
      console.log(`[Game ${this.uuid}] Reconnection timeout expired`);
      this.waitingForReconnection = false;

      // Notify remaining player that reconnection timed out
      if (remainingSocket && remainingSocket.connected) {
        remainingSocket.emit(this.uuid, {
          type: 'reconnection-timeout',
          message: 'Opponent did not reconnect in time. Game ended.'
        });
      }

      // Call the cleanup callback
      if (onReconnectionTimeout) {
        onReconnectionTimeout(this.uuid);
      }
    }, 120000); // 2 minutes
  }

  /**
   * reconnectPlayer - Called when a disconnected player returns
   */
  reconnectPlayer(playerId, socket) {
    console.log(`[Game ${this.uuid}] Player ${playerId} reconnecting`);

    if (!this.waitingForReconnection || this.disconnectedPlayerId !== playerId) {
      console.log(`[Game ${this.uuid}] Invalid reconnection attempt`);
      return false;
    }

    // Clear reconnection timeout
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }

    // Update the socket for the reconnected player
    if (playerId === this.player1Id) {
      this.player1Socket = socket;
    } else if (playerId === this.player2Id) {
      this.player2Socket = socket;
    }

    // Reset reconnection state
    this.waitingForReconnection = false;
    this.disconnectedPlayerId = null;

    // Notify both players that reconnection was successful
    this.emitToPlayers('opponent-reconnected', {
      message: 'Opponent has reconnected! Both players click READY to resume.',
      gameState: this.getGameState()
    });

    return true;
  }

  /**
   * Check if this game is waiting for a specific player to reconnect
   */
  isWaitingForPlayer(playerId) {
    return this.waitingForReconnection && this.disconnectedPlayerId === playerId;
  }

  /**
   * Get the ID of the player who should reconnect
   */
  getDisconnectedPlayerId() {
    return this.disconnectedPlayerId;
  }

  /**
   * emitToPlayers - Send event to all connected players
   * For remote games: sends to both players
   * For local/AI: sends only to player 1
   */
  emitToPlayers(eventType, data) {
    const payload = { type: eventType, ...data };

    // Always emit to player 1
    if (this.player1Socket) {
      console.log(`[Game ${this.uuid}] Emitting ${eventType} to player1 (socket connected: ${this.player1Socket.connected})`);
      this.player1Socket.emit(this.uuid, payload);
    } else {
      console.log(`[Game ${this.uuid}] WARNING: No player1Socket for ${eventType}`);
    }

    // For remote games, also emit to player 2
    if (this.isRemoteGame && this.player2Socket) {
      console.log(`[Game ${this.uuid}] Emitting ${eventType} to player2 (socket connected: ${this.player2Socket.connected})`);
      this.player2Socket.emit(this.uuid, payload);
    } else if (this.isRemoteGame) {
      console.log(`[Game ${this.uuid}] WARNING: No player2Socket for ${eventType}`);
    }
  }

  /**
   * emitGameUpdate - Send game state to players
   * Player 2 receives a MIRRORED view (their paddle appears on the left)
   */
  emitGameUpdate(gameState) {
    // Player 1 gets normal state
    if (this.player1Socket) {
      try {
        this.player1Socket.emit(this.uuid, {
          type: "game-update",
          state: gameState
        });
      } catch (err) {
        console.error(`[Game ${this.uuid}] Error emitting to player 1:`, err);
      }
    } else {
      console.warn(`[Game ${this.uuid}] emitGameUpdate: player1Socket is null!`);
    }

    // Player 2 gets mirrored state (for remote games)
    if (this.isRemoteGame && this.player2Socket) {
      try {
        const mirroredState = this.mirrorGameState(gameState);
        this.player2Socket.emit(this.uuid, {
          type: "game-update",
          state: mirroredState
        });
      } catch (err) {
        console.error(`[Game ${this.uuid}] Error emitting to player 2:`, err);
      }
    }
  }

  /**
   * mirrorGameState - Create a mirrored view of the game state for player 2
   *
   * The mirror effect:
   * - Player 2's paddle (paddle2) becomes paddle1 in their view (left side)
   * - Player 1's paddle (paddle1) becomes paddle2 in their view (right side)
   * - Ball X position is mirrored
   * - Ball X velocity is reversed
   * - Scores are swapped
   */
  mirrorGameState(state) {
    return {
      // Swap paddles: player 2 sees their paddle on the left
      paddle1: {
        x: CANVAS_WIDTH - state.paddle2.x - 10, // Mirror X position
        y: state.paddle2.y
      },
      paddle2: {
        x: CANVAS_WIDTH - state.paddle1.x - 10, // Mirror X position
        y: state.paddle1.y
      },
      // Mirror ball position and velocity
      ball: {
        x: CANVAS_WIDTH - state.ball.x - state.ball.size,
        y: state.ball.y,
        size: state.ball.size,
        velocityX: -state.ball.velocityX, // Reverse direction
        velocityY: state.ball.velocityY
      },
      // Swap scores: player 2 sees their score on the left
      player1Score: state.player2Score,
      player2Score: state.player1Score,
      gameRunning: state.gameRunning,
      winner: state.winner === 'player1' ? 'player2' :
              state.winner === 'player2' ? 'player1' : state.winner
    };
  }

  async setupAiSubscription() {
    try {
      // Create a duplicate client for subscribing (Redis requires separate client for pub/sub)
      this.redisSubscriber = this.redis.duplicate();
      await this.redisSubscriber.connect();

      // Subscribe to AI input channel
      await this.redisSubscriber.subscribe(`game:${this.uuid}:ai-input`, (message) => {
        try {
          const data = JSON.parse(message);
          if (data.paddle2Dir !== undefined) {
            this.playerInputs.paddle2Dir = data.paddle2Dir;
          }
        } catch (err) {
          console.error('Error parsing AI input:', err);
        }
      });

      console.log(`Game ${this.uuid}: Subscribed to AI input channel`);
    } catch (err) {
      console.error('Error setting up AI subscription:', err);
    }
  }


  setPlayerReady(playerNum) {
    console.log(`[Game ${this.uuid}] setPlayerReady called: playerNum=${playerNum}, type=${this.type}`);

    // Prevent setting the same player ready multiple times
    if (playerNum === 1 && this.playersReady.player1) {
      console.log(`[Game ${this.uuid}] Player 1 already ready, ignoring duplicate call`);
      return;
    }
    if (playerNum === 2 && this.playersReady.player2) {
      console.log(`[Game ${this.uuid}] Player 2 already ready, ignoring duplicate call`);
      return;
    }

    if (playerNum === 1) {
      this.playersReady.player1 = true;
    } else if (playerNum === 2) {
      this.playersReady.player2 = true;
    } else if (playerNum === 3) {
      // For local/AI games: mark both players ready
      this.playersReady.player1 = true;
      this.playersReady.player2 = true;
    }

    // For AI games ONLY, player2 (AI) is always ready when player1 clicks ready
    if (this.isAiGame && playerNum === 1) {
      this.playersReady.player2 = true;
    }

    console.log(`[Game ${this.uuid}] Ready status - P1: ${this.playersReady.player1}, P2: ${this.playersReady.player2}`);

    // For remote games, only emit ready status if Player 2 has confirmed they're listening
    // (or if it's Player 2 setting ready, they must be listening)
    if (this.isRemoteGame && !this.player2Joined && playerNum === 1) {
      console.log(`[Game ${this.uuid}] Player 2 hasn't joined yet, deferring ready-status emit`);
      // Ready status will be emitted when Player 2 joins (in setPlayer2Joined)
      return;
    }

    this.emitReadyStatus();

    if (this.playersReady.player1 && this.playersReady.player2) {
      console.log(`[Game ${this.uuid}] Both players ready! Starting countdown...`);
      this.startCountdown();
    }
  }

  /**
   * emitReadyStatus - Send current ready status to all players
   */
  emitReadyStatus() {
    this.emitToPlayers("ready-status", {
      player1Ready: this.playersReady.player1,
      player2Ready: this.playersReady.player2
    });
  }


  startCountdown() {
    // Prevent duplicate countdowns
    if (this.countdownInProgress) {
      console.log(`[Game ${this.uuid}] Countdown already in progress, skipping`);
      return;
    }
    this.countdownInProgress = true;

    let count = 3;
    console.log(`[Game ${this.uuid}] Starting countdown...`);
    console.log(`[Game ${this.uuid}] player1Socket connected: ${this.player1Socket?.connected}, player2Socket connected: ${this.player2Socket?.connected}`);

    this.countdownInterval = setInterval(() => {
      console.log(`[Game ${this.uuid}] Emitting countdown: ${count}`);
      this.emitToPlayers("countdown", { count: count });

      count--;

      if (count < 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.countdownInProgress = false;
        this.startGame();
      }
    }, 1000);
  }

  /**
   * stopCountdown - Cancel countdown when player disconnects
   */
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
      this.countdownInProgress = false;
      console.log(`[Game ${this.uuid}] Countdown stopped`);
    }
  }

  ///////////////////////////////////////////
  ///////// FUNCTIONS GAME LOGIC ////////////
  ///////////////////////////////////////////

  startGame() {
    console.log('Game.startGame() called');
    this.gameRunning = true;
    this.score.winner = null;
    this.emitToPlayers("game-start", {});
    this.gameLoop();
  }

  pauseGame() {
    console.log(`[Game ${this.uuid}] pauseGame() called, gameRunning: ${this.gameRunning}`);

    if (!this.gameRunning) {
      console.log(`[Game ${this.uuid}] pauseGame() - game not running, cannot pause`);
      return;
    }

    this.gameRunning = false;
    this.gameLoopRunning = false; // Reset so resume can restart the loop
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    // For pause, send the current state (mirrored for player 2)
    this.emitGameUpdate(this.getGameState());
    this.emitToPlayers("game-paused", {});
    console.log(`[Game ${this.uuid}] Game paused successfully`);
  }

  resumeGame() {
    console.log(`[Game ${this.uuid}] resumeGame() called, gameRunning: ${this.gameRunning}`);

    if (this.gameRunning) {
      console.log(`[Game ${this.uuid}] resumeGame() - game already running`);
      return;
    }

    this.gameRunning = true;

    this.emitToPlayers("game-start", {});
    this.gameLoop();
    console.log(`[Game ${this.uuid}] Game resumed successfully`);
  }

  resetGame() {
    this.score.reset();
    this.gameRunning = false;
    this.countdownInProgress = false; // Reset countdown state
    this.paddle1.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.paddle2.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.ball.reset();

    this.playerInputs = {
      paddle1Dir: 0,
      paddle2Dir: 0
    };

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    this.playersReady = {
      player1: false,
      player2: false
    };

    this.emitToPlayers("game-reset", { state: this.getGameState() });
  }


  playAgainstRandomPlayer() {
    // This is now handled by matchmaking system in server.js
    // Keeping for backwards compatibility
    this.emitToPlayers("play-against-random-player", {});
  }

  playAgainstFriend() {
    this.emitToPlayers("play-against-friend", {});
  }


  gameLoop() {
    try {
      if (this.gameLoopInterval) {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
      }

      console.log(`[Game ${this.uuid}] gameLoop() starting, gameRunning: ${this.gameRunning}`);

      // 60 FPS = ~16.67ms per frame
      this.gameLoopInterval = setInterval(() => {
        try {
          if (!this.gameRunning) {
            console.log(`[Game ${this.uuid}] gameLoop() ending - gameRunning is false`);
            if (this.gameLoopInterval) {
              clearInterval(this.gameLoopInterval);
              this.gameLoopInterval = null;
            }
            return;
          }

          this.update();
        } catch (err) {
          console.error(`[Game ${this.uuid}] Error in gameLoop interval:`, err);
        }
      }, 1000 / 60); // 60 FPS
    } catch (err) {
      console.error(`[Game ${this.uuid}] Error in gameLoop():`, err);
    }
  }

  ///////// PLAYER INPUTS /////////
  updatePlayerMove(paddle1Dir, paddle2Dir, socketId = null) {
    // For remote games: each player should only control their assigned paddle
    if (this.isRemoteGame && socketId) {
      // Determine which socket this is
      const isPlayer1 = this.player1Socket && this.player1Socket.id === socketId;
      const isPlayer2 = this.player2Socket && this.player2Socket.id === socketId;

      if (isPlayer1) {
        // Player 1 socket: only update paddle1
        this.playerInputs.paddle1Dir = paddle1Dir;
      } else if (isPlayer2) {
        // Player 2 socket: only update paddle2
        this.playerInputs.paddle2Dir = paddle2Dir;
      }
    } else {
      // Local/AI games: accept both inputs normally
      this.playerInputs.paddle1Dir = paddle1Dir;
      // For AI games, ignore paddle2 input from frontend - AI controls it via Redis
      if (!this.isAiGame) {
        this.playerInputs.paddle2Dir = paddle2Dir;
      }
    }
  }

  applyPlayerMoves() {
    const speed = this.settings.paddleSpeed;
    this.paddle1.move(this.playerInputs.paddle1Dir, speed);
    this.paddle2.move(this.playerInputs.paddle2Dir, speed);
  }

  update() {
    this.applyPlayerMoves();
    this.ball.update();
    this.ball.checkWallCollision();

    // Check paddle1 collision (left paddle)
    if (this.paddle1.checkCollisionWithBall(this.ball)) {
      // Only reverse if ball is moving towards the paddle
      if (this.ball.velocityX < 0) {
        this.ball.reverseX();
        this.ball.addRandomYVelocity();
        // Push ball out of paddle to prevent sticking
        this.ball.x = this.paddle1.x + this.paddle1.width;
      }
    }

    // Check paddle2 collision (right paddle)
    if (this.paddle2.checkCollisionWithBall(this.ball)) {
      // Only reverse if ball is moving towards the paddle
      if (this.ball.velocityX > 0) {
        this.ball.reverseX();
        this.ball.addRandomYVelocity();
        // Push ball out of paddle to prevent sticking
        this.ball.x = this.paddle2.x - this.ball.size;
      }
    }

    const outOfBounds = this.ball.checkOutOfBounds();
    if (outOfBounds === 'left') {
      this.score.incrementPlayer2();
      this.ball.reset();
      if (this.score.isGameOver()) {
        this.gameRunning = false;
      }
    } else if (outOfBounds === 'right') {
      this.score.incrementPlayer1();
      this.ball.reset();
      if (this.score.isGameOver()) {
        this.gameRunning = false;
      }
    }

    const gameState = this.getGameState();

    // Send game state to all players (with mirroring for player 2)
    this.emitGameUpdate(gameState);

    // Publish game state to Redis for AI service
    if (this.isAiGame && this.redis && this.gameRunning) {
      this.publishGameStateToAi(gameState);
    }
  }

  async publishGameStateToAi(gameState) {
    try {
      await this.redis.publish(`game:${this.uuid}:state`, JSON.stringify({
        ball: gameState.ball,
        paddle2: gameState.paddle2,
        difficulty: this.difficulty
      }));
    } catch (err) {
      console.error('Error publishing game state to AI:', err);
    }
  }

  getGameState() {
    return {
      paddle1: this.paddle1.getState(),
      paddle2: this.paddle2.getState(),
      ball: this.ball.getState(),
      player1Score: this.score.player1Score,
      player2Score: this.score.player2Score,
      gameRunning: this.gameRunning,
      winner: this.score.getWinner()
    };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.ballSpeed !== undefined) {
      this.ball.ballSpeed = newSettings.ballSpeed;
    }
    if (newSettings.winningScore !== undefined) {
      this.score.winningScore = newSettings.winningScore;
    }
  }

  async destroy() {
    // Stop countdown if in progress
    this.stopCountdown();

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    // Clear reconnection timeout to prevent callback from firing after destroy
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
      console.log(`[Game ${this.uuid}] Reconnection timeout cleared on destroy`);
    }

    // Clean up Redis subscription
    if (this.redisSubscriber) {
      try {
        await this.redisSubscriber.unsubscribe(`game:${this.uuid}:ai-input`);
        await this.redisSubscriber.quit();
      } catch (err) {
        console.error('Error cleaning up Redis subscriber:', err);
      }
    }
  }
}
