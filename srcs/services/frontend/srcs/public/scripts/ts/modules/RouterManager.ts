export type Page = 'auth' | 'guest' | 'menu' | 'game-ai' | 'game-local' | 'game-online' | 'leaderboard' | 'settings' | 'check-otp';

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

  private getBaseUrl(): string {
      const element = document.querySelector("meta[name='api-base-url']");
      const baseUrl = element?.getAttribute('content') ?? '';
      return baseUrl;
  }

  public getUrl(endpoint: string): string{
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

