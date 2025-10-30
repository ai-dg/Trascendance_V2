import { AuthManager } from './modules/AuthManager.js';
import { RouterManager } from './modules/RouterManager.js';
import { UIManager } from './modules/UIManager.js';
import { AuthPage } from './pages/AuthPage.js';
import { GuestPage } from './pages/GuestPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { GamePageAI, GamePageLocal, GamePageOnline } from './pages/GamePage.js';
import { CheckOtp } from './pages/CheckOtp.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { CheckManager } from './modules/CheckManager.js';
import { UpdateProfilePage } from './pages/UpdateProfilePage.js';
import { LanguageManager } from './modules/LangManager.js';
export class App {
    constructor(container) {
        this.currentUser = null;
        this.currentPage = 'auth';
        this.generalSocket = null;
        this.container = container;
        this.authManager = new AuthManager(this.handleBackToCheckOtp.bind(this));
        this.routerManager = new RouterManager((user) => {
            this.currentUser = user;
            // this.updateCurrentPage();
        });
        this.uiManager = new UIManager(container);
        this.languageManager = new LanguageManager(this.routerManager);
        this.checkManager = new CheckManager(this.languageManager);
        // Initialize pages
        this.authPage = new AuthPage(this.uiManager, this.authManager, this.checkManager, this.languageManager, this.handleLogin.bind(this), this.handleRegister.bind(this), this.appHandleForgotPassword.bind(this), this.handleChangePassword.bind(this), this.handleShowGuestPage.bind(this), this.handleError.bind(this));
        this.guestPage = new GuestPage(this.uiManager, this.handleBackToAuth.bind(this), this.handlePlayAsGuest.bind(this));
        this.menuPage = new MenuPage(this.uiManager, this.handlePlayGameAI.bind(this), this.handlePlayGameLocal.bind(this), this.handlePlayGameOnline.bind(this), this.handleViewLeaderboard.bind(this), this.handleChatWithFriends.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this));
        this.gamePageAI = new GamePageAI(this.uiManager, this.handleBackToMenu.bind(this));
        this.gamePageLocal = new GamePageLocal(this.uiManager, this.handleBackToMenu.bind(this));
        this.gamePageOnline = new GamePageOnline(this.uiManager, this.handleBackToMenu.bind(this));
        this.checkOtpPage = new CheckOtp(this.uiManager, this.languageManager, this.handleOtpVerificationComplete.bind(this), this.handleNewChangePassword.bind(this), this.handleBackToUpdateProfile.bind(this), this.handleBackToAuth.bind(this));
        this.leaderboardPage = new LeaderboardPage(this.uiManager, this.handleBackToMenu.bind(this));
        this.updateProfilePage = new UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
        if (this.currentUser)
            this.settingsPage = new SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser ?? null, this.currentUser?.isGuest ?? true);
        this.setupEventListeners();
        this.initialize();
    }
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
    async initialize() {
        // Check if user is already logged in
        this.currentUser = await this.getConnectedUser();
        console.log("CURRENT USER: ", this.currentUser);
        await this.languageManager.init();
        if (this.currentUser) {
            this.currentPage = 'menu';
            this.generalSocket = await this.initSocket('/remote-players/general');
            console.log(this.generalSocket);
        }
        this.render();
    }
    updateCurrentPage() {
        if (this.currentUser) {
            this.routerManager.navigateTo('menu');
        }
        else {
            this.routerManager.navigateTo('auth');
        }
    }
    async initSocket(endpoint, handle = (data) => { console.log(data); }) {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const sock = new WebSocket(wsProtocol + '//' + window.location.host + endpoint, []);
        sock.onerror = function (error) {
            console.error('Erreur WebSocket:', error);
        };
        sock.onopen = () => console.log("✅ Connected on websocket", endpoint, " !!!!");
        sock.onmessage = (msg) => {
            let data = JSON.parse(msg.data);
            handle(data);
        };
        return sock;
    }
    async render() {
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
            case 'check-otp':
                // TODO: Get translations from languageManager
                const text = {}; // Placeholder
                this.authManager.otpData ?? { otp_id: 'temp_otp_id', context: 'signup', handler: () => console.log('Default handler called') };
                console.log("Using OTP params:", this.authManager.otpData);
                this.checkOtpPage.render(text, this.authManager.otpData);
                break;
            case 'leaderboard':
                this.leaderboardPage.render();
                break;
            case 'settings':
                this.settingsPage = new SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser ?? null, this.currentUser?.isGuest ?? true);
                this.settingsPage.render();
                break;
            case 'update-profile':
                this.updateProfilePage = new UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
                this.updateProfilePage.render();
                break;
        }
    }
    // Event handlers
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
        // TODO: Get translations from languageManager
        const text = {}; // Placeholder
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
    handleError(error) {
        this.authPage.showError(error);
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
            // Clear OTP data
            this.authPage.handleChangePassword;
        }
        else {
            console.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    }
    handleLogout() {
        this.authManager.logout();
    }
    handlePlayGameAI() {
        // TODO: Implement AI game logic
        console.log('Starting AI game...');
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
    handleViewLeaderboard() {
        this.routerManager.navigateTo('leaderboard');
    }
    handleSettings() {
        this.routerManager.navigateTo('settings');
    }
    handleBackToCheckOtp() {
        this.routerManager.navigateTo('check-otp');
        this.render();
    }
    handleOtpVerificationComplete(success) {
        if (success) {
            console.log('OTP verification successful, redirecting to menu');
            // Clear OTP data
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
    handleChatWithFriends() {
        // TODO: Implement chat functionality
        console.log('Chat with friends functionality not yet implemented');
    }
    handleBackToMenu() {
        this.routerManager.navigateTo('menu');
    }
    handleBackToAuth() {
        this.routerManager.navigateTo('auth');
    }
    handleShowGuestPage() {
        this.routerManager.navigateTo('guest');
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
    handlePlayAsGuest(nickname, avatar) {
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
}
