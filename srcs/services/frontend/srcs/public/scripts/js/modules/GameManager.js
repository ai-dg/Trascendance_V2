import { gameSocket } from "../app.js";
import { Logger } from './Logger.js';
//import { INITIAL_READY_STATE } from "../../../realtime-sockets/app/srcs/Data.js";
export class GameManager {
    constructor(canvas, UUID) {
        this.keys = {};
        this.animationId = null;
        this.listeners = [];
        this.gameUID = null;
        this.CANVAS_WIDTH = 800;
        this.CANVAS_HEIGHT = 400;
        this.PADDLE_WIDTH = 10;
        this.PADDLE_HEIGHT = 80;
        this.hasStarted = false;
        this.isReady = false;
        this.isPaused = false;
        this.intervalId = null;
        this.onKeyDown = null;
        this.onKeyUp = null;
        // Remote game properties
        this.playerNumber = 1; // 1 or 2 (assigned by matchmaking)
        this.opponentId = null;
        this.onOpponentFound = null;
        this.onOpponentDisconnected = null;
        this.onMatchmakingError = null;
        this.onOpponentReconnected = null;
        this.onReconnectionTimeout = null;
        this.onOpponentAbandoned = null;
        this.onCountdownStart = null;
        this.isRemoteGame = false; // Set to true when opponent is found
        this.isInCountdown = false; // Prevent draw() from overwriting countdown
        // A garder ?
        this.playersReadyStatus = {
            player1: false,
            player2: false
        };
        this.gameUID = UUID;
        this.ctx = canvas.getContext('2d');
        this.gameState = {
            player1Score: 0,
            player2Score: 0,
            paddle1: {
                x: 20,
                y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
            },
            paddle2: {
                x: this.CANVAS_WIDTH - 30,
                y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
            },
            gameRunning: false,
            winner: null
        };
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    /**
     * Destroy the game manager
     * @param notifyServer - If true, sends destroy-game to server. Set to false for remote games
     *                       that should allow reconnection (triggers player-left instead)
     */
    destroy(notifyServer = true) {
        Logger.log(`[GameManager] destroy() called for game: ${this.gameUID}, notifyServer: ${notifyServer}`);
        this.stopInputLoop();
        if (this.onKeyDown)
            window.removeEventListener('keydown', this.onKeyDown);
        if (this.onKeyUp)
            window.removeEventListener('keyup', this.onKeyUp);
        if (gameSocket && this.gameUID) {
            if (notifyServer) {
                // Completely destroy the game on server
                gameSocket.emit(this.gameUID, { action: "destroy-game" });
                Logger.log(`[GameManager] Sent destroy-game to server for: ${this.gameUID}`);
            }
            else {
                // For active remote games: notify server that player left (triggers reconnection flow)
                this.leaveGame();
                Logger.log(`[GameManager] Sent player-left to server (reconnection enabled)`);
            }
            // Remove socket listener to prevent memory leaks
            gameSocket.removeAllListeners(this.gameUID);
            Logger.log(`[GameManager] Socket listener removed for: ${this.gameUID}`);
        }
    }
    /**
     * Check if this is a remote game that has started (for reconnection logic)
     */
    isActiveRemoteGame() {
        return this.isRemoteGame && this.hasStarted;
    }
    //////////////////////////////////////////
    ///////////// GETTERS ////////////////////
    /////////////////////////////////////////
    getGameState() {
        return { ...this.gameState };
    }
    getIsPaused() {
        return this.isPaused;
    }
    getHasStarted() {
        return this.hasStarted;
    }
    getPlayerNumber() {
        return this.playerNumber;
    }
    getGameUID() {
        return this.gameUID;
    }
    /**
     * Set the player number (used for reconnection)
     */
    setPlayerNumber(num) {
        this.playerNumber = num;
        this.isRemoteGame = true;
        Logger.log(`[GameManager] Player number set to: ${num}`);
    }
    //////////////////////////////////////////
    /////// SETUP SOCKET LISTENERS //////////
    /////////////////////////////////////////
    setupSocketListeners() {
        if (!gameSocket || !this.gameUID) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        Logger.log(`[GameManager] Setting up socket listeners for game: ${this.gameUID}`);
        Logger.log(`[GameManager] gameSocket connected: ${gameSocket.connected}`);
        gameSocket.on(this.gameUID, (data) => {
            Logger.log(`[GameManager] <<<< RECEIVED EVENT on ${this.gameUID}:`, data?.type || 'NO TYPE');
            if (!data?.type)
                return;
            if (data.type === "ready-status") {
                this.playersReadyStatus = {
                    player1: data.player1Ready,
                    player2: data.player2Ready
                };
                // Set countdown flag to prevent draw() from overwriting ready screen
                this.isInCountdown = true;
                this.drawReadyScreen();
            }
            else if (data.type === "countdown") {
                Logger.log(`[GameManager] COUNTDOWN RECEIVED: ${data.count}`);
                // Set countdown flag to prevent draw() from overwriting
                this.isInCountdown = true;
                // Notify UI to hide overlays on EVERY countdown (not just first)
                if (this.onCountdownStart) {
                    Logger.log("[GameManager] Calling onCountdownStart callback");
                    this.onCountdownStart();
                }
                this.drawCountdown(data.count);
            }
            else if (data.type === "game-start")
                this.startGame();
            else if (data.type === "game-paused")
                this.handleServerGamePaused(data);
            else if (data.type === "game-reset")
                this.handleServerGameReset(data);
            else if (data.type === "game-update")
                this.updateGame(data);
            else if (data.type === "play-against-random-player")
                this.handleServerPlayAgainstRandomPlayer(data);
            else if (data.type === "play-against-friend")
                this.handleServerPlayAgainstFriend(data);
            else if (data.type === "opponent-found")
                this.handleOpponentFound(data);
            else if (data.type === "opponent-disconnected") {
                Logger.log("[GameManager] OPPONENT DISCONNECTED EVENT RECEIVED", data);
                this.handleOpponentDisconnected(data);
            }
            else if (data.type === "matchmaking-error") {
                Logger.log("[GameManager] MATCHMAKING ERROR:", data);
                this.handleMatchmakingError(data);
            }
            else if (data.type === "opponent-reconnected") {
                Logger.log("[GameManager] OPPONENT RECONNECTED:", data);
                this.handleOpponentReconnected(data);
            }
            else if (data.type === "reconnection-timeout") {
                Logger.log("[GameManager] RECONNECTION TIMEOUT:", data);
                this.handleReconnectionTimeout(data);
            }
            else if (data.type === "opponent-abandoned") {
                Logger.log("[GameManager] OPPONENT ABANDONED:", data);
                this.handleOpponentAbandoned(data);
            }
        });
    }
    /**
     * handleOpponentFound - Called when matchmaking finds an opponent
     */
    handleOpponentFound(data) {
        Logger.log("[GameManager] Opponent found!", data);
        this.playerNumber = data.playerNumber; // 1 or 2
        this.opponentId = data.opponentId;
        this.isRemoteGame = true; // Mark this as a remote game
        // If player 2, switch to the matched game UUID
        if (data.playerNumber === 2 && data.gameUUID) {
            Logger.log(`[GameManager] Player 2 switching from ${this.gameUID} to ${data.gameUUID}`);
            // Remove old socket listener
            if (gameSocket && this.gameUID) {
                gameSocket.removeAllListeners(this.gameUID);
                Logger.log(`[GameManager] Removed listener for old UUID: ${this.gameUID}`);
            }
            // Update to new game UUID
            this.gameUID = data.gameUUID;
            // Set up listener for the new game
            this.setupSocketListeners();
            Logger.log(`[GameManager] Now listening on matched game: ${this.gameUID}`);
            // Confirm to server that we're now listening on the new channel
            if (gameSocket && this.gameUID) {
                gameSocket.emit(this.gameUID, { action: "player-2-joined" });
                Logger.log(`[GameManager] Sent player-2-joined confirmation`);
            }
        }
        // Notify listeners that opponent was found
        if (this.onOpponentFound) {
            this.onOpponentFound(data);
        }
    }
    /**
     * Set callback for when opponent is found (used by GameRemotePage)
     */
    setOnOpponentFound(callback) {
        this.onOpponentFound = callback;
    }
    /**
     * handleOpponentDisconnected - Called when opponent leaves the game
     */
    handleOpponentDisconnected(data) {
        Logger.log("[GameManager] handleOpponentDisconnected() called", data);
        // CRITICAL: Stop the game loop IMMEDIATELY to prevent draw() from overwriting countdown/ready screens
        this.gameState.gameRunning = false;
        this.hasStarted = false;
        this.isPaused = false;
        // Stop the animation loop (this is the actual game rendering loop)
        this.stopInputLoop();
        // Also clear any legacy interval if exists
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        Logger.log("[GameManager] Game loop stopped, gameRunning:", this.gameState.gameRunning);
        Logger.log("[GameManager] Calling onOpponentDisconnected callback");
        // Notify UI (GameRemotePage will handle this)
        if (this.onOpponentDisconnected) {
            this.onOpponentDisconnected(data);
        }
        else {
            Logger.warn("[GameManager] No onOpponentDisconnected callback set!");
        }
    }
    /**
     * Set callback for when opponent disconnects
     */
    setOnOpponentDisconnected(callback) {
        this.onOpponentDisconnected = callback;
    }
    /**
     * handleMatchmakingError - Called when matchmaking fails (e.g., already searching)
     */
    handleMatchmakingError(data) {
        Logger.log("[GameManager] handleMatchmakingError() called", data);
        if (this.onMatchmakingError) {
            this.onMatchmakingError(data);
        }
        else {
            Logger.info("[GameManager] No matchmaking callback set");
        }
    }
    /**
     * Set callback for matchmaking errors
     */
    setOnMatchmakingError(callback) {
        this.onMatchmakingError = callback;
    }
    /**
     * handleOpponentReconnected - Called when disconnected opponent returns
     */
    handleOpponentReconnected(data) {
        Logger.log("[GameManager] handleOpponentReconnected() called", data);
        // Reset ready states - both need to click Ready again
        this.isReady = false;
        this.hasStarted = true; // Keep hasStarted true so we show ready screen, not start screen
        if (this.onOpponentReconnected) {
            this.onOpponentReconnected(data);
        }
        else {
            Logger.warn("[GameManager] No onOpponentReconnected callback set!");
        }
    }
    /**
     * Set callback for when opponent reconnects
     */
    setOnOpponentReconnected(callback) {
        this.onOpponentReconnected = callback;
    }
    /**
     * handleReconnectionTimeout - Called when opponent doesn't reconnect in time
     */
    handleReconnectionTimeout(data) {
        Logger.log("[GameManager] handleReconnectionTimeout() called", data);
        if (this.onReconnectionTimeout) {
            this.onReconnectionTimeout(data);
        }
        else {
            Logger.warn("[GameManager] No onReconnectionTimeout callback set!");
        }
    }
    /**
     * handleOpponentAbandoned - Called when opponent starts new game instead of reconnecting
     */
    handleOpponentAbandoned(data) {
        Logger.log("[GameManager] handleOpponentAbandoned() called", data);
        if (this.onOpponentAbandoned) {
            this.onOpponentAbandoned(data);
        }
        else {
            Logger.warn("[GameManager] No onOpponentAbandoned callback set!");
        }
    }
    /**
     * Set callback for reconnection timeout
     */
    setOnReconnectionTimeout(callback) {
        this.onReconnectionTimeout = callback;
    }
    /**
     * Set callback for opponent abandoned
     */
    setOnOpponentAbandoned(callback) {
        this.onOpponentAbandoned = callback;
    }
    /**
     * Set callback for when countdown starts (to hide overlays)
     */
    setOnCountdownStart(callback) {
        this.onCountdownStart = callback;
    }
    setupEventListeners() {
        this.onKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
        };
        this.onKeyUp = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.getGameState()));
    }
    //////////////////////////////////////////
    ///// SEND ACTIONS TO THE BACKEND //////
    /////////////////////////////////////////
    static getStoredGameSettings() {
        try {
            const raw = localStorage.getItem(GameManager.SETTINGS_STORAGE_KEY);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object')
                return null;
            const settings = {};
            if (typeof parsed.ballSpeed === 'number')
                settings.ballSpeed = parsed.ballSpeed;
            if (typeof parsed.paddleSpeed === 'number')
                settings.paddleSpeed = parsed.paddleSpeed;
            return Object.keys(settings).length ? settings : null;
        }
        catch {
            return null;
        }
    }
    static requestGameID(type, options = {}) {
        if (!gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        const payload = { type, ...options };
        // For local games, include saved settings from SettingsPage
        if (type === 'local') {
            const storedSettings = GameManager.getStoredGameSettings();
            const optionSettings = options.settings;
            if (storedSettings || optionSettings) {
                payload.settings = {};
                if (storedSettings)
                    payload.settings = { ...storedSettings };
                if (optionSettings) {
                    payload.settings = { ...payload.settings, ...optionSettings };
                }
            }
        }
        gameSocket.emit("request-game-uid", payload);
    }
    /**
     * Check if user has a game waiting for reconnection
     */
    static checkForReconnection(onResult) {
        if (!gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            onResult({ hasGame: false });
            return;
        }
        // Set up one-time listeners for the response
        gameSocket.once('reconnection-available', (data) => {
            Logger.log("[GameManager] Reconnection available:", data);
            onResult({ hasGame: true, ...data });
        });
        gameSocket.once('no-reconnection-available', () => {
            Logger.log("[GameManager] No reconnection available");
            onResult({ hasGame: false });
        });
        gameSocket.emit('check-reconnection');
    }
    /**
     * Attempt to reconnect to an existing game
     */
    static reconnectToGame(gameUUID, onResult) {
        if (!gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            onResult({ success: false });
            return;
        }
        // Set up one-time listeners for the response
        gameSocket.once('reconnection-success', (data) => {
            Logger.log("[GameManager] Reconnection success:", data);
            onResult({ success: true, ...data });
        });
        gameSocket.once('reconnection-failed', (data) => {
            Logger.log("[GameManager] Reconnection failed:", data);
            onResult({ success: false, ...data });
        });
        gameSocket.emit('reconnect-to-game', { gameUUID });
    }
    setReady(isRemoteGame = false) {
        if (this.isReady)
            return;
        this.isReady = true;
        if (!gameSocket || !this.gameUID) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        // For remote games: send individual player number (1 or 2)
        // For local/AI: send 3 to mark both players ready
        const playerNum = isRemoteGame ? this.playerNumber : 3;
        Logger.log(`[GameManager] setReady - sending player: ${playerNum} (isRemote: ${isRemoteGame})`);
        gameSocket.emit(this.gameUID, {
            action: "player-ready",
            player: playerNum
        });
        this.hasStarted = true;
    }
    pauseGame() {
        if (!gameSocket || !this.gameUID) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        this.isPaused = true;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "pause-game" });
    }
    resumeGame() {
        if (!gameSocket || !this.gameUID) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        // Don't change isPaused here - wait for server's game-start event
        // this.isPaused = false;
        // this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "resume-game" });
    }
    resetGame() {
        if (!this.gameUID || !gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        this.isReady = false;
        this.isPaused = false;
        this.hasStarted = false;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "reset-game" });
    }
    /**
     * searchForRandomOpponent - Tell server to find us an opponent
     * This triggers the matchmaking system
     */
    searchForRandomOpponent() {
        if (!this.gameUID || !gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        Logger.log("[GameManager] Searching for random opponent...");
        gameSocket.emit(this.gameUID, { action: "play-against-random-player" });
    }
    /**
     * cancelSearch - Cancel matchmaking search
     */
    cancelSearch() {
        if (!this.gameUID || !gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        Logger.log("[GameManager] Canceling search...");
        gameSocket.emit(this.gameUID, { action: "cancel-matchmaking" });
    }
    /**
     * leaveGame - Leave a remote game gracefully (triggers reconnection flow on server)
     * Used when player navigates away from an active remote game
     */
    leaveGame() {
        if (!this.gameUID || !gameSocket)
            return;
        Logger.log("[GameManager] Leaving game (triggering reconnection flow)...");
        gameSocket.emit(this.gameUID, { action: "player-left" });
    }
    //////////////////////////////////////////
    ///////HANDLE SERVER EVENTS /////////////
    /////////////////////////////////////////
    startGame() {
        this.isInCountdown = false; // Countdown finished, game starting
        this.gameState.gameRunning = true;
        this.isPaused = false;
        this.notifyListeners();
        this.startInputLoop();
    }
    handleServerGamePaused(data) {
        this.isPaused = true;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    handleServerGameReset(data) {
        this.isReady = false;
        this.isPaused = false;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    handleServerPlayAgainstRandomPlayer(data) {
        Logger.log("handleServerPlayAgainstRandomPlayer", data);
    }
    handleServerPlayAgainstFriend(data) {
        Logger.log("handleServerPlayAgainstFriend", data);
    }
    //////////////////////////////////////////
    /////////// GAME LOOP ////////////////////
    /////////////////////////////////////////
    stopInputLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    startInputLoop() {
        if (!this.gameState.gameRunning) {
            // Ensure the loop is fully stopped so it can be restarted on resume
            Logger.log('[GameManager] startInputLoop stopped: gameRunning=false');
            this.stopInputLoop();
            return;
        }
        Logger.log('[GameManager] startInputLoop frame - gameRunning=true, animationId set');
        // Send inputs to server
        this.sendPlayerInputs();
        // Render the current state from server
        this.draw();
        this.animationId = requestAnimationFrame(() => this.startInputLoop());
    }
    updateGame(data) {
        if (data.state) {
            // Always use server state directly - server is authoritative
            // This ensures both players see identical positions
            this.gameState = data.state;
            if (this.gameState.gameRunning)
                this.isPaused = false;
            // If game is running but input loop was stopped (e.g., after pause), restart it
            if (this.gameState.gameRunning && !this.isInCountdown && !this.animationId) {
                Logger.log('[GameManager] Restarting input loop: gameRunning=true, animationId=null');
                this.startInputLoop();
            }
            // Don't draw game state during countdown - would overwrite countdown numbers
            if (!this.isInCountdown) {
                this.draw();
            }
            this.notifyListeners();
        }
    }
    sendPlayerInputs() {
        if (!this.gameUID || !gameSocket) {
            console.info('[GameManager]', 'Game socket not ready');
            return;
        }
        let paddle1 = 0;
        let paddle2 = 0;
        // For remote games: only send input for your assigned paddle
        // Both players use W/S keys since the game is mirrored - everyone sees themselves on the left
        if (this.isRemoteGame) {
            if (this.playerNumber === 1) {
                // Player 1 controls paddle1 (W/S keys)
                if (this.keys['s'])
                    paddle1 = 1;
                else if (this.keys['w'])
                    paddle1 = -1;
                paddle2 = 0; // Don't send input for opponent's paddle
            }
            else if (this.playerNumber === 2) {
                // Player 2 controls paddle2 (also W/S keys due to mirroring)
                paddle1 = 0; // Don't send input for opponent's paddle
                if (this.keys['s'])
                    paddle2 = 1;
                else if (this.keys['w'])
                    paddle2 = -1;
            }
        }
        else {
            // For local/AI games: send both paddles
            if (this.keys['s'])
                paddle1 = 1;
            else if (this.keys['w'])
                paddle1 = -1;
            if (this.keys['arrowdown'])
                paddle2 = 1;
            else if (this.keys['arrowup'])
                paddle2 = -1;
        }
        const state = {
            paddle1,
            paddle2
        };
        gameSocket.emit(this.gameUID, { state });
    }
    //////////////////////////////////////////
    /////////// GAME DESIGN /////////////////
    /////////////////////////////////////////
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Draw center line
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.CANVAS_WIDTH / 2, 0);
        this.ctx.lineTo(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        // Draw paddles with glow effect
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.gameState.paddle1.x, this.gameState.paddle1.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        this.ctx.fillRect(this.gameState.paddle2.x, this.gameState.paddle2.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        // Draw ball with glow effect
        if (this.gameState.ball) {
            this.ctx.shadowColor = '#ff1493';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#ff1493';
            this.ctx.beginPath();
            this.ctx.arc(this.gameState.ball.x + this.gameState.ball.size / 2, this.gameState.ball.y + this.gameState.ball.size / 2, this.gameState.ball.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    drawReadyScreen() {
        Logger.log("[GameManager] drawReadyScreen called, canvas valid:", !!this.ctx);
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Titre
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Waiting for players...', this.CANVAS_WIDTH / 2, 150);
        // Status Player 1
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = this.playersReadyStatus.player1 ? '#00ff00' : '#ff0000';
        this.ctx.fillText(`Player 1: ${this.playersReadyStatus.player1 ? 'READY ✓' : 'NOT READY'}`, this.CANVAS_WIDTH / 2, 220);
        // Status Player 2
        this.ctx.fillStyle = this.playersReadyStatus.player2 ? '#00ff00' : '#ff0000';
        this.ctx.fillText(`Player 2: ${this.playersReadyStatus.player2 ? 'READY ✓' : 'NOT READY'}`, this.CANVAS_WIDTH / 2, 260);
    }
    drawCountdown(count) {
        Logger.log("[GameManager] drawCountdown called with count:", count, "canvas valid:", !!this.ctx);
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Countdown number
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 120px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff1493';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(count.toString(), this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 40);
        this.ctx.shadowBlur = 0;
    }
}
GameManager.SETTINGS_STORAGE_KEY = 'arcade_settings';
