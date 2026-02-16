// Canvas constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

// Paddle constants
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 80;

// Ball constants
export const BALL_SIZE = 8;

// Default settings
export const DEFAULT_SETTINGS = {
  ballSpeed: 3,
  paddleSpeed: 8,
  winningScore: 10
};

// Initial paddle 1 state
export const INITIAL_PADDLE1_STATE = {
  x: 20,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

// Initial paddle 2 state
export const INITIAL_PADDLE2_STATE = {
  x: CANVAS_WIDTH - 30,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

// Initial ball state
export const INITIAL_BALL_STATE = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  velocityX: 0,
  velocityY: 0,
  size: BALL_SIZE
};

// Random initial ball velocity
export function getRandomBallVelocity(ballSpeed) {
  return {
    velocityX: Math.random() > 0.5 ? ballSpeed : -ballSpeed,
    velocityY: Math.random() * 4 - 2
  };
}
