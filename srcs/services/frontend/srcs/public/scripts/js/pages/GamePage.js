import { GameManager } from '../modules/GameManager.js';
export class GamePageLocal {
    constructor(uiManager, onBack) {
        this.gameManager = null;
        this.canvas = null;
        this.uiManager = uiManager;
        this.onBack = onBack;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-6xl');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', 'PONG');
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle', 'CLASSIC ARCADE EXPERIENCE');
        // Back to Menu Button
        const backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto mt-4', this.onBack);
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        header.appendChild(title);
        header.appendChild(subtitle);
        header.appendChild(backButton);
        // Game Container
        const gameContainer = this.uiManager.createElement('div', 'flex flex-col items-center gap-6');
        // Score Display
        const scoreDisplay = this.uiManager.createElement('div', 'flex gap-16 items-center retro-text');
        const player1Score = this.uiManager.createElement('div', 'text-center');
        const player1Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 1');
        const player1Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player1Score.appendChild(player1Label);
        player1Score.appendChild(player1Value);
        const vsLabel = this.uiManager.createElement('div', 'text-2xl opacity-40', 'VS');
        const player2Score = this.uiManager.createElement('div', 'text-center');
        const player2Label = this.uiManager.createElement('div', 'text-lg opacity-60', 'PLAYER 2');
        const player2Value = this.uiManager.createElement('div', 'text-4xl tracking-wider', '00');
        player2Score.appendChild(player2Label);
        player2Score.appendChild(player2Value);
        scoreDisplay.appendChild(player1Score);
        scoreDisplay.appendChild(vsLabel);
        scoreDisplay.appendChild(player2Score);
        // Game Canvas Container
        const canvasContainer = this.uiManager.createElement('div', 'relative');
        this.canvas = this.uiManager.createCanvas(800, 400, 'border-2 border-[#ff1493] rounded-lg bg-black shadow-[0_0_20px_#ff1493] retro-canvas');
        canvasContainer.appendChild(this.canvas);
        // Game Over Overlay
        const gameOverOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
        gameOverOverlay.setAttribute('data-overlay', 'game-over');
        const gameOverContent = this.uiManager.createElement('div', 'text-center retro-text');
        const gameOverTitle = this.uiManager.createElement('div', 'text-4xl mb-4 text-[#ff1493]', 'GAME OVER');
        const gameOverWinner = this.uiManager.createElement('div', 'text-2xl mb-6 text-[#00ffff]', '');
        const playAgainButton = this.uiManager.createButton('PLAY AGAIN', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.resetGame());
        gameOverContent.appendChild(gameOverTitle);
        gameOverContent.appendChild(gameOverWinner);
        gameOverContent.appendChild(playAgainButton);
        gameOverOverlay.appendChild(gameOverContent);
        canvasContainer.appendChild(gameOverOverlay);
        // Start Game Overlay
        const startOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg');
        startOverlay.setAttribute('data-overlay', 'start-game');
        const startContent = this.uiManager.createElement('div', 'text-center retro-text');
        const startTitle = this.uiManager.createElement('div', 'text-3xl mb-6 text-[#ff1493]', 'READY TO PLAY?');
        const startButton = this.uiManager.createButton('START GAME', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200', () => this.startGame());
        startContent.appendChild(startTitle);
        startContent.appendChild(startButton);
        startOverlay.appendChild(startContent);
        canvasContainer.appendChild(startOverlay);
        // Controls
        const controls = this.uiManager.createElement('div', 'flex gap-12 retro-text text-sm opacity-60');
        const player1Controls = this.uiManager.createElement('div', 'text-center');
        const player1Title = this.uiManager.createElement('div', 'mb-2', 'PLAYER 1');
        const player1Up = this.uiManager.createElement('div', '', 'W - UP');
        const player1Down = this.uiManager.createElement('div', '', 'S - DOWN');
        player1Controls.appendChild(player1Title);
        player1Controls.appendChild(player1Up);
        player1Controls.appendChild(player1Down);
        const player2Controls = this.uiManager.createElement('div', 'text-center');
        const player2Title = this.uiManager.createElement('div', 'mb-2', 'PLAYER 2');
        const player2Up = this.uiManager.createElement('div', '', '↑ - UP');
        const player2Down = this.uiManager.createElement('div', '', '↓ - DOWN');
        player2Controls.appendChild(player2Title);
        player2Controls.appendChild(player2Up);
        player2Controls.appendChild(player2Down);
        controls.appendChild(player1Controls);
        controls.appendChild(player2Controls);
        // Game Controls
        const gameControls = this.uiManager.createElement('div', 'flex gap-4');
        const pauseButton = this.uiManager.createButton('PAUSE', 'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200', () => this.pauseGame());
        const resumeButton = this.uiManager.createButton('RESUME', 'retro-button bg-transparent text-[#ff1493] px-6 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200', () => this.startGame());
        const resetButton = this.uiManager.createButton('RESET', 'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', () => this.resetGame());
        gameControls.appendChild(pauseButton);
        gameControls.appendChild(resumeButton);
        gameControls.appendChild(resetButton);
        gameContainer.appendChild(scoreDisplay);
        gameContainer.appendChild(canvasContainer);
        gameContainer.appendChild(controls);
        gameContainer.appendChild(gameControls);
        // Footer
        const footer = this.uiManager.createElement('div', 'text-center mt-8 retro-text text-sm opacity-40');
        const footerText = this.uiManager.createElement('p', '', 'FIRST TO 10 POINTS WINS • USE KEYBOARD CONTROLS');
        footer.appendChild(footerText);
        content.appendChild(header);
        content.appendChild(gameContainer);
        content.appendChild(footer);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
        // Initialize game manager
        if (this.canvas) {
            GameManager.requestGameID("local");
        }
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
    }
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
        console.log('updateGameState called with:', gameState);
        // Utilisons des sélecteurs plus spécifiques pour éviter les conflits
        const gameOverOverlay = document.querySelector('[data-overlay="game-over"]');
        const startOverlay = document.querySelector('[data-overlay="start-game"]');
        console.log('Found overlays:', { gameOverOverlay, startOverlay });
        // Vérifier si le jeu est terminé
        const isGameOver = gameState.player1Score >= 10 || gameState.player2Score >= 10;
        const winner = isGameOver ? (gameState.player1Score >= 10 ? 'Player 1' : 'Player 2') : null;
        if (isGameOver && winner) {
            // Afficher l'overlay de fin de jeu
            if (gameOverOverlay) {
                gameOverOverlay.classList.remove('hidden');
                const winnerText = gameOverOverlay.querySelector('.text-2xl.mb-6.text-\\[\\#00ffff\\]');
                if (winnerText) {
                    winnerText.textContent = `${winner} WINS!`;
                }
            }
            if (startOverlay) {
                startOverlay.classList.add('hidden');
            }
        }
        else if (!gameState.gameRunning && !isGameOver) {
            // Afficher l'overlay de démarrage seulement si pas de gagnant
            if (startOverlay) {
                startOverlay.classList.remove('hidden');
            }
            if (gameOverOverlay) {
                gameOverOverlay.classList.add('hidden');
            }
        }
        else if (gameState.gameRunning) {
            // Cacher tous les overlays pendant le jeu
            if (startOverlay) {
                startOverlay.classList.add('hidden');
            }
            if (gameOverOverlay) {
                gameOverOverlay.classList.add('hidden');
            }
        }
    }
    startGame() {
        console.log('startGame() called');
        if (this.gameManager) {
            console.log('GameManager exists, calling startGame()');
            this.gameManager.startGame();
        }
        else {
            console.log('GameManager is null!');
        }
    }
    pauseGame() {
        if (this.gameManager) {
            this.gameManager.pauseGame();
        }
    }
    resetGame() {
        if (this.gameManager) {
            this.gameManager.resetGame();
        }
    }
}
export class GamePageAI {
    constructor(uiManager, onBack) {
        this.uiManager = uiManager;
        this.onBack = onBack;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl text-center');
        // Header
        const header = this.uiManager.createElement('div', 'mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-4xl mb-4', 'PONG VS AI');
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-xl', 'ARTIFICIAL INTELLIGENCE MODE');
        // Construction Message
        const constructionContainer = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-12 mb-8');
        const constructionIcon = this.uiManager.createElement('div', 'flex justify-center mb-6');
        const icon = this.uiManager.createIcon('zap', 'w-16 h-16 text-[#ff1493]');
        constructionIcon.appendChild(icon);
        const constructionTitle = this.uiManager.createElement('h2', 'retro-text text-2xl mb-4 text-[#ff1493]', 'UNDER CONSTRUCTION');
        const constructionText = this.uiManager.createElement('p', 'retro-text text-lg opacity-80 mb-6', 'AI opponent is being developed. This feature will be available soon!');
        constructionContainer.appendChild(constructionIcon);
        constructionContainer.appendChild(constructionTitle);
        constructionContainer.appendChild(constructionText);
        // Back Button
        const backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-6 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto', this.onBack);
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        header.appendChild(title);
        header.appendChild(subtitle);
        content.appendChild(header);
        content.appendChild(constructionContainer);
        content.appendChild(backButton);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
}
export class GamePageOnline {
    constructor(uiManager, onBack) {
        this.uiManager = uiManager;
        this.onBack = onBack;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl text-center');
        // Header
        const header = this.uiManager.createElement('div', 'mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-4xl mb-4', 'PONG ONLINE');
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-xl', 'MULTIPLAYER MODE');
        // Construction Message
        const constructionContainer = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-12 mb-8');
        const constructionIcon = this.uiManager.createElement('div', 'flex justify-center mb-6');
        const icon = this.uiManager.createIcon('users', 'w-16 h-16 text-[#00ffff]');
        constructionIcon.appendChild(icon);
        const constructionTitle = this.uiManager.createElement('h2', 'retro-text text-2xl mb-4 text-[#00ffff]', 'UNDER CONSTRUCTION');
        const constructionText = this.uiManager.createElement('p', 'retro-text text-lg opacity-80 mb-6', 'Online multiplayer is being developed. This feature will be available soon!');
        constructionContainer.appendChild(constructionIcon);
        constructionContainer.appendChild(constructionTitle);
        constructionContainer.appendChild(constructionText);
        // Back Button
        const backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-6 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto', this.onBack);
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        header.appendChild(title);
        header.appendChild(subtitle);
        content.appendChild(header);
        content.appendChild(constructionContainer);
        content.appendChild(backButton);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
}
