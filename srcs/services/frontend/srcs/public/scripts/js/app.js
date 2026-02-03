/**********************************************************************************************/
/**************************************** IMPORTS *********************************************/
/**********************************************************************************************/
import { RouterManager } from './modules/RouterManager.js';
// Managers
import { AuthManager } from './modules/AuthManager.js';
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
export let gameSocket = null;
/**********************************************************************************************/
/**************************************** MAIN APP CLASS *************************************/
/**********************************************************************************************/
export class App {
    /**********************************************************************************************/
    /**************************************** CONSTRUCTOR ****************************************/
    /**********************************************************************************************/
    constructor(container) {
        //this.container = container;
        // State
        this.currentUser = null;
        this.currentPage = 'auth';
        // Socket Connections
        this.generalSocket = null;
        this.TournamentSocket = null;
        this.authManager = new AuthManager(this.handleBackToCheckOtp.bind(this));
        this.routerManager = new RouterManager((user) => {
            this.currentUser = user;
            // this.updateCurrentPage();
        });
        this.websocketManager = WebsocketManager.getInstance();
        // Managers
        this.uiManager = new UIManager(container);
        this.languageManager = new LanguageManager(this.routerManager);
        this.checkManager = new CheckManager(this.languageManager);
        // Initialize pages
        this.authPage = new AuthPage(this.uiManager, this.authManager, this.checkManager, this.languageManager, this.handleLogin.bind(this), this.handleRegister.bind(this), this.appHandleForgotPassword.bind(this), this.handleChangePassword.bind(this), this.handleShowGuestPage.bind(this), this.handleError.bind(this));
        this.menuPage = new MenuPage(this.uiManager, this.websocketManager, this.routerManager, this.handlePlayGameAI.bind(this), this.handlePlayGameLocal.bind(this), this.handlePlayGameOnline.bind(this), this.handleChatWithFriends.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this), this.handleShowPrivacyPolicy.bind(this), this.handleShowTermsOfService.bind(this));
        this.privacyPolicyPage = new PrivacyPolicyPage(this.uiManager, this.handleBackToMenu.bind(this));
        this.termsOfServicePage = new TermsOfServicePage(this.uiManager, this.handleBackToMenu.bind(this));
        this.gamePageAI = new AIPage(this.uiManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.gamePageLocal = new GamePageLocal(this.uiManager, this.handleBackToMenu.bind(this));
        this.gamePageOnline = new RemotePage(this.uiManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.guestPage = new GuestPage(this.uiManager, this.handleBackToAuth.bind(this), this.handleConnectAsGuest.bind(this));
        this.checkOtpPage = new CheckOtp(this.uiManager, this.languageManager, this.handleOtpVerificationComplete.bind(this), this.handleNewChangePassword.bind(this), this.handleBackToUpdateProfile.bind(this), this.handleBackToAuth.bind(this));
        this.updateProfilePage = new UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
        if (this.currentUser)
            this.settingsPage = new SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser ?? null, this.currentUser?.isGuest ?? true);
        this.liveChatPage = new LiveChatPage(this.uiManager, this.routerManager, this.languageManager, this.websocketManager, this.handleBackToMenu.bind(this), this.currentUser ?? null);
        this.setupEventListeners();
        this.initialize();
    }
    /**********************************************************************************************/
    /**************************************** INITIALIZATION *************************************/
    /**********************************************************************************************/
    /**
     * Setup event listeners for auth and router changes
     */
    setupEventListeners() {
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
    async initialize() {
        this.currentUser = await this.getConnectedUser();
        await this.languageManager.init();
        if (this.currentUser) {
            this.currentPage = 'menu';
            const wsManager = WebsocketManager.getInstance();
            wsManager.init(window.location.origin);
            // Expose the game socket for GameManager (imported from `../app.js`)
            gameSocket = wsManager.gameSocket;
            // Route "new-game" to the currently active game page
            wsManager.onGame('new-game', (data) => {
                if (this.currentPage === 'game-ai') {
                    this.gamePageAI.setupGame(data);
                }
                else if (this.currentPage === 'game-local') {
                    this.gamePageLocal.setupGame(data);
                }
                else if (this.currentPage === 'game-online') {
                    this.gamePageOnline.setupGame(data);
                }
            });
            if (this.currentUser && !this.currentUser.isGuest) {
                // this.menuPage.setWebsocketManager(wsManager);
                this.liveChatPage.setWebsocketManager(wsManager);
            }
            // this.gamePageOnline.setWebsocketManager(wsManager);
        }
        this.render();
    }
    /**
     * Get the currently connected user from server or localStorage
     */
    async getConnectedUser() {
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
            }
            else {
                console.warn(`getConnectedUser: unexpected status ${res.status}`);
            }
            let guestUser = null;
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
            }
            else {
                console.error("getConnectedUser: unexpected error →", err);
            }
        }
        return null;
    }
    /**
     * Update current page based on user authentication status
     */
    updateCurrentPage() {
        if (this.currentUser) {
            this.routerManager.navigateTo('menu');
        }
        else {
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
    async render() {
        this.uiManager.clear();
        this.currentUser = await this.getConnectedUser();
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
                const text = {}; // Placeholder
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
    }
    /**********************************************************************************************/
    /**************************************** AUTH HANDLERS **************************************/
    /**********************************************************************************************/
    /**
     * Handle user login
     */
    async handleLogin(username, password) {
        const text = {};
        const result = await this.authManager.login({ username, password }, text);
        if (!result.success) {
            console.error('Login failed:', result.error);
            this.authPage.showError(result.error || 'Login failed');
        }
        else if (result.needsVerification) {
            console.log('Login successful, verification page should be shown by showVerificationCode');
            // The verification page will be shown by logUser via showVerificationCode
        }
        else {
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
    async handleRegister(username, email, password, confirmPassword) {
        const text = {}; // TODO: Get translations from languageManager
        const result = await this.authManager.register({ username, email, password, confirmPassword }, text);
        if (!result.success) {
            console.error('Registration failed:', result.error);
            this.authPage.showError(result.error || 'Registration failed');
        }
        else if (result.needsVerification) {
            console.log('Registration successful, verification page should be shown by showVerificationCode');
            // The verification page will be shown by registerUser via showVerificationCode
        }
        else {
            console.log('Registration successful without verification');
            // TODO: Handle successful registration without verification
        }
    }
    async appHandleForgotPassword(email) {
        console.log('Forgot password requested for:', email);
        const response = await this.authManager.forgotPassword(email);
        console.log('Response ', response);
        if (response.success && response.needsVerification) {
            this.routerManager.navigateTo('check-otp', response.verificationData);
        }
        else if (!response.success) {
            console.error(response.error);
        }
    }
    async handleChangePassword(email, password) {
        console.log('Change password requested for:', email);
        const otpId = this.authManager.otpData?.otp_id;
        if (!otpId)
            return console.error("OTP ID missing");
        const response = await this.authManager.changePassword(email, password, otpId);
        if (response.success) {
            console.log("Password changed succesfully");
            this.authManager.otpData = null;
            this.authPage.showLogin();
        }
        else {
            console.error(response.error);
        }
    }
    handleNewChangePassword(success) {
        if (success) {
            console.log('OTP verification successful, redirecting to change password');
            this.authPage.handleChangePassword;
        }
        else {
            console.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    }
    handleOtpVerificationComplete(success) {
        if (success) {
            console.log('OTP verification successful, redirecting to menu');
            this.authManager.otpData = null;
            // Update current user and navigate to menu
            this.currentUser = this.authManager.getCurrentUser();
            this.routerManager.navigateTo('menu');
        }
        else {
            console.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    }
    handleLogout() {
        this.authManager.logout();
    }
    handleError(error) {
        this.authPage.showError(error);
    }
    handleConnectAsGuest(nickname, avatar) {
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
        wsManager.onGame('new-game', (data) => {
            if (this.currentPage === 'game-ai') {
                this.gamePageAI.setupGame(data);
            }
            else if (this.currentPage === 'game-local') {
                this.gamePageLocal.setupGame(data);
            }
            else if (this.currentPage === 'game-online') {
                this.gamePageOnline.setupGame(data);
            }
        });
        console.log('Playing as guest:', nickname, 'with avatar:', avatar);
        this.routerManager.navigateTo('menu');
    }
    /**********************************************************************************************/
    /**************************************** NAVIGATION HANDLERS ********************************/
    /**********************************************************************************************/
    handleBackToMenu() {
        this.routerManager.navigateTo('menu');
    }
    handleBackToAuth() {
        this.routerManager.navigateTo('auth');
    }
    handleShowGuestPage() {
        this.routerManager.navigateTo('guest');
    }
    handleShowPrivacyPolicy() {
        this.routerManager.navigateTo('privacy-policy');
    }
    handleShowTermsOfService() {
        this.routerManager.navigateTo('terms-of-service');
    }
    handleSettings() {
        this.routerManager.navigateTo('settings');
    }
    handleBackToCheckOtp() {
        this.routerManager.navigateTo('check-otp');
        this.render();
    }
    handleBackToUpdateProfile(success) {
        if (success) {
            console.log("Email updated successfully!");
            this.routerManager.navigateTo('update-profile');
        }
        else {
            console.log("Problem to update e-mail");
            // this.routerManager.navigateTo('update-profile');
        }
    }
    /**********************************************************************************************/
    /**************************************** GAME HANDLERS **************************************/
    /**********************************************************************************************/
    handlePlayGameAI() {
        // TODO: Implement AI game logic
        console.log('Starting AI game...');
        if (this.gamePageAI) {
            this.gamePageAI.render(this.currentUser);
        }
        this.routerManager.navigateTo('game-ai');
    }
    handlePlayGameLocal() {
        // TODO: Implement local multiplayer logic
        console.log('Starting local multiplayer game...');
        this.routerManager.navigateTo('game-local');
    }
    handlePlayGameOnline() {
        // TODO: Implement online multiplayer logic
        console.log('Starting online multiplayer game...');
        this.routerManager.navigateTo('game-online');
    }
    /**********************************************************************************************/
    /**************************************** USER HANDLERS **************************************/
    /**********************************************************************************************/
    handleChatWithFriends() {
        // TODO: Implement chat functionality
        console.log('Chat with friends functionality not yet implemented');
        if (this.currentUser && this.currentUser.isGuest == false)
            this.routerManager.navigateTo('live-chat');
        else
            console.log('Connect to chat wih friends');
    }
}
