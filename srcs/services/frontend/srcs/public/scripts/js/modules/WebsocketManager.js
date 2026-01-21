export class WebsocketManager {
    constructor() {
        this.generalSocket = null;
        this.gameSocket = null;
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
    setupDefaultListeners() {
        this.generalSocket?.on("connect", () => console.log("General socket connected"));
        this.gameSocket?.on("connect", () => console.log("Game socket connected"));
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
}
