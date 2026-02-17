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
import { Logger } from './modules/Logger.js';
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
        this._lastAuthMeStatus = null;
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
        this.menuPage = new MenuPage(this.uiManager, this.websocketManager, this.routerManager, this.languageManager, this.handlePlayGameAI.bind(this), this.handlePlayGameLocal.bind(this), this.handlePlayGameOnline.bind(this), this.handleChatWithFriends.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this), this.handleShowPrivacyPolicy.bind(this), this.handleShowTermsOfService.bind(this));
        this.privacyPolicyPage = new PrivacyPolicyPage(this.uiManager, this.languageManager, this.handleBackToMenu.bind(this));
        this.termsOfServicePage = new TermsOfServicePage(this.uiManager, this.languageManager, this.handleBackToMenu.bind(this));
        this.gamePageAI = new AIPage(this.uiManager, this.languageManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.gamePageLocal = new GamePageLocal(this.uiManager, this.languageManager, this.handleBackToMenu.bind(this));
        this.gamePageOnline = new RemotePage(this.uiManager, this.languageManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.guestPage = new GuestPage(this.uiManager, this.languageManager, this.handleBackToAuth.bind(this), this.handleConnectAsGuest.bind(this));
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
        // Listen to auth changes (e.g. logout sets user to null)
        this.authManager.addListener((user) => {
            console.log('[REFRESH_DEBUG] AuthManager listener: user=', user ? 'id=' + user.id : 'null');
            this.currentUser = user;
            this.updateCurrentPage();
        });
        // Listen to router changes
        this.routerManager.addListener((page, data) => {
            if (page === 'auth')
                console.log('[AUTH_SWITCH]', { reason: 'router(page=auth)', currentUser: this.currentUser, stack: new Error().stack });
            if (page === 'menu')
                console.log('[MENU_SWITCH]', { reason: 'router(page=menu)', currentUser: this.currentUser, stack: new Error().stack });
            this.currentPage = page;
            this.currentRouteData = data;
            this.render();
        });
    }
    /**
     * Initialize the application: check user session, setup sockets, and render
     */
    async initialize() {
        const navEntry = typeof performance !== 'undefined' && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : undefined;
        const navType = navEntry?.type ?? 'unknown';
        const bootArcade = localStorage.getItem('arcade_user');
        console.log('[BOOT] origin=' + window.location.origin + ' navType=' + navType);
        console.log('[BOOT] arcade_user=' + (bootArcade == null ? 'null' : 'present') + ' length=' + (bootArcade?.length ?? 0));
        console.log('[REFRESH_DEBUG] ========== BOOT START ==========');
        console.log('[BOOT_ORIGIN]', window.location.origin, 'host=', window.location.host, 'protocol=', window.location.protocol);
        console.log('[REFRESH_DEBUG] origin=', window.location.origin, 'path=', window.location.pathname, 'navType=', navType, '(0=normal 1=reload 2=backforward)');
        const rawStored = bootArcade ?? localStorage.getItem('arcade_user');
        const hasStored = !!rawStored;
        console.log('[BOOT_STORAGE] arcade_user present=', hasStored, 'length=', rawStored?.length ?? 0, hasStored ? '(has value)' : '(empty)');
        console.log('[REFRESH_DEBUG] localStorage.arcade_user present=', hasStored, 'length=', rawStored?.length ?? 0);
        if (rawStored) {
            try {
                const parsed = JSON.parse(rawStored);
                console.log('[REFRESH_DEBUG] localStorage.arcade_user parsed id=', parsed?.id, 'isGuest=', parsed?.isGuest);
            }
            catch (e) {
                console.log('[REFRESH_DEBUG] localStorage.arcade_user parse error:', e.message);
            }
        }
        const cookieStr = document.cookie || '';
        console.log('[BOOT_COOKIES_CLIENT] document.cookie=', cookieStr === '' ? '(empty)' : cookieStr, '| length=', cookieStr.length, '| token/sessionId are HttpOnly so not visible here');
        console.log('[REFRESH_DEBUG] document.cookie (visible to JS)=', cookieStr === '' ? '(empty)' : cookieStr, '| length=', cookieStr.length, '| token/sessionId are httpOnly so never visible here');
        try {
            const debugUrl = this.routerManager.getUrl('auth/debug-cookies');
            const debugRes = await fetch(debugUrl, { method: 'GET', credentials: 'include', signal: AbortSignal.timeout(3000) });
            if (debugRes.ok) {
                const debug = await debugRes.json();
                console.log('[REFRESH_DEBUG] cookies received by server: token=', debug.tokenPresent, 'sessionId=', debug.sessionIdPresent, 'lang=', debug.langPresent);
            }
            else {
                console.log('[REFRESH_DEBUG] debug-cookies request failed status=', debugRes.status);
            }
        }
        catch (e) {
            console.log('[REFRESH_DEBUG] debug-cookies request error:', e.message);
        }
        // 1) Rehydrate from localStorage first so we never show "logged out" on refresh
        const stored = this.authManager.getCurrentUser();
        const hasRehydratedUser = !!stored;
        if (stored) {
            this.currentUser = stored;
            console.log('[REFRESH_DEBUG] Rehydrated from localStorage → currentUser.id=', stored.id, 'isGuest=', stored.isGuest);
        }
        else {
            console.log('[REFRESH_DEBUG] No user in localStorage → currentUser=null');
        }
        // 2) Then validate/refresh with auth/me (cookie). If it succeeds, update; if it fails, keep rehydrated user.
        const authMeUrl = this.routerManager.getUrl('auth/me');
        const sameOrigin = authMeUrl.startsWith(window.location.origin);
        console.log('[API_AUTH_REQ] auth/me url=', authMeUrl, 'sameOrigin=', sameOrigin, 'credentials=include');
        console.log('[REFRESH_DEBUG] Calling auth/me url=', authMeUrl, 'sameOrigin=', sameOrigin, 'credentials=include');
        const [user, _] = await Promise.all([
            this.getConnectedUser(),
            this.languageManager.init()
        ]);
        let resolvedUser = user;
        if (!resolvedUser && this.currentUser && !this.currentUser.isGuest) {
            console.log('[REFRESH_DEBUG] auth/me returned null but we have rehydrated user → retry auth/me once after 400ms');
            await new Promise((r) => setTimeout(r, 400));
            resolvedUser = await this.getConnectedUser();
            console.log('[REFRESH_DEBUG] auth/me retry result:', resolvedUser ? 'user id=' + resolvedUser.id : 'null');
        }
        if (resolvedUser) {
            this.currentUser = resolvedUser;
            this.authManager.setUserAndPersist(resolvedUser);
            console.log('[REFRESH_DEBUG] auth/me 200 → currentUser set and persisted, id=', resolvedUser.id);
        }
        else {
            // getConnectedUser() returned null: rehydrate from localStorage (Step E)
            this.currentUser = this.authManager.getCurrentUser();
            if (this.currentUser) {
                sessionStorage.removeItem('not_authenticated');
                this.authManager.setUserAndPersist(this.currentUser);
                console.log('[REFRESH_DEBUG] auth/me null but rehydrated from localStorage, id=', this.currentUser.id, '→ will show MENU');
            }
            // else: no user → will show AUTH
        }
        const authMeStatusStr = this._lastAuthMeStatus === 'error' ? 'error' : (this._lastAuthMeStatus ?? 'null');
        const showing = this.currentUser ? 'MENU' : 'AUTH';
        console.log('[DECIDE] authMeStatus=' + authMeStatusStr + ' hasRehydratedUser=' + hasRehydratedUser + ' currentUserId=' + (this.currentUser?.id ?? 'null') + ' showing=' + showing);
        console.log('[REFRESH_DEBUG] After init: currentUser.id=', this.currentUser ? this.currentUser.id : null, '→ showing=', this.currentUser ? 'MENU' : 'AUTH');
        console.log('[REFRESH_DEBUG] ========== BOOT END ==========');
        let didNavigate = false;
        if (this.currentUser) {
            const wsManager = WebsocketManager.getInstance();
            wsManager.init(window.location.origin);
            console.log('[AUTH_LOGIN] boot: user set, persisted to localStorage');
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
                    const pending = wsManager.getPendingGameInvite();
                    if (pending && data?.UUID) {
                        const inviteId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2);
                        wsManager.emitGeneral('game-invite', { friendId: pending.friendId, gameUUID: data.UUID, inviteId, message: pending.message });
                        this.gamePageOnline.setWaitingForInviteResponse(pending.friendId, pending.toUsername);
                        wsManager.clearPendingGameInvite();
                    }
                }
            });
            if (this.currentUser && !this.currentUser.isGuest) {
                // this.menuPage.setWebsocketManager(wsManager);
                this.liveChatPage.setWebsocketManager(wsManager);
            }
            // this.gamePageOnline.setWebsocketManager(wsManager);
            if (this.routerManager.getCurrentPage() === 'auth') {
                console.log('[MENU_SWITCH]', { reason: 'initialize(boot has user)', currentUser: this.currentUser, stack: new Error().stack });
                this.routerManager.navigateTo('menu', undefined, { replace: true });
                didNavigate = true;
            }
        }
        if (!didNavigate) {
            this.render();
        }
    }
    /**
     * Get the currently connected user from server or localStorage.
     * Cookie (auth/me) always wins over localStorage so that with two tabs (42 + guest)
     * the 42 session is not overwritten by the guest when refreshing.
     */
    async getConnectedUser() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthSuccess = urlParams.get('oauth_success') === '1';
        if (hasOAuthSuccess) {
            sessionStorage.removeItem("not_authenticated");
            urlParams.delete('oauth_success');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
        }
        // Always try auth/me first: cookie (42 session) must win over localStorage (guest can overwrite when 2 tabs)
        try {
            const res = await fetch(this.routerManager.getUrl('auth/me'), {
                method: 'GET',
                credentials: 'include',
                signal: AbortSignal.timeout(5000)
            });
            this._lastAuthMeStatus = res.status;
            console.log('[REFRESH_DEBUG] auth/me response status=', res.status, 'ok=', res.ok, '(if 401: cookie missing/expired or not sent with this request)');
            const data = await res.json();
            if (res.ok && data.success === true) {
                sessionStorage.removeItem("not_authenticated");
                const user = {
                    id: data.data.user.user_id,
                    username: data.data.user.pseudo,
                    email: data.data.user.user_mail,
                    avatar: data.data.user.avatar,
                    isGuest: false,
                    provider: (data.data.user.auth_provider === '42' ? '42' : 'local')
                };
                console.log('[REFRESH_DEBUG] auth/me 200 → server accepted cookie, user_id=', user.id);
                return user;
            }
            else if (res.ok && data.success === false) {
                console.log('[REFRESH_DEBUG] auth/me', res.status, '→ server rejected (no cookie, wrong cookie, token expired, or user not in DB)');
                sessionStorage.setItem("not_authenticated", "true");
                Logger.debug("getConnectedUser: " + res.status + " - user not authenticated");
                // Only use guest when server says not authenticated (no 42 cookie in this tab)
                const guestNickname = localStorage.getItem("guestNickname");
                const guestAvatar = localStorage.getItem("guestAvatar");
                if (guestAvatar && guestNickname) {
                    const guestId = localStorage.getItem("arcade_guest_id") || "guest";
                    console.log('[REFRESH_DEBUG] auth/me 401 → using guest from localStorage');
                    return { id: guestId, username: guestNickname, avatar: guestAvatar, isGuest: true };
                }
                return null;
            }
            console.log('[REFRESH_DEBUG] auth/me unexpected status=', res.status);
            Logger.warn(`getConnectedUser: unexpected status ${res.status}`);
            return null;
        }
        catch (err) {
            this._lastAuthMeStatus = 'error';
            console.log('[REFRESH_DEBUG] auth/me fetch error:', err instanceof Error ? err.message : String(err));
            if (err instanceof TypeError && err.message.includes("NetworkError")) {
                Logger.debug("getConnectedUser: server internal failure");
            }
            else {
                Logger.info("getConnectedUser: unexpected failure →", err);
            }
        }
        return null;
    }
    /**
     * Update current page based on user authentication status
     */
    updateCurrentPage() {
        if (this.currentUser) {
            console.log('[MENU_SWITCH]', { reason: 'updateCurrentPage(has user)', currentUser: this.currentUser, stack: new Error().stack });
            this.routerManager.navigateTo('menu');
        }
        else {
            console.log('[AUTH_SWITCH]', { reason: 'updateCurrentPage(no user)', currentUser: this.currentUser, stack: new Error().stack });
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
        const routerPage = this.routerManager.getCurrentPage();
        console.log('[RENDER_DECISION]', {
            currentUserId: this.currentUser?.id ?? null,
            currentPage: this.currentPage,
            routerPage,
            stack: new Error().stack
        });
        if (this.currentUser && this.currentPage === 'auth') {
            if (routerPage !== 'auth') {
                this.currentPage = routerPage;
            }
            else {
                this.routerManager.navigateTo('menu', undefined, { replace: true });
                return;
            }
        }
        console.log("CURRENT USER RENDER: ", this.currentUser);
        switch (this.currentPage) {
            case 'auth':
                console.log('[AUTH_SWITCH]', { reason: 'render(case auth)', currentUser: this.currentUser, stack: new Error().stack });
                this.authPage.render();
                break;
            case 'menu':
                console.log('[MENU_SWITCH]', { reason: 'render(case menu)', currentUser: this.currentUser, stack: new Error().stack });
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
                this.gamePageOnline.render(this.currentUser, this.currentRouteData);
                break;
            case 'check-otp':
                // TODO: Get translations from languageManager
                const text = {}; // Placeholder
                this.authManager.otpData ?? { otp_id: 'temp_otp_id', context: 'signup', handler: () => Logger.log('Default handler called') };
                Logger.log("Using OTP params:", this.authManager.otpData);
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
    async handleLogin(username, password) {
        const text = {};
        const result = await this.authManager.login({ username, password }, text);
        if (!result.success) {
            Logger.error('Login failed:', result.error);
            console.log('Login failed:', result.error);
            this.authPage.showError(result.error || 'Login failed');
        }
        else if (result.needsVerification) {
            Logger.log('Login successful, verification page should be shown by showVerificationCode');
            // The verification page will be shown by logUser via showVerificationCode
        }
        else {
            console.log('Login successful without verification');
            sessionStorage.removeItem("not_authenticated");
            // Fetch real user from auth/me (cookie was set by login) and persist so refresh keeps session
            console.log('[REFRESH_DEBUG] After login success: fetching auth/me to get user and persist');
            const user = await this.getConnectedUser();
            if (user) {
                this.currentUser = user;
                this.authManager.setUserAndPersist(user);
                console.log('[REFRESH_DEBUG] After login: auth/me returned user id=', user.id, '→ persisted to localStorage');
            }
            else {
                console.log('[REFRESH_DEBUG] After login: auth/me returned null (cookie may not be stored by browser) → using fallback user');
                this.currentUser = {
                    id: 'guest_' + Date.now(),
                    username: username,
                    email: '',
                    avatar: 'default.png',
                    isGuest: false
                };
                this.authManager.setUserAndPersist(this.currentUser);
            }
            this.routerManager.navigateTo('menu');
        }
    }
    async handleRegister(username, email, password, confirmPassword) {
        const text = {}; // TODO: Get translations from languageManager
        const result = await this.authManager.register({ username, email, password, confirmPassword }, text);
        if (!result.success) {
            Logger.error('Registration failed:', result.error);
            this.authPage.showError(result.error || 'Registration failed');
        }
        else if (result.needsVerification) {
            Logger.log('Registration successful, verification page should be shown by showVerificationCode');
            // The verification page will be shown by registerUser via showVerificationCode
        }
        else {
            Logger.log('Registration successful without verification');
            // TODO: Handle successful registration without verification
        }
    }
    async appHandleForgotPassword(email) {
        Logger.log('Forgot password requested for:', email);
        const response = await this.authManager.forgotPassword(email);
        Logger.log('Response ', response);
        if (response.success && response.needsVerification) {
            this.routerManager.navigateTo('check-otp', response.verificationData);
        }
        else if (!response.success) {
            Logger.error(response.error);
        }
    }
    async handleChangePassword(email, password) {
        Logger.log('Change password requested for:', email);
        const otpId = this.authManager.otpData?.otp_id;
        if (!otpId)
            return Logger.error("OTP ID missing");
        const response = await this.authManager.changePassword(email, password, otpId);
        if (response.success) {
            Logger.log("Password changed succesfully");
            this.authManager.otpData = null;
            this.authPage.showLogin();
        }
        else {
            Logger.error(response.error);
        }
    }
    handleNewChangePassword(success) {
        if (success) {
            Logger.log('OTP verification successful, redirecting to change password');
            this.authPage.handleChangePassword;
        }
        else {
            Logger.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    }
    async handleOtpVerificationComplete(success) {
        if (success) {
            console.log('[REFRESH_DEBUG] OTP verification successful → fetching auth/me to get user and persist');
            this.authManager.otpData = null;
            this.currentUser = await this.authManager.getConnectedUser();
            if (this.currentUser) {
                this.authManager.setUserAndPersist(this.currentUser);
                console.log('[REFRESH_DEBUG] After OTP: auth/me returned user id=', this.currentUser.id, '→ persisted to localStorage');
            }
            else {
                console.log('[REFRESH_DEBUG] After OTP: auth/me returned null (cookie may not be stored)');
            }
            this.routerManager.navigateTo('menu');
        }
        else {
            Logger.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    }
    handleLogout(reason) {
        console.log('[LOGOUT_TRIGGER]', { reason, stack: new Error().stack });
        this.authManager.logout(reason);
    }
    handleError(error) {
        this.authPage.showError(error);
    }
    handleConnectAsGuest(nickname, avatar) {
        const guestId = localStorage.getItem('arcade_guest_id') || 'guest_' + Date.now();
        if (!localStorage.getItem('arcade_guest_id')) {
            localStorage.setItem('arcade_guest_id', guestId);
        }
        this.currentUser = {
            id: guestId,
            username: nickname,
            email: '',
            avatar: avatar,
            isGuest: true
        };
        localStorage.setItem('guestNickname', nickname);
        localStorage.setItem('guestAvatar', avatar);
        this.authManager.setUserAndPersist(this.currentUser);
        console.log('[REFRESH_DEBUG] Guest connected and persisted id=', this.currentUser.id);
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
        Logger.log('Playing as guest:', nickname, 'with avatar:', avatar);
        this.routerManager.navigateTo('menu');
    }
    /**********************************************************************************************/
    /**************************************** NAVIGATION HANDLERS ********************************/
    /**********************************************************************************************/
    handleBackToMenu() {
        this.routerManager.navigateTo('menu');
    }
    handleBackToAuth() {
        console.log('[AUTH_SWITCH]', { reason: 'handleBackToAuth', currentUser: this.currentUser, stack: new Error().stack });
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
            Logger.log("Email updated successfully!");
            this.routerManager.navigateTo('update-profile');
        }
        else {
            Logger.log("Problem to update e-mail");
            // this.routerManager.navigateTo('update-profile');
        }
    }
    /**********************************************************************************************/
    /**************************************** GAME HANDLERS **************************************/
    /**********************************************************************************************/
    handlePlayGameAI() {
        // TODO: Implement AI game logic
        Logger.log('Starting AI game...');
        if (this.gamePageAI) {
            this.gamePageAI.render(this.currentUser);
        }
        this.routerManager.navigateTo('game-ai');
    }
    handlePlayGameLocal() {
        // TODO: Implement local multiplayer logic
        Logger.log('Starting local multiplayer game...');
        this.routerManager.navigateTo('game-local');
    }
    handlePlayGameOnline() {
        // TODO: Implement online multiplayer logic
        Logger.log('Starting online multiplayer game...');
        this.routerManager.navigateTo('game-online');
    }
    /**********************************************************************************************/
    /**************************************** USER HANDLERS **************************************/
    /**********************************************************************************************/
    handleChatWithFriends() {
        // TODO: Implement chat functionality
        Logger.log('Chat with friends functionality not yet implemented');
        if (this.currentUser && this.currentUser.isGuest == false)
            this.routerManager.navigateTo('live-chat');
        else
            Logger.log('Connect to chat wih friends');
    }
}
