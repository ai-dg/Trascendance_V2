"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
var app_js_1 = require("../app.js");
//import { INITIAL_READY_STATE } from "../../../realtime-sockets/app/srcs/Data.js";
var GameManager = /** @class */ (function () {
    function GameManager(canvas, UUID) {
        this.keys = {};
        this.animationId = null;
        this.listeners = [];
        this.gameUID = null;
        this.CANVAS_WIDTH = 800;
        this.CANVAS_HEIGHT = 400;
        this.PADDLE_WIDTH = 10;
        this.PADDLE_HEIGHT = 80;
        this.PADDLE_SPEED = 8; // Must match server's PADDLE_SPEED
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
        this.isRemoteGame = false; // Set to true when opponent is found
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
     *                       that should allow reconnection (server handles cleanup on disconnect)
     */
    GameManager.prototype.destroy = function (notifyServer) {
        if (notifyServer === void 0) { notifyServer = true; }
        console.log("[GameManager] destroy() called for game: ".concat(this.gameUID, ", notifyServer: ").concat(notifyServer));
        this.stopInputLoop();
        if (this.onKeyDown)
            window.removeEventListener('keydown', this.onKeyDown);
        if (this.onKeyUp)
            window.removeEventListener('keyup', this.onKeyUp);
        if (app_js_1.gameSocket && this.gameUID) {
            // Only notify server to destroy if explicitly requested
            // For remote games in progress, let server handle via disconnect event
            if (notifyServer) {
                app_js_1.gameSocket.emit(this.gameUID, { action: "destroy-game" });
                console.log("[GameManager] Sent destroy-game to server for: ".concat(this.gameUID));
            }
            else {
                console.log("[GameManager] NOT sending destroy-game (allowing reconnection)");
            }
            // Remove socket listener to prevent memory leaks
            app_js_1.gameSocket.removeAllListeners(this.gameUID);
            console.log("[GameManager] Socket listener removed for: ".concat(this.gameUID));
        }
    };
    /**
     * Check if this is a remote game that has started (for reconnection logic)
     */
    GameManager.prototype.isActiveRemoteGame = function () {
        return this.isRemoteGame && this.hasStarted;
    };
    //////////////////////////////////////////
    ///////////// GETTERS ////////////////////
    /////////////////////////////////////////
    GameManager.prototype.getGameState = function () {
        return __assign({}, this.gameState);
    };
    GameManager.prototype.getIsPaused = function () {
        return this.isPaused;
    };
    GameManager.prototype.getHasStarted = function () {
        return this.hasStarted;
    };
    GameManager.prototype.getPlayerNumber = function () {
        return this.playerNumber;
    };
    /**
     * Set the player number (used for reconnection)
     */
    GameManager.prototype.setPlayerNumber = function (num) {
        this.playerNumber = num;
        this.isRemoteGame = true;
        console.log("[GameManager] Player number set to: ".concat(num));
    };
    //////////////////////////////////////////
    /////// SETUP SOCKET LISTENERS //////////
    /////////////////////////////////////////
    GameManager.prototype.setupSocketListeners = function () {
        var _this = this;
        if (!app_js_1.gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        app_js_1.gameSocket.on(this.gameUID, function (data) {
            console.log("[GameManager] <<<< RECEIVED EVENT on ".concat(_this.gameUID, ":"), (data === null || data === void 0 ? void 0 : data.type) || 'NO TYPE', data);
            if (!(data === null || data === void 0 ? void 0 : data.type))
                return;
            if (data.type === "ready-status") {
                _this.playersReadyStatus = {
                    player1: data.player1Ready,
                    player2: data.player2Ready
                };
                _this.drawReadyScreen();
            }
            else if (data.type === "countdown")
                _this.drawCountdown(data.count);
            else if (data.type === "game-start")
                _this.startGame();
            else if (data.type === "game-paused")
                _this.handleServerGamePaused(data);
            else if (data.type === "game-reset")
                _this.handleServerGameReset(data);
            else if (data.type === "game-update")
                _this.updateGame(data);
            else if (data.type === "play-against-random-player")
                _this.handleServerPlayAgainstRandomPlayer(data);
            else if (data.type === "play-against-friend")
                _this.handleServerPlayAgainstFriend(data);
            else if (data.type === "opponent-found")
                _this.handleOpponentFound(data);
            else if (data.type === "opponent-disconnected") {
                console.log("[GameManager] OPPONENT DISCONNECTED EVENT RECEIVED", data);
                _this.handleOpponentDisconnected(data);
            }
            else if (data.type === "matchmaking-error") {
                console.log("[GameManager] MATCHMAKING ERROR:", data);
                _this.handleMatchmakingError(data);
            }
            else if (data.type === "opponent-reconnected") {
                console.log("[GameManager] OPPONENT RECONNECTED:", data);
                _this.handleOpponentReconnected(data);
            }
            else if (data.type === "reconnection-timeout") {
                console.log("[GameManager] RECONNECTION TIMEOUT:", data);
                _this.handleReconnectionTimeout(data);
            }
        });
    };
    /**
     * handleOpponentFound - Called when matchmaking finds an opponent
     */
    GameManager.prototype.handleOpponentFound = function (data) {
        console.log("[GameManager] Opponent found!", data);
        this.playerNumber = data.playerNumber; // 1 or 2
        this.opponentId = data.opponentId;
        this.isRemoteGame = true; // Mark this as a remote game
        // If player 2, switch to the matched game UUID
        if (data.playerNumber === 2 && data.gameUUID) {
            console.log("[GameManager] Player 2 switching from ".concat(this.gameUID, " to ").concat(data.gameUUID));
            // Remove old socket listener
            if (app_js_1.gameSocket && this.gameUID) {
                app_js_1.gameSocket.removeAllListeners(this.gameUID);
                console.log("[GameManager] Removed listener for old UUID: ".concat(this.gameUID));
            }
            // Update to new game UUID
            this.gameUID = data.gameUUID;
            // Set up listener for the new game
            this.setupSocketListeners();
            console.log("[GameManager] Now listening on matched game: ".concat(this.gameUID));
            // Confirm to server that we're now listening on the new channel
            if (app_js_1.gameSocket && this.gameUID) {
                app_js_1.gameSocket.emit(this.gameUID, { action: "player-2-joined" });
                console.log("[GameManager] Sent player-2-joined confirmation");
            }
        }
        // Notify listeners that opponent was found
        if (this.onOpponentFound) {
            this.onOpponentFound(data);
        }
    };
    /**
     * Set callback for when opponent is found (used by GameRemotePage)
     */
    GameManager.prototype.setOnOpponentFound = function (callback) {
        this.onOpponentFound = callback;
    };
    /**
     * handleOpponentDisconnected - Called when opponent leaves the game
     */
    GameManager.prototype.handleOpponentDisconnected = function (data) {
        console.log("[GameManager] handleOpponentDisconnected() called", data);
        // Stop the game
        this.hasStarted = false;
        this.isPaused = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log("[GameManager] Calling onOpponentDisconnected callback");
        // Notify UI (GameRemotePage will handle this)
        if (this.onOpponentDisconnected) {
            this.onOpponentDisconnected(data);
        }
        else {
            console.warn("[GameManager] No onOpponentDisconnected callback set!");
        }
    };
    /**
     * Set callback for when opponent disconnects
     */
    GameManager.prototype.setOnOpponentDisconnected = function (callback) {
        this.onOpponentDisconnected = callback;
    };
    /**
     * handleMatchmakingError - Called when matchmaking fails (e.g., already searching)
     */
    GameManager.prototype.handleMatchmakingError = function (data) {
        console.log("[GameManager] handleMatchmakingError() called", data);
        if (this.onMatchmakingError) {
            this.onMatchmakingError(data);
        }
        else {
            console.warn("[GameManager] No onMatchmakingError callback set!");
        }
    };
    /**
     * Set callback for matchmaking errors
     */
    GameManager.prototype.setOnMatchmakingError = function (callback) {
        this.onMatchmakingError = callback;
    };
    /**
     * handleOpponentReconnected - Called when disconnected opponent returns
     */
    GameManager.prototype.handleOpponentReconnected = function (data) {
        console.log("[GameManager] handleOpponentReconnected() called", data);
        // Reset ready states - both need to click Ready again
        this.isReady = false;
        this.hasStarted = true; // Keep hasStarted true so we show ready screen, not start screen
        if (this.onOpponentReconnected) {
            this.onOpponentReconnected(data);
        }
        else {
            console.warn("[GameManager] No onOpponentReconnected callback set!");
        }
    };
    /**
     * Set callback for when opponent reconnects
     */
    GameManager.prototype.setOnOpponentReconnected = function (callback) {
        this.onOpponentReconnected = callback;
    };
    /**
     * handleReconnectionTimeout - Called when opponent doesn't reconnect in time
     */
    GameManager.prototype.handleReconnectionTimeout = function (data) {
        console.log("[GameManager] handleReconnectionTimeout() called", data);
        if (this.onReconnectionTimeout) {
            this.onReconnectionTimeout(data);
        }
        else {
            console.warn("[GameManager] No onReconnectionTimeout callback set!");
        }
    };
    /**
     * Set callback for reconnection timeout
     */
    GameManager.prototype.setOnReconnectionTimeout = function (callback) {
        this.onReconnectionTimeout = callback;
    };
    GameManager.prototype.setupEventListeners = function () {
        var _this = this;
        this.onKeyDown = function (e) {
            _this.keys[e.key.toLowerCase()] = true;
        };
        this.onKeyUp = function (e) {
            _this.keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    };
    GameManager.prototype.addListener = function (callback) {
        var _this = this;
        this.listeners.push(callback);
        return function () {
            _this.listeners = _this.listeners.filter(function (l) { return l !== callback; });
        };
    };
    GameManager.prototype.notifyListeners = function () {
        var _this = this;
        this.listeners.forEach(function (callback) { return callback(_this.getGameState()); });
    };
    //////////////////////////////////////////
    ///// SEND ACTIONS TO THE BACKEND //////
    /////////////////////////////////////////
    GameManager.requestGameID = function (type, options) {
        if (options === void 0) { options = {}; }
        if (!app_js_1.gameSocket)
            throw Error("gameSocket is not ready");
        app_js_1.gameSocket.emit("request-game-uid", __assign({ type: type }, options));
    };
    /**
     * Check if user has a game waiting for reconnection
     */
    GameManager.checkForReconnection = function (onResult) {
        if (!app_js_1.gameSocket)
            throw Error("gameSocket is not ready");
        // Set up one-time listeners for the response
        app_js_1.gameSocket.once('reconnection-available', function (data) {
            console.log("[GameManager] Reconnection available:", data);
            onResult(__assign({ hasGame: true }, data));
        });
        app_js_1.gameSocket.once('no-reconnection-available', function () {
            console.log("[GameManager] No reconnection available");
            onResult({ hasGame: false });
        });
        app_js_1.gameSocket.emit('check-reconnection');
    };
    /**
     * Attempt to reconnect to an existing game
     */
    GameManager.reconnectToGame = function (gameUUID, onResult) {
        if (!app_js_1.gameSocket)
            throw Error("gameSocket is not ready");
        // Set up one-time listeners for the response
        app_js_1.gameSocket.once('reconnection-success', function (data) {
            console.log("[GameManager] Reconnection success:", data);
            onResult(__assign({ success: true }, data));
        });
        app_js_1.gameSocket.once('reconnection-failed', function (data) {
            console.log("[GameManager] Reconnection failed:", data);
            onResult(__assign({ success: false }, data));
        });
        app_js_1.gameSocket.emit('reconnect-to-game', { gameUUID: gameUUID });
    };
    GameManager.prototype.setReady = function (isRemoteGame) {
        if (isRemoteGame === void 0) { isRemoteGame = false; }
        if (this.isReady)
            return;
        this.isReady = true;
        if (!app_js_1.gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        // For remote games: send individual player number (1 or 2)
        // For local/AI: send 3 to mark both players ready
        var playerNum = isRemoteGame ? this.playerNumber : 3;
        console.log("[GameManager] setReady - sending player: ".concat(playerNum, " (isRemote: ").concat(isRemoteGame, ")"));
        app_js_1.gameSocket.emit(this.gameUID, {
            action: "player-ready",
            player: playerNum
        });
        this.hasStarted = true;
    };
    GameManager.prototype.pauseGame = function () {
        if (!app_js_1.gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.isPaused = true;
        this.stopInputLoop();
        this.notifyListeners();
        app_js_1.gameSocket.emit(this.gameUID, { action: "pause-game" });
    };
    GameManager.prototype.resumeGame = function () {
        if (!app_js_1.gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.isPaused = false;
        this.notifyListeners();
        app_js_1.gameSocket.emit(this.gameUID, { action: "resume-game" });
    };
    GameManager.prototype.resetGame = function () {
        if (!this.gameUID || !app_js_1.gameSocket)
            throw Error("Error with game socket!");
        this.isReady = false;
        this.isPaused = false;
        this.hasStarted = false;
        this.stopInputLoop();
        this.notifyListeners();
        app_js_1.gameSocket.emit(this.gameUID, { action: "reset-game" });
    };
    /**
     * searchForRandomOpponent - Tell server to find us an opponent
     * This triggers the matchmaking system
     */
    GameManager.prototype.searchForRandomOpponent = function () {
        if (!this.gameUID || !app_js_1.gameSocket)
            throw Error("Error with game socket!");
        console.log("[GameManager] Searching for random opponent...");
        app_js_1.gameSocket.emit(this.gameUID, { action: "play-against-random-player" });
    };
    /**
     * cancelSearch - Cancel matchmaking search
     */
    GameManager.prototype.cancelSearch = function () {
        if (!this.gameUID || !app_js_1.gameSocket)
            throw Error("Error with game socket!");
        console.log("[GameManager] Canceling search...");
        app_js_1.gameSocket.emit(this.gameUID, { action: "cancel-matchmaking" });
    };
    //////////////////////////////////////////
    ///////HANDLE SERVER EVENTS /////////////
    /////////////////////////////////////////
    GameManager.prototype.startGame = function () {
        this.gameState.gameRunning = true;
        this.isPaused = false;
        this.notifyListeners();
        this.startInputLoop();
    };
    GameManager.prototype.handleServerGamePaused = function (data) {
        this.isPaused = true;
        this.stopInputLoop();
        if (data === null || data === void 0 ? void 0 : data.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    };
    GameManager.prototype.handleServerGameReset = function (data) {
        this.isReady = false;
        this.isPaused = false;
        this.stopInputLoop();
        if (data === null || data === void 0 ? void 0 : data.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    };
    GameManager.prototype.handleServerPlayAgainstRandomPlayer = function (data) {
        console.log("handleServerPlayAgainstRandomPlayer", data);
    };
    GameManager.prototype.handleServerPlayAgainstFriend = function (data) {
        console.log("handleServerPlayAgainstFriend", data);
    };
    //////////////////////////////////////////
    /////////// GAME LOOP ////////////////////
    /////////////////////////////////////////
    GameManager.prototype.stopInputLoop = function () {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    };
    GameManager.prototype.startInputLoop = function () {
        var _this = this;
        if (!this.gameState.gameRunning)
            return;
        // Apply local paddle movement immediately for responsiveness
        this.applyLocalPaddleMovement();
        // Send inputs to server
        this.sendPlayerInputs();
        // Render the current state (local prediction + server ball/opponent)
        this.draw();
        this.animationId = requestAnimationFrame(function () { return _this.startInputLoop(); });
    };
    /**
     * Apply paddle movement locally for instant feedback (client-side prediction)
     */
    GameManager.prototype.applyLocalPaddleMovement = function () {
        // Only do local prediction for remote games
        if (!this.isRemoteGame)
            return;
        // Determine which paddle this player controls
        var paddleKey = this.playerNumber === 1 ? 'paddle1' : 'paddle2';
        var paddle = this.gameState[paddleKey];
        // Apply movement based on keys
        if (this.keys['w']) {
            paddle.y -= this.PADDLE_SPEED;
        }
        if (this.keys['s']) {
            paddle.y += this.PADDLE_SPEED;
        }
        // Clamp to canvas bounds
        paddle.y = Math.max(0, Math.min(this.CANVAS_HEIGHT - this.PADDLE_HEIGHT, paddle.y));
    };
    GameManager.prototype.updateGame = function (data) {
        if (data.state) {
            if (this.isRemoteGame && this.gameState.gameRunning) {
                // For remote games: preserve local paddle position, use server for everything else
                var myPaddleKey = this.playerNumber === 1 ? 'paddle1' : 'paddle2';
                var localPaddleY = this.gameState[myPaddleKey].y;
                // Update game state from server
                this.gameState = data.state;
                // Restore local paddle position (our prediction)
                this.gameState[myPaddleKey].y = localPaddleY;
            }
            else {
                // For local/AI games: use server state directly
                this.gameState = data.state;
            }
            if (this.gameState.gameRunning)
                this.isPaused = false;
            // Only draw here for non-remote games (remote games draw in startInputLoop)
            if (!this.isRemoteGame) {
                this.draw();
            }
            this.notifyListeners();
        }
    };
    GameManager.prototype.sendPlayerInputs = function () {
        if (!this.gameUID || !app_js_1.gameSocket)
            throw Error("Error with game socket!");
        var paddle1 = 0;
        var paddle2 = 0;
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
        var state = {
            paddle1: paddle1,
            paddle2: paddle2
        };
        if (!app_js_1.gameSocket)
            throw Error("Error with game socket!");
        app_js_1.gameSocket.emit(this.gameUID, { state: state });
    };
    //////////////////////////////////////////
    /////////// GAME DESIGN /////////////////
    /////////////////////////////////////////
    GameManager.prototype.draw = function () {
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
    };
    GameManager.prototype.drawReadyScreen = function () {
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
        this.ctx.fillText("Player 1: ".concat(this.playersReadyStatus.player1 ? 'READY ✓' : 'NOT READY'), this.CANVAS_WIDTH / 2, 220);
        // Status Player 2
        this.ctx.fillStyle = this.playersReadyStatus.player2 ? '#00ff00' : '#ff0000';
        this.ctx.fillText("Player 2: ".concat(this.playersReadyStatus.player2 ? 'READY ✓' : 'NOT READY'), this.CANVAS_WIDTH / 2, 260);
    };
    GameManager.prototype.drawCountdown = function (count) {
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
    };
    return GameManager;
}());
exports.GameManager = GameManager;
