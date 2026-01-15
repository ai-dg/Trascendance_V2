export class Score {
  constructor(winningScore) {
    this.player1Score = 0;
    this.player2Score = 0;
    this.winningScore = winningScore;
    this.winner = null;
  }

  // Incrémente le score du joueur 1
  incrementPlayer1() {
    this.player1Score++;
    this.checkWinner();
  }

  // Incrémente le score du joueur 2
  incrementPlayer2() {
    this.player2Score++;
    this.checkWinner();
  }

  // Vérifie s'il y a un gagnant
  checkWinner() {
    if (this.player1Score >= this.winningScore) {
      this.winner = 'Player 1';
      return true;
    } else if (this.player2Score >= this.winningScore) {
      this.winner = 'Player 2';
      return true;
    }
    return false;
  }

  // Retourne le gagnant (ou null si pas de gagnant)
  getWinner() {
    return this.winner;
  }

  // Vérifie si le jeu est terminé
  isGameOver() {
    return this.winner !== null;
  }

  // Réinitialise les scores
  reset() {
    this.player1Score = 0;
    this.player2Score = 0;
    this.winner = null;
  }

  // Retourne l'état actuel du score
  getState() {
    return {
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      winner: this.winner
    };
  }
}
