import { GameManager } from '../modules/GameManager.js';
import { gameSocket } from '../app.js';
import { Logger } from '../modules/Logger.js';
export class RemotePage {
    constructor(uiManager, languageManager, onBack, user) {
        this.gameManager = null;
        this.canvas = null;
        this.user = null;
        this.isSearchingOpponent = false;
        this.selectedFriendId = null;
        this.avatarPlayer1ImgEl = null;
        this.avatarPlayer2ImgEl = null;
        this.player1LabelEl = null;
        this.player2LabelEl = null;
        this._waitingForInviteDeclinedListener = null;
        this.uiManager = uiManager;
        this.languageManager = languageManager;
        this.onBack = onBack;
        this.user = user ?? null;
    }
    t(key, replacements) {
        let text = this.languageManager.t(key) || key;
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                text = text.replace(`{${k}}`, v);
            }
        }
        return text;
    }
    ///////////// DESIGN & RENDERING /////////////
    render(user, routeData) {
        if (user !== undefined) {
            this.user = user;
        }
        // Avatars
        const avatarPlayer1Section = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const avatarPlayer1Img = this.uiManager.createElement('img', 'rounded-full');
        avatarPlayer1Img.style.width = '110px';
        avatarPlayer1Img.style.height = '110px';
        if (!this.user || !this.user.avatar)
            avatarPlayer1Img.src = 'public/avatars/default.png';
        else if (this.user.avatar.startsWith('http'))
            avatarPlayer1Img.src = this.user.avatar;
        else
            avatarPlayer1Img.src = `public/avatars/${this.user.avatar}.png`;
        avatarPlayer1Section.appendChild(avatarPlayer1Img);
        const avatarPlayer2Section = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const avatarPlayer2Img = this.uiManager.createElement('img', 'rounded-full');
        avatarPlayer2Img.style.width = '110px';
        avatarPlayer2Img.style.height = '110px';
        avatarPlayer2Img.src = 'public/avatars/unknownPlayer.jpeg';
        avatarPlayer2Section.appendChild(avatarPlayer2Img);
        // Keep references so we can update after matchmaking
        this.avatarPlayer1ImgEl = avatarPlayer1Img;
        this.avatarPlayer2ImgEl = avatarPlayer2Img;
        // Score Display
        const scoreDisplay = this.uiManager.createElement('div', 'flex gap-16 items-center retro-text');
        const player1Score = this.uiManager.createElement('div', 'text-center');
        const player1Label = this.uiManager.createElement('div', 'text-lg opacity-60', this.t('player1') || 'PLAYER 1');
        player1Label.textContent = this.user ? this.user.username : (this.t('player1') || 'PLAYER 1');
        const player1Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player1Score.appendChild(player1Label);
        player1Score.appendChild(player1Value);
        const vsLabel = this.uiManager.createElement('div', 'text-2xl opacity-40', this.t('vs') || 'VS');
        const player2Score = this.uiManager.createElement('div', 'text-center');
        const player2Label = this.uiManager.createElement('div', 'text-lg opacity-60', this.t('unknownPlayer') || '???');
        const player2Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player2Score.appendChild(player2Label);
        player2Score.appendChild(player2Value);
        this.player1LabelEl = player1Label;
        this.player2LabelEl = player2Label;
        scoreDisplay.appendChild(avatarPlayer1Section);
        scoreDisplay.appendChild(player1Score);
        scoreDisplay.appendChild(vsLabel);
        scoreDisplay.appendChild(player2Score);
        scoreDisplay.appendChild(avatarPlayer2Section);
        // Game Canvas Container
        const canvasContainer = this.uiManager.createElement('div', 'relative');
        this.canvas = this.uiManager.createCanvas(800, 400, 'border-2 border-[#ff1493] rounded-lg bg-black shadow-[0_0_20px_#ff1493] retro-canvas');
        canvasContainer.appendChild(this.canvas);
        // Start Game Overlay
        const startOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg');
        startOverlay.setAttribute('data-overlay', 'start-game');
        const startContent = this.uiManager.createElement('div', 'text-center retro-text');
        const startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('chooseOpponent') || 'CHOOSE YOUR OPPONENT');
        const startButtonRandom = this.uiManager.createButton(this.t('playAgainstRandom') || 'PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.playAgainstRandomPlayer());
        startContent.appendChild(startTitle);
        startContent.appendChild(startButtonRandom);
        startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
        startOverlay.appendChild(startContent);
        canvasContainer.appendChild(startOverlay);
        // Pause Game Overlay
        const pauseOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        pauseOverlay.setAttribute('data-overlay', 'pause-game');
        const pauseContent = this.uiManager.createElement('div', 'text-center retro-text');
        const pauseTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('paused') || 'PAUSED');
        pauseContent.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseContent);
        canvasContainer.appendChild(pauseOverlay);
        // Game Over Overlay
        const gameOverOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        gameOverOverlay.setAttribute('data-overlay', 'game-over');
        const gameOverContent = this.uiManager.createElement('div', 'text-center retro-text');
        const gameOverTitle = this.uiManager.createElement('div', 'text-4xl mb-4 text-[#ff1493]', this.t('gameOver') || 'GAME OVER');
        const gameOverWinner = this.uiManager.createElement('div', 'text-2xl mb-6 text-[#00ffff]', '');
        const playAgainButton = this.uiManager.createButton(this.t('playAgain') || 'PLAY AGAIN', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.requestNewGame());
        gameOverContent.appendChild(gameOverTitle);
        gameOverContent.appendChild(gameOverWinner);
        gameOverContent.appendChild(playAgainButton);
        gameOverOverlay.appendChild(gameOverContent);
        canvasContainer.appendChild(gameOverOverlay);
        // Controls
        const controls = this.uiManager.createElement('div', 'flex gap-12 retro-text text-sm opacity-60');
        const player1Controls = this.uiManager.createElement('div', 'text-center');
        const player1Title = this.uiManager.createElement('div', 'mb-2', this.t('commands') || 'COMMANDS');
        const player1Up = this.uiManager.createElement('div', '', this.t('wUp') || 'W - UP');
        const player1Down = this.uiManager.createElement('div', '', this.t('sDown') || 'S - DOWN');
        player1Controls.appendChild(player1Title);
        player1Controls.appendChild(player1Up);
        player1Controls.appendChild(player1Down);
        controls.appendChild(player1Controls);
        // Buttons Pause & Reset
        const gameControls = this.uiManager.createElement('div', 'flex gap-4');
        const pauseButton = this.uiManager.createButton(this.t('pauseResume') || 'PAUSE / RESUME', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', () => this.pauseGame());
        // const resetButton = this.uiManager.createButton(
        //  'RESTART',
        //  'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200',
        //  () => this.resetGame()
        // );
        // Back to Menu Button
        const backButtonContainer = this.uiManager.createElement('div', 'text-center mb-8');
        const backButton = this.uiManager.createButton(this.t('backToMenu') || 'BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto mt-4', () => this.backToMenu());
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        backButtonContainer.appendChild(backButton);
        gameControls.appendChild(pauseButton);
        //gameControls.appendChild(resetButton);
        // Game Container
        const gameContainer = this.uiManager.createElement('div', 'flex flex-col items-center gap-6');
        gameContainer.appendChild(scoreDisplay);
        gameContainer.appendChild(canvasContainer);
        gameContainer.appendChild(controls);
        gameContainer.appendChild(gameControls);
        // Main Bloc
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-6xl');
        content.appendChild(gameContainer);
        content.appendChild(backButtonContainer);
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
        if (routeData?.joinGameUUID) {
            this.joinGameByInvite(routeData.joinGameUUID);
            return;
        }
        // Check if there's a game to reconnect to
        this.checkForReconnection();
    }
    /** Join an existing game by invite (player 2): emit join-game, server adds us and emits opponent-found */
    joinGameByInvite(gameUUID) {
        if (!this.canvas || !gameSocket)
            return;
        if (typeof window.DEBUG_INVITE !== 'undefined' && window.DEBUG_INVITE) {
            console.log('[INVITE_JOIN]', { gameUUID });
        }
        this.gameManager = new GameManager(this.canvas, gameUUID);
        this.setupGameListeners();
        gameSocket.emit('join-game', { UUID: gameUUID });
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            content.appendChild(this.uiManager.createElement('div', 'text-lg text-[#00ffff]', this.t('joiningGame') || 'Joining game...'));
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    }
    /**
     * Check if there's an existing game to reconnect to
     */
    checkForReconnection() {
        GameManager.checkForReconnection((result) => {
            if (result.hasGame) {
                console.log("[RemotePage] Found game to reconnect:", result);
                this.showReconnectionOption(result);
            }
            else {
                console.log("[RemotePage] No game to reconnect to");
                // Just show the normal lobby (already displayed)
            }
        });
    }
    /**
     * Show option to reconnect to an existing game
     */
    showReconnectionOption(data) {
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', this.t('ongoingGameFound') || 'ONGOING GAME FOUND');
            // Show current score
            const scoreLabel = this.t('scoreLabel') || 'Score:';
            const scoreText = data.gameState ?
                `${scoreLabel} ${data.gameState.player1Score} - ${data.gameState.player2Score}` :
                '';
            const scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || this.t('reconnectPrompt') || 'You have an ongoing game. Would you like to reconnect?');
            const buttonsContainer = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
            const reconnectButton = this.uiManager.createButton(this.t('reconnect') || 'RECONNECT', 'retro-button bg-[#00ffff] text-black px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-transparent hover:text-[#00ffff] transition-all duration-200', () => this.handleReconnect(data.gameUUID));
            const newGameButton = this.uiManager.createButton(this.t('startNewGame') || 'START NEW GAME', 'retro-button bg-transparent text-[#ff1493] px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => this.rejectReconnection(data.gameUUID));
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
    }
    /**
     * Handle reconnection to existing game
     */
    handleReconnect(gameUUID) {
        console.log("[RemotePage] Attempting to reconnect to game:", gameUUID);
        GameManager.reconnectToGame(gameUUID, (result) => {
            if (result.success) {
                console.log("[RemotePage] Reconnection successful:", result);
                // Set up the game manager with the reconnected game
                if (!this.canvas) {
                    console.info('[GameRemotePage]', 'Canvas not initialized');
                    return;
                }
                this.gameManager = new GameManager(this.canvas, result.gameUUID);
                this.gameManager.setPlayerNumber(result.playerNumber); // Set correct player number for reconnection
                this.setupGameListeners();
                // Update opponent display with info from reconnection response
                // The opponent info is always displayed on the right side (player 2 labels)
                console.log("[RemotePage] Reconnection result:", result);
                console.log("[RemotePage] opponentUsername:", result.opponentUsername, "opponentAvatar:", result.opponentAvatar);
                if (result.opponentUsername || result.opponentAvatar) {
                    const opponentUsername = result.opponentUsername || (this.t('player2') || 'Player 2');
                    const opponentAvatarSrc = this.resolveAvatarSrc(result.opponentAvatar || null);
                    console.log("[RemotePage] Setting opponent display - username:", opponentUsername, "avatar:", opponentAvatarSrc);
                    console.log("[RemotePage] player2LabelEl exists:", !!this.player2LabelEl, "avatarPlayer2ImgEl exists:", !!this.avatarPlayer2ImgEl);
                    if (this.player2LabelEl) {
                        this.player2LabelEl.textContent = opponentUsername;
                        console.log("[RemotePage] Updated player2Label");
                    }
                    else {
                        Logger.warn("[RemotePage] player2LabelEl not found!");
                    }
                    if (this.avatarPlayer2ImgEl) {
                        this.avatarPlayer2ImgEl.src = opponentAvatarSrc;
                        console.log("[RemotePage] Updated avatarPlayer2Img");
                    }
                    else {
                        Logger.warn("[RemotePage] avatarPlayer2ImgEl not found!");
                    }
                }
                else {
                    Logger.warn("[RemotePage] No opponent info in reconnection response!");
                }
                // Show ready screen
                const startOverlay = document.querySelector('[data-overlay="start-game"]');
                if (startOverlay) {
                    startOverlay.innerHTML = '';
                    const content = this.uiManager.createElement('div', 'text-center retro-text');
                    const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', this.t('reconnected') || 'RECONNECTED!');
                    const scoreLabel = this.t('scoreLabel') || 'Score:';
                    const scoreText = result.gameState ?
                        `${scoreLabel} ${result.gameState.player1Score} - ${result.gameState.player2Score}` :
                        '';
                    const scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
                    const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', this.t('clickReadyToResume') || 'Both players click READY to resume the game.');
                    const readyButton = this.uiManager.createButton(this.t('ready') || 'READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.setReady());
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
                const startOverlay = document.querySelector('[data-overlay="start-game"]');
                if (startOverlay) {
                    startOverlay.innerHTML = '';
                    const content = this.uiManager.createElement('div', 'text-center retro-text');
                    const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', this.t('reconnectionFailed') || 'RECONNECTION FAILED');
                    const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', result.message || this.t('couldNotReconnect') || 'Could not reconnect to the game.');
                    const backButton = this.uiManager.createButton(this.t('backToLobby') || 'BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.requestNewGame());
                    content.appendChild(title);
                    content.appendChild(message);
                    content.appendChild(backButton);
                    startOverlay.appendChild(content);
                    startOverlay.classList.remove('hidden');
                }
            }
        });
    }
    //////////////////////////////////////////////
    ///////////// GAME INITIALIZATION ////////////
    //////////////////////////////////////////////
    removeWaitingScreen() {
        document
            .querySelectorAll('[data-overlay="waiting-screen"]')
            .forEach((el) => el.remove());
    }
    clearWaitingForInviteListener() {
        if (this._waitingForInviteDeclinedListener) {
            window.removeEventListener('game-invite-declined', this._waitingForInviteDeclinedListener);
            this._waitingForInviteDeclinedListener = null;
        }
    }
    /** Called when A has sent an invite from live chat: show "Waiting for [username]..." and listen for decline */
    setWaitingForInviteResponse(_friendId, username) {
        this.clearWaitingForInviteListener();
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (!startOverlay)
            return;
        startOverlay.innerHTML = '';
        const content = this.uiManager.createElement('div', 'text-center retro-text');
        const title = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('waitingForOpponent') || 'WAITING FOR OPPONENT');
        const subtitleText = username ? this.t('waitingForUserAccept', { username }) : this.t('waitingForAccept') || 'Waiting for opponent to accept...';
        const subtitle = this.uiManager.createElement('div', 'text-lg mb-6 text-[#00ffff]', subtitleText);
        const cancelBtn = this.uiManager.createButton(this.t('cancel') || 'CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => {
            this.clearWaitingForInviteListener();
            this.requestNewGame();
        });
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(cancelBtn);
        startOverlay.appendChild(content);
        startOverlay.classList.remove('hidden');
        startOverlay.style.display = '';
        this._waitingForInviteDeclinedListener = () => {
            this.clearWaitingForInviteListener();
            this.showInviteDeclined();
        };
        window.addEventListener('game-invite-declined', this._waitingForInviteDeclinedListener);
    }
    /** Show "Invite declined" and offer "Play Against Random Player?" */
    showInviteDeclined() {
        this.clearWaitingForInviteListener();
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (!startOverlay)
            return;
        startOverlay.innerHTML = '';
        const content = this.uiManager.createElement('div', 'text-center retro-text');
        const title = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff6b6b]', this.t('inviteDeclinedTitle') || 'INVITE DECLINED');
        const subtitle = this.uiManager.createElement('div', 'text-lg mb-6 text-white', this.t('inviteDeclinedMsg') || 'Your invite was declined.');
        const randomBtn = this.uiManager.createButton(this.t('playAgainstRandom') || 'PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.playAgainstRandomPlayer());
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(randomBtn);
        startOverlay.appendChild(content);
        startOverlay.classList.remove('hidden');
        startOverlay.style.display = '';
    }
    /**
     * Reject reconnection and notify server so other player is informed
     */
    rejectReconnection(gameUID) {
        console.log("[RemotePage] User rejected reconnection, notifying server for game:", gameUID);
        // Notify server that this player is rejecting reconnection
        if (gameSocket) {
            gameSocket.emit(gameUID, { action: 'reject-reconnection' });
        }
        // Show lobby
        this.requestNewGame();
    }
    requestNewGame() {
        // Return to lobby - show game mode selection
        this.clearWaitingForInviteListener();
        this.removeWaitingScreen();
        const gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (gameOverOverlay) {
            gameOverOverlay.classList.add('hidden');
        }
        if (startOverlay) {
            // Restore original lobby content (may have been replaced by error/disconnect screens)
            startOverlay.innerHTML = '';
            const startContent = this.uiManager.createElement('div', 'text-center retro-text');
            const startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('chooseOpponent') || 'CHOOSE YOUR OPPONENT');
            const startButtonRandom = this.uiManager.createButton(this.t('playAgainstRandom') || 'PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.playAgainstRandomPlayer());
            startContent.appendChild(startTitle);
            startContent.appendChild(startButtonRandom);
            startOverlay.appendChild(startContent);
            startOverlay.classList.remove('hidden');
            startOverlay.style.display = ''; // Clear inline display:none from countdown/pause
        }
        // Don't create game yet - wait for user to select mode
    }
    setupGame(data) {
        console.log("should work here in setupGame");
        if (!this.canvas) {
            console.info('[GameRemotePage]', 'Canvas not initialised');
            return;
        }
        this.gameManager = new GameManager(this.canvas, data.UUID);
        this.setupGameListeners();
        console.log(data.UUID, this.gameManager);
    }
    setupGameListeners() {
        if (!this.gameManager)
            return;
        console.log("[RemotePage] Setting up game listeners");
        this.gameManager.addListener((gameState) => {
            this.updateScore(gameState.player1Score, gameState.player2Score);
            this.updateGameState(gameState);
        });
        // Handle when matchmaking finds an opponent
        this.gameManager.setOnOpponentFound((data) => {
            console.log("[RemotePage] Opponent found callback triggered!", data);
            this.handleOpponentFound(data);
        });
        // Handle when opponent disconnects
        this.gameManager.setOnOpponentDisconnected((data) => {
            console.log("[RemotePage] Opponent disconnected callback triggered!", data);
            this.handleOpponentDisconnected(data);
        });
        // Handle matchmaking errors (e.g., already searching)
        this.gameManager.setOnMatchmakingError((data) => {
            console.log("[RemotePage] Matchmaking failed", data);
            this.handleMatchmakingError(data);
        });
        // Handle when opponent reconnects
        this.gameManager.setOnOpponentReconnected((data) => {
            console.log("[RemotePage] Opponent reconnected!", data);
            this.handleOpponentReconnected(data);
        });
        // Handle when reconnection times out
        this.gameManager.setOnReconnectionTimeout((data) => {
            console.log("[RemotePage] Reconnection timeout!", data);
            this.handleReconnectionTimeout(data);
        });
        // Handle when opponent abandons the game (starts new game instead of reconnecting)
        this.gameManager.setOnOpponentAbandoned((data) => {
            console.log("[RemotePage] Opponent abandoned!", data);
            this.handleOpponentAbandoned(data);
        });
        // Handle countdown start - hide overlays so countdown is visible
        this.gameManager.setOnCountdownStart(() => {
            console.log("[RemotePage] Countdown started - FORCE hiding ALL overlays");
            // Remove waiting screen if any
            this.removeWaitingScreen();
            // Hide ALL possible overlays using BOTH class and inline style
            const startOverlay = document.querySelector('[data-overlay="start-game"]');
            const pauseOverlay = document.querySelector('[data-overlay="pause-game"]');
            const gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
            // Log all overlays for debugging
            const allOverlays = document.querySelectorAll('[data-overlay]');
            console.log("[RemotePage] All overlays found:", allOverlays.length);
            allOverlays.forEach((el, i) => {
                const htmlEl = el;
                console.log(`[RemotePage] Overlay ${i}: ${htmlEl.getAttribute('data-overlay')}, display: ${getComputedStyle(htmlEl).display}`);
            });
            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
                console.log("[RemotePage] startOverlay hidden with display:none");
            }
            if (pauseOverlay) {
                pauseOverlay.classList.add('hidden');
                pauseOverlay.style.display = 'none';
            }
            if (gameOverOverlay) {
                gameOverOverlay.classList.add('hidden');
                gameOverOverlay.style.display = 'none';
            }
            // Also hide ANY remaining overlay elements
            allOverlays.forEach((el) => {
                const htmlEl = el;
                htmlEl.classList.add('hidden');
                htmlEl.style.display = 'none';
            });
        });
    }
    /**
     * handleOpponentFound - Called when matchmaking finds an opponent
     * Removes waiting screen and starts the ready phase
     */
    handleOpponentFound(data) {
        this.isSearchingOpponent = false;
        this.clearWaitingForInviteListener();
        this.removeWaitingScreen();
        // Update avatars and usernames (server sends yourAvatar/yourUsername to both players so we show our own avatar even if this.user wasn't set)
        const myUsername = data?.yourUsername ?? this.user?.username ?? 'Guest';
        const opponentUsername = data?.opponentUsername ?? (this.t('player2') || 'Player 2');
        const myAvatarSrc = this.resolveAvatarSrc(data?.yourAvatar ?? this.user?.avatar ?? null);
        const opponentAvatarSrc = this.resolveAvatarSrc(data?.opponentAvatar ?? null);
        if (this.player1LabelEl)
            this.player1LabelEl.textContent = myUsername;
        if (this.avatarPlayer1ImgEl)
            this.avatarPlayer1ImgEl.src = myAvatarSrc;
        if (this.player2LabelEl)
            this.player2LabelEl.textContent = opponentUsername;
        if (this.avatarPlayer2ImgEl)
            this.avatarPlayer2ImgEl.src = opponentAvatarSrc;
        // Show ready screen (both players need to click ready)
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            // Change the overlay content to show "Opponent found! Click READY"
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', this.t('opponentFound') || 'OPPONENT FOUND!');
            const subtitle = this.uiManager.createElement('div', 'text-lg mb-6 text-[#ff1493]', this.t('playingAgainst', { username: opponentUsername }) || `Playing against: ${opponentUsername}`);
            const readyButton = this.uiManager.createButton(this.t('ready') || 'READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.setReady());
            content.appendChild(title);
            content.appendChild(subtitle);
            content.appendChild(readyButton);
            startOverlay.appendChild(content);
            // Show overlay - clear any inline styles and remove hidden class
            startOverlay.style.display = '';
            startOverlay.classList.remove('hidden');
        }
    }
    resolveAvatarSrc(avatar) {
        const v = (avatar != null && typeof avatar === 'string') ? avatar.trim() : '';
        if (!v)
            return 'public/avatars/unknownPlayer.jpeg';
        if (v.startsWith('http'))
            return v;
        // Avoid double extension when backend returns "default.png" or "avatar1.png"
        const hasExtension = /\.(png|jpe?g|gif|webp)$/i.test(v);
        return hasExtension ? `public/avatars/${v}` : `public/avatars/${v}.png`;
    }
    /**
     * handleOpponentDisconnected - Called when opponent leaves the game
     * Shows options to wait for reconnection or leave
     */
    handleOpponentDisconnected(data) {
        console.log("[RemotePage] Handling opponent disconnect", data);
        // DON'T destroy gameManager - keep listening for reconnection events
        // Remove all overlays
        this.removeWaitingScreen();
        document.querySelector('[data-overlay="game-over"]')?.classList.add('hidden');
        document.querySelector('[data-overlay="pause-game"]')?.classList.add('hidden');
        // Show disconnect notification with wait/leave options
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', this.t('opponentDisconnected') || 'OPPONENT DISCONNECTED');
            // Show current score if available
            const scoreLabel = this.t('scoreLabel') || 'Score:';
            const scoreText = data.gameState ?
                `${scoreLabel} ${data.gameState.player1Score} - ${data.gameState.player2Score}` :
                '';
            const scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#00ffff]', scoreText);
            const messageText = data.waitingForReconnection ?
                (this.t('waitForReconnectMsg') || 'Your opponent has disconnected. You can wait for them to reconnect or leave the game.') :
                (data.message || this.t('opponentLeft') || 'Your opponent has left the game.');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', messageText);
            const buttonsContainer = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
            if (data.waitingForReconnection) {
                const waitMessage = this.uiManager.createElement('div', 'text-sm mb-4 text-[#9d4edd]', this.t('waitingReconnectTimeout') || 'Waiting for opponent to reconnect... (2 minute timeout)');
                content.appendChild(waitMessage);
            }
            const leaveButton = this.uiManager.createButton(this.t('leaveGame') || 'LEAVE GAME', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
            buttonsContainer.appendChild(leaveButton);
            content.appendChild(title);
            if (scoreText)
                content.appendChild(scoreDisplay);
            content.appendChild(message);
            content.appendChild(buttonsContainer);
            startOverlay.appendChild(content);
            // Show overlay - clear any inline styles and remove hidden class
            startOverlay.style.display = '';
            startOverlay.classList.remove('hidden');
            console.log("[RemotePage] Showing disconnect overlay");
        }
    }
    /**
     * handleOpponentReconnected - Called when disconnected opponent returns
     * Shows ready screen for both players to resume
     */
    handleOpponentReconnected(data) {
        console.log("[RemotePage] Handling opponent reconnect", data);
        // Update opponent display with their info
        if (data.opponentUsername || data.opponentAvatar) {
            const opponentUsername = data.opponentUsername || (this.t('player2') || 'Player 2');
            const opponentAvatarSrc = this.resolveAvatarSrc(data.opponentAvatar || null);
            // Update opponent info (player 2 is always on the right side visually)
            if (this.player2LabelEl)
                this.player2LabelEl.textContent = opponentUsername;
            if (this.avatarPlayer2ImgEl)
                this.avatarPlayer2ImgEl.src = opponentAvatarSrc;
            console.log("[RemotePage] Updated opponent display:", opponentUsername);
        }
        // Show ready screen
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', this.t('reconnected') || 'OPPONENT RECONNECTED!');
            // Show current score
            const scoreLabel = this.t('scoreLabel') || 'Score:';
            const scoreText = data.gameState ?
                `${scoreLabel} ${data.gameState.player1Score} - ${data.gameState.player2Score}` :
                '';
            const scoreDisplay = this.uiManager.createElement('div', 'text-lg mb-2 text-[#ff1493]', scoreText);
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', this.t('clickReadyToResume') || 'Both players click READY to resume the game.');
            const readyButton = this.uiManager.createButton(this.t('ready') || 'READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.setReady());
            content.appendChild(title);
            if (scoreText)
                content.appendChild(scoreDisplay);
            content.appendChild(message);
            content.appendChild(readyButton);
            startOverlay.appendChild(content);
            // Show overlay - clear any inline styles and remove hidden class
            startOverlay.style.display = '';
            startOverlay.classList.remove('hidden');
            console.log("[RemotePage] Showing reconnect overlay with Ready button");
        }
    }
    /**
     * handleReconnectionTimeout - Called when opponent doesn't reconnect in time
     */
    handleReconnectionTimeout(data) {
        console.log("[RemotePage] Handling reconnection timeout", data);
        // Clean up game manager now
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Show timeout notification
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', this.t('reconnectionTimeout') || 'RECONNECTION TIMEOUT');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || this.t('opponentTimeoutMsg') || 'Opponent did not reconnect in time. The game has ended.');
            const backButton = this.uiManager.createButton(this.t('backToLobby') || 'BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(backButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    }
    /**
     * handleOpponentAbandoned - Called when opponent starts new game instead of reconnecting
     */
    handleOpponentAbandoned(data) {
        console.log("[RemotePage] Handling opponent abandoned", data);
        // Clean up game manager now
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Show abandoned notification
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', this.t('opponentAbandoned') || 'OPPONENT LEFT');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || this.t('opponentStartedNewGameMsg') || 'Your opponent has started a new game. This game has been ended.');
            const backButton = this.uiManager.createButton(this.t('backToLobby') || 'BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(backButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    }
    /**
     * handleMatchmakingError - Called when matchmaking fails
     * Shows error message and returns to lobby
     */
    handleMatchmakingError(data) {
        console.log("[RemotePage] Handling matchmaking failure", data);
        this.isSearchingOpponent = false;
        this.removeWaitingScreen();
        // Clean up game manager since matchmaking failed
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Show error on start overlay
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', this.t('matchmakingError') || 'MATCHMAKING ERROR');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || this.t('matchmakingProblemMsg') || 'A problem occurred while searching for an opponent.');
            const backButton = this.uiManager.createButton(this.t('backToLobby') || 'BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(backButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    }
    //////////////////////////////////////////
    ///////////// UPDATES ////////////////////
    //////////////////////////////////////////
    updateScore(player1Score, player2Score) {
        const player1Element = document.querySelector('.text-4xl.tracking-wider');
        const player2Element = document.querySelectorAll('.text-4xl.tracking-wider')[1];
        if (player1Element) {
            player1Element.textContent = player1Score.toString().padStart(2, '0');
        }
        if (player2Element) {
            player2Element.textContent = player2Score.toString().padStart(2, '0');
        }
    }
    updateGameState(gameState) {
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        const pauseOverlay = document.querySelector('[data-overlay="pause-game"]');
        const gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
        const winnerFromState = gameState.winner ?? null;
        const isGameOverByScore = gameState.player1Score >= 10 || gameState.player2Score >= 10;
        const winnerByScore = isGameOverByScore ? (gameState.player1Score >= 10 ? 'Player 1' : 'Player 2') : null;
        const winner = winnerFromState || winnerByScore;
        const isGameOver = !!winner;
        const isPaused = this.gameManager ? this.gameManager.getIsPaused() : false;
        console.log('[GameRemotePage] updateGameState called - gameRunning:', gameState.gameRunning, 'isPaused:', isPaused, 'hasStarted:', this.gameManager?.getHasStarted());
        // For waiting screen
        if (this.isSearchingOpponent) {
            console.log('[GameRemotePage] Showing waiting screen');
            startOverlay?.classList.add('hidden');
            pauseOverlay?.classList.add('hidden');
            gameOverOverlay?.classList.add('hidden');
            return;
        }
        // Screen at the start of the game
        if (!this.gameManager?.getHasStarted()) {
            console.log('[GameRemotePage] Showing start overlay (game not started yet)');
            if (startOverlay)
                startOverlay.classList.remove('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            if (gameOverOverlay)
                gameOverOverlay.classList.add('hidden');
            return;
        }
        // Screen when the game is over
        else if (isGameOver && winner) {
            if (this.gameManager) {
                this.gameManager.destroy();
                this.gameManager = null;
            }
            if (gameOverOverlay) {
                // Update game over content to return to lobby instead of playing again
                const winnerText = gameOverOverlay.querySelector('.text-2xl');
                if (winnerText) {
                    // After server mirroring, player1Score is always YOUR score
                    // and player2Score is always opponent's score for BOTH players
                    // So if player1Score >= 10, YOU won. If player2Score >= 10, opponent won.
                    // Use score to determine winner (scores are correctly mirrored for each player)
                    // player1Score is always YOUR score after server mirroring
                    winnerText.textContent = gameState.player1Score >= 10 ? (this.t('youWin') || 'YOU WIN!') : (this.t('youLose') || 'YOU LOSE!');
                }
                const playAgainBtn = gameOverOverlay.querySelector('button');
                if (playAgainBtn) {
                    playAgainBtn.textContent = this.t('returnToLobby') || 'RETURN TO LOBBY';
                }
                gameOverOverlay.classList.remove('hidden');
                gameOverOverlay.style.display = ''; // Clear inline display:none from countdown/pause
            }
            if (startOverlay)
                startOverlay.classList.add('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            return;
        }
        // Screen when the game is paused - CHECK THIS BEFORE gameRunning!
        else if (isPaused) {
            console.log('[GameRemotePage] Showing pause overlay');
            if (pauseOverlay) {
                pauseOverlay.classList.remove('hidden');
                pauseOverlay.style.display = ''; // Clear inline style that might be hiding it
            }
            if (startOverlay) {
                startOverlay.classList.add('hidden');
                startOverlay.style.display = 'none';
            }
            if (gameOverOverlay) {
                gameOverOverlay.classList.add('hidden');
                gameOverOverlay.style.display = 'none';
            }
            return;
        }
        // Screen when the game is running
        else if (gameState.gameRunning) {
            console.log('[GameRemotePage] Game running - hiding all overlays');
            if (startOverlay)
                startOverlay.classList.add('hidden');
            if (pauseOverlay)
                pauseOverlay.classList.add('hidden');
            if (gameOverOverlay)
                gameOverOverlay.classList.add('hidden');
            return;
        }
    }
    //////////////////////////////////////////
    ///////////// GAME FUNCTIONS ////////////
    //////////////////////////////////////////
    setReady() {
        if (!this.gameManager)
            return;
        // Pass true for remote games - each player marks only themselves ready
        this.gameManager.setReady(true);
        // Always hide the start overlay when Ready is clicked so countdown is visible
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay)
            startOverlay.classList.add('hidden');
    }
    pauseGame() {
        if (!this.gameManager)
            return;
        if (!this.gameManager.getIsPaused() && !this.gameManager.getGameState().gameRunning)
            return;
        if (this.gameManager.getIsPaused())
            this.gameManager.resumeGame();
        else
            this.gameManager.pauseGame();
    }
    backToMenu() {
        // Cancel matchmaking if searching
        if (this.isSearchingOpponent && this.gameManager) {
            this.gameManager.cancelSearch();
            this.isSearchingOpponent = false;
        }
        // For remote games in progress, DON'T destroy the game on server
        // Let the socket disconnect trigger the reconnection flow
        if (this.gameManager) {
            const isActiveRemote = this.gameManager.isActiveRemoteGame();
            // Pass false to NOT notify server for active remote games (allows reconnection)
            this.gameManager.destroy(!isActiveRemote);
            this.gameManager = null;
        }
        this.onBack();
    }
    backToLobby() {
        // Cancel matchmaking if searching
        if (this.isSearchingOpponent && this.gameManager) {
            this.gameManager.cancelSearch();
            this.isSearchingOpponent = false;
        }
        // For remote games in progress, DON'T destroy the game on server
        // Let the socket disconnect trigger the reconnection flow
        if (this.gameManager) {
            const isActiveRemote = this.gameManager.isActiveRemoteGame();
            // Pass false to NOT notify server for active remote games (allows reconnection)
            this.gameManager.destroy(!isActiveRemote);
            this.gameManager = null;
        }
        // Return to lobby (show game mode selection)
        this.requestNewGame();
    }
    resetGame() {
        if (!this.gameManager)
            return;
        if (!this.gameManager.getGameState().gameRunning)
            return;
        this.gameManager.resetGame();
    }
    //////////////////////////////////////////////
    ///////////// OPTIONS GAME ///////////////////
    //////////////////////////////////////////////
    playAgainstRandomPlayer() {
        // Create new game if needed
        if (!this.gameManager) {
            GameManager.requestGameID("remote");
            // Wait for setupGame to be called, then start matchmaking
            setTimeout(() => {
                if (!this.gameManager)
                    return;
                this.playAgainstRandomPlayer(); // Retry after game is created
            }, 100);
            return;
        }
        this.startMatchmaking();
    }
    startMatchmaking() {
        if (!this.gameManager)
            return;
        this.isSearchingOpponent = true;
        document.querySelector('[data-overlay="start-game"]')?.classList.add('hidden');
        this.removeWaitingScreen();
        const WaitingScreen = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-10');
        WaitingScreen.setAttribute('data-overlay', 'waiting-screen');
        const WaitingScreenContent = this.uiManager.createElement('div', 'text-center retro-text');
        const WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('waitingForRandomOpponent') || 'WAITING FOR AN OPPONENT...');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        const cancelButton = this.uiManager.createButton(this.t('cancel') || 'CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => {
            // Cancel matchmaking search
            this.gameManager?.cancelSearch();
            this.removeWaitingScreen();
            this.isSearchingOpponent = false;
            document.querySelector('[data-overlay="start-game"]')?.classList.remove('hidden');
        });
        WaitingScreenContent.appendChild(cancelButton);
        WaitingScreen.appendChild(WaitingScreenContent);
        const canvasContainer = this.canvas?.parentElement;
        if (canvasContainer)
            canvasContainer.appendChild(WaitingScreen);
        else
            this.uiManager.container.appendChild(WaitingScreen);
        // IMPORTANT: Tell server to start searching for opponent!
        this.gameManager.searchForRandomOpponent();
    }
    playAgainstFriend() {
        // Create new game if needed
        if (!this.gameManager) {
            GameManager.requestGameID("remote");
            // Wait for setupGame to be called, then show friend selection
            setTimeout(() => {
                if (!this.gameManager)
                    return;
                this.playAgainstFriend(); // Retry after game is created
            }, 100);
            return;
        }
        this.isSearchingOpponent = true;
        document.querySelector('[data-overlay="start-game"]')?.classList.add('hidden');
        this.removeWaitingScreen();
        // Invite text and overlay
        const WaitingScreen = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg z-10');
        WaitingScreen.setAttribute('data-overlay', 'waiting-screen');
        const WaitingScreenContent = this.uiManager.createElement('div', 'text-center retro-text');
        const WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', this.t('inviteAFriend') || 'INVITE A FRIEND');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        // Friends List
        const friendsList = this.uiManager.createElement('div', 'flex gap-4 justify-center');
        const selectedLabel = this.uiManager.createElement('div', 'retro-text text-xs opacity-60 mb-2', this.t('selectAFriend') || 'Select a friend');
        const friends = [
            { id: 'friend1', name: 'Friend 1' },
            { id: 'friend2', name: 'Friend 2' },
            { id: 'friend3', name: 'Friend 3' },
        ];
        const friendEls = [];
        const updateSelectionUI = () => {
            friendEls.forEach((el) => {
                const id = el.getAttribute('data-friend-id');
                const isSelected = id && id === this.selectedFriendId;
                el.classList.toggle('border-[#00ffff]', !!isSelected);
                el.classList.toggle('border-[#ff1493]', !isSelected);
            });
            selectedLabel.textContent = this.selectedFriendId
                ? this.t('selectedFriend', { username: friends.find(f => f.id === this.selectedFriendId)?.name ?? this.selectedFriendId }) || `Selected: ${friends.find(f => f.id === this.selectedFriendId)?.name ?? this.selectedFriendId}`
                : (this.t('selectAFriend') || 'Select a friend');
        };
        friends.forEach((f) => {
            const friendEl = this.uiManager.createElement('button', 'cursor-pointer px-4 py-2 rounded border-2 border-[#ff1493] bg-black/40 hover:bg-black/60 transition-all duration-200', f.name);
            friendEl.type = 'button';
            friendEl.setAttribute('data-friend-id', f.id);
            friendEl.addEventListener('click', () => {
                this.selectedFriendId = this.selectedFriendId === f.id ? null : f.id;
                updateSelectionUI();
            });
            friendEls.push(friendEl);
            friendsList.appendChild(friendEl);
        });
        WaitingScreenContent.appendChild(selectedLabel);
        WaitingScreenContent.appendChild(friendsList);
        // Space between list and buttons + stack buttons vertically
        WaitingScreenContent.appendChild(this.uiManager.createElement('div', 'h-4'));
        const buttonsWrapper = this.uiManager.createElement('div', 'flex flex-col gap-4 items-center');
        // Invite Button
        const inviteButton = this.uiManager.createButton(this.t('invite') || 'INVITE', 'retro-button bg-[#ff1493] text-black px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => {
            // TODO: Implement invite friend functionality
            // Example: use this.selectedFriendId
            if (!this.selectedFriendId) {
                selectedLabel.textContent = this.t('selectFriendFirst') || 'Select a friend first';
                return;
            }
        });
        buttonsWrapper.appendChild(inviteButton);
        // Cancel Button
        const cancelButton = this.uiManager.createButton(this.t('cancel') || 'CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-black transition-all duration-200', () => {
            this.removeWaitingScreen();
            this.isSearchingOpponent = false;
            document.querySelector('[data-overlay="start-game"]')?.classList.remove('hidden');
        });
        buttonsWrapper.appendChild(cancelButton);
        WaitingScreenContent.appendChild(buttonsWrapper);
        WaitingScreen.appendChild(WaitingScreenContent);
        const canvasContainer = this.canvas?.parentElement;
        if (canvasContainer)
            canvasContainer.appendChild(WaitingScreen);
        else
            this.uiManager.container.appendChild(WaitingScreen);
    }
}
