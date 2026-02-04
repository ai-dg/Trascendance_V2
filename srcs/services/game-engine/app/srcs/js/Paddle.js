import { CANVAS_HEIGHT, PADDLE_HEIGHT } from './Data.js';

export class Paddle {
  constructor(initialState) {
    this.x = initialState.x;
    this.y = initialState.y;
    this.width = initialState.width;
    this.height = initialState.height;
  }

  move(direction, speed) {
    if (direction === -1 && this.y > 0) {
      this.y -= speed;
    } else if (direction === 1 && this.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      this.y += speed;
    }
  }

  checkCollisionWithBall(ball) {
    return ball.x < this.x + this.width &&
           ball.x + ball.size > this.x &&
           ball.y < this.y + this.height &&
           ball.y + ball.size > this.y;
  }

  reset(initialY) {
    this.y = initialY;
  }

  getState() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
