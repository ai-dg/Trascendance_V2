import type { User } from '../modules/TypesManager.js';
import { Socket } from "socket.io-client";

declare const io: any;

export class WebsocketManager {
  private static instance: WebsocketManager;
  public generalSocket: Socket | null = null;
  public gameSocket: Socket | null = null;

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
    const options = {
      path: "/realtime-sockets/socket.io/",
      transports: ['websocket', 'polling'],
      withCredentials: true
    };

    this.generalSocket = io(origin, options);
    this.gameSocket = io(`${origin}/game`, options);
    this.setupDefaultListeners();
  }

    private setupDefaultListeners() {
        this.generalSocket?.on("connect", () => console.log("General socket connected"));
        this.gameSocket?.on("connect", () => console.log("Game socket connected"));
        
        this.generalSocket?.on("connect_error", (err) => console.error("Error socket general:", err));
        this.gameSocket?.on("connect_error", (err) => console.error("Error socket game:", err));
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