// GameManager.js


const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;



export class GameManager {
  constructor(socket, uuid, settings = {
    ballSpeed: 6,
    paddleSpeed: 8,
    winningScore: 10
  }) {

    this.settings = settings;
    this.animationId = null;
    this.listeners = [];
    
    this.gameState = {
      player1Score: 0,
      player2Score: 0,
	  paddle1 : {
      x: 20,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },

     paddle2 : {
      x: CANVAS_WIDTH - 30,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },
      gameRunning: false,
      winner: null
    };

    this.initializeGameObjects();
    this.setupEventListeners();
  }

  initializeGameObjects() {
    this.gameState.paddle1 = {
      x: 20,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    };

    this.gameState.paddle2 = {
      x: CANVAS_WIDTH - 30,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    };

    this.resetBall();
  }

  resetBall() {
    this.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      velocityX: Math.random() > 0.5 ? this.settings.ballSpeed : -this.settings.ballSpeed,
      velocityY: Math.random() * 4 - 2,
      size: 8,
      speed: this.settings.ballSpeed
    };
  }


  startGame() {
    console.log('GameManager.startGame() called');
    this.gameState.gameRunning = true;
    this.gameState.winner = null;
    console.log('Game state after start:', this.gameState);
    this.notifyListeners();
    this.gameLoop();
  }

  pauseGame() {
    this.gameState.gameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.notifyListeners();
  }

  resetGame() {
    this.gameState = {
      player1Score: 0,
      player2Score: 0,
      gameRunning: false,
      winner: null
    };
    this.initializeGameObjects();
  
    this.notifyListeners();
  }

  gameLoop() {
    if (!this.gameState.gameRunning) return;

	this.update();    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
}

updatePlayerMove(data){
	
}

update(gameState) {
    // Update paddles
	this.gameState.paddle1.x = gameState.paddle1.x
    this.gameState.paddle1.y = gameState.paddle1.y
   	this.gameState.paddle2.x = gameState.paddle2.x
    this.gameState.paddle2.y = gameState.paddle2.y

	socket.emit(uuid, {action :"game-update", data: moves})

    // Update ball
    this.ball.x += this.ball.velocityX;
    this.ball.y += this.ball.velocityY;

    // Ball collision with top and bottom walls
    if (this.ball.y <= 0 || this.ball.y >= this.CANVAS_HEIGHT) {
      this.ball.velocityY = -this.ball.velocityY;
    }


	const moves = {
		paddle1: this.gameState.paddle1,
		paddle2: this.gameState.paddle2,
		ball: this.ball
	}

    // Ball collision with paddles
    if (this.ballCollidesWithPaddle(this.gameState.paddle1) || this.ballCollidesWithPaddle(this.gameState.paddle2)) {
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
    } else if (this.ball.x > CANVAS_WIDTH) {
      this.gameState.player1Score++;
      this.resetBall();
      this.checkWinner();
    }

  }

  ballCollidesWithPaddle(paddle) {
    return this.ball.x < paddle.x + paddle.width &&
           this.ball.x + this.ball.size > paddle.x &&
           this.ball.y < paddle.y + paddle.height &&
           this.ball.y + this.ball.size > paddle.y;
  }

  checkWinner() {
    if (this.gameState.player1Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 1';
      this.gameState.gameRunning = false;
    } else if (this.gameState.player2Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 2';
      this.gameState.gameRunning = false;
    }
    this.notifyListeners();
  }


  getGameState() {
    return { ...this.gameState };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    this.ball.speed = this.settings.ballSpeed;
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

