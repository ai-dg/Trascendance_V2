import { Logger } from './Logger.js';
/**
 * Generate or retrieve persistent guest ID for unauthenticated users
 * This ensures guests can reconnect to their games after page refresh
 */
function getOrCreateGuestId() {
    const GUEST_ID_KEY = 'arcade_guest_id';
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
        // Generate a UUID-like identifier
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
}
export class WebsocketManager {
    constructor() {
        this.generalSocket = null;
        this.gameSocket = null;
        this.onGameReconnectCallback = null;
        this.gameSocketWasConnected = false;
        this.chatNotifications = new Map();
        /** Pending game invite to send once new-game UUID is received (invite-from-chat flow) */
        this.pendingGameInvite = null;
        /** Received game invites (persist across navigation so notification is re-shown when returning to Live Chat) */
        this.pendingReceivedGameInvites = new Map();
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
    setPendingGameInvite(friendId, message, toUsername) {
        this.pendingGameInvite = { friendId, message, toUsername };
    }
    getPendingGameInvite() {
        return this.pendingGameInvite;
    }
    clearPendingGameInvite() {
        this.pendingGameInvite = null;
    }
    addPendingReceivedGameInvite(payload) {
        this.pendingReceivedGameInvites.set(payload.inviteId, payload);
    }
    getPendingReceivedGameInvites() {
        return Array.from(this.pendingReceivedGameInvites.values());
    }
    removePendingReceivedGameInvite(inviteId) {
        this.pendingReceivedGameInvites.delete(inviteId);
    }
    init(origin) {
        // Include persistent guest ID for reconnection support
        const guestId = getOrCreateGuestId();
        // Include guest info (nickname and avatar) if available
        const guestNickname = localStorage.getItem('guestNickname');
        const guestAvatar = localStorage.getItem('guestAvatar');
        const generalOptions = {
            path: "/realtime-sockets/socket.io/",
            transports: ['websocket', 'polling'], // WebSocket first for better performance
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        };
        const gameOptions = {
            path: "/remote-players/socket.io/",
            transports: ['websocket', 'polling'], // WebSocket first - critical for real-time games
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            auth: {
                guestId: guestId,
                guestNickname: guestNickname,
                guestAvatar: guestAvatar
            }
        };
        console.log('[WS_AUTH] connecting with withCredentials: true (cookies)');
        this.generalSocket = io(origin, generalOptions);
        this.gameSocket = io(origin, gameOptions);
        this.setupDefaultListeners();
    }
    /**
     * Set callback to be called when game socket reconnects after a disconnect
     */
    setOnGameReconnect(callback) {
        this.onGameReconnectCallback = callback;
    }
    setupDefaultListeners() {
        let generalErrorCount = 0;
        let gameErrorCount = 0;
        this.generalSocket?.on("connect", () => {
            console.log("General socket connected");
            generalErrorCount = 0; // Reset error count on successful connection
        });
        this.gameSocket?.on("connect", () => {
            console.log("Game socket connected");
            gameErrorCount = 0; // Reset error count on successful connection
            // If we were previously connected and now reconnected, trigger reconnection check
            if (this.gameSocketWasConnected && this.onGameReconnectCallback) {
                Logger.log("[WebsocketManager] Game socket reconnected - triggering reconnection check");
                this.onGameReconnectCallback();
            }
            this.gameSocketWasConnected = true;
        });
        this.gameSocket?.on("disconnect", (reason) => {
            Logger.log("[WebsocketManager] Game socket disconnected:", reason);
        });
        // Only log errors after multiple failures (Socket.io retries automatically)
        this.generalSocket?.on("connect_error", (err) => {
            generalErrorCount++;
            if (generalErrorCount > 3) {
                Logger.info("[WebsocketManager] General socket connection failed:", err.message);
            }
        });
        this.gameSocket?.on("connect_error", (err) => {
            gameErrorCount++;
            if (gameErrorCount > 3) {
                Logger.info("[WebsocketManager] Game socket connection failed:", err.message);
            }
        });
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
