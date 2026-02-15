import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_HEIGHT } from './Data.js';

/**
 * AI opponent for Pong game
 * Uses ball trajectory prediction with configurable difficulty
 */
export class Ai {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty.toLowerCase();
    this.config = this.getDifficultyConfig(this.difficulty);

    // Prediction state
    this.prediction = null;
    this.predictionAge = 0;
  }

  getDifficultyConfig(difficulty) {
    const configs = {
      easy: {
        reactionTime: 30,        // Frames before reacting (0.5 seconds at 60fps)
        maxError: 80,            // Maximum prediction error (pixels)
        updateFrequency: 20,     // Frames between prediction updates
        deadZone: 30,            // Stop moving when this close to target
      },
      medium: {
        reactionTime: 15,
        maxError: 50,
        updateFrequency: 10,
        deadZone: 20,
      },
      hard: {
        reactionTime: 5,
        maxError: 20,
        updateFrequency: 5,
        deadZone: 10,
      }
    };

    return configs[difficulty] || configs.medium;
  }

  /**
   * Main method: calculates the direction the AI paddle should move
   * @returns {number} Direction: -1 (up), 0 (stay), 1 (down)
   */
  calculateMove(ball, paddle) {
    // If ball is moving away from AI, return to center
    if (ball.velocityX < 0) {
      this.prediction = null;
      this.predictionAge = 0;
      return this.moveTowardsCenter(paddle);
    }

    // Ball is coming towards AI - update prediction
    this.updatePrediction(ball, paddle);

    // After reaction delay passes, start moving towards prediction
    if (this.predictionAge >= this.config.reactionTime && this.prediction) {
      return this.moveTowardsPrediction(paddle);
    }

    // During reaction delay - don't move
    return 0;
  }

  updatePrediction(ball, paddle) {
    this.predictionAge++;

    const shouldUpdate =
      !this.prediction ||
      (this.prediction.velocityX * ball.velocityX < 0) || // Ball bounced
      (this.predictionAge % this.config.updateFrequency === 0);

    if (shouldUpdate) {
      this.calculatePrediction(ball, paddle);
    }
  }

  calculatePrediction(ball, paddle) {
    // For easy mode, just track current ball position with error
    if (this.difficulty === 'easy') {
      const error = (Math.random() - 0.5) * 2 * this.config.maxError;
      const targetY = ball.y + error;

      this.prediction = {
        y: Math.max(PADDLE_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT / 2, targetY)),
        velocityX: ball.velocityX
      };
      return;
    }

    // Simulate ball trajectory (medium/hard mode)
    let simX = ball.x;
    let simY = ball.y;
    let simVelX = ball.velocityX;
    let simVelY = ball.velocityY;

    const targetX = paddle.x;
    const maxIterations = 1000;
    let iterations = 0;

    while (simX < targetX && iterations < maxIterations) {
      simX += simVelX;
      simY += simVelY;

      // Handle wall bounces
      if (simY <= 0 || simY >= CANVAS_HEIGHT) {
        simVelY = -simVelY;
        if (simY <= 0) simY = -simY;
        if (simY >= CANVAS_HEIGHT) simY = 2 * CANVAS_HEIGHT - simY;
      }

      iterations++;
    }

    // Add error based on distance (farther = more error)
    const distanceToPaddle = targetX - ball.x;
    const closeness = Math.max(0, Math.min(1, distanceToPaddle / CANVAS_WIDTH));
    const randomError = (Math.random() - 0.5) * 2 * this.config.maxError * closeness;
    simY += randomError;

    // Clamp to valid positions
    simY = Math.max(PADDLE_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT / 2, simY));

    this.prediction = {
      y: simY,
      velocityX: ball.velocityX
    };
  }

  moveTowardsPrediction(paddle) {
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const diff = this.prediction.y - paddleCenter;

    if (Math.abs(diff) < this.config.deadZone) {
      return 0;
    }

    return diff < 0 ? -1 : 1;
  }

  moveTowardsCenter(paddle) {
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const center = CANVAS_HEIGHT / 2;
    const diff = center - paddleCenter;

    if (Math.abs(diff) < this.config.deadZone) {
      return 0;
    }

    return diff < 0 ? -1 : 1;
  }
}
