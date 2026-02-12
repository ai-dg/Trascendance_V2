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
import { Logger } from './modules/Logger.js';


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
      this.handleBackToMenu.bind(this),
      this.currentUser
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
    this.routerManager.addListener((page) => {
      this.currentPage = page;
      this.render();
    });
  }

  /**
   * Initialize the application: check user session, setup sockets, and render
   */


  private async initialize(): Promise<void> {
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
          if (this.currentPage === 'game-ai') {
            this.gamePageAI.setupGame(data);
          } else if (this.currentPage === 'game-local') {
            this.gamePageLocal.setupGame(data);
          } else if (this.currentPage === 'game-online') {
            this.gamePageOnline.setupGame(data);
          }
        });

        if (this.currentUser && !this.currentUser.isGuest) {
          // this.menuPage.setWebsocketManager(wsManager);
          this.liveChatPage.setWebsocketManager(wsManager);
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
    // Check for guest user in localStorage first to avoid unnecessary API calls
    const guestNickname = localStorage.getItem("guestNickname");
    const guestAvatar = localStorage.getItem("guestAvatar");
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
        Logger.debug("getConnectedUser: 401 Unauthorized - user not authenticated");
        return null;
      }

      // Handle other unexpected status codes
      Logger.warn(`getConnectedUser: unexpected status ${res.status}`);
      return null;
    }
    catch (err) {
      if (err instanceof TypeError && err.message.includes("NetworkError")) {
        Logger.debug("getConnectedUser: server internal error");
      } else {
        Logger.error("getConnectedUser: unexpected error →", err);
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
  private async render(): Promise<void> {
    this.uiManager.clear();
    // Don't refetch user on every render - use cached currentUser
    console.log("CURRENT USER RENDER: ", this.currentUser);

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
        this.gamePageOnline.render(this.currentUser);
        break;
      case 'check-otp':
        // TODO: Get translations from languageManager
        const text = {} as Translations; // Placeholder
        this.authManager.otpData ?? { otp_id: 'temp_otp_id', context: 'signup', handler: () => console.log('Default handler called') };
        console.log("Using OTP params:", this.authManager.otpData);
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
      Logger.error('Login failed:', result.error);
      console.log('Login failed:', result.error);
      this.authPage.showError(result.error || 'Login failed');
    } else if (result.needsVerification) {
      console.log('Login successful, verification page should be shown by showVerificationCode');
      console.log('Login successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by logUser via showVerificationCode
    } else {
      console.log('Login successful without verification');
      console.log('Login successful without verification');
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

      console.log('Playing as user:', username, 'with avatar:', 'default.png');
      console.log('Playing as user:', username, 'with avatar:', 'default.png');
      this.routerManager.navigateTo('menu');
    }
  }

  private async handleRegister(username: string, email: string, password: string, confirmPassword: string): Promise<void> {
    const text = {} as Translations; // TODO: Get translations from languageManager
    const result = await this.authManager.register({ username, email, password, confirmPassword }, text);

    if (!result.success) {
      Logger.error('Registration failed:', result.error);
      this.authPage.showError(result.error || 'Registration failed');
    } else if (result.needsVerification) {
      console.log('Registration successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by registerUser via showVerificationCode
    } else {
      console.log('Registration successful without verification');
      // TODO: Handle successful registration without verification
    }
  }

  private async appHandleForgotPassword(email: string): Promise<void> {
    console.log('Forgot password requested for:', email);
    const response = await this.authManager.forgotPassword(email);
    console.log('Response ', response);
    if (response.success && response.needsVerification) {
      this.routerManager.navigateTo('check-otp', response.verificationData);
    } else if (!response.success) {
      Logger.error(response.error);
    }
  }

  private async handleChangePassword(email: string, password: string): Promise<void> {
    console.log('Change password requested for:', email);
    const otpId = this.authManager.otpData?.otp_id;
    if (!otpId) return Logger.error("OTP ID missing");

    const response = await this.authManager.changePassword(email, password, otpId);
    if (response.success) {
      console.log("Password changed succesfully");
      this.authManager.otpData = null;
      this.authPage.showLogin();
    } else {
      Logger.error(response.error);
    }
  }

  private handleNewChangePassword(success: boolean): void {
    if (success) {
      console.log('OTP verification successful, redirecting to change password');
      this.authPage.handleChangePassword;
    } else {
      console.log('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  private async handleOtpVerificationComplete(success: boolean): Promise<void> {
    if (success) {
      console.log('OTP verification successful, redirecting to menu');
      console.log('OTP complete', success);
      this.authManager.otpData = null;
      console.log('Fetching current user after OTP verification...');
      const user = await this.authManager.getConnectedUser();
      console.log('Fetched current user after OTP verification:', user);
      if (user) {
        console.log('Fetched current user after OTP verification:', user);
      } else {
        console.log('No user data returned after OTP verification');
      }
      // Update current user and navigate to menu
      console.log('Fetching current user after OTP verification...');
      this.currentUser = await this.authManager.getConnectedUser();
      // this.currentUser = this.authManager.getCurrentUser();
      console.log('Current user after OTP verification:', this.currentUser);
      this.routerManager.navigateTo('menu');
    } else {
      console.log('OTP verification failed');
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

    localStorage.setItem('guestNickname', nickname);
    localStorage.setItem('guestAvatar', avatar);

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

    console.log('Playing as guest:', nickname, 'with avatar:', avatar);
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
      console.log("Email updated successfully!");
      this.routerManager.navigateTo('update-profile');
    } else {
      console.log("Problem to update e-mail");
      // this.routerManager.navigateTo('update-profile');
    }
  }

  /**********************************************************************************************/
  /**************************************** GAME HANDLERS **************************************/
  /**********************************************************************************************/

  private handlePlayGameAI(): void {
    // TODO: Implement AI game logic
    console.log('Starting AI game...');
    if (this.gamePageAI) {
      this.gamePageAI.render(this.currentUser);
    }
    this.routerManager.navigateTo('game-ai');
  }

  private handlePlayGameLocal(): void {
    // TODO: Implement local multiplayer logic
    console.log('Starting local multiplayer game...');
    this.routerManager.navigateTo('game-local');
  }

  private handlePlayGameOnline(): void {
    // TODO: Implement online multiplayer logic
    console.log('Starting online multiplayer game...');
    this.routerManager.navigateTo('game-online');
  }


  /**********************************************************************************************/
  /**************************************** USER HANDLERS **************************************/
  /**********************************************************************************************/

  private handleChatWithFriends(): void {
    // TODO: Implement chat functionality
    console.log('Chat with friends functionality not yet implemented');
    if (this.currentUser && this.currentUser.isGuest == false)
      this.routerManager.navigateTo('live-chat');
    else
      console.log('Connect to chat wih friends');
  }
}
