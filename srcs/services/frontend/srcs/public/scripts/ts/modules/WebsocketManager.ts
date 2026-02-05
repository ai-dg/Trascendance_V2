import type { User } from '../modules/TypesManager.js';
import type { Socket } from "socket.io-client";

declare const io: any;

/**
 * Generate or retrieve persistent guest ID for unauthenticated users
 * This ensures guests can reconnect to their games after page refresh
 */
function getOrCreateGuestId(): string {
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
  private static instance: WebsocketManager;
  public generalSocket: Socket | null = null;
  public gameSocket: Socket | null = null;
  private onGameReconnectCallback: (() => void) | null = null;
  private gameSocketWasConnected: boolean = false;

  public constructor() {}

  public static getInstance(): WebsocketManager {
    if (!WebsocketManager.instance) {
      WebsocketManager.instance = new WebsocketManager();
    }
    return WebsocketManager.instance;
  }

  public setWebsocketManager(manager: WebsocketManager) {
    WebsocketManager.instance = manager;
    this.setupDefaultListeners();
  }

  private chatNotifications = new Map<number, { senderId: number, username: string, message: string }>();

  public init(origin: string) {
    // Include persistent guest ID for reconnection support
    const guestId = getOrCreateGuestId();

    // Include guest info (nickname and avatar) if available
    const guestNickname = localStorage.getItem('guestNickname');
    const guestAvatar = localStorage.getItem('guestAvatar');

    const generalOptions = {
      path: "/realtime-sockets/socket.io/",
      transports: ['websocket', 'polling'],  // WebSocket first for better performance
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    };

    const gameOptions = {
      path: "/remote-players/socket.io/",
      transports: ['websocket', 'polling'],  // WebSocket first - critical for real-time games
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

    this.generalSocket = io(origin, generalOptions);
    this.gameSocket = io(origin, gameOptions);
    this.setupDefaultListeners();
  }

  /**
   * Set callback to be called when game socket reconnects after a disconnect
   */
  public setOnGameReconnect(callback: () => void) {
    this.onGameReconnectCallback = callback;
  }

  private setupDefaultListeners() {
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
        console.log("[WebsocketManager] Game socket reconnected - triggering reconnection check");
        this.onGameReconnectCallback();
      }
      this.gameSocketWasConnected = true;
    });

    this.gameSocket?.on("disconnect", (reason) => {
      console.log("[WebsocketManager] Game socket disconnected:", reason);
    });

    // Only log errors after multiple failures (Socket.io retries automatically)
    this.generalSocket?.on("connect_error", (err) => {
      generalErrorCount++;
      if (generalErrorCount > 3) {
        console.error("[WebsocketManager] General socket persistent connection error:", err.message);
      }
    });
    this.gameSocket?.on("connect_error", (err) => {
      gameErrorCount++;
      if (gameErrorCount > 3) {
        console.error("[WebsocketManager] Game socket persistent connection error:", err.message);
      }
    });
  }

    public onGeneral(event: string, callback: (data: any) => void) {
        this.generalSocket?.off(event);
        this.generalSocket?.on(event, callback);
    }

    public offGeneral(event: string) {
        this.generalSocket?.off(event);
    }

    public onGame(event: string, callback: (data: any) => void) {
        this.gameSocket?.off(event);
        this.gameSocket?.on(event, callback);
    }

    public offGame(event: string) {
        this.gameSocket?.off(event);
    }

    public emitGeneral(event: string, data: any) {
        this.generalSocket?.emit(event, data);
    }

    public emitGame(event: string, data: any) {
      this.gameSocket?.emit(event, data);
    }

    public disconnectAll() {
      this.generalSocket?.disconnect();
      this.gameSocket?.disconnect();
    }

    public getPendingNotifications() {
        return Array.from(this.chatNotifications.values());
    }

    public saveNotification(senderId: number, username: string, message: string) {
        this.chatNotifications.set(Number(senderId), { senderId, username, message });
    }

    public clearNotification(senderId: number) {
        this.chatNotifications.delete(Number(senderId));
    }
}
