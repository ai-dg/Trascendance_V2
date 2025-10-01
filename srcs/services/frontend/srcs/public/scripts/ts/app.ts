import { User, OTParams } from './modules/TypesManager.js';
import { AuthManager} from './modules/AuthManager.js';
import { RouterManager, type Page } from './modules/RouterManager.js';
import { UIManager } from './modules/UIManager.js';
import { type Translations } from './modules/TypesManager.js';
import { AuthPage } from './pages/AuthPage.js';
import { GuestPage } from './pages/GuestPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { GamePageAI, GamePageLocal, GamePageOnline } from './pages/GamePage.js';
import { CheckOtp } from './pages/CheckOtp.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { SettingsPage } from './pages/SettingsPage.js';


export class App {
  private container: HTMLElement;
  private authManager: AuthManager;
  private routerManager: RouterManager;
  private uiManager: UIManager;
  private currentUser: User | null = null;
  private currentPage: Page = 'auth';

  // Page instances
  private authPage: AuthPage;
  private guestPage: GuestPage;
  private menuPage: MenuPage;
  private gamePageAI: GamePageAI;
  private gamePageLocal: GamePageLocal;
  private gamePageOnline: GamePageOnline;
  private checkOtpPage: CheckOtp;
  private leaderboardPage: LeaderboardPage;
  private settingsPage: SettingsPage;

  constructor(container: HTMLElement) {
    this.container = container;
    this.authManager = new AuthManager(this.handleBackToCheckOtp.bind(this));
    this.routerManager = new RouterManager();
    this.uiManager = new UIManager(container);

    // Initialize pages
    this.authPage = new AuthPage(this.uiManager, this.handleLogin.bind(this), this.handleRegister.bind(this), this.handleForgotPassword.bind(this), this.handleShowGuestPage.bind(this), this.handleError.bind(this));
    this.guestPage = new GuestPage(this.uiManager, this.handleBackToAuth.bind(this), this.handlePlayAsGuest.bind(this));
    this.menuPage = new MenuPage(this.uiManager, this.handlePlayGameAI.bind(this), this.handlePlayGameLocal.bind(this), this.handlePlayGameOnline.bind(this), this.handleViewLeaderboard.bind(this), this.handleChatWithFriends.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this));
    this.gamePageAI = new GamePageAI(this.uiManager, this.handleBackToMenu.bind(this));
    this.gamePageLocal = new GamePageLocal(this.uiManager, this.handleBackToMenu.bind(this));
    this.gamePageOnline = new GamePageOnline(this.uiManager, this.handleBackToMenu.bind(this));
    this.checkOtpPage = new CheckOtp(this.uiManager, this.handleOtpVerificationComplete.bind(this), this.handleBackToAuth.bind(this));
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
      case 'check-otp':
        // TODO: Get translations from languageManager
        const text = {} as Translations; // Placeholder
        const params: OTParams = (window as any).otpData || { otp_id: 'temp_otp_id', context: 'signup', handler: () => console.log('Default handler called') };
        console.log("Using OTP params:", params);
        this.checkOtpPage.render(text, params);
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

  private async handleRegister(username: string, email: string, password: string, confirmPassword: string): Promise<void> {
    // TODO: Get translations from languageManager
    const text = {} as Translations; // Placeholder
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

  private handleError(error: string): void {
    this.authPage.showError(error);
  }

  private handleForgotPassword(email: string): void {
    this.authManager.forgotPassword({ email });
    console.log('Forgot password requested for:', email);
  }

  private handleLogout(): void {
    this.authManager.logout();
  }

  private handlePlayGameAI(): void {
    // TODO: Implement AI game logic
    console.log('Starting AI game...');
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

  private handleViewLeaderboard(): void {
    this.routerManager.navigateTo('leaderboard');
  }

  private handleSettings(): void {
    this.routerManager.navigateTo('settings');
  }

  private handleBackToCheckOtp(): void {
    this.routerManager.navigateTo('check-otp');
  }

  private handleOtpVerificationComplete(success: boolean): void {
    if (success) {
      console.log('OTP verification successful, redirecting to menu');
      // Clear OTP data
      (window as any).otpData = null;
      // Update current user and navigate to menu
      this.currentUser = this.authManager.getCurrentUser();
      this.routerManager.navigateTo('menu');
    } else {
      console.log('OTP verification failed');
      // Stay on check-otp page to retry
    }
  }

  private handleChatWithFriends(): void {
    // TODO: Implement chat functionality
    console.log('Chat with friends functionality not yet implemented');
  }

  private handleBackToMenu(): void {
    this.routerManager.navigateTo('menu');
  }

  private handleBackToAuth(): void {
    this.routerManager.navigateTo('auth');
  }

  private handleShowGuestPage(): void {
    this.routerManager.navigateTo('guest');
  }

  private handlePlayAsGuest(nickname: string, avatar: string): void {
    // Create a guest user object
    this.currentUser = {
      id: 'guest_' + Date.now(),
      username: nickname,
      email: '',
      avatar: avatar,
      isGuest: true
    };
    
    console.log('Playing as guest:', nickname, 'with avatar:', avatar);
    this.routerManager.navigateTo('menu');
  }
}





// import { navigateTo, setupBackButton } from "./navigation.js";
// import type { Translations } from "./types.js";
// import { getElement } from "./script.js";
// import { isConnectedUser, initCSRFToken } from "./login.js";
// import { getUrl } from "./urls.js";

// export async function getConnectedUser() {
//     try {
//         const res = await fetch(getUrl('auth/me'), {
//             method: 'GET',
//             credentials: 'include'
//         });
//         if (!res.ok) throw new Error('Failed to get user');
//         const result = await res.json();
//         if (result.success) {
//             return result.data.user;
//         }
//     } catch (err) {
//         console.error(err);
//     }
//     return null;
// }

// export async function getCurrentUser() {
//     try {
//         const res = await fetch(getUrl('auth/me'), {
//             method: "GET",
//             credentials: "include",
//         });

//         if (!res.ok) {
//             return null;
//         }

//         const result = await res.json();
//         if (result.success) {
//             return result.user;
//         }
//         return null;
//     } catch (err) {
//         console.error("getCurrentUser error:", err);
//         return null;
//     }
// }

// export function getGuestNickname() {
//   const nickname = localStorage.getItem("guestNickname");
//   const avatar = localStorage.getItem("guestAvatar");

//   if (!nickname || !avatar) {
//     return { nickname: "Guest", avatar: "/avatar/default.png" }; 
//   }

//   return { nickname, avatar };
// }



// export async function showGame(text: Translations) {

//     let gameDiv = document.getElementById('gameScreen') as HTMLDivElement | null;
//     const contentDiv = getElement<HTMLDivElement>('content')!;

//     const isConnected = await isConnectedUser();
//     console.log("user is connected : ", isConnected);
    
//     if (!gameDiv) {
//         gameDiv = document.createElement('div');
//         gameDiv.id = 'gameScreen';
//         gameDiv.className = 'flex flex-col w-full h-screen bg-gray-900';
//         gameDiv.innerHTML = `
//         <header id="gameHeader" class="w-full bg-white p-4 shadow-md flex justify-between items-center space-x-4">
//         <img id="avatar-option" class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
//         <h1 id="gameHeaderTitle" class="text-xl font-bold">Game Header</h1>
//         </header>
//         <main class="flex-1 w-full bg-gray-700 flex items-center justify-center">
//         <canvas id="gameCanvas" class="w-full h-full"></canvas>
//         </main>
//         <button id="exitGameBtn" class="text-red-500">Exit</button>
//         `;
//         getElement<HTMLDivElement>('app')!.appendChild(gameDiv);
//     }
    
//     contentDiv.style.display = 'none';
//     gameDiv.style.display = 'flex';
    
//     const avatarImg = getElement<HTMLImageElement>('avatar-option');
//     const headerTitle = getElement<HTMLHeadingElement>('gameHeaderTitle');
//     if (isConnected) {
//         const user = await getCurrentUser();
//         if (user) {
//             headerTitle.textContent = user.pseudo;
//             console.log("JUST before user.avatar showGame");
//             if (user.avatar) {
//                 console.log("user.avatar: ", user.avatar);
//                 avatarImg.src = user.avatar;
//             }
//             else
//                 avatarImg.src = '/public/avatars/default.png';
//         }
//         else {
//             headerTitle.textContent = "Not connected";
//             avatarImg.src = '/public/avatars/default.png';
//         }
//     }
//     else {
//         const guest = getGuestNickname();
//         headerTitle.textContent = guest.nickname;
//         avatarImg.src = guest.avatar || '/public/avatars/default.png';
//     }

//     // exit game button
//     getElement<HTMLButtonElement>('exitGameBtn')!.onclick = () => {
//         gameDiv.style.display = 'none';
//         contentDiv.style.display = 'block';
//         if(isConnected)
//             navigateTo(text, "home");
//         else
//             navigateTo(text, "guestPlay");
//     };
// }





