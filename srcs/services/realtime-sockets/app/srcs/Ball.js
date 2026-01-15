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

  // Met à jour la position de la balle
  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  // Vérifie et gère les collisions avec les murs (haut et bas)
  checkWallCollision() {
    if (this.y <= 0 || this.y >= CANVAS_HEIGHT) {
      this.reverseY();
      return true;
    }
    return false;
  }

  // Inverse la direction horizontale
  reverseX() {
    this.velocityX = -this.velocityX;
  }

  // Inverse la direction verticale
  reverseY() {
    this.velocityY = -this.velocityY;
  }

  // Ajoute de la variation à la vélocité Y après une collision
  addRandomYVelocity() {
    this.velocityY += (Math.random() - 0.5) * 2;
    // Limite la vélocité Y
    this.velocityY = Math.max(-8, Math.min(8, this.velocityY));
  }

  // Vérifie si la balle est sortie du terrain (gauche ou droite)
  checkOutOfBounds() {
    if (this.x < 0) {
      return 'left'; // Player 2 marque
    } else if (this.x > CANVAS_WIDTH) {
      return 'right'; // Player 1 marque
    }
    return null;
  }

  // Réinitialise la balle au centre avec une nouvelle vélocité
  reset() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    const velocity = getRandomBallVelocity(this.ballSpeed);
    this.velocityX = velocity.velocityX;
    this.velocityY = velocity.velocityY;
  }

  // Retourne l'état actuel de la balle
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
