import { App, gameSocket } from "../app.js";
import type { GameState, BallState, GameSettings, PaddleState } from "./TypesManager.js";

export let customGameSettings = null;

export const defaultGameSettings: GameSettings = {
  ballSpeed: 6,
  paddleSpeed: 8,
  winningScore: 10
};

export class GameManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private settings: GameSettings;
  private keys: { [key: string]: boolean } = {};
  private animationId: number | null = null;
  private listeners: ((state: GameState) => void)[] = [];
  private gameUID: string | null = null;

  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 400;
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 80;

  private isReady: boolean = false;
  private playersReadyStatus = {
    player1: false,
    player2: false
  };

  constructor(canvas: HTMLCanvasElement, UUID: string, settings: GameSettings = defaultGameSettings) {
    this.gameUID = UUID;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;

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

    console.log("THIS.GAMEUID: ", this.gameUID);
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  static requestGameID(type: "local" | "ai" | "remote" = "local") {
    if (!gameSocket)
      throw Error("gameSocket is not ready");
    gameSocket.emit("game-request", { type });
  }

  public setReady(): void {
    if (this.isReady) return;

    this.isReady = true;

    if (!gameSocket || !this.gameUID)
      throw Error("gameSocket is not ready");

    gameSocket.emit(this.gameUID, {
      action: "player-ready",
      player: 3 // Pour le mode local et IA, on simule les 2 joueurs prêts // plus tard, pour les jeux a deux, on implémentera le numero du joueur a envoyer en fonction de l'attribution du placement...
    });
  }

  private setupSocketListeners(): void {
    if (!gameSocket || !this.gameUID)
      throw Error("gameSocket is not ready");

    gameSocket.on(this.gameUID, (data) => {
      console.log("Received from backend:", data);

      if (data.type === "ready-status") {
        this.playersReadyStatus = {
          player1: data.player1Ready,
          player2: data.player2Ready
        };
        this.drawReadyScreen();
      }

      if (data.type === "countdown") {
        this.drawCountdown(data.count);
      }

      if (data.type === "game-start") {
        this.startGame();
      }

      if (data.type === "game-update") {
        this.updateGame(data);
      }
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  private drawReadyScreen(): void {
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
    this.ctx.fillText(
      `Player 1: ${this.playersReadyStatus.player1 ? 'READY ✓' : 'NOT READY'}`,
      this.CANVAS_WIDTH / 2,
      220
    );

    // Status Player 2
    this.ctx.fillStyle = this.playersReadyStatus.player2 ? '#00ff00' : '#ff0000';
    this.ctx.fillText(
      `Player 2: ${this.playersReadyStatus.player2 ? 'READY ✓' : 'NOT READY'}`,
      this.CANVAS_WIDTH / 2,
      260
    );
  }

  private drawCountdown(count: number): void {
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

  public startGame(): void {
    console.log('GameManager.startGame() called');
    this.gameState.gameRunning = true;
    this.gameState.winner = null;
    console.log('Game state after start:', this.gameState);
    this.notifyListeners();
    this.gameLoop();
  }

  public pauseGame(): void {
    if (!gameSocket || !this.gameUID) {
      console.error("Cannot pause: gameSocket or gameUID not available");
      return;
    }

    this.gameState.gameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Send pause action to backend
    gameSocket.emit(this.gameUID, {
      action: "pause"
    });

    this.notifyListeners();
  }

  public resumeGame(): void {
    if (!gameSocket || !this.gameUID) {
      console.error("Cannot resume: gameSocket or gameUID not available");
      return;
    }

    // Send resume action to backend
    gameSocket.emit(this.gameUID, {
      action: "resume"
    });

    this.gameState.gameRunning = true;
    this.notifyListeners();
    this.gameLoop();
  }

  public resetGame(): void {
    this.draw();
  }

  private gameLoop(): void {
    if (!this.gameState.gameRunning) return;

    this.updatePlayers();
    this.draw();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  updateGame(data: any): void {
    if (data.state) {
      this.gameState = data.state;
      this.draw();
      this.notifyListeners();
    }
  }

  private updatePlayers(): void {
    if (!this.gameUID || !gameSocket)
      throw Error("Error with game socket!");

    let paddle1 = 0;
    let paddle2 = 0;

    // Update paddles
    if (this.keys['w'])
      paddle1 = -1;
    else if (this.keys['s'])
      paddle1 = 1;

    if (this.keys['arrowup'])
      paddle2 = -1;
    else if (this.keys['arrowdown'])
      paddle2 = 1;

    const state = {
      paddle1,
      paddle2
    };

    if (!gameSocket)
      throw Error("Error with game socket!");
    gameSocket.emit(this.gameUID, { state });
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

    this.ctx.fillRect(
      this.gameState.paddle1.x,
      this.gameState.paddle1.y,
      this.PADDLE_WIDTH,
      this.PADDLE_HEIGHT
    );
    this.ctx.fillRect(
      this.gameState.paddle2.x,
      this.gameState.paddle2.y,
      this.PADDLE_WIDTH,
      this.PADDLE_HEIGHT
    );

    // Draw ball with glow effect
    if (this.gameState.ball) {
      this.ctx.shadowColor = '#ff1493';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = '#ff1493';
      this.ctx.beginPath();
      this.ctx.arc(
        this.gameState.ball.x + this.gameState.ball.size / 2,
        this.gameState.ball.y + this.gameState.ball.size / 2,
        this.gameState.ball.size / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
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
