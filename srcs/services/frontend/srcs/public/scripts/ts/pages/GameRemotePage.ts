import { UIManager } from '../modules/UIManager.js';
import { GameManager } from '../modules/GameManager.js';
import type { User } from '../modules/TypesManager.js';

export class RemotePage {
  private uiManager: UIManager;
  private onBack: () => void;
  private gameManager: GameManager | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private user: User | null = null;

  constructor(uiManager: UIManager, onBack: () => void, user?: User | null) {
	this.uiManager = uiManager;
	this.onBack = onBack;
	this.user = user ?? null;
  }

  ///////////// DESIGN & RENDERING /////////////

  public render(user?: User | null): void {
	if (user !== undefined) {
	  this.user = user;
	}	

	// Avatars
	const avatarPlayer1Section = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
    const avatarPlayer1Img = this.uiManager.createElement('img', 'rounded-full') as HTMLImageElement;
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
    const avatarPlayer2Img = this.uiManager.createElement('img', 'rounded-full') as HTMLImageElement;
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
	const startButtonRandom = this.uiManager.createButton(
		'PLAY AGAINST RANDOM PLAYER',
		'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200',
		() => this.setReady()
	);
	const startButtonFriend = this.uiManager.createButton(
		'PLAY AGAINST A FRIEND',
		'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 mt-4',
		() => this.setReady()
	);
	startContent.appendChild(startTitle);
	startContent.appendChild(startButtonRandom);
	startContent.appendChild(this.uiManager.createElement('div', 'h-4'));
	startContent.appendChild(startButtonFriend);
	startOverlay.appendChild(startContent);
	
	canvasContainer.appendChild(startOverlay);

	// Countdown Overlay (3..2..1..0) - affiché via GameManager quand il reçoit l'event "countdown"
	const countdownOverlay = this.uiManager.createElement(
		'div',
		'absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg hidden'
	);
	countdownOverlay.setAttribute('data-overlay', 'countdown');
	const countdownValue = this.uiManager.createElement(
		'div',
		'text-7xl text-[#ff1493] retro-text drop-shadow-[0_0_20px_#ff1493]'
	);
	countdownValue.setAttribute('data-countdown', 'value');
	countdownValue.textContent = '3';
	countdownOverlay.appendChild(countdownValue);
	canvasContainer.appendChild(countdownOverlay);
	
	// Game Over Overlay
	const gameOverOverlay = this.uiManager.createElement('div', 'absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg hidden');
	gameOverOverlay.setAttribute('data-overlay', 'game-over');
	const gameOverContent = this.uiManager.createElement('div', 'text-center retro-text');
	const gameOverTitle = this.uiManager.createElement('div', 'text-4xl mb-4 text-[#ff1493]', 'GAME OVER');
	const gameOverWinner = this.uiManager.createElement('div', 'text-2xl mb-6 text-[#00ffff]', '');
	const playAgainButton = this.uiManager.createButton(
		'PLAY AGAIN',
		'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200',
		() => this.requestNewGame()
	);
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
	const pauseButton = this.uiManager.createButton(
		'PAUSE',
		'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200',
		() => this.pauseGame()
	);
	const resetButton = this.uiManager.createButton(
		'RESTART',
		'retro-button bg-transparent text-[#9d4edd] px-6 py-2 rounded border-2 border-[#9d4edd] hover:bg-[#9d4edd] hover:text-black transition-all duration-200',
		() => this.resetGame()
	);

	// Back to Menu Button
	const backButtonContainer = this.uiManager.createElement('div', 'text-center mb-8');
	const backButton = this.uiManager.createButton(
	  'BACK TO MENU',
	  'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mx-auto mt-4',
	  this.onBack
	);
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
	
	// Initialize game manager
	if (this.canvas)
		this.requestNewGame()
  }


  //////////// GAME LOGIC //////////---
  private requestNewGame(): void{
	const gameOverOverlay = document.querySelector('[data-overlay="game-over"]') as HTMLElement;
	const startOverlay = document.querySelector('[data-overlay="start-game"]') as HTMLElement;
	if (gameOverOverlay) {
	  gameOverOverlay.classList.add('hidden');
	  startOverlay.classList.remove('hidden')
	}
	GameManager.requestGameID("remote")
  }

  private setReady(): void {
  if (this.gameManager) {
	this.gameManager.setReady();
	const startOverlay = document.querySelector('[data-overlay="start-game"]') as HTMLElement;
	if (startOverlay) {
	  startOverlay.classList.add('hidden');
	}
  }
}

  public setupGame(data:any){
	console.log("should work here in setupGame")
	if (!this.canvas)
		throw new Error("canvas is not initialised");
	this.gameManager = new GameManager(this.canvas, data.UUID);
	this.setupGameListeners()
	console.log(data.UUID, this.gameManager)
  }

  private setupGameListeners(): void {
	if (!this.gameManager) return;

	this.gameManager.addListener((gameState) => {
	  this.updateScore(gameState.player1Score, gameState.player2Score);
	  this.updateGameState(gameState);
	});
  }

  private updateScore(player1Score: number, player2Score: number): void {
	const player1Element = document.querySelector('.text-4xl.tracking-wider') as HTMLElement;
	const player2Element = document.querySelectorAll('.text-4xl.tracking-wider')[1] as HTMLElement;
	
	if (player1Element) {
	  player1Element.textContent = player1Score.toString().padStart(2, '0');
	}
	if (player2Element) {
	  player2Element.textContent = player2Score.toString().padStart(2, '0');
	}
  }

  private updateGameState(gameState: any): void {
	console.log('updateGameState called with:', gameState);
	// Utilisons des sélecteurs plus spécifiques pour éviter les conflits
	const gameOverOverlay = document.querySelector('[data-overlay="game-over"]') as HTMLElement;
	const startOverlay = document.querySelector('[data-overlay="start-game"]') as HTMLElement;
	console.log('Found overlays:', { gameOverOverlay, startOverlay });
	
	// Vérifier si le jeu est terminé
	const isGameOver = gameState.player1Score >= 10 || gameState.player2Score >= 10;
	const winner = isGameOver ? (gameState.player1Score >= 10 ? 'Player 1' : 'Player 2') : null;
	
	if (isGameOver && winner) {
	  // Afficher l'overlay de fin de jeu
	  if (gameOverOverlay) {
		if (this.gameManager)
			this.gameManager = null;

		gameOverOverlay.classList.remove('hidden');
		const winnerText = gameOverOverlay.querySelector('.text-2xl.mb-6.text-\\[\\#00ffff\\]') as HTMLElement;
		if (winnerText) {
		  winnerText.textContent = `${winner} WINS!`;
		}
	  }
	  if (startOverlay) {
		startOverlay.classList.add('hidden');
	  }
	} else if (!gameState.gameRunning && !isGameOver) {
	  // Afficher l'overlay de démarrage seulement si le jeu n'a jamais été lancé (pas en pause)
	  const isPaused = this.gameManager ? this.gameManager.getIsPaused() : false;
	  if (startOverlay && !isPaused) {
		startOverlay.classList.remove('hidden');
	  } else if (startOverlay && isPaused) {
		startOverlay.classList.add('hidden');
	  }
	  if (gameOverOverlay) {
		gameOverOverlay.classList.add('hidden');
	  }
	} else if (gameState.gameRunning) {
	  // Cacher tous les overlays pendant le jeu
	  if (startOverlay) {
		startOverlay.classList.add('hidden');
	  }
	  if (gameOverOverlay) {
		gameOverOverlay.classList.add('hidden');
	  }
	}
  }

  private startGame(): void {
	console.log('startGame() called');
	if (this.gameManager) {
	  console.log('GameManager exists, calling startGame()');
	  
	  this.gameManager.startGame();
	} else {
	  console.log('GameManager is null!');
	}
  }

  private pauseGame(): void {
	if (this.gameManager) {
	  this.gameManager.pauseGame();
	}
  }

  private resetGame(): void {
	if (this.gameManager) {
	  this.gameManager.resetGame();
	}
  }
}