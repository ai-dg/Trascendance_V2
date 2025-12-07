const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;

/**
 * GameManager - Gère la logique complète d'une partie de Pong côté serveur
 * 
 * Cette classe est responsable de :
 * - Gérer l'état du jeu (positions, scores, etc.)
 * - Calculer la physique (mouvement de la balle, collisions)
 * - Synchroniser l'état avec le(s) client(s) via Socket.IO
 * - Gérer le cycle de vie de la partie (ready, countdown, jeu, fin)
 */
export class GameManager {
  /**
   * Constructeur du GameManager
   * @param {Socket} socket - Socket Socket.IO pour communiquer avec le(s) client(s)
   * @param {Object} data - Données de la partie (uuid, type)
   * @param {Object} settings - Paramètres du jeu (vitesses, score gagnant)
   */
  constructor(socket, data, settings = {
    ballSpeed: 6,
    paddleSpeed: 8,
    winningScore: 10
  }) {
    // Socket pour communiquer avec le(s) client(s)
    this.socket = socket;
    
    // UUID unique de la partie - utilisé comme channel Socket.IO
    this.uuid = data.uuid;
    
    // Type de partie : "local", "ai", ou "remote"
    this.type = data.type;
    
    // Paramètres de jeu configurables
    this.settings = settings;
    
    // Référence à l'interval de la boucle de jeu (60 FPS)
    this.gameLoopInterval = null;

    // Statut de préparation des joueurs
    // Pour le mode local, les 2 joueurs sont considérés prêts en même temps
    this.playersReady = {
      player1: false,
      player2: false
    };
    
    // État complet du jeu - synchronisé avec le frontend
    this.gameState = {
      // Raquette du joueur 1 (gauche)
      paddle1: {
        x: 20,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      },
      // Raquette du joueur 2 (droite)
      paddle2: {
        x: CANVAS_WIDTH - 30,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
      },
      // Balle avec position et vélocité
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        // Direction aléatoire au départ (gauche ou droite)
        velocityX: Math.random() > 0.5 ? settings.ballSpeed : -settings.ballSpeed,
        // Angle vertical aléatoire
        velocityY: Math.random() * 4 - 2,
        size: 8
      },
      player1Score: 0,
      player2Score: 0,
      gameRunning: false,
      winner: null
    };
  }

  /**
   * Marque un ou plusieurs joueurs comme prêts
   * @param {number} playerNum - 1 = joueur 1, 2 = joueur 2, 3 = les deux (mode local)
   * 
   * Workflow :
   * 1. Met à jour le statut de préparation
   * 2. Envoie le statut au(x) client(s)
   * 3. Si tous sont prêts, démarre le compte à rebours
   */
  setPlayerReady(playerNum) {
    // Joueur 1 uniquement
    if (playerNum === 1)
      this.playersReady.player1 = true;
    
    // Joueur 2 uniquement
    if (playerNum === 2)
      this.playersReady.player2 = true;
    
    // Les deux joueurs (utilisé en mode local où un seul client contrôle les 2)
    if (playerNum === 3) {
      this.playersReady.player1 = true;
      this.playersReady.player2 = true;
    }
    
    // Notifie le(s) client(s) du statut de préparation via Socket.IO
    this.socket.emit(this.uuid, {
      type: "ready-status",
      player1Ready: this.playersReady.player1,
      player2Ready: this.playersReady.player2
    });
    
    // Si tous les joueurs sont prêts, lance le compte à rebours
    if (this.playersReady.player1 && this.playersReady.player2) {
      this.startCountdown();
    }
  }

  /**
   * Lance le compte à rebours de 3 secondes avant le début de la partie
   * Envoie chaque seconde le nombre au client pour affichage
   */
  startCountdown() {
    let count = 3;
    
    // Intervalle de 1 seconde pour le compte à rebours
    const countdownInterval = setInterval(() => {
      // Envoie le chiffre actuel au(x) client(s)
      this.socket.emit(this.uuid, {
        type: "countdown",
        count: count
      });
      
      count--;
      
      // Quand le compte à rebours est terminé (< 0)
      if (count < 0) {
        clearInterval(countdownInterval);
        this.startGame(); // Démarre la partie
      }
    }, 1000);
  }

  /**
   * Démarre la partie
   * - Active le flag gameRunning
   * - Notifie le client
   * - Lance la boucle de jeu à 60 FPS
   */
  startGame() {
    console.log('GameManager.startGame() called');
    this.gameState.gameRunning = true;
    this.gameState.winner = null;
    
    // Prévenir le frontend que le jeu démarre
    this.socket.emit(this.uuid, { type: "game-start" });
    
    // Lance la boucle de jeu (60 FPS)
    this.gameLoop();
  }

  /**
   * Réinitialise la balle au centre avec une direction aléatoire
   * Appelé après chaque point marqué
   */
  resetBall() {
    this.gameState.ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      // Direction horizontale aléatoire (gauche ou droite)
      velocityX: Math.random() > 0.5 ? this.settings.ballSpeed : -this.settings.ballSpeed,
      // Angle vertical aléatoire entre -2 et +2
      velocityY: Math.random() * 4 - 2,
      size: 8
    };
  }

  /**
   * Met le jeu en pause
   * - Arrête le flag gameRunning
   * - Stoppe la boucle de jeu
   */
  pauseGame() {
    this.gameState.gameRunning = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  /**
   * Réinitialise complètement la partie
   * - Remet les scores à 0
   * - Repositionne les raquettes au centre
   * - Réinitialise la balle
   */
  resetGame() {
    this.gameState.player1Score = 0;
    this.gameState.player2Score = 0;
    this.gameState.gameRunning = false;
    this.gameState.winner = null;
    this.gameState.paddle1.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.gameState.paddle2.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    this.resetBall();
  }

  /**
   * Boucle de jeu principale - Tourne à 60 FPS
   * 
   * Cette méthode est le cœur du jeu :
   * - S'exécute 60 fois par seconde (toutes les 16.67ms)
   * - Appelle update() pour calculer la physique
   * - S'arrête automatiquement si gameRunning devient false
   */
  gameLoop() {
    // Nettoie l'ancien interval s'il existe
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    
    // Crée un nouvel interval à 60 FPS (16.67ms par frame)
    this.gameLoopInterval = setInterval(() => {
      // Si le jeu n'est plus en cours, arrête la boucle
      if (!this.gameState.gameRunning) {
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
        return;
      }
      
      // Met à jour la physique et envoie l'état au client
      this.update();
    }, 1000 / 60); // 60 FPS = 1000ms / 60 frames = ~16.67ms par frame
  }

  /**
   * Met à jour la position des raquettes selon les inputs des joueurs
   * 
   * @param {number} paddle1Dir - Direction de la raquette 1 (-1 = haut, 0 = immobile, 1 = bas)
   * @param {number} paddle2Dir - Direction de la raquette 2 (-1 = haut, 0 = immobile, 1 = bas)
   * 
   * Note: Les inputs viennent du frontend via Socket.IO
   */
  updatePlayerMove(paddle1Dir, paddle2Dir) {
    const speed = this.settings.paddleSpeed;
    
    // === Mise à jour de la Raquette 1 (gauche) ===
    // Mouvement vers le haut (-1) avec limite de bordure supérieure
    if (paddle1Dir === -1 && this.gameState.paddle1.y > 0) {
      this.gameState.paddle1.y -= speed;
    }
    // Mouvement vers le bas (1) avec limite de bordure inférieure
    if (paddle1Dir === 1 && this.gameState.paddle1.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      this.gameState.paddle1.y += speed;
    }
    
    // === Mise à jour de la Raquette 2 (droite) ===
    // Mouvement vers le haut (-1) avec limite de bordure supérieure
    if (paddle2Dir === -1 && this.gameState.paddle2.y > 0) {
      this.gameState.paddle2.y -= speed;
    }
    // Mouvement vers le bas (1) avec limite de bordure inférieure
    if (paddle2Dir === 1 && this.gameState.paddle2.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      this.gameState.paddle2.y += speed;
    }
  }

  /**
   * Méthode update() - Calcule toute la physique du jeu
   * 
   * Appelée 60 fois par seconde par gameLoop()
   * Responsabilités :
   * 1. Déplace la balle selon sa vélocité
   * 2. Détecte les collisions avec les murs
   * 3. Détecte les collisions avec les raquettes
   * 4. Gère le scoring
   * 5. Synchronise l'état avec le(s) client(s)
   */
  update() {
    // === 1. MOUVEMENT DE LA BALLE ===
    // Mise à jour de la position selon la vélocité
    this.gameState.ball.x += this.gameState.ball.velocityX;
    this.gameState.ball.y += this.gameState.ball.velocityY;
    
    // === 2. COLLISION AVEC LES MURS (HAUT ET BAS) ===
    // Si la balle touche le plafond ou le sol, inverse la direction verticale
    if (this.gameState.ball.y <= 0 || this.gameState.ball.y >= CANVAS_HEIGHT) {
      this.gameState.ball.velocityY = -this.gameState.ball.velocityY;
    }
    
    // === 3. COLLISION AVEC LES RAQUETTES ===
    // Si la balle touche l'une des deux raquettes
    if (this.ballCollidesWithPaddle(this.gameState.paddle1) || 
        this.ballCollidesWithPaddle(this.gameState.paddle2)) {
      
      // Inverse la direction horizontale (rebond)
      this.gameState.ball.velocityX = -this.gameState.ball.velocityX;
      
      // Ajoute un peu d'aléatoire à l'angle vertical pour varier le jeu
      // Math.random() - 0.5 donne une valeur entre -0.5 et +0.5
      // Multiplié par 2 = entre -1 et +1
      this.gameState.ball.velocityY += (Math.random() - 0.5) * 2;
      
      // Limite la vélocité verticale pour éviter des angles trop extrêmes
      // Ne peut pas dépasser -8 ou +8
      this.gameState.ball.velocityY = Math.max(-8, Math.min(8, this.gameState.ball.velocityY));
    }

    // === 4. SCORING - BALLE HORS LIMITES ===
    // Si la balle sort à gauche (côté joueur 1)
    if (this.gameState.ball.x < 0) {
      this.gameState.player2Score++; // Point pour le joueur 2
      this.resetBall(); // Remet la balle au centre
      this.checkWinner(); // Vérifie si quelqu'un a gagné
    } 
    // Si la balle sort à droite (côté joueur 2)
    else if (this.gameState.ball.x > CANVAS_WIDTH) {
      this.gameState.player1Score++; // Point pour le joueur 1
      this.resetBall(); // Remet la balle au centre
      this.checkWinner(); // Vérifie si quelqu'un a gagné
    }
    
    // === 5. SYNCHRONISATION ===
    // Envoie l'état complet au(x) client(s) via Socket.IO
    // Le client recevra cet événement et mettra à jour l'affichage
    this.socket.emit(this.uuid, {
      type: "game-update",
      state: this.gameState
    });
  }

  /**
   * Détection de collision entre la balle et une raquette
   * 
   * Utilise l'algorithme AABB (Axis-Aligned Bounding Box)
   * Vérifie si les rectangles de la balle et de la raquette se chevauchent
   * 
   * @param {Object} paddle - La raquette à tester (paddle1 ou paddle2)
   * @returns {boolean} true si collision, false sinon
   * 
   * Logique :
   * - Le côté gauche de la balle est avant le côté droit de la raquette
   * - Le côté droit de la balle est après le côté gauche de la raquette
   * - Le haut de la balle est avant le bas de la raquette
   * - Le bas de la balle est après le haut de la raquette
   */
  ballCollidesWithPaddle(paddle) {
    return this.gameState.ball.x < paddle.x + paddle.width &&
           this.gameState.ball.x + this.gameState.ball.size > paddle.x &&
           this.gameState.ball.y < paddle.y + paddle.height &&
           this.gameState.ball.y + this.gameState.ball.size > paddle.y;
  }

  /**
   * Vérifie si un joueur a atteint le score gagnant
   * Si oui, déclare le gagnant et arrête la partie
   */
  checkWinner() {
    if (this.gameState.player1Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 1';
      this.gameState.gameRunning = false;
    } else if (this.gameState.player2Score >= this.settings.winningScore) {
      this.gameState.winner = 'Player 2';
      this.gameState.gameRunning = false;
    }
  }

  /**
   * Retourne une copie de l'état du jeu
   * @returns {Object} Copie de gameState
   */
  getGameState() {
    return { ...this.gameState };
  }

  /**
   * Met à jour les paramètres du jeu
   * @param {Object} newSettings - Nouveaux paramètres à fusionner
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Nettoie les ressources quand la partie est terminée
   * Arrête la boucle de jeu pour libérer la mémoire
   */
  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }
}