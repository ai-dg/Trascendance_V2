export class RouterManager {
    constructor() {
        this.currentPage = 'auth';
        this.listeners = [];
        this.loadInitialRoute();
    }
    loadInitialRoute() {
        // Could implement URL-based routing here if needed
        this.currentPage = 'auth';
    }
    getCurrentPage() {
        return this.currentPage;
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
}
