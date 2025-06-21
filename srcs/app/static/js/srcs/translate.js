import { getUrl } from './Urls.js'




// manque : win_condition, owner, ready? go !
export const translate = {
  en: {
    translation: {
      canvasJoin: "Please join or create a game or tournament",
      canvasPlay: "Games or tournaments are available! Want to play ?",
      opponentLeaved: "Your opponent left the game! Please wait !",
      newGameAvailable: "A new game is available",
      newTournament: "A new tournament is available",
      ready: "All players connected! Press Ready to start!",
      resume: "All players reconnected! Press Resume to continue!",
      winGame: "Congratulations! You won the game!",
      winTournamentGame: "You won the game! Please wait for your next opponent",
      gameOver: "Game over",
      gameWinnerIs: "won the game!",
      winTounament: "Congratulations! You won the tournament!",
      tournamentWinnerIs: "won the tournament",
      beenBanned: "has been banned",
      modified: "modified",
      deleted: "deleted",
      players : "joueurs",
      cantPlay: "can't play for the moment",
      noGame: "No games waiting...",
      ok: "OK",
      cancel: "Cancel",
      join: "Join"
    }
  },
  fr: {
    translation: {
      canvasJoin: "Veuillez rejoindre ou créer une partie ou un tournoi",
      canvasPlay: "Des parties ou tournois sont disponibles ! Tu veux jouer ?",
      opponentLeaved: "Ton adversaire a quitté la partie ! Merci de patienter !",
      newGameAvailable: "Une nouvelle partie est disponible",
      newTournament: "Un nouveau tournoi est disponible",
      ready: "Tous les joueurs sont connectés ! Appuie sur Prêt pour commencer !",
      resume: "Tous les joueurs sont reconnectés ! Appuie sur Reprendre pour continuer !",
      winGame: "Félicitations ! Tu as gagné la partie !",
      winTournamentGame: "Tu as gagné la partie ! Merci de patienter pour le prochain adversaire",
      gameOver: "Partie terminée",
      gameWinnerIs: "a gagné la partie !",
      winTounament: "Félicitations ! Tu as remporté le tournoi !",
      tournamentWinnerIs: "a remporté le tournoi",
      beenBanned: "a été banni",
      modified: "modifié",
      deleted: "supprimé",
      players: "joueurs",
      cantPlay: "ne peut pas jouer pour le moment",
      noGame: "Aucune partie en attente...",
      ok: "Ok",
      cancel: "Annuler",
      join: "Rejoindre"
    }
  },
  es: {
    translation: {
      canvasJoin: "Únete o crea una partida o torneo",
      canvasPlay: "¡Hay partidas o torneos disponibles! ¿Quieres jugar?",
      opponentLeaved: "¡Tu oponente abandonó la partida! ¡Espera un momento!",
      newGameAvailable: "Hay una nueva partida disponible",
      newTournament: "Hay un nuevo torneo disponible",
      ready: "¡Todos los jugadores están conectados! ¡Pulsa Listo para empezar!",
      resume: "¡Todos los jugadores se reconectaron! ¡Pulsa Reanudar para continuar!",
      winGame: "¡Felicidades! ¡Has ganado la partida!",
      winTournamentGame: "¡Has ganado la partida! Espera al siguiente oponente",
      gameOver: "Fin del juego",
      gameWinnerIs: "¡ganó la partida!",
      winTounament: "¡Felicidades! ¡Has ganado el torneo!",
      tournamentWinnerIs: "ganó el torneo",
      beenBanned: "ha sido expulsado",
      modified: "modificado",
      deleted: "eliminado",
      players: "jugadores",
      cantPlay: "no puede jugar por el momento",
      noGame: "No hay partidas en espera...",
      ok: "Aceptar",
      cancel: "Cancelar",
      join: "Unirse"
    }
  }
};



export function set_language()
{
  let lk = document.querySelector(".langkeeper");
  let lang = lk.getAttribute("data-lang")
  
  if (lang)
    localStorage.setItem("lang",lang)
  return lang
}

