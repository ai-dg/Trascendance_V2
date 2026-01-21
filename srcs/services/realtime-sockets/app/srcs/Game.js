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

    this.playersReady = {
      player1: false,
      player2: false
    };

    this.playerInputs = {
      paddle1Dir: 0,
      paddle2Dir: 0
    };

    // Initialiser les composants du jeu
    this.paddle1 = new Paddle(INITIAL_PADDLE1_STATE);
    this.paddle2 = new Paddle(INITIAL_PADDLE2_STATE);
    this.ball = new Ball(INITIAL_BALL_STATE, this.settings.ballSpeed);
    this.score = new Score(this.settings.winningScore);
    this.gameRunning = false;

    // Initialiser la balle avec une vélocité alatoire
    this.ball.reset();
  }


  setPlayerReady(playerNum) {
    if (playerNum === 1) this.playersReady.player1 = true;
    if (playerNum === 2) this.playersReady.player2 = true;
    if (playerNum === 3) {
      this.playersReady.player1 = true;
      this.playersReady.player2 = true;
    }

    this.socket.emit(this.uuid, {
      type: "ready-status",
      player1Ready: this.playersReady.player1,
      player2Ready: this.playersReady.player2
    });

    if (this.playersReady.player1 && this.playersReady.player2) {
      this.startCountdown();
    }
  }


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

  ///////////////////////////////////////////
  ///////// FUNCTIONS GAME LOGIC ////////////
  ///////////////////////////////////////////

  startGame() {
    console.log('Game.startGame() called');
    this.gameRunning = true;
    this.score.winner = null;
    this.socket.emit(this.uuid, { type: "game-start" });
    this.gameLoop();
  }

  pauseGame() {
    this.gameRunning = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    this.socket.emit(this.uuid, { type: "game-paused", state : this.getGameState() });
  }

  resumeGame() {
    if (this.gameRunning)
      return;

    this.gameRunning = true;

    this.socket.emit(this.uuid, { type: "game-start" });
    this.gameLoop();
  }

  resetGame() {
    this.score.reset();
    this.gameRunning = false;
    this.paddle1.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.paddle2.reset(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    this.ball.reset();

    this.playerInputs = {
      paddle1Dir: 0,
      paddle2Dir: 0
    };

    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }

    this.playersReady = {
      player1: false,
      player2: false
    };

    this.socket.emit(this.uuid, { type: "game-reset", state : this.getGameState() });
  }


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

  ///////// PLAYER INPUTS /////////
  updatePlayerMove(paddle1Dir, paddle2Dir) {
    this.playerInputs.paddle1Dir = paddle1Dir;
    this.playerInputs.paddle2Dir = paddle2Dir;
  }

  applyPlayerMoves() {
    const speed = this.settings.paddleSpeed;
    this.paddle1.move(this.playerInputs.paddle1Dir, speed);
    this.paddle2.move(this.playerInputs.paddle2Dir, speed);
  }

  update() {
    this.applyPlayerMoves();
    this.ball.update();
    this.ball.checkWallCollision();

    // Check paddle1 collision (left paddle)
    if (this.paddle1.checkCollisionWithBall(this.ball)) {
      // Only reverse if ball is moving towards the paddle
      if (this.ball.velocityX < 0) {
        this.ball.reverseX();
        this.ball.addRandomYVelocity();
        // Push ball out of paddle to prevent sticking
        this.ball.x = this.paddle1.x + this.paddle1.width;
      }
    }

    // Check paddle2 collision (right paddle)
    if (this.paddle2.checkCollisionWithBall(this.ball)) {
      // Only reverse if ball is moving towards the paddle
      if (this.ball.velocityX > 0) {
        this.ball.reverseX();
        this.ball.addRandomYVelocity();
        // Push ball out of paddle to prevent sticking
        this.ball.x = this.paddle2.x - this.ball.size;
      }
    }

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

    this.socket.emit(this.uuid, {
      type: "game-update",
      state: this.getGameState()
    });
  }

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

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.ballSpeed !== undefined) {
      this.ball.ballSpeed = newSettings.ballSpeed;
    }
    if (newSettings.winningScore !== undefined) {
      this.score.winningScore = newSettings.winningScore;
    }
  }

  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }
}
