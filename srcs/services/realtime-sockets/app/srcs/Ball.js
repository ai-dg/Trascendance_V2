import { CANVAS_WIDTH, CANVAS_HEIGHT, getRandomBallVelocity } from './Data.js';

export class Ball {
  constructor(initialState, ballSpeed) {
    this.x = initialState.x;
    this.y = initialState.y;
    this.velocityX = initialState.velocityX;
    this.velocityY = initialState.velocityY;
    this.size = initialState.size;
    this.ballSpeed = ballSpeed;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  checkWallCollision() {
    if (this.y <= 0 || this.y >= CANVAS_HEIGHT) {
      this.reverseY();
      return true;
    }
    return false;
  }

  reverseX() {
    this.velocityX = -this.velocityX;
  }

  reverseY() {
    this.velocityY = -this.velocityY;
  }

  addRandomYVelocity() {
    this.velocityY += (Math.random() - 0.5) * 2;
    // Limite la vélocité Y
    this.velocityY = Math.max(-8, Math.min(8, this.velocityY));
  }

  checkOutOfBounds() {
    if (this.x < 0) {
      return 'left'; // Player 2 marque
    } else if (this.x > CANVAS_WIDTH) {
      return 'right'; // Player 1 marque
    }
    return null;
  }

  reset() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    const velocity = getRandomBallVelocity(this.ballSpeed);
    this.velocityX = velocity.velocityX;
    this.velocityY = velocity.velocityY;
  }

  getState() {
    return {
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      size: this.size
    };
  }
}
