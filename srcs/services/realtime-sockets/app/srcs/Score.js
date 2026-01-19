export class Score {
  constructor(winningScore) {
    this.player1Score = 0;
    this.player2Score = 0;
    this.winningScore = winningScore;
    this.winner = null;
  }

  incrementPlayer1() {
    this.player1Score++;
    this.checkWinner();
  }

  incrementPlayer2() {
    this.player2Score++;
    this.checkWinner();
  }

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

  getWinner() {
    return this.winner;
  }

  isGameOver() {
    return this.winner !== null;
  }

  reset() {
    this.player1Score = 0;
    this.player2Score = 0;
    this.winner = null;
  }

  getState() {
    return {
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      winner: this.winner
    };
  }
}
