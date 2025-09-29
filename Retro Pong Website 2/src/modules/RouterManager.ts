export type Page = 'auth' | 'menu' | 'game' | 'leaderboard' | 'settings';

export interface RouteData {
  [key: string]: any;
}

export class RouterManager {
  private currentPage: Page = 'auth';
  private listeners: ((page: Page, data?: RouteData) => void)[] = [];

  constructor() {
    this.loadInitialRoute();
  }

  private loadInitialRoute(): void {
    // Could implement URL-based routing here if needed
    this.currentPage = 'auth';
  }

  public getCurrentPage(): Page {
    return this.currentPage;
  }

  public navigateTo(page: Page, data?: RouteData): void {
    if (this.currentPage !== page) {
      this.currentPage = page;
      this.notifyListeners(data);
    }
  }

  public addListener(callback: (page: Page, data?: RouteData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(data?: RouteData): void {
    this.listeners.forEach(callback => callback(this.currentPage, data));
  }
}