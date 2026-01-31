"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemotePage = void 0;
var GameManager_js_1 = require("../modules/GameManager.js");
var RemotePage = /** @class */ (function () {
    function RemotePage(uiManager, onBack, user) {
        this.gameManager = null;
        this.canvas = null;
        this.user = null;
        this.isSearchingOpponent = false;
        this.selectedFriendId = null;
        this.uiManager = uiManager;
        this.onBack = onBack;
        this.user = user !== null && user !== void 0 ? user : null;
    }
    ///////////// DESIGN & RENDERING /////////////
    RemotePage.prototype.render = function (user) {
        var _this = this;
        if (user !== undefined) {
            this.user = user;
        }
        // Avatars
        var avatarPlayer1Section = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        var avatarPlayer1Img = this.uiManager.createElement('img', 'rounded-full');
        avatarPlayer1Img.style.width = '110px';
        avatarPlayer1Img.style.height = '110px';
        if (!this.user || !this.user.avatar)
            avatarPlayer1Img.src = 'public/avatars/default.png';
        else if (this.user.avatar.startsWith('http'))
            avatarPlayer1Img.src = this.user.avatar;
        else
            avatarPlayer1Img.src = "public/avatars/".concat(this.user.avatar, ".png");
        avatarPlayer1Section.appendChild(avatarPlayer1Img);
        var avatarPlayer2Section = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        var avatarPlayer2Img = this.uiManager.createElement('img', 'rounded-full');
        avatarPlayer2Img.style.width = '110px';
        avatarPlayer2Img.style.height = '110px';
        if (!this.user || !this.user.avatar)
            avatarPlayer2Img.src = 'public/avatars/default.png';
        else if (this.user.avatar.startsWith('http'))
            avatarPlayer2Img.src = this.user.avatar;
        else
            avatarPlayer2Img.src = "public/avatars/".concat(this.user.avatar, ".png");
        avatarPlayer2Section.appendChild(avatarPlayer2Img);
        // Score Display
        var scoreDisplay = this.uiManager.createElement('div', 'flex gap-16 items-center retro-text');
        var player1Score = this.uiManager.createElement('div', 'text-center');
        var player1Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 1');
        player1Label.textContent = this.user ? this.user.username : 'PLAYER 1';
        var player1Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player1Score.appendChild(player1Label);
        player1Score.appendChild(player1Value);
        var vsLabel = this.uiManager.createElement('div', 'text-2xl opacity-40', 'VS');
        var player2Score = this.uiManager.createElement('div', 'text-center');
        var player2Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 2');
        var player2Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player2Score.appendChild(player2Label);
        player2Score.appendChild(player2Value);
        scoreDisplay.appendChild(avatarPlayer1Section);
        scoreDisplay.appendChild(player1Score);
        scoreDisplay.appendChild(vsLabel);
        scoreDisplay.appendChild(player2Score);
        scoreDisplay.appendChild(avatarPlayer2Section);
        // Game Canvas Container
        var canvasContainer = this.uiManager.createElement('div', 'relative');
        this.canvas = this.uiManager.createCanvas(800, 400, 'border-2 border-[#ff1493] rounded-lg bg-black shadow-[0_0_20px_#ff1493] retro-canvas');
        canvasContainer.appendChild(this.canvas);
        // Start Game Overlay
        var startOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg');
        startOverlay.setAttribute('data-overlay', 'start-game');
        var startContent = this.uiManager.createElement('div', 'text-center retro-text');
        var startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'CHOOSE YOUR OPPONENT');
        var startButtonRandom = this.uiManager.createButton('PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.playAgainstRandomPlayer(); });
        var startButtonFriend = this.uiManager.createButton('PLAY AGAINST A FRIEND', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 mt-4', function () { return _this.playAgainstFriend(); });
        startContent.appendChild(startTitle);
        startContent.appendChild(startButtonRandom);
        startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
        startContent.appendChild(startButtonFriend);
        startOverlay.appendChild(startContent);
        canvasContainer.appendChild(startOverlay);
        // Pause Game Overlay
        var pauseOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        pauseOverlay.setAttribute('data-overlay', 'pause-game');
        var pauseContent = this.uiManager.createElement('div', 'text-center retro-text');
        var pauseTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'PAUSED');
        pauseContent.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseContent);
        canvasContainer.appendChild(pauseOverlay);
        // Game Over Overlay
        var gameOverOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        gameOverOverlay.setAttribute('data-overlay', 'game-over');
        var gameOverContent = this.uiManager.createElement('div', 'text-center retro-text');
        var gameOverTitle = this.uiManager.createElement('div', 'text-4xl mb-4 text-[#ff1493]', 'GAME OVER');
        var gameOverWinner = this.uiManager.createElement('div', 'text-2xl mb-6 text-[#00ffff]', '');
        var playAgainButton = this.uiManager.createButton('PLAY AGAIN', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.requestNewGame(); });
        gameOverContent.appendChild(gameOverTitle);
        gameOverContent.appendChild(gameOverWinner);
        gameOverContent.appendChild(playAgainButton);
        gameOverOverlay.appendChild(gameOverContent);
        canvasContainer.appendChild(gameOverOverlay);
        // Controls
        var controls = this.uiManager.createElement('div', 'flex gap-12 retro-text text-sm opacity-60');
        var player1Controls = this.uiManager.createElement('div', 'text-center');
        var player1Title = this.uiManager.createElement('div', 'mb-2', 'COMMANDS');
        var player1Up = this.uiManager.createElement('div', '', 'W - UP');
        var player1Down = this.uiManager.createElement('div', '', 'S - DOWN');
        player1Controls.appendChild(player1Title);
        player1Controls.appendChild(player1Up);
        player1Controls.appendChild(player1Down);
        controls.appendChild(player1Controls);
        // Buttons Pause & Reset
        var gameControls = this.uiManager.createElement('div', 'flex gap-4');
        var pauseButton = this.uiManager.createButton('PAUSE / RESUME', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', function () { return _this.pauseGame(); });
        var resetButton = this.uiManager.createButton('RESTART', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', function () { return _this.resetGame(); });
        // Back to Menu Button
        var backButtonContainer = this.uiManager.createElement('div', 'text-center mb-8');
        var backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto mt-4', function () { return _this.backToMenu(); });
        var backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        backButtonContainer.appendChild(backButton);
        gameControls.appendChild(pauseButton);
        gameControls.appendChild(resetButton);
        // Game Container
        var gameContainer = this.uiManager.createElement('div', 'flex flex-col items-center gap-6');
        gameContainer.appendChild(scoreDisplay);
        gameContainer.appendChild(canvasContainer);
        gameContainer.appendChild(controls);
        gameContainer.appendChild(gameControls);
        // Main Bloc
        var content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-6xl');
        content.appendChild(gameContainer);
        content.appendChild(backButtonContainer);
        var container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
        // Check if there's a game to reconnect to
        this.checkForReconnection();
    };
    /**
     * Check if there's an existing game to reconnect to
     */
    RemotePage.prototype.checkForReconnection = function () {
        var _this = this;
        GameManager_js_1.GameManager.checkForReconnection(function (result) {
            if (result.hasGame) {
                console.log("[RemotePage] Found game to reconnect:", result);
                _this.showReconnectionOption(result);
            }
            else {
                console.log("[RemotePage] No game to reconnect to");
                // Just show the normal lobby (already displayed)
            }
        });
    };
    /**
     * Show option to reconnect to an existing game
     */
    RemotePage.prototype.showReconnectionOption = function (data) {
        var _this = this;
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', 'ONGOING GAME FOUND');
            // Show current score
            var scoreText = data.gameState ?
                "Score: ".concat(data.gameState.player1Score, " - ").concat(data.gameState.player2Score) :
                '';
            var scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
            var message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || 'You have an ongoing game. Would you like to reconnect?');
            var buttonsContainer = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
            var reconnectButton = this.uiManager.createButton('RECONNECT', 'retro-button bg-[#00ffff] text-black px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-transparent hover:text-[#00ffff] transition-all duration-200', function () { return _this.handleReconnect(data.gameUUID); });
            var newGameButton = this.uiManager.createButton('START NEW GAME', 'retro-button bg-transparent text-[#ff1493] px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', function () { return _this.requestNewGame(); });
            buttonsContainer.appendChild(reconnectButton);
            buttonsContainer.appendChild(newGameButton);
            content.appendChild(title);
            if (scoreText)
                content.appendChild(scoreDisplay);
            content.appendChild(message);
            content.appendChild(buttonsContainer);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    /**
     * Handle reconnection to existing game
     */
    RemotePage.prototype.handleReconnect = function (gameUUID) {
        var _this = this;
        console.log("[RemotePage] Attempting to reconnect to game:", gameUUID);
        GameManager_js_1.GameManager.reconnectToGame(gameUUID, function (result) {
            if (result.success) {
                console.log("[RemotePage] Reconnection successful:", result);
                // Set up the game manager with the reconnected game
                if (!_this.canvas)
                    throw new Error("canvas is not initialized");
                _this.gameManager = new GameManager_js_1.GameManager(_this.canvas, result.gameUUID);
                _this.gameManager.setPlayerNumber(result.playerNumber); // Set correct player number for reconnection
                _this.setupGameListeners();
                // Show ready screen
                var startOverlay = document.querySelector('[data-overlay="start-game"]');
                if (startOverlay) {
                    startOverlay.innerHTML = '';
                    var content = _this.uiManager.createElement('div', 'text-center retro-text');
                    var title = _this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', 'RECONNECTED!');
                    var scoreText = result.gameState ?
                        "Score: ".concat(result.gameState.player1Score, " - ").concat(result.gameState.player2Score) :
                        '';
                    var scoreDisplay = _this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
                    var message = _this.uiManager.createElement('div', 'text-lg mb-6 text-white', 'Both players click READY to resume the game.');
                    var readyButton = _this.uiManager.createButton('READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.setReady(); });
                    content.appendChild(title);
                    if (scoreText)
                        content.appendChild(scoreDisplay);
                    content.appendChild(message);
                    content.appendChild(readyButton);
                    startOverlay.appendChild(content);
                    startOverlay.classList.remove('hidden');
                }
            }
            else {
                console.log("[RemotePage] Reconnection failed:", result);
                // Show error and return to lobby
                var startOverlay = document.querySelector('[data-overlay="start-game"]');
                if (startOverlay) {
                    startOverlay.innerHTML = '';
                    var content = _this.uiManager.createElement('div', 'text-center retro-text');
                    var title = _this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'RECONNECTION FAILED');
                    var message = _this.uiManager.createElement('div', 'text-lg mb-6 text-white', result.message || 'Could not reconnect to the game.');
                    var backButton = _this.uiManager.createButton('BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.requestNewGame(); });
                    content.appendChild(title);
                    content.appendChild(message);
                    content.appendChild(backButton);
                    startOverlay.appendChild(content);
                    startOverlay.classList.remove('hidden');
                }
            }
        });
    };
    //////////////////////////////////////////////
    ///////////// GAME INITIALIZATION ////////////
    //////////////////////////////////////////////
    RemotePage.prototype.removeWaitingScreen = function () {
        document
            .querySelectorAll('[data-overlay="waiting-screen"]')
            .forEach(function (el) { return el.remove(); });
    };
    RemotePage.prototype.requestNewGame = function () {
        var _this = this;
        // Return to lobby - show game mode selection
        this.removeWaitingScreen();
        var gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (gameOverOverlay) {
            gameOverOverlay.classList.add('hidden');
        }
        if (startOverlay) {
            // Restore original lobby content (may have been replaced by error/disconnect screens)
            startOverlay.innerHTML = '';
            var startContent = this.uiManager.createElement('div', 'text-center retro-text');
            var startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'CHOOSE YOUR OPPONENT');
            var startButtonRandom = this.uiManager.createButton('PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.playAgainstRandomPlayer(); });
            var startButtonFriend = this.uiManager.createButton('PLAY AGAINST A FRIEND', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 mt-4', function () { return _this.playAgainstFriend(); });
            startContent.appendChild(startTitle);
            startContent.appendChild(startButtonRandom);
            startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
            startContent.appendChild(startButtonFriend);
            startOverlay.appendChild(startContent);
            startOverlay.classList.remove('hidden');
        }
        // Don't create game yet - wait for user to select mode
    };
    RemotePage.prototype.setupGame = function (data) {
        console.log("should work here in setupGame");
        if (!this.canvas)
            throw new Error("canvas is not initialised");
        this.gameManager = new GameManager_js_1.GameManager(this.canvas, data.UUID);
        this.setupGameListeners();
        console.log(data.UUID, this.gameManager);
    };
    RemotePage.prototype.setupGameListeners = function () {
        var _this = this;
        if (!this.gameManager)
            return;
        this.gameManager.addListener(function (gameState) {
            _this.updateScore(gameState.player1Score, gameState.player2Score);
            _this.updateGameState(gameState);
        });
        // Handle when matchmaking finds an opponent
        this.gameManager.setOnOpponentFound(function (data) {
            console.log("[RemotePage] Opponent found!", data);
            _this.handleOpponentFound(data);
        });
        // Handle when opponent disconnects
        this.gameManager.setOnOpponentDisconnected(function (data) {
            console.log("[RemotePage] Opponent disconnected!", data);
            _this.handleOpponentDisconnected(data);
        });
        // Handle matchmaking errors (e.g., already searching)
        this.gameManager.setOnMatchmakingError(function (data) {
            console.log("[RemotePage] Matchmaking error!", data);
            _this.handleMatchmakingError(data);
        });
        // Handle when opponent reconnects
        this.gameManager.setOnOpponentReconnected(function (data) {
            console.log("[RemotePage] Opponent reconnected!", data);
            _this.handleOpponentReconnected(data);
        });
        // Handle when reconnection times out
        this.gameManager.setOnReconnectionTimeout(function (data) {
            console.log("[RemotePage] Reconnection timeout!", data);
            _this.handleReconnectionTimeout(data);
        });
    };
    /**
     * handleOpponentFound - Called when matchmaking finds an opponent
     * Removes waiting screen and starts the ready phase
     */
    RemotePage.prototype.handleOpponentFound = function (data) {
        var _this = this;
        this.isSearchingOpponent = false;
        this.removeWaitingScreen();
        // Show ready screen (both players need to click ready)
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            // Change the overlay content to show "Opponent found! Click READY"
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', 'OPPONENT FOUND!');
            var subtitle = this.uiManager.createElement('div', 'text-lg mb-6 text-[#ff1493]', "Playing against: ".concat(data.opponentId));
            var readyButton = this.uiManager.createButton('READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.setReady(); });
            content.appendChild(title);
            content.appendChild(subtitle);
            content.appendChild(readyButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    /**
     * handleOpponentDisconnected - Called when opponent leaves the game
     * Shows options to wait for reconnection or leave
     */
    RemotePage.prototype.handleOpponentDisconnected = function (data) {
        var _this = this;
        var _a, _b;
        console.log("[RemotePage] Handling opponent disconnect", data);
        // DON'T destroy gameManager - keep listening for reconnection events
        // Remove all overlays
        this.removeWaitingScreen();
        (_a = document.querySelector('[data-overlay="game-over"]')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
        (_b = document.querySelector('[data-overlay="pause-game"]')) === null || _b === void 0 ? void 0 : _b.classList.add('hidden');
        // Show disconnect notification with wait/leave options
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'OPPONENT DISCONNECTED');
            // Show current score if available
            var scoreText = data.gameState ?
                "Current score: ".concat(data.gameState.player1Score, " - ").concat(data.gameState.player2Score) :
                '';
            var scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#00ffff]', scoreText);
            var message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.waitingForReconnection ?
                'Your opponent has disconnected. You can wait for them to reconnect or leave the game.' :
                data.message || 'Your opponent has left the game.');
            var buttonsContainer = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
            if (data.waitingForReconnection) {
                var waitMessage = this.uiManager.createElement('div', 'text-sm mb-4 text-[#9d4edd]', 'Waiting for opponent to reconnect... (2 minute timeout)');
                content.appendChild(waitMessage);
            }
            var leaveButton = this.uiManager.createButton('LEAVE GAME', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.backToLobby(); });
            buttonsContainer.appendChild(leaveButton);
            content.appendChild(title);
            if (scoreText)
                content.appendChild(scoreDisplay);
            content.appendChild(message);
            content.appendChild(buttonsContainer);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    /**
     * handleOpponentReconnected - Called when disconnected opponent returns
     * Shows ready screen for both players to resume
     */
    RemotePage.prototype.handleOpponentReconnected = function (data) {
        var _this = this;
        console.log("[RemotePage] Handling opponent reconnect", data);
        // Show ready screen
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', 'OPPONENT RECONNECTED!');
            // Show current score
            var scoreText = data.gameState ?
                "Score: ".concat(data.gameState.player1Score, " - ").concat(data.gameState.player2Score) :
                '';
            var scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
            var message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', 'Both players click READY to resume the game.');
            var readyButton = this.uiManager.createButton('READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.setReady(); });
            content.appendChild(title);
            if (scoreText)
                content.appendChild(scoreDisplay);
            content.appendChild(message);
            content.appendChild(readyButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    /**
     * handleReconnectionTimeout - Called when opponent doesn't reconnect in time
     */
    RemotePage.prototype.handleReconnectionTimeout = function (data) {
        var _this = this;
        console.log("[RemotePage] Handling reconnection timeout", data);
        // Clean up game manager now
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Show timeout notification
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'RECONNECTION TIMEOUT');
            var message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || 'Opponent did not reconnect in time. The game has ended.');
            var backButton = this.uiManager.createButton('BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.backToLobby(); });
            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(backButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    /**
     * handleMatchmakingError - Called when matchmaking fails
     * Shows error message and returns to lobby
     */
    RemotePage.prototype.handleMatchmakingError = function (data) {
        var _this = this;
        console.log("[RemotePage] Handling matchmaking error", data);
        this.isSearchingOpponent = false;
        this.removeWaitingScreen();
        // Clean up game manager since matchmaking failed
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Show error on start overlay
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            var content = this.uiManager.createElement('div', 'text-center retro-text');
            var title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'MATCHMAKING ERROR');
            var message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || 'An error occurred while searching for an opponent.');
            var backButton = this.uiManager.createButton('BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () { return _this.backToLobby(); });
            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(backButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    };
    //////////////////////////////////////////
    ///////////// UPDATES ////////////////////
    //////////////////////////////////////////
    RemotePage.prototype.updateScore = function (player1Score, player2Score) {
        var player1Element = document.querySelector('.text-4xl.tracking-wider');
        var player2Element = document.querySelectorAll('.text-4xl.tracking-wider')[1];
        if (player1Element) {
            player1Element.textContent = player1Score.toString().padStart(2, '0');
        }
        if (player2Element) {
            player2Element.textContent = player2Score.toString().padStart(2, '0');
        }
    };
    RemotePage.prototype.updateGameState = function (gameState) {
        var _a, _b, _c;
        var startOverlay = document.querySelector('[data-overlay="start-game"]');
        var pauseOverlay = document.querySelector('[data-overlay="pause-game"]');
        var gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
        var isGameOver = gameState.player1Score >= 10 || gameState.player2Score >= 10;
        var winner = isGameOver ? (gameState.player1Score >= 10 ? 'Player 1' : 'Player 2') : null;
        var isPaused = this.gameManager ? this.gameManager.getIsPaused() : false;
        // For waiting screen
        if (this.isSearchingOpponent) {
            startOverlay === null || startOverlay === void 0 ? void 0 : startOverlay.classList.add('hidden');
            pauseOverlay === null || pauseOverlay === void 0 ? void 0 : pauseOverlay.classList.add('hidden');
            gameOverOverlay === null || gameOverOverlay === void 0 ? void 0 : gameOverOverlay.classList.add('hidden');
            return;
        }
        // Screen at the start of the game
        if (!((_a = this.gameManager) === null || _a === void 0 ? void 0 : _a.getHasStarted())) {
            if (startOverlay)
                startOverlay.classList.remove('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            if (gameOverOverlay)
                gameOverOverlay.classList.add('hidden');
            return;
        }
        // Screen when the game is running
        else if (gameState.gameRunning) {
            if (startOverlay)
                startOverlay.classList.add('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            if (gameOverOverlay)
                gameOverOverlay.classList.add('hidden');
            return;
        }
        // Screen when the game is paused
        else if (isPaused) {
            if (pauseOverlay)
                pauseOverlay.classList.remove('hidden');
            if (startOverlay)
                startOverlay.classList.add('hidden');
            if (gameOverOverlay)
                gameOverOverlay.classList.add('hidden');
            return;
        }
        // Screen when the game is over
        else if (isGameOver && winner) {
            // Get player number before destroying gameManager
            var playerNum = (_c = (_b = this.gameManager) === null || _b === void 0 ? void 0 : _b.getPlayerNumber()) !== null && _c !== void 0 ? _c : 1;
            if (this.gameManager) {
                this.gameManager.destroy();
                this.gameManager = null;
            }
            if (gameOverOverlay) {
                // Update game over content to return to lobby instead of playing again
                var winnerText = gameOverOverlay.querySelector('.text-2xl');
                if (winnerText) {
                    winnerText.textContent = winner === 'Player 1' ?
                        (playerNum === 1 ? 'YOU WIN!' : 'YOU LOSE!') :
                        (playerNum === 2 ? 'YOU WIN!' : 'YOU LOSE!');
                }
                var playAgainBtn = gameOverOverlay.querySelector('button');
                if (playAgainBtn) {
                    playAgainBtn.textContent = 'RETURN TO LOBBY';
                }
                gameOverOverlay.classList.remove('hidden');
            }
            if (startOverlay)
                startOverlay.classList.add('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            return;
        }
    };
    //////////////////////////////////////////
    ///////////// GAME FUNCTIONS ////////////
    //////////////////////////////////////////
    RemotePage.prototype.setReady = function () {
        if (!this.gameManager)
            return;
        var wasPaused = this.gameManager.getIsPaused();
        // Pass true for remote games - each player marks only themselves ready
        this.gameManager.setReady(true);
        if (!wasPaused) {
            var startOverlay = document.querySelector('[data-overlay="start-game"]');
            if (startOverlay)
                startOverlay.classList.add('hidden');
        }
    };
    RemotePage.prototype.pauseGame = function () {
        if (!this.gameManager)
            return;
        if (!this.gameManager.getIsPaused() && !this.gameManager.getGameState().gameRunning)
            return;
        if (this.gameManager.getIsPaused())
            this.gameManager.resumeGame();
        else
            this.gameManager.pauseGame();
    };
    RemotePage.prototype.backToMenu = function () {
        // Cancel matchmaking if searching
        if (this.isSearchingOpponent && this.gameManager) {
            this.gameManager.cancelSearch();
            this.isSearchingOpponent = false;
        }
        // Destroy game and return to main menu
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        this.onBack();
    };
    RemotePage.prototype.backToLobby = function () {
        // Cancel matchmaking if searching
        if (this.isSearchingOpponent && this.gameManager) {
            this.gameManager.cancelSearch();
            this.isSearchingOpponent = false;
        }
        // Destroy current game
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Return to lobby (show game mode selection)
        this.requestNewGame();
    };
    RemotePage.prototype.resetGame = function () {
        if (!this.gameManager)
            return;
        if (!this.gameManager.getGameState().gameRunning)
            return;
        this.gameManager.resetGame();
    };
    //////////////////////////////////////////////
    ///////////// OPTIONS GAME ///////////////////
    //////////////////////////////////////////////
    RemotePage.prototype.playAgainstRandomPlayer = function () {
        var _this = this;
        // Create new game if needed
        if (!this.gameManager) {
            GameManager_js_1.GameManager.requestGameID("remote");
            // Wait for setupGame to be called, then start matchmaking
            setTimeout(function () {
                if (!_this.gameManager)
                    return;
                _this.playAgainstRandomPlayer(); // Retry after game is created
            }, 100);
            return;
        }
        this.startMatchmaking();
    };
    RemotePage.prototype.startMatchmaking = function () {
        var _this = this;
        var _a, _b;
        if (!this.gameManager)
            return;
        this.isSearchingOpponent = true;
        (_a = document.querySelector('[data-overlay="start-game"]')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
        this.removeWaitingScreen();
        var WaitingScreen = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-10');
        WaitingScreen.setAttribute('data-overlay', 'waiting-screen');
        var WaitingScreenContent = this.uiManager.createElement('div', 'text-center retro-text');
        var WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'WAITING FOR AN OPPONENT...');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        var cancelButton = this.uiManager.createButton('CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', function () {
            var _a, _b;
            // Cancel matchmaking search
            (_a = _this.gameManager) === null || _a === void 0 ? void 0 : _a.cancelSearch();
            _this.removeWaitingScreen();
            _this.isSearchingOpponent = false;
            (_b = document.querySelector('[data-overlay="start-game"]')) === null || _b === void 0 ? void 0 : _b.classList.remove('hidden');
        });
        WaitingScreenContent.appendChild(cancelButton);
        WaitingScreen.appendChild(WaitingScreenContent);
        var canvasContainer = (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.parentElement;
        if (canvasContainer)
            canvasContainer.appendChild(WaitingScreen);
        else
            this.uiManager.container.appendChild(WaitingScreen);
        // IMPORTANT: Tell server to start searching for opponent!
        this.gameManager.searchForRandomOpponent();
    };
    RemotePage.prototype.playAgainstFriend = function () {
        var _this = this;
        var _a, _b;
        // Create new game if needed
        if (!this.gameManager) {
            GameManager_js_1.GameManager.requestGameID("remote");
            // Wait for setupGame to be called, then show friend selection
            setTimeout(function () {
                if (!_this.gameManager)
                    return;
                _this.playAgainstFriend(); // Retry after game is created
            }, 100);
            return;
        }
        this.isSearchingOpponent = true;
        (_a = document.querySelector('[data-overlay="start-game"]')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
        this.removeWaitingScreen();
        // Invite text and overlay
        var WaitingScreen = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-10');
        WaitingScreen.setAttribute('data-overlay', 'waiting-screen');
        var WaitingScreenContent = this.uiManager.createElement('div', 'text-center retro-text');
        var WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'INVITE A FRIEND');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        // Friends List
        var friendsList = this.uiManager.createElement('div', 'flex gap-4 justify-center');
        var selectedLabel = this.uiManager.createElement('div', 'retro-text text-xs opacity-60 mb-2', 'Select a friend');
        var friends = [
            { id: 'friend1', name: 'Friend 1' },
            { id: 'friend2', name: 'Friend 2' },
            { id: 'friend3', name: 'Friend 3' },
        ];
        var friendEls = [];
        var updateSelectionUI = function () {
            var _a, _b;
            friendEls.forEach(function (el) {
                var id = el.getAttribute('data-friend-id');
                var isSelected = id && id === _this.selectedFriendId;
                el.classList.toggle('border-[#00ffff]', !!isSelected);
                el.classList.toggle('border-[#ff1493]', !isSelected);
            });
            selectedLabel.textContent = _this.selectedFriendId
                ? "Selected: ".concat((_b = (_a = friends.find(function (f) { return f.id === _this.selectedFriendId; })) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : _this.selectedFriendId)
                : 'Select a friend';
        };
        friends.forEach(function (f) {
            var friendEl = _this.uiManager.createElement('button', 'cursor-pointer px-4 py-2 rounded border-2 border-[#ff1493] bg-black/40 hover:bg-black/60 transition-all duration-200', f.name);
            friendEl.type = 'button';
            friendEl.setAttribute('data-friend-id', f.id);
            friendEl.addEventListener('click', function () {
                _this.selectedFriendId = _this.selectedFriendId === f.id ? null : f.id;
                updateSelectionUI();
            });
            friendEls.push(friendEl);
            friendsList.appendChild(friendEl);
        });
        WaitingScreenContent.appendChild(selectedLabel);
        WaitingScreenContent.appendChild(friendsList);
        // Space between list and buttons + stack buttons vertically
        WaitingScreenContent.appendChild(this.uiManager.createElement('div', 'h-4'));
        var buttonsWrapper = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
        // Invite Button
        var inviteButton = this.uiManager.createButton('INVITE', 'retro-button bg-[#ff1493] text-black px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', function () {
            // TODO: Implement invite friend functionality
            // Example: use this.selectedFriendId
            if (!_this.selectedFriendId) {
                selectedLabel.textContent = 'Select a friend first';
                return;
            }
        });
        buttonsWrapper.appendChild(inviteButton);
        // Cancel Button
        var cancelButton = this.uiManager.createButton('CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', function () {
            var _a;
            _this.removeWaitingScreen();
            _this.isSearchingOpponent = false;
            (_a = document.querySelector('[data-overlay="start-game"]')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
        });
        buttonsWrapper.appendChild(cancelButton);
        WaitingScreenContent.appendChild(buttonsWrapper);
        WaitingScreen.appendChild(WaitingScreenContent);
        var canvasContainer = (_b = this.canvas) === null || _b === void 0 ? void 0 : _b.parentElement;
        if (canvasContainer)
            canvasContainer.appendChild(WaitingScreen);
        else
            this.uiManager.container.appendChild(WaitingScreen);
    };
    return RemotePage;
}());
exports.RemotePage = RemotePage;
