import { AuthManager, User } from './modules/AuthManager';
import { RouterManager, Page } from './modules/RouterManager';
import { UIManager } from './modules/UIManager';
import { AuthPage } from './pages/AuthPage';
import { MenuPage } from './pages/MenuPage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';

export class App {
  private container: HTMLElement;
  private authManager: AuthManager;
  private routerManager: RouterManager;
  private uiManager: UIManager;
  private currentUser: User | null = null;
  private currentPage: Page = 'auth';

  // Page instances
  private authPage: AuthPage;
  private menuPage: MenuPage;
  private gamePage: GamePage;
  private leaderboardPage: LeaderboardPage;
  private settingsPage: SettingsPage;

  constructor(container: HTMLElement) {
    this.container = container;
    this.authManager = new AuthManager();
    this.routerManager = new RouterManager();
    this.uiManager = new UIManager(container);

    // Initialize pages
    this.authPage = new AuthPage(this.uiManager, this.handleLogin.bind(this), this.handleRegister.bind(this));
    this.menuPage = new MenuPage(this.uiManager, this.handlePlayGame.bind(this), this.handleViewLeaderboard.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this));
    this.gamePage = new GamePage(this.uiManager, this.handleBackToMenu.bind(this));
    this.leaderboardPage = new LeaderboardPage(this.uiManager, this.handleBackToMenu.bind(this));
    this.settingsPage = new SettingsPage(this.uiManager, this.handleBackToMenu.bind(this));

    this.setupEventListeners();
    this.initialize();
  }

  private setupEventListeners(): void {
    // Listen to auth changes
    this.authManager.addListener((user) => {
      this.currentUser = user;
      this.updateCurrentPage();
    });

    // Listen to router changes
    this.routerManager.addListener((page) => {
      this.currentPage = page;
      this.render();
    });
  }

  private initialize(): void {
    // Check if user is already logged in
    this.currentUser = this.authManager.getCurrentUser();
    if (this.currentUser) {
      this.currentPage = 'menu';
    }
    this.render();
  }

  private updateCurrentPage(): void {
    if (this.currentUser) {
      this.routerManager.navigateTo('menu');
    } else {
      this.routerManager.navigateTo('auth');
    }
  }

  private render(): void {
    this.uiManager.clear();

    switch (this.currentPage) {
      case 'auth':
        this.authPage.render();
        break;
      case 'menu':
        this.menuPage.render(this.currentUser);
        break;
      case 'game':
        this.gamePage.render();
        break;
      case 'leaderboard':
        this.leaderboardPage.render();
        break;
      case 'settings':
        this.settingsPage.render();
        break;
    }
  }

  // Event handlers
  private handleLogin(username: string): void {
    this.authManager.login({ username, password: 'demo' });
  }

  private handleRegister(username: string, email: string, password: string): void {
    this.authManager.register({ username, email, password, confirmPassword: password });
  }

  private handleLogout(): void {
    this.authManager.logout();
  }

  private handlePlayGame(): void {
    this.routerManager.navigateTo('game');
  }

  private handleViewLeaderboard(): void {
    this.routerManager.navigateTo('leaderboard');
  }

  private handleSettings(): void {
    this.routerManager.navigateTo('settings');
  }

  private handleBackToMenu(): void {
    this.routerManager.navigateTo('menu');
  }
}
