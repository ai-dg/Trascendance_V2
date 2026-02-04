export class WebsocketManager {
    constructor() {
        this.generalSocket = null;
        this.gameSocket = null;
        this.onGameReconnectCallback = null;
        this.gameSocketWasConnected = false;
        this.chatNotifications = new Map();
    }
    static getInstance() {
        if (!WebsocketManager.instance) {
            WebsocketManager.instance = new WebsocketManager();
        }
        return WebsocketManager.instance;
    }
    setWebsocketManager(manager) {
        WebsocketManager.instance = manager;
        this.setupDefaultListeners();
    }
    init(origin) {
        const options = {
            path: "/realtime-sockets/socket.io/",
            transports: ['websocket', 'polling'],
            withCredentials: true
        };
        this.generalSocket = io(origin, options);
        this.gameSocket = io(`${origin}/game`, options);
        this.setupDefaultListeners();
    }
    /**
     * Set callback to be called when game socket reconnects after a disconnect
     */
    setOnGameReconnect(callback) {
        this.onGameReconnectCallback = callback;
    }
    setupDefaultListeners() {
        this.generalSocket?.on("connect", () => console.log("General socket connected"));
        this.gameSocket?.on("connect", () => {
            console.log("Game socket connected");
            // If we were previously connected and now reconnected, trigger reconnection check
            if (this.gameSocketWasConnected && this.onGameReconnectCallback) {
                console.log("[WebsocketManager] Game socket reconnected - triggering reconnection check");
                this.onGameReconnectCallback();
            }
            this.gameSocketWasConnected = true;
        });
        this.gameSocket?.on("disconnect", (reason) => {
            console.log("[WebsocketManager] Game socket disconnected:", reason);
        });
        this.generalSocket?.on("connect_error", (err) => console.error("Error socket general:", err));
        this.gameSocket?.on("connect_error", (err) => console.error("Error socket game:", err));
    }
    onGeneral(event, callback) {
        this.generalSocket?.off(event);
        this.generalSocket?.on(event, callback);
    }
    offGeneral(event) {
        this.generalSocket?.off(event);
    }
    onGame(event, callback) {
        this.gameSocket?.off(event);
        this.gameSocket?.on(event, callback);
    }
    offGame(event) {
        this.gameSocket?.off(event);
    }
    emitGeneral(event, data) {
        this.generalSocket?.emit(event, data);
    }
    emitGame(event, data) {
        this.gameSocket?.emit(event, data);
    }
    disconnectAll() {
        this.generalSocket?.disconnect();
        this.gameSocket?.disconnect();
    }
    getPendingNotifications() {
        return Array.from(this.chatNotifications.values());
    }
    saveNotification(senderId, username, message) {
        this.chatNotifications.set(Number(senderId), { senderId, username, message });
    }
    clearNotification(senderId) {
        this.chatNotifications.delete(Number(senderId));
    }
}
