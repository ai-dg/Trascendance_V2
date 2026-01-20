export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 80;

export const BALL_SIZE = 8;

export const DEFAULT_SETTINGS = {
  ballSpeed: 6,
  paddleSpeed: 8,
  winningScore: 10
};

export const INITIAL_PADDLE1_STATE = {
  x: 20,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

export const INITIAL_PADDLE2_STATE = {
  x: CANVAS_WIDTH - 30,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

export const INITIAL_BALL_STATE = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  velocityX: 0,
  velocityY: 0,
  size: BALL_SIZE
};

export const INITIAL_READY_STATE = {
  player1: false,
  player2: false
};

export function getRandomBallVelocity(ballSpeed) {
  return {
    velocityX: Math.random() > 0.5 ? ballSpeed : -ballSpeed,
    velocityY: Math.random() * 4 - 2
  };
}
