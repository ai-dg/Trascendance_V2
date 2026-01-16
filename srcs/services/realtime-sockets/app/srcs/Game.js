import { Ball } from './Ball.js';
import { Paddle } from './Paddle.js';
import { Score } from './Score.js';
import {
  DEFAULT_SETTINGS,
  INITIAL_PADDLE1_STATE,
  INITIAL_PADDLE2_STATE,
  INITIAL_BALL_STATE,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT
} from './Data.js';

export class Game {
  constructor(socket, data, settings = DEFAULT_SETTINGS) {
    this.socket = socket;
    this.uuid = data.uuid;
    this.type = data.type;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.gameLoopInterval = null;

    // État des joueurs prêts
    this.playersReady = {
      player1: false,
      player2: false
    };
    
    // Stocker les inputs des joueurs
    this.playerInputs = {
      paddle1Dir: 0,
      paddle2Dir: 0
    };
    
    // Initialiser les composants du jeu
    this.paddle1 = new Paddle(INITIAL_PADDLE1_STATE);
    this.paddle2 = new Paddle(INITIAL_PADDLE2_STATE);
    this.ball = new Ball(INITIAL_BALL_STATE, this.settings.ballSpeed);
    this.score = new Score(this.settings.winningScore);
    
    // État du jeu
    this.gameRunning = false;
    
    // Initialiser la balle avec une vélocité aléatoire
    this.ball.reset();
  }

  // Définir un joueur comme prêt
  setPlayerReady(playerNum) {
    if (playerNum === 1) this.playersReady.player1 = true;
    if (playerNum === 2) this.playersReady.player2 = true;
    if (playerNum === 3) {
      this.playersReady.player1 = true;
      this.playersReady.player2 = true;
    }
    
    // Notifie les clients du statut
    this.socket.emit(this.uuid, {
      type: "ready-status",
      player1Ready: this.playersReady.player1,
      player2Ready: this.playersReady.player2
    });
    
    // Si tous sont prêts, lance le countdown
    if (this.playersReady.player1 && this.playersReady.player2) {
      this.startCountdown();
    }
  }

  // Démarre le compte à rebours avant le début du jeu
  startCountdown() {
    let count = 3;
    
    const countdownInterval = setInterval(() => {
      this.socket.emit(this.uuid, {
        type: "countdown",
        count: count
      });
      
      count--;
      
      if (count < 0) {
        clearInterval(countdownInterval);
        this.startGame();
      }
    }, 1000);
  }

  // Démarre le jeu
  startGame() {
    console.log('Game.startGame() called');
    this.gameRunning = true;
    this.score.winner = null;
    
    // Prévenir le frontend
    this.socket.emit(this.uuid, { type: "game-start" });
    
    this.gameLoop();
  }

  // Met en pause le jeu
  pauseGame() {
    this.gameRunning = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  // Réinitialise le jeu
  resetGame() {
    this.score.reset();
    this.gameRunning = false;
    this.paddle1.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.paddle2.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.ball.reset();
  }

  // Boucle principale du jeu (60 FPS)
  gameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    
    // 60 FPS = ~16.67ms par frame
    this.gameLoopInterval = setInterval(() => {
      if (!this.gameRunning) {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
        return;
      }
      
      this.update();
    }, 1000 / 60); // 60 FPS
  }

  // Recevoir et stocker les inputs des joueurs
  updatePlayerMove(paddle1Dir, paddle2Dir) {
    this.playerInputs.paddle1Dir = paddle1Dir;
    this.playerInputs.paddle2Dir = paddle2Dir;
  }

  // Appliquer les mouvements des paddles basés sur les inputs stockés
  applyPlayerMoves() {
    const speed = this.settings.paddleSpeed;
    
    // Déplacer les paddles
    this.paddle1.move(this.playerInputs.paddle1Dir, speed);
    this.paddle2.move(this.playerInputs.paddle2Dir, speed);
  }

  // Met à jour l'état du jeu
  update() {
    // Appliquer les mouvements des joueurs
    this.applyPlayerMoves();
    
    // Mettre à jour la position de la balle
    this.ball.update();
    
    // Vérifier les collisions avec les murs
    this.ball.checkWallCollision();
    
    // Vérifier les collisions avec les paddles
    if (this.paddle1.checkCollisionWithBall(this.ball) || 
        this.paddle2.checkCollisionWithBall(this.ball)) {
      this.ball.reverseX();
      this.ball.addRandomYVelocity();
    }

    // Vérifier si la balle est sortie du terrain (scoring)
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

    // Envoyer l'état au frontend
    this.socket.emit(this.uuid, {
      type: "game-update",
      state: this.getGameState()
    });
  }

  // Retourne l'état complet du jeu
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

  // Met à jour les paramètres du jeu
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    // Mettre à jour la vitesse de la balle si elle a changé
    if (newSettings.ballSpeed !== undefined) {
      this.ball.ballSpeed = newSettings.ballSpeed;
    }
    // Mettre à jour le score gagnant si il a changé
    if (newSettings.winningScore !== undefined) {
      this.score.winningScore = newSettings.winningScore;
    }
  }

  // Nettoie les ressources
  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }
}
