"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterManager = void 0;
var RouterManager = /** @class */ (function () {
    function RouterManager(updateUserCallback) {
        this.currentPage = 'auth';
        this.listeners = [];
        this.updateUserCallback = updateUserCallback;
        this.loadInitialRoute();
    }
    RouterManager.prototype.loadInitialRoute = function () {
        // Could implement URL-based routing here if needed
        this.currentPage = 'auth';
    };
    RouterManager.prototype.getCurrentPage = function () {
        return this.currentPage;
    };
    RouterManager.prototype.setCurrentUser = function (user) {
        var _a;
        (_a = this.updateUserCallback) === null || _a === void 0 ? void 0 : _a.call(this, user);
    };
    RouterManager.prototype.navigateTo = function (page, data) {
        if (this.currentPage !== page) {
            this.currentPage = page;
            this.notifyListeners(data);
        }
    };
    RouterManager.prototype.addListener = function (callback) {
        var _this = this;
        this.listeners.push(callback);
        return function () {
            _this.listeners = _this.listeners.filter(function (l) { return l !== callback; });
        };
    };
    RouterManager.prototype.notifyListeners = function (data) {
        var _this = this;
        this.listeners.forEach(function (callback) { return callback(_this.currentPage, data); });
    };
    RouterManager.prototype.getBaseUrl = function () {
        var _a;
        var element = document.querySelector("meta[name='api-base-url']");
        var baseUrl = (_a = element === null || element === void 0 ? void 0 : element.getAttribute('content')) !== null && _a !== void 0 ? _a : '';
        return baseUrl;
    };
    RouterManager.prototype.getUrl = function (endpoint) {
        if (endpoint[0] != '/')
            endpoint = '/' + endpoint;
        return window.location.protocol + '//' + this.getBaseUrl() + endpoint;
    };
    return RouterManager;
}());
exports.RouterManager = RouterManager;
// TODO: Not using those two functions yet
// function getWebSocketProtocol() {
// 	return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// }
// export function getWebSocketUrl(path: string): string {
// 	if (path[0] !== '/')
// 		path = '/' + path;
// 	return getWebSocketProtocol() + '//' + getBaseUrl() + path;
// }
