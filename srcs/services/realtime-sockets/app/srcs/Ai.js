import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_HEIGHT } from './Data.js';

/**
 * AI opponent for Pong game
 * Improved algorithm inspired by Jake Gordon's Pong AI
 * Key improvements:
 * - Dynamic prediction updates
 * - Closeness-based error margin
 * - Smoother reaction time modeling
 * - Better wall bounce simulation
 */
export class Ai {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty.toLowerCase();
    this.config = this.getDifficultyConfig(this.difficulty);

    // Prediction state
    this.prediction = null;
    this.predictionAge = 0; // Time since last prediction (in frames)
  }

  /**
   * Returns configuration based on difficulty level
   */
  getDifficultyConfig(difficulty) {
    const configs = {
      easy: {
        reactionTime: 30,        // Frames before reacting (0.5 seconds at 60fps)
        maxError: 80,            // Maximum prediction error (pixels)
        updateFrequency: 20,     // Frames between prediction updates
        deadZone: 30,            // Stop moving when this close to target
        speedMultiplier: 0.7     // 70% of player speed
      },
      medium: {
        reactionTime: 15,        // 0.25 seconds
        maxError: 50,            // Moderate error
        updateFrequency: 10,     // Update more frequently
        deadZone: 20,
        speedMultiplier: 0.85    // 85% of player speed
      },
      hard: {
        reactionTime: 5,         // 0.08 seconds
        maxError: 20,            // Small error
        updateFrequency: 5,      // Update very frequently
        deadZone: 10,
        speedMultiplier: 1.0     // Same as player
      }
    };

    return configs[difficulty] || configs.medium;
  }

  /**
   * Main method: calculates the direction the AI paddle should move
   * @param {Ball} ball - The ball object with x, y, velocityX, velocityY
   * @param {Paddle} paddle - The AI's paddle (paddle2) with x, y, height
   * @returns {number} Direction: -1 (up), 0 (stay), 1 (down)
   */
  calculateMove(ball, paddle) {
    // If ball is moving away from AI, stay in place
    if (ball.velocityX < 0) {
      this.prediction = null;
      this.predictionAge = 0;
      return 0; // Don't move
    }

    // Ball is coming towards AI
    // Update prediction if needed
    this.updatePrediction(ball, paddle);

    // Debug logging
    if (this.predictionAge % 60 === 0) { // Log once per second
      console.log(`AI Debug - Age: ${this.predictionAge}, ReactionTime: ${this.config.reactionTime}, HasPrediction: ${!!this.prediction}`);
    }

    // After reaction delay passes, start moving towards prediction
    if (this.predictionAge >= this.config.reactionTime && this.prediction) {
      const direction = this.moveTowardsPrediction(paddle);
      if (this.predictionAge % 60 === 0) {
        console.log(`AI Moving: direction=${direction}, targetY=${this.prediction.y}, paddleY=${paddle.y}`);
      }
      return direction;
    }

    // During reaction delay or no prediction - don't move
    return 0;
  }

  /**
   * Updates the prediction if necessary
   * Only recalculates when:
   * 1. We don't have a prediction yet
   * 2. Ball changed direction (only X direction matters for recalculation)
   * 3. Enough time has passed since last prediction update
   */
  updatePrediction(ball, paddle) {
    // Always increment age
    this.predictionAge++;

    const shouldUpdate =
      !this.prediction || // No prediction yet
      (this.prediction.velocityX * ball.velocityX < 0) || // Direction changed (X) - ball bounced
      (this.predictionAge % this.config.updateFrequency === 0); // Periodic update

    if (shouldUpdate) {
      this.calculatePrediction(ball, paddle);
    }
  }

  /**
   * Calculates where the ball will intercept the paddle's X position
   * Matches Ball.js collision logic exactly for accurate prediction
   */
  calculatePrediction(ball, paddle) {
    // For easy mode, just track current ball position
    if (this.difficulty === 'easy') {
      const error = (Math.random() - 0.5) * 2 * this.config.maxError;
      const targetY = ball.y + error;

      this.prediction = {
        y: Math.max(PADDLE_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT / 2, targetY)),
        velocityX: ball.velocityX,
        velocityY: ball.velocityY
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

    // Simulate until ball reaches paddle's X position
    while (simX < targetX && iterations < maxIterations) {
      simX += simVelX;
      simY += simVelY;

      // Handle wall bounces - match Ball.js checkWallCollision() exactly
      // Ball.js just checks if y <= 0 or y >= CANVAS_HEIGHT and reverses velocity
      if (simY <= 0 || simY >= CANVAS_HEIGHT) {
        simVelY = -simVelY;
        // Clamp position to stay in bounds
        if (simY <= 0) simY = -simY;
        if (simY >= CANVAS_HEIGHT) simY = 2 * CANVAS_HEIGHT - simY;
      }

      iterations++;
    }

    // Calculate error based on distance (closeness factor)
    // When ball is far away, prediction is less accurate
    const distanceToPaddle = targetX - ball.x;
    const courtWidth = CANVAS_WIDTH;
    const closeness = Math.max(0, Math.min(1, distanceToPaddle / courtWidth));
    const error = this.config.maxError * closeness;

    // Apply random error
    const randomError = (Math.random() - 0.5) * 2 * error;
    simY += randomError;

    // Clamp to valid paddle center positions
    const minY = PADDLE_HEIGHT / 2;
    const maxY = CANVAS_HEIGHT - PADDLE_HEIGHT / 2;
    simY = Math.max(minY, Math.min(maxY, simY));

    // Store prediction
    this.prediction = {
      y: simY,
      velocityX: ball.velocityX,
      velocityY: ball.velocityY
    };
  }

  /**
   * Move towards the predicted intercept point
   */
  moveTowardsPrediction(paddle) {
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const targetY = this.prediction.y;
    const diff = targetY - paddleCenter;

    // Dead zone - don't move if we're close enough
    if (Math.abs(diff) < this.config.deadZone) {
      return 0;
    }

    return diff < 0 ? -1 : 1;
  }

  /**
   * Move towards center (used when ball is moving away or during reaction delay)
   */
  moveTowardsCenter(paddle) {
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const center = CANVAS_HEIGHT / 2;
    const diff = center - paddleCenter;

    if (Math.abs(diff) < this.config.deadZone) {
      return 0;
    }

    return diff < 0 ? -1 : 1;
  }

  /**
   * Move towards a specific Y position (used for easy mode)
   */
  moveTowardsY(paddle, targetY) {
    const paddleCenter = paddle.y + PADDLE_HEIGHT / 2;
    const diff = targetY - paddleCenter;

    if (Math.abs(diff) < this.config.deadZone) {
      return 0;
    }

    return diff < 0 ? -1 : 1;
  }

  /**
   * Reset AI state (call when starting a new game)
   */
  resetState() {
    this.prediction = null;
    this.predictionAge = 0;
  }

  /**
   * Get the speed multiplier for this difficulty level
   * @returns {number} Speed multiplier (0.7 to 1.0)
   */
  getSpeedMultiplier() {
    return this.config.speedMultiplier;
  }
}
