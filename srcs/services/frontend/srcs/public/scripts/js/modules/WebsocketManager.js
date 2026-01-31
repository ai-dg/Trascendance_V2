"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketManager = void 0;
var WebsocketManager = /** @class */ (function () {
    function WebsocketManager() {
        this.generalSocket = null;
        this.gameSocket = null;
    }
    WebsocketManager.getInstance = function () {
        if (!WebsocketManager.instance) {
            WebsocketManager.instance = new WebsocketManager();
        }
        return WebsocketManager.instance;
    };
    WebsocketManager.prototype.setWebsocketManager = function (manager) {
        WebsocketManager.instance = manager;
        this.setupDefaultListeners();
    };
    WebsocketManager.prototype.init = function (origin) {
        var options = {
            path: "/realtime-sockets/socket.io/",
            transports: ['websocket', 'polling'],
            withCredentials: true
        };
        this.generalSocket = io(origin, options);
        this.gameSocket = io("".concat(origin, "/game"), options);
        this.setupDefaultListeners();
    };
    WebsocketManager.prototype.setupDefaultListeners = function () {
        var _a, _b, _c, _d;
        (_a = this.generalSocket) === null || _a === void 0 ? void 0 : _a.on("connect", function () { return console.log("General socket connected"); });
        (_b = this.gameSocket) === null || _b === void 0 ? void 0 : _b.on("connect", function () { return console.log("Game socket connected"); });
        (_c = this.generalSocket) === null || _c === void 0 ? void 0 : _c.on("connect_error", function (err) { return console.error("Error socket general:", err); });
        (_d = this.gameSocket) === null || _d === void 0 ? void 0 : _d.on("connect_error", function (err) { return console.error("Error socket game:", err); });
    };
    WebsocketManager.prototype.onGeneral = function (event, callback) {
        var _a, _b;
        (_a = this.generalSocket) === null || _a === void 0 ? void 0 : _a.off(event);
        (_b = this.generalSocket) === null || _b === void 0 ? void 0 : _b.on(event, callback);
    };
    WebsocketManager.prototype.offGeneral = function (event) {
        var _a;
        (_a = this.generalSocket) === null || _a === void 0 ? void 0 : _a.off(event);
    };
    WebsocketManager.prototype.onGame = function (event, callback) {
        var _a, _b;
        (_a = this.gameSocket) === null || _a === void 0 ? void 0 : _a.off(event);
        (_b = this.gameSocket) === null || _b === void 0 ? void 0 : _b.on(event, callback);
    };
    WebsocketManager.prototype.offGame = function (event) {
        var _a;
        (_a = this.gameSocket) === null || _a === void 0 ? void 0 : _a.off(event);
    };
    WebsocketManager.prototype.emitGeneral = function (event, data) {
        var _a;
        (_a = this.generalSocket) === null || _a === void 0 ? void 0 : _a.emit(event, data);
    };
    WebsocketManager.prototype.emitGame = function (event, data) {
        var _a;
        (_a = this.gameSocket) === null || _a === void 0 ? void 0 : _a.emit(event, data);
    };
    WebsocketManager.prototype.disconnectAll = function () {
        var _a, _b;
        (_a = this.generalSocket) === null || _a === void 0 ? void 0 : _a.disconnect();
        (_b = this.gameSocket) === null || _b === void 0 ? void 0 : _b.disconnect();
    };
    return WebsocketManager;
}());
exports.WebsocketManager = WebsocketManager;
