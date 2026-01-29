import { GameManager } from '../modules/GameManager.js';
export class RemotePage {
    constructor(uiManager, onBack, user) {
        this.gameManager = null;
        this.canvas = null;
        this.user = null;
        this.isSearchingOpponent = false;
        this.selectedFriendId = null;
        this.uiManager = uiManager;
        this.onBack = onBack;
        this.user = user ?? null;
    }
    ///////////// DESIGN & RENDERING /////////////
    render(user) {
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
        if (!this.user || !this.user.avatar)
            avatarPlayer2Img.src = 'public/avatars/default.png';
        else if (this.user.avatar.startsWith('http'))
            avatarPlayer2Img.src = this.user.avatar;
        else
            avatarPlayer2Img.src = `public/avatars/${this.user.avatar}.png`;
        avatarPlayer2Section.appendChild(avatarPlayer2Img);
        // Score Display
        const scoreDisplay = this.uiManager.createElement('div', 'flex gap-16 items-center retro-text');
        const player1Score = this.uiManager.createElement('div', 'text-center');
        const player1Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 1');
        player1Label.textContent = this.user ? this.user.username : 'PLAYER 1';
        const player1Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player1Score.appendChild(player1Label);
        player1Score.appendChild(player1Value);
        const vsLabel = this.uiManager.createElement('div', 'text-2xl opacity-40', 'VS');
        const player2Score = this.uiManager.createElement('div', 'text-center');
        const player2Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 2');
        const player2Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player2Score.appendChild(player2Label);
        player2Score.appendChild(player2Value);
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
        const startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'CHOOSE YOUR OPPONENT');
        const startButtonRandom = this.uiManager.createButton('PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.playAgainstRandomPlayer());
        const startButtonFriend = this.uiManager.createButton('PLAY AGAINST A FRIEND', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 mt-4', () => this.playAgainstFriend());
        startContent.appendChild(startTitle);
        startContent.appendChild(startButtonRandom);
        startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
        startContent.appendChild(startButtonFriend);
        startOverlay.appendChild(startContent);
        canvasContainer.appendChild(startOverlay);
        // Pause Game Overlay
        const pauseOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        pauseOverlay.setAttribute('data-overlay', 'pause-game');
        const pauseContent = this.uiManager.createElement('div', 'text-center retro-text');
        const pauseTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'PAUSED');
        pauseContent.appendChild(pauseTitle);
        pauseOverlay.appendChild(pauseContent);
        canvasContainer.appendChild(pauseOverlay);
        // Game Over Overlay
        const gameOverOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        gameOverOverlay.setAttribute('data-overlay', 'game-over');
        const gameOverContent = this.uiManager.createElement('div', 'text-center retro-text');
        const gameOverTitle = this.uiManager.createElement('div', 'text-4xl mb-4 text-[#ff1493]', 'GAME OVER');
        const gameOverWinner = this.uiManager.createElement('div', 'text-2xl mb-6 text-[#00ffff]', '');
        const playAgainButton = this.uiManager.createButton('PLAY AGAIN', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.requestNewGame());
        gameOverContent.appendChild(gameOverTitle);
        gameOverContent.appendChild(gameOverWinner);
        gameOverContent.appendChild(playAgainButton);
        gameOverOverlay.appendChild(gameOverContent);
        canvasContainer.appendChild(gameOverOverlay);
        // Controls
        const controls = this.uiManager.createElement('div', 'flex gap-12 retro-text text-sm opacity-60');
        const player1Controls = this.uiManager.createElement('div', 'text-center');
        const player1Title = this.uiManager.createElement('div', 'mb-2', 'COMMANDS');
        const player1Up = this.uiManager.createElement('div', '', 'W - UP');
        const player1Down = this.uiManager.createElement('div', '', 'S - DOWN');
        player1Controls.appendChild(player1Title);
        player1Controls.appendChild(player1Up);
        player1Controls.appendChild(player1Down);
        controls.appendChild(player1Controls);
        // Buttons Pause & Reset
        const gameControls = this.uiManager.createElement('div', 'flex gap-4');
        const pauseButton = this.uiManager.createButton('PAUSE / RESUME', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', () => this.pauseGame());
        const resetButton = this.uiManager.createButton('RESTART', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', () => this.resetGame());
        // Back to Menu Button
        const backButtonContainer = this.uiManager.createElement('div', 'text-center mb-8');
        const backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto mt-4', () => this.backToMenu());
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        backButtonContainer.appendChild(backButton);
        gameControls.appendChild(pauseButton);
        gameControls.appendChild(resetButton);
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
        // Don't auto-create game - wait for user to select game mode
    }
    //////////////////////////////////////////////
    ///////////// GAME INITIALIZATION ////////////
    //////////////////////////////////////////////
    removeWaitingScreen() {
        document
            .querySelectorAll('[data-overlay="waiting-screen"]')
            .forEach((el) => el.remove());
    }
    requestNewGame() {
        // Return to lobby - show game mode selection
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
            const startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'CHOOSE YOUR OPPONENT');
            const startButtonRandom = this.uiManager.createButton('PLAY AGAINST RANDOM PLAYER', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.playAgainstRandomPlayer());
            const startButtonFriend = this.uiManager.createButton('PLAY AGAINST A FRIEND', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 mt-4', () => this.playAgainstFriend());
            startContent.appendChild(startTitle);
            startContent.appendChild(startButtonRandom);
            startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
            startContent.appendChild(startButtonFriend);
            startOverlay.appendChild(startContent);
            startOverlay.classList.remove('hidden');
        }
        // Don't create game yet - wait for user to select mode
    }
    setupGame(data) {
        console.log("should work here in setupGame");
        if (!this.canvas)
            throw new Error("canvas is not initialised");
        this.gameManager = new GameManager(this.canvas, data.UUID);
        this.setupGameListeners();
        console.log(data.UUID, this.gameManager);
    }
    setupGameListeners() {
        if (!this.gameManager)
            return;
        this.gameManager.addListener((gameState) => {
            this.updateScore(gameState.player1Score, gameState.player2Score);
            this.updateGameState(gameState);
        });
        // Handle when matchmaking finds an opponent
        this.gameManager.setOnOpponentFound((data) => {
            console.log("[RemotePage] Opponent found!", data);
            this.handleOpponentFound(data);
        });
        // Handle when opponent disconnects
        this.gameManager.setOnOpponentDisconnected((data) => {
            console.log("[RemotePage] Opponent disconnected!", data);
            this.handleOpponentDisconnected(data);
        });
        // Handle matchmaking errors (e.g., already searching)
        this.gameManager.setOnMatchmakingError((data) => {
            console.log("[RemotePage] Matchmaking error!", data);
            this.handleMatchmakingError(data);
        });
    }
    /**
     * handleOpponentFound - Called when matchmaking finds an opponent
     * Removes waiting screen and starts the ready phase
     */
    handleOpponentFound(data) {
        this.isSearchingOpponent = false;
        this.removeWaitingScreen();
        // Show ready screen (both players need to click ready)
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            // Change the overlay content to show "Opponent found! Click READY"
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#00ffff]', 'OPPONENT FOUND!');
            const subtitle = this.uiManager.createElement('div', 'text-lg mb-6 text-[#ff1493]', `Playing against: ${data.opponentId}`);
            const readyButton = this.uiManager.createButton('READY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.setReady());
            content.appendChild(title);
            content.appendChild(subtitle);
            content.appendChild(readyButton);
            startOverlay.appendChild(content);
            startOverlay.classList.remove('hidden');
        }
    }
    /**
     * handleOpponentDisconnected - Called when opponent leaves the game
     * Shows notification and returns to matchmaking lobby
     */
    handleOpponentDisconnected(data) {
        console.log("[RemotePage] Handling opponent disconnect", data);
        // Clean up game manager
        if (this.gameManager) {
            this.gameManager.destroy();
            this.gameManager = null;
        }
        // Remove all overlays
        this.removeWaitingScreen();
        document.querySelector('[data-overlay="game-over"]')?.classList.add('hidden');
        document.querySelector('[data-overlay="pause-game"]')?.classList.add('hidden');
        // Show disconnect notification on start overlay
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        if (startOverlay) {
            startOverlay.innerHTML = '';
            const content = this.uiManager.createElement('div', 'text-center retro-text');
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'OPPONENT DISCONNECTED');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || 'Your opponent has left the game.');
            const backButton = this.uiManager.createButton('BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
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
        console.log("[RemotePage] Handling matchmaking error", data);
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
            const title = this.uiManager.createElement('div', 'text-3xl mb-4 text-[#ff6b6b]', 'MATCHMAKING ERROR');
            const message = this.uiManager.createElement('div', 'text-lg mb-6 text-white', data.message || 'An error occurred while searching for an opponent.');
            const backButton = this.uiManager.createButton('BACK TO LOBBY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.backToLobby());
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
        const isGameOver = gameState.player1Score >= 10 || gameState.player2Score >= 10;
        const winner = isGameOver ? (gameState.player1Score >= 10 ? 'Player 1' : 'Player 2') : null;
        const isPaused = this.gameManager ? this.gameManager.getIsPaused() : false;
        // For waiting screen
        if (this.isSearchingOpponent) {
            startOverlay?.classList.add('hidden');
            pauseOverlay?.classList.add('hidden');
            gameOverOverlay?.classList.add('hidden');
            return;
        }
        // Screen at the start of the game
        if (!this.gameManager?.getHasStarted()) {
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
            const playerNum = this.gameManager?.getPlayerNumber() ?? 1;
            if (this.gameManager) {
                this.gameManager.destroy();
                this.gameManager = null;
            }
            if (gameOverOverlay) {
                // Update game over content to return to lobby instead of playing again
                const winnerText = gameOverOverlay.querySelector('.text-2xl');
                if (winnerText) {
                    winnerText.textContent = winner === 'Player 1' ?
                        (playerNum === 1 ? 'YOU WIN!' : 'YOU LOSE!') :
                        (playerNum === 2 ? 'YOU WIN!' : 'YOU LOSE!');
                }
                const playAgainBtn = gameOverOverlay.querySelector('button');
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
    }
    //////////////////////////////////////////
    ///////////// GAME FUNCTIONS ////////////
    //////////////////////////////////////////
    setReady() {
        if (!this.gameManager)
            return;
        const wasPaused = this.gameManager.getIsPaused();
        // Pass true for remote games - each player marks only themselves ready
        this.gameManager.setReady(true);
        if (!wasPaused) {
            const startOverlay = document.querySelector('[data-overlay="start-game"]');
            if (startOverlay)
                startOverlay.classList.add('hidden');
        }
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
        // Destroy game and return to main menu
        if (this.gameManager) {
            this.gameManager.destroy();
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
        // Destroy current game
        if (this.gameManager) {
            this.gameManager.destroy();
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
        const WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'WAITING FOR AN OPPONENT...');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        const cancelButton = this.uiManager.createButton('CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => {
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
        const WaitingScreenTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'INVITE A FRIEND');
        WaitingScreenContent.appendChild(WaitingScreenTitle);
        // Friends List
        const friendsList = this.uiManager.createElement('div', 'flex gap-4 justify-center');
        const selectedLabel = this.uiManager.createElement('div', 'retro-text text-xs opacity-60 mb-2', 'Select a friend');
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
                ? `Selected: ${friends.find(f => f.id === this.selectedFriendId)?.name ?? this.selectedFriendId}`
                : 'Select a friend';
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
        const inviteButton = this.uiManager.createButton('INVITE', 'retro-button bg-[#ff1493] text-black px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => {
            // TODO: Implement invite friend functionality
            // Example: use this.selectedFriendId
            if (!this.selectedFriendId) {
                selectedLabel.textContent = 'Select a friend first';
                return;
            }
        });
        buttonsWrapper.appendChild(inviteButton);
        // Cancel Button
        const cancelButton = this.uiManager.createButton('CANCEL', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => {
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
