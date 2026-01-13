const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;


export class GameManager {
  constructor(socket, data, settings = {
    ballSpeed: 6,
    paddleSpeed: 8,
    winningScore: 10
  }) {
    this.socket = socket;
    this.uuid = data.uuid;
    this.type = data.type;
    this.settings = settings;
    this.gameLoopInterval = null;

    this.playersReady = {
      player1: false,
      player2: false
    };
    
    this.gameState = {
      paddle1: {
        x: 20,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      },
      paddle2: {
        x: CANVAS_WIDTH - 30,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      },
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        velocityX: Math.random() > 0.5 ? settings.ballSpeed : -settings.ballSpeed,
        velocityY: Math.random() * 4 - 2,
        size: 8
      },
      player1Score: 0,
      player2Score: 0,
      gameRunning: false,
      winner: null
    };
  }

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

  startGame() {
    console.log('GameManager.startGame() called');
    this.gameState.gameRunning = true;
    this.gameState.winner = null;
    
    // Prévenir le frontend
    this.socket.emit(this.uuid, { type: "game-start" });
    
    this.gameLoop();
  }

  resetBall() {
    this.gameState.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      velocityX: Math.random() > 0.5 ? this.settings.ballSpeed : -this.settings.ballSpeed,
      velocityY: Math.random() * 4 - 2,
      size: 8
    };
  }

  pauseGame() {
    this.gameState.gameRunning = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  resetGame() {
    this.gameState.player1Score = 0;
    this.gameState.player2Score = 0;
    this.gameState.gameRunning = false;
    this.gameState.winner = null;
    this.gameState.paddle1.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.paddle2.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.resetBall();
  }

  gameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    
    // 60 FPS = ~16.67ms par frame
    this.gameLoopInterval = setInterval(() => {
      if (!this.gameState.gameRunning) {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
        return;
      }
      
      this.update();
    }, 1000 / 60); // 60 FPS
  }

  updatePlayerMove(paddle1Dir, paddle2Dir) {
    const speed = this.settings.paddleSpeed;
    
    // Paddle 1
    if (paddle1Dir === -1 && this.gameState.paddle1.y > 0) {
      this.gameState.paddle1.y -= speed;
    }
    if (paddle1Dir === 1 && this.gameState.paddle1.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      this.gameState.paddle1.y += speed;
    }
    
    // Paddle 2
    if (paddle2Dir === -1 && this.gameState.paddle2.y > 0) {
      this.gameState.paddle2.y -= speed;
    }
    if (paddle2Dir === 1 && this.gameState.paddle2.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      this.gameState.paddle2.y += speed;
    }
  }

  update() {
    // Update ball position
    this.gameState.ball.x += this.gameState.ball.velocityX;
    this.gameState.ball.y += this.gameState.ball.velocityY;
    
    // Ball collision with top and bottom walls
    if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= CANVAS_HEIGHT) {
      this.gameState.ball.velocityY = -this.gameState.ball.velocityY;
    }
    
    // Ball collision with paddles
    if (this.ballCollidesWithPaddle(this.gameState.paddle1) || 
        this.ballCollidesWithPaddle(this.gameState.paddle2)) {
      this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
      
      // Add some randomness to the Y velocity
      this.gameState.ball.velocityY += (Math.random() - 0.5) * 2;
      
      // Limit Y velocity
      this.gameState.ball.velocityY = Math.max(-8, Math.min(8, this.gameState.ball.velocityY));
    }

    // Ball out of bounds (scoring)
    if (this.gameState.ball.x < 0) {
      this.gameState.player2Score++;
      this.resetBall();
      this.checkWinner();
    } else if (this.gameState.ball.x > CANVAS_WIDTH) {
      this.gameState.player1Score++;
      this.resetBall();
      this.checkWinner();
    }
    
    // Send state to frontend
    this.socket.emit(this.uuid, {
      type: "game-update",
      state: this.gameState
    });
  }

  ballCollidesWithPaddle(paddle) {
    return this.gameState.ball.x < paddle.x + paddle.width &&
           this.gameState.ball.x + this.gameState.ball.size > paddle.x &&
           this.gameState.ball.y < paddle.y + paddle.height &&
           this.gameState.ball.y + this.gameState.ball.size > paddle.y;
  }

  checkWinner() {
    if (this.gameState.player1Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 1';
      this.gameState.gameRunning = false;
    } else if (this.gameState.player2Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 2';
      this.gameState.gameRunning = false;
    }
  }

  getGameState() {
    return { ...this.gameState };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }
}