import { gameSocket } from "../app.js";
export class GameManager {
    constructor(canvas, UUID) {
        this.keys = {};
        this.animationId = null;
        this.listeners = [];
        this.gameUID = null;
        this.CANVAS_WIDTH = 800;
        this.CANVAS_HEIGHT = 400;
        this.PADDLE_WIDTH = 10;
        this.PADDLE_HEIGHT = 80;
        this.isReady = false;
        this.isPaused = false;
        this.onKeyDown = null;
        this.onKeyUp = null;
        this.gameUID = UUID;
        this.ctx = canvas.getContext('2d');
        this.gameState = {
            player1Score: 0,
            player2Score: 0,
            paddle1: {
                x: 20,
                y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
            },
            paddle2: {
                x: this.CANVAS_WIDTH - 30,
                y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
            },
            gameRunning: false,
            winner: null
        };
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    static requestGameID(type) {
        console.log(type);
        if (!gameSocket)
            throw Error("gameSocket is not ready");
        gameSocket.emit("game-request", { type });
    }
    //////////////////////////////////////////
    ///////////// GETTERS ////////////////////
    /////////////////////////////////////////
    getGameState() {
        return { ...this.gameState };
    }
    getIsPaused() {
        return this.isPaused;
    }
    //////////////////////////////////////////
    //////// BEGGINING OF THE GAME  //////////
    /////////////////////////////////////////
    setPlayerReady() {
        // if (playerNum === 1) this.playersReady.player1 = true;
        // if (playerNum === 2) this.playersReady.player2 = true;
        // if (playerNum === 3) {
        //   this.playersReady.player1 = true;
        //   this.playersReady.player2 = true;
        // }
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        gameSocket.emit(this.gameUID, {
            type: "ready-status",
            // player1Ready: this.playersReady.player1,
            // player2Ready: this.playersReady.player2
        });
        // Si tous sont prêts, lance le countdown
        // if (this.playersReady.player1 && this.playersReady.player2) {
        //this.startCountdown();
        //}
    }
    // startCountdown() {
    //   let count = 3;
    //   const countdownInterval = setInterval(() => {
    //     if (!gameSocket || !this.gameUID)
    //       throw Error("gameSocket is not ready");
    //     gameSocket.emit(this.gameUID, {
    //       type: "countdown",
    //       count: count
    //     });
    //     count--;
    //     if (count < 0) {
    //       clearInterval(countdownInterval);
    //       this.startGame();
    //     }
    //   }, 1000);
    // }
    //////////////////////////////////////////
    ///// SEND ACTIONS TO THE BACKEND //////
    /////////////////////////////////////////
    setReady() {
        if (this.isReady)
            return;
        this.isReady = true;
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.printCountdownOverlay(false);
        gameSocket.emit(this.gameUID, {
            action: "player-ready",
            player: 3 // Pour le mode local et IA, on simule les 2 joueurs prêts // plus tard, pour les jeux a deux, on implémentera le numero du joueur a envoyer en fonction de l'attribution du placement...
        });
    }
    pauseGame() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.printCountdownOverlay(false);
        this.isPaused = true;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "pause-game" });
    }
    resumeGame() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.printCountdownOverlay(false);
        this.isPaused = false;
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "resume-game" });
    }
    resetGame() {
        if (!this.gameUID || !gameSocket)
            throw Error("Error with game socket!");
        this.printCountdownOverlay(true);
        this.isReady = false;
        this.isPaused = false;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "reset-game" });
    }
    setupSocketListeners() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        gameSocket.on(this.gameUID, (data) => {
            if (!data?.type)
                return;
            if (data.type === "countdown")
                this.handleServerCountdown(data.count);
            else if (data.type === "game-start")
                this.handleServerGameStart();
            else if (data.type === "game-paused")
                this.handleServerGamePaused(data);
            else if (data.type === "game-reset")
                this.handleServerGameReset(data);
            else if (data.type === "game-update")
                this.updateGame(data);
        });
    }
    setupEventListeners() {
        this.onKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
        };
        this.onKeyUp = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    handleServerGameStart() {
        this.printCountdownOverlay(false);
        this.startGame();
    }
    //////////////////////////////////////////
    ///////HANDLE SERVER EVENTS /////////////
    /////////////////////////////////////////
    startGame() {
        this.gameState.gameRunning = true;
        this.isPaused = false;
        this.notifyListeners();
        this.startInputLoop();
    }
    handleServerGamePaused(data) {
        //this.hideCountdownOverlay();
        this.isPaused = true;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    handleServerGameReset(data) {
        //this.hideCountdownOverlay();
        this.isReady = false;
        this.isPaused = false;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    handleServerCountdown(count) {
        const n = typeof count === "number" ? count : Number(count);
        if (!Number.isFinite(n))
            return;
        this.showCountdownOverlay(n);
    }
    stopInputLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    // Boucle pour envoyer les inputs au backend (le backend gère la physique)
    startInputLoop() {
        if (!this.gameState.gameRunning)
            return;
        this.sendPlayerInputs();
        this.animationId = requestAnimationFrame(() => this.startInputLoop());
    }
    // Recevoir et afficher l'état du jeu depuis le backend
    updateGame(data) {
        if (data.state) {
            this.gameState = data.state;
            if (this.gameState.gameRunning)
                this.isPaused = false;
            this.draw();
            this.notifyListeners();
        }
    }
    // Envoyer uniquement les inputs au backend
    sendPlayerInputs() {
        if (!this.gameUID || !gameSocket)
            throw Error("Error with game socket!");
        let paddle1 = 0;
        let paddle2 = 0;
        if (this.keys['s'])
            paddle1 = 1;
        else if (this.keys['w'])
            paddle1 = -1;
        if (this.keys['arrowdown'])
            paddle2 = 1;
        else if (this.keys['arrowup'])
            paddle2 = -1;
        const state = {
            paddle1,
            paddle2
        };
        if (!gameSocket)
            throw Error("Error with game socket!");
        gameSocket.emit(this.gameUID, { state });
    }
    //////////////////////////////////////////
    /////////// GAME DESIGN /////////////////
    /////////////////////////////////////////
    /////////// HIDE OVERLAYS /////////////////
    printCountdownOverlay(print = false) {
        const overlay = document.querySelector('[data-overlay="countdown"]');
        if (overlay) {
            if (print)
                overlay.classList.remove('hidden');
            else
                overlay.classList.add('hidden');
        }
    }
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Draw center line
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.CANVAS_WIDTH / 2, 0);
        this.ctx.lineTo(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        // Draw paddles with glow effect
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(this.gameState.paddle1.x, this.gameState.paddle1.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        this.ctx.fillRect(this.gameState.paddle2.x, this.gameState.paddle2.y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
        // Draw ball with glow effect
        if (this.gameState.ball) {
            this.ctx.shadowColor = '#ff1493';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = '#ff1493';
            this.ctx.beginPath();
            this.ctx.arc(this.gameState.ball.x + this.gameState.ball.size / 2, this.gameState.ball.y + this.gameState.ball.size / 2, this.gameState.ball.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    // private drawReadyScreen(): void {
    //   // Clear canvas
    //   this.ctx.fillStyle = '#000000';
    //   this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    //   // Titre
    //   this.ctx.fillStyle = '#00ffff';
    //   this.ctx.font = '48px Arial';
    //   this.ctx.textAlign = 'center';
    //   this.ctx.fillText('Waiting for players...', this.CANVAS_WIDTH / 2, 150);
    //   // Status Player 1
    //   this.ctx.font = '24px Arial';
    //   this.ctx.fillStyle = this.playersReadyStatus.player1 ? '#00ff00' : '#ff0000';
    //   this.ctx.fillText(
    //     `Player 1: ${this.playersReadyStatus.player1 ? 'READY ✓' : 'NOT READY'}`,
    //     this.CANVAS_WIDTH / 2,
    //     220
    //   );
    //   // Status Player 2
    //   this.ctx.fillStyle = this.playersReadyStatus.player2 ? '#00ff00' : '#ff0000';
    //   this.ctx.fillText(
    //     `Player 2: ${this.playersReadyStatus.player2 ? 'READY ✓' : 'NOT READY'}`,
    //     this.CANVAS_WIDTH / 2,
    //     260
    //   );
    // }
    showCountdownOverlay(count) {
        const overlay = document.querySelector('[data-overlay="countdown"]');
        const text = overlay?.querySelector('[data-countdown="value"]');
        if (overlay && text) {
            text.textContent = String(count);
            overlay.classList.remove('hidden');
            return;
        }
        this.drawCountdown(count);
    }
    drawCountdown(count) {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Countdown number
        this.ctx.fillStyle = '#ff1493';
        this.ctx.font = 'bold 120px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff1493';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(count.toString(), this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 40);
        this.ctx.shadowBlur = 0;
    }
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.getGameState()));
    }
    destroy() {
        this.stopInputLoop();
        if (this.onKeyDown)
            window.removeEventListener('keydown', this.onKeyDown);
        if (this.onKeyUp)
            window.removeEventListener('keyup', this.onKeyUp);
    }
}
