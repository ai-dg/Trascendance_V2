import { gameSocket } from "../app.js";
//import { INITIAL_READY_STATE } from "../../../realtime-sockets/app/srcs/Data.js";
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
        this.hasStarted = false;
        this.isReady = false;
        this.isPaused = false;
        this.onKeyDown = null;
        this.onKeyUp = null;
        // A garder ?
        this.playersReadyStatus = {
            player1: false,
            player2: false
        };
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
    destroy() {
        this.stopInputLoop();
        if (this.onKeyDown)
            window.removeEventListener('keydown', this.onKeyDown);
        if (this.onKeyUp)
            window.removeEventListener('keyup', this.onKeyUp);
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
    getHasStarted() {
        return this.hasStarted;
    }
    //////////////////////////////////////////
    /////// SETUP SOCKET LISTENERS //////////
    /////////////////////////////////////////
    setupSocketListeners() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        gameSocket.on(this.gameUID, (data) => {
            if (!data?.type)
                return;
            if (data.type === "ready-status") {
                this.playersReadyStatus = {
                    player1: data.player1Ready,
                    player2: data.player2Ready
                };
                this.drawReadyScreen();
            }
            else if (data.type === "countdown")
                this.drawCountdown(data.count);
            else if (data.type === "game-start")
                this.startGame();
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
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.getGameState()));
    }
    //////////////////////////////////////////
    ///// SEND ACTIONS TO THE BACKEND //////
    /////////////////////////////////////////
    static requestGameID(type, options = {}) {
        if (!gameSocket)
            throw Error("gameSocket is not ready");
        gameSocket.emit("game-request", { type, ...options });
    }
    setReady() {
        if (this.isReady)
            return;
        this.isReady = true;
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        gameSocket.emit(this.gameUID, {
            action: "player-ready",
            player: 3 // Pour le mode local et IA, on simule les 2 joueurs prêts // plus tard, pour les jeux a deux, on implémentera le numero du joueur a envoyer en fonction de l'attribution du placement...
        });
        this.hasStarted = true;
    }
    pauseGame() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.isPaused = true;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "pause-game" });
    }
    resumeGame() {
        if (!gameSocket || !this.gameUID)
            throw Error("gameSocket is not ready");
        this.isPaused = false;
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "resume-game" });
    }
    resetGame() {
        if (!this.gameUID || !gameSocket)
            throw Error("Error with game socket!");
        this.isReady = false;
        this.isPaused = false;
        this.hasStarted = false;
        this.stopInputLoop();
        this.notifyListeners();
        gameSocket.emit(this.gameUID, { action: "reset-game" });
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
        this.isPaused = true;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    handleServerGameReset(data) {
        this.isReady = false;
        this.isPaused = false;
        this.stopInputLoop();
        if (data?.state) {
            this.gameState = data.state;
            this.draw();
        }
        this.notifyListeners();
    }
    //////////////////////////////////////////
    /////////// GAME LOOP ////////////////////
    /////////////////////////////////////////
    stopInputLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    startInputLoop() {
        if (!this.gameState.gameRunning)
            return;
        this.sendPlayerInputs();
        this.animationId = requestAnimationFrame(() => this.startInputLoop());
    }
    updateGame(data) {
        if (data.state) {
            this.gameState = data.state;
            if (this.gameState.gameRunning)
                this.isPaused = false;
            this.draw();
            this.notifyListeners();
        }
    }
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
    drawReadyScreen() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        // Titre
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Waiting for players...', this.CANVAS_WIDTH / 2, 150);
        // Status Player 1
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = this.playersReadyStatus.player1 ? '#00ff00' : '#ff0000';
        this.ctx.fillText(`Player 1: ${this.playersReadyStatus.player1 ? 'READY ✓' : 'NOT READY'}`, this.CANVAS_WIDTH / 2, 220);
        // Status Player 2
        this.ctx.fillStyle = this.playersReadyStatus.player2 ? '#00ff00' : '#ff0000';
        this.ctx.fillText(`Player 2: ${this.playersReadyStatus.player2 ? 'READY ✓' : 'NOT READY'}`, this.CANVAS_WIDTH / 2, 260);
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
}
