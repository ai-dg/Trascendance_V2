// Constantes du canvas
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

// Constantes des paddles
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 80;

// Constantes de la balle
export const BALL_SIZE = 8;

// Settings par défaut
export const DEFAULT_SETTINGS = {
  ballSpeed: 3,
  paddleSpeed: 8,
  winningScore: 10
};

// État initial du paddle 1
export const INITIAL_PADDLE1_STATE = {
  x: 20,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

// État initial du paddle 2
export const INITIAL_PADDLE2_STATE = {
  x: CANVAS_WIDTH - 30,
  y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT
};

// État initial de la balle
export const INITIAL_BALL_STATE = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  velocityX: 0,
  velocityY: 0,
  size: BALL_SIZE
};

// Fonction pour obtenir une vélocité initiale aléatoire
export function getRandomBallVelocity(ballSpeed) {
  return {
    velocityX: Math.random() > 0.5 ? ballSpeed : -ballSpeed,
    velocityY: Math.random() * 4 - 2
  };
}
