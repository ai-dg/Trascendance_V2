export class RouterManager {
    constructor(updateUserCallback) {
        this.currentPage = 'auth';
        this.listeners = [];
        this.pageQueryKey = 'page';
        this.updateUserCallback = updateUserCallback;
        this.loadInitialRoute();
        window.addEventListener('popstate', (event) => {
            const pageFromState = this.getPageFromState(event.state);
            const pageFromUrl = this.getPageFromUrl();
            const nextPage = pageFromState ?? pageFromUrl;
            if (nextPage && nextPage !== this.currentPage) {
                this.currentPage = nextPage;
                this.notifyListeners();
            }
        });
    }
    loadInitialRoute() {
        const pageFromUrl = this.getPageFromUrl();
        this.currentPage = pageFromUrl ?? 'auth';
        this.updateHistory(this.currentPage, true);
    }
    getCurrentPage() {
        return this.currentPage;
    }
    setCurrentUser(user) {
        this.updateUserCallback?.(user);
    }
    navigateTo(page, data, options) {
        console.log(`Navigating to page: ${page} with data:`, data, 'and options:', options); // Debug log
        if (this.currentPage !== page) {
            this.currentPage = page;
            this.updateHistory(page, options?.replace ?? false);
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
    getPageFromState(state) {
        if (state && typeof state.page === 'string' && this.isValidPage(state.page)) {
            return state.page;
        }
        return null;
    }
    getPageFromUrl() {
        const url = new URL(window.location.href);
        const paramValue = url.searchParams.get(this.pageQueryKey);
        if (paramValue && this.isValidPage(paramValue)) {
            return paramValue;
        }
        const hashValue = url.hash.replace(/^#\/?/, '');
        if (hashValue && this.isValidPage(hashValue)) {
            return hashValue;
        }
        return null;
    }
    updateHistory(page, replace) {
        const url = new URL(window.location.href);
        url.searchParams.set(this.pageQueryKey, page);
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method]({ page }, '', url.toString());
    }
    isValidPage(page) {
        const pages = [
            'auth',
            'guest',
            'menu',
            'game-ai',
            'game-local',
            'game-online',
            'leaderboard',
            'settings',
            'check-otp',
            'update-profile',
            'live-chat',
            'multiplayer',
            'privacy-policy',
            'terms-of-service'
        ];
        return pages.includes(page);
    }
    getBaseUrl() {
        const element = document.querySelector("meta[name='api-base-url']");
        const baseUrl = (element?.getAttribute('content') ?? '').trim();
        return baseUrl || (typeof window !== 'undefined' ? window.location.host : '');
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
