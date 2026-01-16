# Architecture du Jeu Pong - Realtime Sockets

## Vue d'ensemble

Le système de jeu a été refactorisé en plusieurs modules pour améliorer la maintenabilité et la clarté du code.

## Structure des fichiers

### 📄 Data.js
**Rôle**: Contient toutes les constantes et configurations du jeu

**Exports**:
- `CANVAS_WIDTH`, `CANVAS_HEIGHT` - Dimensions du canvas
- `PADDLE_WIDTH`, `PADDLE_HEIGHT` - Dimensions des paddles
- `BALL_SIZE` - Taille de la balle
- `DEFAULT_SETTINGS` - Paramètres par défaut (vitesse, score gagnant)
- `INITIAL_PADDLE1_STATE`, `INITIAL_PADDLE2_STATE` - États initiaux des paddles
- `INITIAL_BALL_STATE` - État initial de la balle
- `getRandomBallVelocity()` - Fonction pour générer une vélocité aléatoire

### 🎱 Ball.js
**Rôle**: Gère la physique et le comportement de la balle

**Classe**: `Ball`

**Méthodes principales**:
- `update()` - Met à jour la position de la balle
- `checkWallCollision()` - Détecte les collisions avec les murs
- `reverseX()`, `reverseY()` - Inverse la direction
- `addRandomYVelocity()` - Ajoute de la variation après collision
- `checkOutOfBounds()` - Vérifie si la balle est sortie (scoring)
- `reset()` - Réinitialise la balle au centre
- `getState()` - Retourne l'état actuel

### 🏓 Paddle.js
**Rôle**: Gère le mouvement et les collisions des paddles

**Classe**: `Paddle`

**Méthodes principales**:
- `move(direction, speed)` - Déplace le paddle (-1: haut, 0: immobile, 1: bas)
- `checkCollisionWithBall(ball)` - Détecte la collision avec la balle
- `reset(initialY)` - Réinitialise la position
- `getState()` - Retourne l'état actuel

### 🏆 Score.js
**Rôle**: Gère le système de score et la détection du gagnant

**Classe**: `Score`

**Méthodes principales**:
- `incrementPlayer1()`, `incrementPlayer2()` - Incrémente les scores
- `checkWinner()` - Vérifie s'il y a un gagnant
- `getWinner()` - Retourne le gagnant (ou null)
- `isGameOver()` - Vérifie si le jeu est terminé
- `reset()` - Réinitialise les scores
- `getState()` - Retourne l'état actuel

### 🎮 Game.js
**Rôle**: Classe centrale qui orchestre tous les composants

**Classe**: `Game`

**Propriétés**:
- `socket` - Socket pour la communication
- `uuid` - Identifiant unique du jeu
- `type` - Type de jeu (local, multiplayer, etc.)
- `paddle1`, `paddle2` - Instances des paddles
- `ball` - Instance de la balle
- `score` - Instance du score
- `gameRunning` - État du jeu
- `playersReady` - État de préparation des joueurs

**Méthodes principales**:
- `setPlayerReady(playerNum)` - Définit un joueur comme prêt
- `startCountdown()` - Lance le compte à rebours
- `startGame()` - Démarre le jeu
- `pauseGame()` - Met en pause
- `resetGame()` - Réinitialise le jeu
- `gameLoop()` - Boucle principale (60 FPS)
- `updatePlayerMove(paddle1Dir, paddle2Dir)` - Met à jour les inputs
- `applyPlayerMoves()` - Applique les mouvements
- `update()` - Met à jour l'état du jeu
- `getGameState()` - Retourne l'état complet
- `updateSettings(newSettings)` - Met à jour les paramètres
- `destroy()` - Nettoie les ressources

## Flux de données

```
Client (Frontend)
    ↓
Socket.IO
    ↓
server.js
    ↓
Game.js (orchestrateur)
    ↓
├── Ball.js (physique balle)
├── Paddle.js (physique paddles)
├── Score.js (gestion score)
└── Data.js (constantes)
    ↓
Socket.IO (émission état)
    ↓
Client (Frontend)
```

## Utilisation dans server.js

```javascript
import { Game } from './srcs/Game.js';

// Créer une nouvelle instance de jeu
const game = new Game(socket, {
  uuid: uuid,
  type: 'local'
}, {
  ballSpeed: 20,
  paddleSpeed: 8,
  winningScore: 10
});

// Gérer les événements
socket.on(uuid, (data) => {
  if (data.action === "player-ready") {
    game.setPlayerReady(data.player);
  }
  if (data.state) {
    game.updatePlayerMove(data.state.paddle1, data.state.paddle2);
  }
});
```

## Avantages de cette architecture

1. **Séparation des responsabilités**: Chaque classe a un rôle bien défini
2. **Maintenabilité**: Plus facile de modifier une partie sans affecter les autres
3. **Testabilité**: Chaque composant peut être testé indépendamment
4. **Réutilisabilité**: Les classes peuvent être réutilisées dans d'autres contextes
5. **Lisibilité**: Le code est plus clair et mieux organisé

## Migration depuis GameManager

L'ancienne classe `GameManager` a été remplacée par `Game`. Les méthodes publiques restent compatibles:
- `setPlayerReady()` ✅
- `updatePlayerMove()` ✅
- `getGameState()` ✅
- `updateSettings()` ✅
- `destroy()` ✅

## Notes importantes

- Le jeu tourne à 60 FPS (16.67ms par frame)
- Les collisions sont détectées à chaque frame
- Les inputs des joueurs sont stockés et appliqués à chaque update
- Le score est vérifié après chaque point marqué
