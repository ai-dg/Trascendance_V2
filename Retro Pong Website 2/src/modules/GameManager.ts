export interface GameState {
  player1Score: number;
  player2Score: number;
  gameRunning: boolean;
  winner: string | null;
}

export interface PaddleState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  speed: number;
}

export interface GameSettings {
  ballSpeed: number;
  paddleSpeed: number;
  winningScore: number;
}

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private paddle1!: PaddleState;
  private paddle2!: PaddleState;
  private ball!: BallState;
  private settings: GameSettings;
  private keys: { [key: string]: boolean } = {};
  private animationId: number | null = null;
  private listeners: ((state: GameState) => void)[] = [];

  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 400;
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 80;

  constructor(canvas: HTMLCanvasElement, settings: GameSettings = {
    ballSpeed: 6,
    paddleSpeed: 8,
    winningScore: 10
  }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    
    this.gameState = {
      player1Score: 0,
      player2Score: 0,
      gameRunning: false,
      winner: null
    };

    this.initializeGameObjects();
    this.setupEventListeners();
  }

  private initializeGameObjects(): void {
    this.paddle1 = {
      x: 20,
      y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.settings.paddleSpeed
    };

    this.paddle2 = {
      x: this.CANVAS_WIDTH - 30,
      y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
      width: this.PADDLE_WIDTH,
      height: this.PADDLE_HEIGHT,
      speed: this.settings.paddleSpeed
    };

    this.resetBall();
  }

  private resetBall(): void {
    this.ball = {
      x: this.CANVAS_WIDTH / 2,
      y: this.CANVAS_HEIGHT / 2,
      velocityX: Math.random() > 0.5 ? this.settings.ballSpeed : -this.settings.ballSpeed,
      velocityY: Math.random() * 4 - 2,
      size: 8,
      speed: this.settings.ballSpeed
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public startGame(): void {
    console.log('GameManager.startGame() called');
    this.gameState.gameRunning = true;
    this.gameState.winner = null;
    console.log('Game state after start:', this.gameState);
    this.notifyListeners();
    this.gameLoop();
  }

  public pauseGame(): void {
    this.gameState.gameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.notifyListeners();
  }

  public resetGame(): void {
    this.gameState = {
      player1Score: 0,
      player2Score: 0,
      gameRunning: false,
      winner: null
    };
    this.initializeGameObjects();
    this.draw();
    this.notifyListeners();
  }

  private gameLoop(): void {
    if (!this.gameState.gameRunning) return;

    this.update();
    this.draw();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    // Update paddles
    if (this.keys['w'] && this.paddle1.y > 0) {
      this.paddle1.y -= this.paddle1.speed;
    }
    if (this.keys['s'] && this.paddle1.y < this.CANVAS_HEIGHT - this.paddle1.height) {
      this.paddle1.y += this.paddle1.speed;
    }
    if (this.keys['arrowup'] && this.paddle2.y > 0) {
      this.paddle2.y -= this.paddle2.speed;
    }
    if (this.keys['arrowdown'] && this.paddle2.y < this.CANVAS_HEIGHT - this.paddle2.height) {
      this.paddle2.y += this.paddle2.speed;
    }

    // Update ball
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    // Ball collision with top and bottom walls
    if (this.ball.y <= 0 || this.ball.y >= this.CANVAS_HEIGHT) {
      this.ball.velocityY = -this.ball.velocityY;
    }

    // Ball collision with paddles
    if (this.ballCollidesWithPaddle(this.paddle1) || this.ballCollidesWithPaddle(this.paddle2)) {
      this.ball.velocityX = -this.ball.velocityX;
      
      // Add some randomness to the Y velocity
      this.ball.velocityY += (Math.random() - 0.5) * 2;
      
      // Limit Y velocity
      this.ball.velocityY = Math.max(-8, Math.min(8, this.ball.velocityY));
    }

    // Ball out of bounds (scoring)
    if (this.ball.x < 0) {
      this.gameState.player2Score++;
      this.resetBall();
      this.checkWinner();
    } else if (this.ball.x > this.CANVAS_WIDTH) {
      this.gameState.player1Score++;
      this.resetBall();
      this.checkWinner();
    }
  }

  private ballCollidesWithPaddle(paddle: PaddleState): boolean {
    return this.ball.x < paddle.x + paddle.width &&
           this.ball.x + this.ball.size > paddle.x &&
           this.ball.y < paddle.y + paddle.height &&
           this.ball.y + this.ball.size > paddle.y;
  }

  private checkWinner(): void {
    if (this.gameState.player1Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 1';
      this.gameState.gameRunning = false;
    } else if (this.gameState.player2Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 2';
      this.gameState.gameRunning = false;
    }
    this.notifyListeners();
  }

  private draw(): void {
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
    
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

    // Draw ball with glow effect
    this.ctx.shadowColor = '#ff1493';
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = '#ff1493';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x + this.ball.size/2, this.ball.y + this.ball.size/2, this.ball.size/2, 0, Math.PI * 2);
    this.ctx.fill();

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.paddle1.speed = this.settings.paddleSpeed;
    this.paddle2.speed = this.settings.paddleSpeed;
    this.ball.speed = this.settings.ballSpeed;
  }

  public addListener(callback: (state: GameState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    console.log('notifyListeners called, listeners count:', this.listeners.length);
    this.listeners.forEach(callback => callback(this.getGameState()));
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('keydown', this.setupEventListeners);
    window.removeEventListener('keyup', this.setupEventListeners);
  }
}