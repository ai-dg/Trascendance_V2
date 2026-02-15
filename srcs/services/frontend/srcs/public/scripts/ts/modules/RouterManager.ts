import { AuthManager } from "./AuthManager.js";
import type { User } from "./TypesManager";

export type Page = 'auth' | 'guest' | 'menu' | 'game-ai' | 'game-local' | 'game-online' | 'leaderboard' | 'settings' | 'check-otp' | 'update-profile' | 'live-chat' | 'multiplayer' | 'privacy-policy' | 'terms-of-service';

export interface RouteData {
  [key: string]: any;
}

export class RouterManager {
  private currentPage: Page = 'auth';
  private listeners: ((page: Page, data?: RouteData) => void)[] = [];
  private updateUserCallback?: (user: User | null) => void;
  private readonly pageQueryKey = 'page';

  constructor(updateUserCallback?: (user: User | null) => void) {
    this.updateUserCallback = updateUserCallback;
    this.loadInitialRoute();
    window.addEventListener('popstate', (event: PopStateEvent) => {
      const pageFromState = this.getPageFromState(event.state);
      const pageFromUrl = this.getPageFromUrl();
      const nextPage = pageFromState ?? pageFromUrl;

      if (nextPage && nextPage !== this.currentPage) {
        this.currentPage = nextPage;
        this.notifyListeners();
      }
    });
  }

  private loadInitialRoute(): void {
    const pageFromUrl = this.getPageFromUrl();
    this.currentPage = pageFromUrl ?? 'auth';
    this.updateHistory(this.currentPage, true);
  }

  public getCurrentPage(): Page {
    return this.currentPage;
  }

  public setCurrentUser(user: User | null) {
    this.updateUserCallback?.(user);
  }

  public navigateTo(page: Page, data?: RouteData, options?: { replace?: boolean }): void {
    console.log(`Navigating to page: ${page} with data:`, data, 'and options:', options); // Debug log
    if (this.currentPage !== page) {
      this.currentPage = page;
      this.updateHistory(page, options?.replace ?? false);
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

  private getPageFromState(state: any): Page | null {
    if (state && typeof state.page === 'string' && this.isValidPage(state.page)) {
      return state.page as Page;
    }
    return null;
  }

  private getPageFromUrl(): Page | null {
    const url = new URL(window.location.href);
    const paramValue = url.searchParams.get(this.pageQueryKey);
    if (paramValue && this.isValidPage(paramValue)) {
      return paramValue as Page;
    }

    const hashValue = url.hash.replace(/^#\/?/, '');
    if (hashValue && this.isValidPage(hashValue)) {
      return hashValue as Page;
    }

    return null;
  }

  private updateHistory(page: Page, replace: boolean): void {
    const url = new URL(window.location.href);
    url.searchParams.set(this.pageQueryKey, page);
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ page }, '', url.toString());
  }

  private isValidPage(page: string): page is Page {
    const pages: Page[] = [
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
    return pages.includes(page as Page);
  }

  private getBaseUrl(): string {
      const element = document.querySelector("meta[name='api-base-url']");
      const baseUrl = (element?.getAttribute('content') ?? '').trim();
      return baseUrl || (typeof window !== 'undefined' ? window.location.host : '');
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

