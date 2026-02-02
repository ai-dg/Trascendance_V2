import { AuthManager } from "./AuthManager.js";
export class RouterManager {
    currentPage = 'auth';
    listeners = [];
    updateUserCallback;
    constructor(updateUserCallback) {
        this.updateUserCallback = updateUserCallback;
        this.loadInitialRoute();
    }
    loadInitialRoute() {
        // Could implement URL-based routing here if needed
        this.currentPage = 'auth';
    }
    getCurrentPage() {
        return this.currentPage;
    }
    setCurrentUser(user) {
        this.updateUserCallback?.(user);
    }
    navigateTo(page, data) {
        if (this.currentPage !== page) {
            this.currentPage = page;
            this.notifyListeners(data);
        }
    }
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    notifyListeners(data) {
        this.listeners.forEach(callback => callback(this.currentPage, data));
    }
    getBaseUrl() {
        const element = document.querySelector("meta[name='api-base-url']");
        const baseUrl = element?.getAttribute('content') ?? '';
        return baseUrl;
    }
    getUrl(endpoint) {
        if (endpoint[0] != '/')
            endpoint = '/' + endpoint;
        return window.location.protocol + '//' + this.getBaseUrl() + endpoint;
    }
}
// TODO: Not using those two functions yet
// function getWebSocketProtocol() {
// 	return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// }
// export function getWebSocketUrl(path: string): string {
// 	if (path[0] !== '/')
// 		path = '/' + path;
// 	return getWebSocketProtocol() + '//' + getBaseUrl() + path;
// }
//# sourceMappingURL=RouterManager.js.map