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
import { GuestPage } from './pages/GuestPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { GamePageAI, GamePageLocal, GamePageOnline } from './pages/GamePage.js';
import { TournamentPage } from './pages/TournamentPage.js';
import { CheckOtp } from './pages/CheckOtp.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { UpdateProfilePage } from './pages/UpdateProfilePage.js';
import { LiveChatPage } from './pages/LiveChatPage.js';

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
  private container: HTMLElement;
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
  private guestPage: GuestPage;
  private menuPage: MenuPage;
  private gamePageAI: GamePageAI;
  private gamePageLocal: GamePageLocal;
  private gamePageOnline: GamePageOnline;
  private tournamentPage: TournamentPage;
  private checkOtpPage: CheckOtp;
  private settingsPage!: SettingsPage;
  private updateProfilePage: UpdateProfilePage;
  private liveChatPage: LiveChatPage;

  /**********************************************************************************************/
  /**************************************** CONSTRUCTOR ****************************************/
  /**********************************************************************************************/

  constructor(container: HTMLElement) {
    this.container = container;
    
    this.authManager = new AuthManager(
      this.handleBackToCheckOtp.bind(this)
    );
    this.routerManager = new RouterManager((user: User | null) => {
      this.currentUser = user;
      // this.updateCurrentPage();
    });

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
    this.guestPage = new GuestPage(
      this.uiManager, 
      this.handleBackToAuth.bind(this), 
      this.handlePlayAsGuest.bind(this)
    );
    this.menuPage = new MenuPage(
      this.uiManager, 
      this.handlePlayGameAI.bind(this), 
      this.handlePlayGameLocal.bind(this), 
      this.handlePlayGameOnline.bind(this), 
      this.handleViewTournament.bind(this), 
      this.handleChatWithFriends.bind(this), 
      this.handleSettings.bind(this), 
      this.handleLogout.bind(this));
    this.gamePageAI = new GamePageAI(
      this.uiManager, 
      this.handleBackToMenu.bind(this)
    );
    this.gamePageLocal = new GamePageLocal(
      this.uiManager, 
      this.handleBackToMenu.bind(this)
    );
    this.tournamentPage = new TournamentPage(
      this.uiManager, 
      this.handleBackToMenu.bind(this)
    );
    this.gamePageOnline = new GamePageOnline(
      this.uiManager, 
      this.handleBackToMenu.bind(this)
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
      this.generalSocket, 
      this.handleBackToMenu.bind(this)
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
    // Check if user is already logged in
    this.currentUser = await this.getConnectedUser();
    console.log("CURRENT USER: ", this.currentUser);
    await this.languageManager.init();
    if (this.currentUser) {
      this.currentPage = 'menu';
      this.generalSocket = await this.initSocket('/live-chat/general');
      console.log(this.generalSocket)
      gameSocket = await this.initSocketAlt('/remote-players', '/general');
      console.log(gameSocket)
    }
    this.render();
  }

  /**
   * Get the currently connected user from server or localStorage
   */
  private async getConnectedUser(): Promise<User | null> {
    try {
      const res = await fetch(this.routerManager.getUrl('auth/me'), {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const result = await res.json();
        const user = {
          id: result.data.user.user_id,
          username: result.data.user.pseudo,
          email: result.data.user.user_mail,
          avatar: result.data.user.avatar,
          isGuest: false
        };
        return user;
        // get localStorage data;
      }
      if (res.status === 401) {
      } else {
        console.warn(`getConnectedUser: unexpected status ${res.status}`);
      }
      let guestUser: User | null = null;
      
      let guestNickname = localStorage.getItem("guestNickname");
      let guestAvatar = localStorage.getItem("guestAvatar");
      
      if (guestAvatar && guestNickname) {
        guestUser = {
          username: guestNickname,
          avatar: guestAvatar,
          isGuest: true
        };
        return guestUser;
      }
      return null;
    }
    catch (err) {
      if (err instanceof TypeError && err.message.includes("NetworkError")) {
        console.debug("getConnectedUser: server internal error");
      } else {
        console.error("getConnectedUser: unexpected error →", err);
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

  /**
   * Initialize socket connection for general purposes (chat, etc.)
   */
  private async initSocket(endpoint: string, handle: (data:any) => void = console.log) {
    // const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // // socket.io automatically handles http/ws
    // const socket = io(`${protocol}://${window.location.host}${endpoint}`, {
    //     transports: ['websocket'], // optional, force WS only
    // });
    const socket = io( { path: "/socket.io/", transports: ['websocket', 'polling'] });
    socket.on("connect", () => {
      console.log("✅ Connected to socket.io", endpoint);
    });
    socket.on("connect_error", (err: any) => {
      console.error("❌ socket.io connection error", err);
    });
    // generic message handler (if server uses socket.emit('message', ...))
    socket.on("message", (msg: any) => {
      console.log("📩 Raw message received:", msg);
      handle(msg);
    });
    return socket;
  }

  /**
   * Initialize socket connection for game-related events (remote players)
   */
  private async initSocketAlt(path: string, namespace: string) {
    const endpoint = `${path}${namespace}`;
    const sock = io(`${window.location.origin}${namespace}`, {
      path: `${path}/socket.io/`,transports: ['polling'] 
    });

    sock.on('connect', () => console.log("✅ Connected to socket.io", endpoint));
    sock.on('connect_error', (err: any) => console.error('❌ Erreur:', err));
    sock.on('welcome', (data: any) => console.log(data))
    sock.on('new-game', (data:any) => {
      console.log('new-game received:', data);
      if (this.currentPage === 'tournament') {
        this.tournamentPage.setupGame(data);
      } else if (this.currentPage === 'game-local') {
        this.gamePageLocal.setupGame(data);
      } else {
        this.gamePageLocal.setupGame(data);
      }
    }


    );
  
    return sock;
  }

  /**********************************************************************************************/
  /**************************************** RENDERING *******************************************/
  /**********************************************************************************************/

  /**
   * Render the current page based on router state
   */
  private async render(): Promise<void> {
    this.uiManager.clear();
    this.currentUser = await this.getConnectedUser();
    console.log("CURRENT USER RENDER: ", this.currentUser);

    switch (this.currentPage) {
      case 'auth':
        this.authPage.render();
        break;
      case 'guest':
        this.guestPage.render();
        break;
      case 'menu':
        requestAnimationFrame(() => {
          this.menuPage.render(this.currentUser);
        });
        break;
      case 'game-ai':
        this.gamePageAI.render();
        break;
      case 'game-local':
        this.gamePageLocal.render();
        break;
      case 'game-online':
        this.gamePageOnline.render();
        break;
      case 'tournament':
        this.tournamentPage.render();
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
        this.liveChatPage = new LiveChatPage(this.uiManager, this.routerManager, this.languageManager, this.generalSocket, this.handleBackToMenu.bind(this));
        this.liveChatPage.render(this.currentUser);
        break;
    }
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
      console.error('Login failed:', result.error);
      this.authPage.showError(result.error || 'Login failed');
    } else if (result.needsVerification) {
      console.log('Login successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by logUser via showVerificationCode
    } else {
      console.log('Login successful without verification');
      // Navigate to menu after successful login
      this.currentUser = {
        id: 'guest_' + Date.now(),
        username: username,
        email: '',
        avatar: 'default.png',
        isGuest: false
      };

      console.log('Playing as user:', username, 'with avatar:', 'default.png');
      this.routerManager.navigateTo('menu');
    }
  }

  /**
   * Handle user registration
   */
  private async handleRegister(username: string, email: string, password: string, confirmPassword: string): Promise<void> {
    const text = {} as Translations; // TODO: Get translations from languageManager
    const result = await this.authManager.register({ username, email, password, confirmPassword }, text);

    if (!result.success) {
      console.error('Registration failed:', result.error);
      this.authPage.showError(result.error || 'Registration failed');
    } else if (result.needsVerification) {
      console.log('Registration successful, verification page should be shown by showVerificationCode');
      // The verification page will be shown by registerUser via showVerificationCode
    } else {
      console.log('Registration successful without verification');
      // TODO: Handle successful registration without verification
    }
  }

  /**
   * Handle forgot password request
   */
  private async appHandleForgotPassword(email: string): Promise<void> {
    console.log('Forgot password requested for:', email);
    const response = await this.authManager.forgotPassword(email);
    console.log('Response ', response);
    if (response.success && response.needsVerification) {
      this.routerManager.navigateTo('check-otp', response.verificationData);
    } else if (!response.success) {
      console.error(response.error);
    }
  }

  /**
   * Handle password change
   */
  private async handleChangePassword(email: string, password: string): Promise<void> {
    console.log('Change password requested for:', email);
    const otpId = this.authManager.otpData?.otp_id;
    if (!otpId) return console.error("OTP ID missing");

    const response = await this.authManager.changePassword(email, password, otpId);
    if (response.success) {
      console.log("Password changed succesfully");
      this.authManager.otpData = null;
      this.authPage.showLogin();
    } else {
      console.error(response.error);
    }
  }

  /**
   * Handle OTP verification completion for password change
   */
  private handleNewChangePassword(success: boolean): void {
    if (success) {
      console.log('OTP verification successful, redirecting to change password');
      this.authPage.handleChangePassword;
    } else {
      console.log('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  /**
   * Handle OTP verification completion
   */
  private handleOtpVerificationComplete(success: boolean): void {
    if (success) {
      console.log('OTP verification successful, redirecting to menu');
      this.authManager.otpData = null;
      // Update current user and navigate to menu
      this.currentUser = this.authManager.getCurrentUser();
      this.routerManager.navigateTo('menu');
    } else {
      console.log('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  /**
   * Handle user logout
   */
  private handleLogout(): void {
    this.authManager.logout();
  }

  /**
   * Handle error display
   */
  private handleError(error: string): void {
    this.authPage.showError(error);
  }

  /**********************************************************************************************/
  /**************************************** NAVIGATION HANDLERS ********************************/
  /**********************************************************************************************/

  /**
   * Navigate to menu page
   */
  private handleBackToMenu(): void {
    this.routerManager.navigateTo('menu');
  }

  /**
   * Navigate to auth page
   */
  private handleBackToAuth(): void {
    this.routerManager.navigateTo('auth');
  }

  /**
   * Navigate to guest page
   */
  private handleShowGuestPage(): void {
    this.routerManager.navigateTo('guest');
  }

  /**
   * Navigate to settings page
   */
  private handleSettings(): void {
    this.routerManager.navigateTo('settings');
  }

  /**
   * Navigate to check OTP page
   */
  private handleBackToCheckOtp(): void {
    this.routerManager.navigateTo('check-otp');
    this.render();
  }

  /**
   * Handle navigation back to update profile page
   */
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

  /**
   * Handle AI game start
   */
  private handlePlayGameAI(): void {
    // TODO: Implement AI game logic
    console.log('Starting AI game...');
    this.routerManager.navigateTo('game-ai');
  }

  /**
   * Handle local multiplayer game start
   */
  private handlePlayGameLocal(): void {
    // TODO: Implement local multiplayer logic
    console.log('Starting local multiplayer game...');
    this.routerManager.navigateTo('game-local');
  }

  /**
   * Handle online multiplayer game start
   */
  private handlePlayGameOnline(): void {
    // TODO: Implement online multiplayer logic
    console.log('Starting online multiplayer game...');
    this.routerManager.navigateTo('game-online');
  }

  /**
   * Handle tournament view
   */
  private handleViewTournament(): void {
    this.routerManager.navigateTo('tournament');
  }

  /**********************************************************************************************/
  /**************************************** USER HANDLERS **************************************/
  /**********************************************************************************************/

  /**
   * Handle guest user play
   */
  private handlePlayAsGuest(nickname: string, avatar: string): void {
    // Create a guest user object
    this.currentUser = {
      id: 'guest_' + Date.now(),
      username: nickname,
      email: '',
      avatar: avatar,
      isGuest: true
    };

    localStorage.setItem("guestNickname", nickname);
    localStorage.setItem("guestAvatar", avatar);

    console.log('Playing as guest:', nickname, 'with avatar:', avatar);
    this.routerManager.navigateTo('menu');
  }

  /**
   * Handle chat with friends
   */
  private handleChatWithFriends(): void {
    // TODO: Implement chat functionality
    console.log('Chat with friends functionality not yet implemented');
    if (this.currentUser && this.currentUser.isGuest == false)
      this.routerManager.navigateTo('live-chat');
    else
      console.log('Connect to chat wih friends');
  }
}
