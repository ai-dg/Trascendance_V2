/**********************************************************************************************/
/**************************************** IMPORTS *********************************************/
/**********************************************************************************************/

// Types
import type { User } from './modules/TypesManager.js';
import type { Socket } from "socket.io-client";
import { RouterManager, type Page } from './modules/RouterManager.js';
import { type Translations } from './modules/TypesManager.js';

// Managers
import { AuthManager} from './modules/AuthManager.js';
import { UIManager } from './modules/UIManager.js';
import { CheckManager } from './modules/CheckManager.js';
import { LanguageManager } from './modules/LangManager.js';

// Pages
import { AuthPage } from './pages/AuthPage.js';
import { WebsocketManager } from './modules/WebsocketManager.js';
import { MenuPage } from './pages/MenuPage.js';
import { GamePageLocal } from './pages/GameLocalPage.js';
import { RemotePage } from './pages/GameRemotePage.js';
import { AIPage } from './pages/GameAiPage.js';
import { CheckOtp } from './pages/CheckOtp.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { UpdateProfilePage } from './pages/UpdateProfilePage.js';
import { LiveChatPage } from './pages/LiveChatPage.js';
import { GuestPage } from './pages/GuestPage.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { TermsOfServicePage } from './pages/TermsOfServicePage.js';
import logger from '../js/utils/logger.js';


// Socket.io
declare const io: any;
export let gameSocket: Socket | null =  null;

/**********************************************************************************************/
/**************************************** MAIN APP CLASS *************************************/
/**********************************************************************************************/

export class App {
  /**********************************************************************************************/
  /**************************************** PROPERTIES *****************************************/
  /**********************************************************************************************/

  // Core Managers
  //private container: HTMLElement;
  private authManager: AuthManager;
  private routerManager: RouterManager;
  private uiManager: UIManager;
  private checkManager: CheckManager;
  private languageManager: LanguageManager;

  // State
  private currentUser: User | null = null;
  private currentPage: Page = 'auth';

  // Socket Connections
  generalSocket: Socket | null =  null;
  TournamentSocket: Socket | null =  null;

  // Page Instances
  private authPage: AuthPage;
  private websocketManager: WebsocketManager;
  private menuPage: MenuPage;
  private gamePageLocal: GamePageLocal;
  private gamePageAI: AIPage;
  private gamePageOnline: RemotePage;
  private checkOtpPage: CheckOtp;
  private settingsPage!: SettingsPage;
  private updateProfilePage: UpdateProfilePage;
  private liveChatPage: LiveChatPage;
  private guestPage: GuestPage;
  private privacyPolicyPage: PrivacyPolicyPage;
  private termsOfServicePage: TermsOfServicePage;

  /**********************************************************************************************/
  /**************************************** CONSTRUCTOR ****************************************/
  /**********************************************************************************************/

  constructor(container: HTMLElement) {
    //this.container = container;

    this.authManager = new AuthManager(
      this.handleBackToCheckOtp.bind(this)
    );
    this.routerManager = new RouterManager((user: User | null) => {
      this.currentUser = user;
      // this.updateCurrentPage();
    });
    // Sync App.currentPage with RouterManager's initial page from URL
    this.currentPage = this.routerManager.getCurrentPage();

    this.websocketManager = WebsocketManager.getInstance();

    // Managers
    this.uiManager = new UIManager(container);
    this.languageManager = new LanguageManager(this.routerManager);
    this.checkManager = new CheckManager(this.languageManager);


    // Initialize pages
    this.authPage = new AuthPage(
      this.uiManager,
      this.authManager,
      this.checkManager,
      this.languageManager,
      this.handleLogin.bind(this),
      this.handleRegister.bind(this),
      this.appHandleForgotPassword.bind(this),
      this.handleChangePassword.bind(this),
      this.handleShowGuestPage.bind(this),
      this.handleError.bind(this)
    );
    this.menuPage = new MenuPage(
      this.uiManager,
      this.websocketManager,
      this.routerManager,
      this.handlePlayGameAI.bind(this),
      this.handlePlayGameLocal.bind(this),
      this.handlePlayGameOnline.bind(this),
      this.handleChatWithFriends.bind(this),
      this.handleSettings.bind(this),
      this.handleLogout.bind(this),
      this.handleShowPrivacyPolicy.bind(this),
      this.handleShowTermsOfService.bind(this)
    );
    this.privacyPolicyPage = new PrivacyPolicyPage(
      this.uiManager,
      this.handleBackToMenu.bind(this)
    );
    this.termsOfServicePage = new TermsOfServicePage(
      this.uiManager,
      this.handleBackToMenu.bind(this)
    );
    this.gamePageAI = new AIPage(
      this.uiManager,
      this.handleBackToMenu.bind(this),
      this.currentUser
    );
    this.gamePageLocal = new GamePageLocal(
      this.uiManager,
      this.handleBackToMenu.bind(this)
    );
    this.gamePageOnline = new RemotePage(
      this.uiManager,
      this.handleBackToMenu.bind(this)
    );
    this.guestPage = new GuestPage(
      this.uiManager,
      this.handleBackToAuth.bind(this),
      this.handleConnectAsGuest.bind(this)
    );
    this.checkOtpPage = new CheckOtp(
      this.uiManager,
      this.languageManager,
      this.handleOtpVerificationComplete.bind(this),
      this.handleNewChangePassword.bind(this),
      this.handleBackToUpdateProfile.bind(this),
      this.handleBackToAuth.bind(this)
    );
    this.updateProfilePage = new UpdateProfilePage(
      this.uiManager, this.routerManager,
      this.authManager, this.languageManager,
      this.handleSettings.bind(this),
      this.handleBackToUpdateProfile.bind(this),
      this.currentUser
    );
    if (this.currentUser)
      this.settingsPage = new SettingsPage(
        this.uiManager,
        this.routerManager,
        this.authManager,
        this.languageManager,
        this.authPage,
        this.handleBackToMenu.bind(this),
        this.handleBackToUpdateProfile.bind(this),
        this.currentUser ?? null,
        this.currentUser?.isGuest ?? true
      );
    this.liveChatPage = new LiveChatPage(
      this.uiManager,
      this.routerManager,
      this.languageManager,
      this.websocketManager,
      this.handleBackToMenu.bind(this),
      this.currentUser ?? null
    );
    this.setupEventListeners();
    this.initialize();
  }

  /**********************************************************************************************/
  /**************************************** INITIALIZATION *************************************/
  /**********************************************************************************************/

  /**
   * Setup event listeners for auth and router changes
   */
  private setupEventListeners(): void {
    // Listen to auth changes
    this.authManager.addListener((user) => {
      this.currentUser = user;
      this.updateCurrentPage();
    });

    // Listen to router changes
    this.routerManager.addListener((page, data) => {
      this.currentPage = page;
      this.render(data);
    });
  }

  /**
   * Initialize the application: check user session, setup sockets, and render
   */


  private async initialize(): Promise<void> {
      // Always re-check auth on page load/refresh.
      sessionStorage.removeItem("not_authenticated");
      // Check user status and language in parallel for faster initialization
      const [user, _] = await Promise.all([
          this.getConnectedUser(),
          this.languageManager.init()
      ]);

      this.currentUser = user;

      let didNavigate = false;

      if (this.currentUser) {
        const wsManager = WebsocketManager.getInstance();
        wsManager.init(window.location.origin);

        // Expose the game socket for GameManager (imported from `../app.js`)
        gameSocket = wsManager.gameSocket;

        // Route "new-game" to the currently active game page
        wsManager.onGame('new-game', (data: any) => {
          // Store gameUUID in sessionStorage for reconnection support after page refresh
          if (data.gameUUID) {
            sessionStorage.setItem('currentGameUUID', data.gameUUID);
          }
          if (this.currentPage === 'game-ai') {
            this.gamePageAI.setupGame(data);
          } else if (this.currentPage === 'game-local') {
            this.gamePageLocal.setupGame(data);
          } else if (this.currentPage === 'game-online') {
            this.gamePageOnline.setupGame(data);
          }
        });

        // When game ends, clear the stored game UUID
        wsManager.onGame('game-ended', () => {
          sessionStorage.removeItem('currentGameUUID');
        });

        // When game is abandoned/closed, clear the stored game UUID
        wsManager.onGame('opponent-abandoned', () => {
          sessionStorage.removeItem('currentGameUUID');
        });

        // Check if user was in a game before page refresh - attempt reconnection
        const storedGameUUID = sessionStorage.getItem('currentGameUUID');
        if (storedGameUUID && gameSocket?.connected) {
          logger.info('[App] Checking for game reconnection:', storedGameUUID);
          const gSocket = gameSocket; // Capture for use in callbacks
          gSocket.emit('check-reconnection');

          // Listen for reconnection opportunities
          gSocket.once('reconnection-available', (data: any) => {
            logger.info('[App] Reconnection available:', data);
            gSocket.emit('reconnect-to-game', { gameUUID: storedGameUUID });
          });

          // Cleanup if no reconnection available
          gSocket.once('no-reconnection-available', () => {
            logger.info('[App] No reconnection available, clearing stored game UUID');
            sessionStorage.removeItem('currentGameUUID');
          });
        }

        // this.gamePageOnline.setWebsocketManager(wsManager);
        if (this.routerManager.getCurrentPage() === 'auth') {
          this.routerManager.navigateTo('menu', undefined, { replace: true });
          didNavigate = true;
        }
      }

      if (!didNavigate) {
        this.render();
      }
  }




  /**
   * Get the currently connected user from server or localStorage
   */
  private async getConnectedUser(): Promise<User | null> {
    // Check for guest user in sessionStorage first to avoid unnecessary API calls
    const guestNickname = sessionStorage.getItem("guestNickname");
    const guestAvatar = sessionStorage.getItem("guestAvatar");
    if (guestAvatar && guestNickname) {
      return {
        username: guestNickname,
        avatar: guestAvatar,
        isGuest: true
      };
    }

    // Check if we just came back from OAuth - clear the not_authenticated flag
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthSuccess = urlParams.get('oauth_success') === '1';
    if (hasOAuthSuccess) {
      sessionStorage.removeItem("not_authenticated");
      // Clean up the URL
      urlParams.delete('oauth_success');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }

    // Check if we've recently determined user is not authenticated
    // This avoids repeated 401 errors in console during the same session
    const notAuthFlag = sessionStorage.getItem("not_authenticated");
    if (notAuthFlag === "true") {
      logger.debug("getConnectedUser: skipping check - user not authenticated in this session");
      return null;
    }

    // Try to fetch authenticated user
    // Note: httpOnly cookies cannot be checked from JavaScript, so we always try
    try {
      const res = await fetch(this.routerManager.getUrl('auth/me'), {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        // Clear not-authenticated flag on successful authentication
        sessionStorage.removeItem("not_authenticated");
        const result = await res.json();
        const user = {
          id: result.data.user.user_id,
          username: result.data.user.pseudo,
          email: result.data.user.user_mail,
          avatar: result.data.user.avatar,
          isGuest: false
        };
        return user;
      }

      // Handle 401 - user is not authenticated or session expired
      if (res.status === 401) {
        // Set flag to prevent repeated checks in this session
        sessionStorage.setItem("not_authenticated", "true");
        logger.debug("getConnectedUser: 401 Unauthorized - user not authenticated");
        return null;
      }

      // Handle other unexpected status codes
      logger.warn(`getConnectedUser: unexpected status ${res.status}`);
      return null;
    }
    catch (err) {
      if (err instanceof TypeError && err.message.includes("NetworkError")) {
        logger.debug("getConnectedUser: server internal error");
      } else {
        logger.error("getConnectedUser: unexpected error →", err);
      }
    }
    return null;
  }

  /**
   * Update current page based on user authentication status
   */
  private updateCurrentPage(): void {
    if (this.currentUser) {
      this.routerManager.navigateTo('menu');
    } else {
      this.routerManager.navigateTo('auth');
    }
  }

  /**********************************************************************************************/
  /**************************************** SOCKET MANAGEMENT ***********************************/
  /**********************************************************************************************/

  /**********************************************************************************************/
  /**************************************** RENDERING *******************************************/
  /**********************************************************************************************/

  /**
   * Render the current page based on router state
   */
  private async render(routeData?: any): Promise<void> {
    this.uiManager.clear();
    // Don't refetch user on every render - use cached currentUser
    logger.info("CURRENT USER RENDER: ", this.currentUser);

    switch (this.currentPage) {
      case 'auth':
        this.authPage.render();
        break;
      case 'menu':
        requestAnimationFrame(() => {
          this.menuPage.setCurrentUser(this.currentUser);
          this.menuPage.render(this.currentUser);
        });
        break;
      case 'guest':
        this.guestPage.render();
        break;
      case 'game-ai':
        this.gamePageAI.render();
        break;
      case 'game-local':
        this.gamePageLocal.render();
        break;
      case 'game-online':
        this.gamePageOnline.render(this.currentUser, routeData);
        break;
      case 'check-otp':
        // TODO: Get translations from languageManager
        const text = {} as Translations; // Placeholder
        this.authManager.otpData ?? { otp_id: 'temp_otp_id', context: 'signup', handler: () => logger.info('Default handler called') };
        logger.info("Using OTP params:", this.authManager.otpData);
        this.checkOtpPage.render(text, this.authManager.otpData);
        break;
      case 'settings':
        this.settingsPage = new SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser ?? null, this.currentUser?.isGuest ?? true);
        this.settingsPage.render();
        break;
      case 'update-profile':
        this.updateProfilePage = new UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
        this.updateProfilePage.render();
        break;
      case 'live-chat':
        this.liveChatPage = new LiveChatPage(this.uiManager, this.routerManager, this.languageManager, this.websocketManager, this.handleBackToMenu.bind(this), this.currentUser);
        if (this.websocketManager) {
          this.liveChatPage.setWebsocketManager(this.websocketManager);
        }
        this.liveChatPage.render(this.currentUser);
        break;
      case 'privacy-policy':
        this.privacyPolicyPage.render();
        break;
      case 'terms-of-service':
        this.termsOfServicePage.render();
        break;
    }

    // After first render, just hide loading screen (app is already visible for SEO)
    requestAnimationFrame(() => {
      const loadingScreen = document.getElementById('app-loading');
      if (loadingScreen) {
        loadingScreen.remove();
      }
    });
  }

  /**********************************************************************************************/
  /**************************************** AUTH HANDLERS **************************************/
  /**********************************************************************************************/

  /**
   * Handle user login
   */
  private async handleLogin(username: string, password: string): Promise<void> {
    const text = {} as Translations;
    const result = await this.authManager.login({ username, password }, text);

    if (!result.success) {
      logger.error('Login failed:', result.error);
      this.authPage.showError(result.error || 'Login failed');
    } else if (result.needsVerification) {
      logger.info('Login successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by logUser via showVerificationCode
    } else {
      logger.info('Login successful without verification');
      // Clear the not-authenticated flag on successful login
      sessionStorage.removeItem("not_authenticated");
      // Navigate to menu after successful login
      this.currentUser = {
        id: 'guest_' + Date.now(),
        username: username,
        email: '',
        avatar: 'default.png',
        isGuest: false
      };

      logger.info('Playing as user:', username, 'with avatar:', 'default.png');
      this.routerManager.navigateTo('menu');
    }
  }

  private async handleRegister(username: string, email: string, password: string, confirmPassword: string): Promise<void> {
    const text = {} as Translations; // TODO: Get translations from languageManager
    const result = await this.authManager.register({ username, email, password, confirmPassword }, text);

    if (!result.success) {
      logger.error('Registration failed:', result.error);
      this.authPage.showError(result.error || 'Registration failed');
    } else if (result.needsVerification) {
      logger.info('Registration successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by registerUser via showVerificationCode
    } else {
      logger.info('Registration successful without verification');
      // TODO: Handle successful registration without verification
    }
  }

  private async appHandleForgotPassword(email: string): Promise<void> {
    logger.info('Forgot password requested for:', email);
    const response = await this.authManager.forgotPassword(email);
    logger.info('Response ', response);
    if (response.success && response.needsVerification) {
      this.routerManager.navigateTo('check-otp', response.verificationData);
    } else if (!response.success) {
      logger.error(response.error);
    }
  }

  private async handleChangePassword(email: string, password: string): Promise<void> {
    logger.info('Change password requested for:', email);
    const otpId = this.authManager.otpData?.otp_id;
    if (!otpId) return logger.error("OTP ID missing");

    const response = await this.authManager.changePassword(email, password, otpId);
    if (response.success) {
      logger.info("Password changed succesfully");
      this.authManager.otpData = null;
      this.authPage.showLogin();
    } else {
      logger.error(response.error);
    }
  }

  private handleNewChangePassword(success: boolean): void {
    if (success) {
      logger.info('OTP verification successful, redirecting to change password');
      this.authPage.handleChangePassword;
    } else {
      logger.info('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  private async handleOtpVerificationComplete(success: boolean): Promise<void> {
    if (success) {
      logger.info('OTP verification successful, redirecting to menu');
      sessionStorage.removeItem("not_authenticated");
      this.authManager.otpData = null;

      const user = await this.getConnectedUser();
      this.currentUser = user;

      if (this.currentUser) {
        const wsManager = WebsocketManager.getInstance();
        wsManager.init(window.location.origin);
        gameSocket = wsManager.gameSocket;
      }

      this.updateCurrentPage();
    } else {
      logger.info('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  private handleLogout(): void {
    this.authManager.logout();
  }

  private handleError(error: string): void {
    this.authPage.showError(error);
  }

  private handleConnectAsGuest(nickname: string, avatar: string): void {
    // Create a guest user object
    this.currentUser = {
      id: 'guest_' + Date.now(),
      username: nickname,
      email: '',
      avatar: avatar,
      isGuest: true
    };

    sessionStorage.setItem('guestNickname', nickname);
    sessionStorage.setItem('guestAvatar', avatar);

    // Init sockets for guests too (needed for local/ai games)
    const wsManager = WebsocketManager.getInstance();
    wsManager.init(window.location.origin);
    gameSocket = wsManager.gameSocket;
    wsManager.onGame('new-game', (data: any) => {
      if (this.currentPage === 'game-ai') {
        this.gamePageAI.setupGame(data);
      } else if (this.currentPage === 'game-local') {
        this.gamePageLocal.setupGame(data);
      } else if (this.currentPage === 'game-online') {
        this.gamePageOnline.setupGame(data);
      }
    });

    logger.info('Playing as guest:', nickname, 'with avatar:', avatar);
    this.routerManager.navigateTo('menu');
  }

  /**********************************************************************************************/
  /**************************************** NAVIGATION HANDLERS ********************************/
  /**********************************************************************************************/

  private handleBackToMenu(): void {
    this.routerManager.navigateTo('menu');
  }

  private handleBackToAuth(): void {
    this.routerManager.navigateTo('auth');
  }

  private handleShowGuestPage(): void {
    this.routerManager.navigateTo('guest');
  }

  private handleShowPrivacyPolicy(): void {
    this.routerManager.navigateTo('privacy-policy');
  }

  private handleShowTermsOfService(): void {
    this.routerManager.navigateTo('terms-of-service');
  }

  private handleSettings(): void {
    this.routerManager.navigateTo('settings');
  }

  private handleBackToCheckOtp(): void {
    this.routerManager.navigateTo('check-otp');
    this.render();
  }

  private handleBackToUpdateProfile(success: boolean): void {
    if (success) {
      logger.info("Email updated successfully!");
      this.routerManager.navigateTo('update-profile');
    } else {
      logger.info("Problem to update e-mail");
      // this.routerManager.navigateTo('update-profile');
    }
  }

  /**********************************************************************************************/
  /**************************************** GAME HANDLERS **************************************/
  /**********************************************************************************************/

  private handlePlayGameAI(): void {
    // TODO: Implement AI game logic
    logger.info('Starting AI game...');
    if (this.gamePageAI) {
      this.gamePageAI.render(this.currentUser);
    }
    this.routerManager.navigateTo('game-ai');
  }

  private handlePlayGameLocal(): void {
    // TODO: Implement local multiplayer logic
    logger.info('Starting local multiplayer game...');
    this.routerManager.navigateTo('game-local');
  }

  private handlePlayGameOnline(): void {
    // TODO: Implement online multiplayer logic
    logger.info('Starting online multiplayer game...');
    this.routerManager.navigateTo('game-online');
  }


  /**********************************************************************************************/
  /**************************************** USER HANDLERS **************************************/
  /**********************************************************************************************/

  private handleChatWithFriends(): void {
    // TODO: Implement chat functionality
    logger.info('Chat with friends functionality not yet implemented');
    if (this.currentUser && this.currentUser.isGuest == false)
      this.routerManager.navigateTo('live-chat');
    else
      logger.info('Connect to chat wih friends');
  }
}
