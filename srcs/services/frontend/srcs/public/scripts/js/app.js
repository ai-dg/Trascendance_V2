"use strict";
/**********************************************************************************************/
/**************************************** IMPORTS *********************************************/
/**********************************************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = exports.gameSocket = void 0;
var RouterManager_js_1 = require("./modules/RouterManager.js");
// Managers
var AuthManager_js_1 = require("./modules/AuthManager.js");
var UIManager_js_1 = require("./modules/UIManager.js");
var CheckManager_js_1 = require("./modules/CheckManager.js");
var LangManager_js_1 = require("./modules/LangManager.js");
// Pages
var AuthPage_js_1 = require("./pages/AuthPage.js");
var WebsocketManager_js_1 = require("./modules/WebsocketManager.js");
var MenuPage_js_1 = require("./pages/MenuPage.js");
var GameLocalPage_js_1 = require("./pages/GameLocalPage.js");
var GameRemotePage_js_1 = require("./pages/GameRemotePage.js");
var GameAiPage_js_1 = require("./pages/GameAiPage.js");
var CheckOtp_js_1 = require("./pages/CheckOtp.js");
var SettingsPage_js_1 = require("./pages/SettingsPage.js");
var UpdateProfilePage_js_1 = require("./pages/UpdateProfilePage.js");
var LiveChatPage_js_1 = require("./pages/LiveChatPage.js");
var GuestPage_js_1 = require("./pages/GuestPage.js");
exports.gameSocket = null;
/**********************************************************************************************/
/**************************************** MAIN APP CLASS *************************************/
/**********************************************************************************************/
var App = /** @class */ (function () {
    /**********************************************************************************************/
    /**************************************** CONSTRUCTOR ****************************************/
    /**********************************************************************************************/
    function App(container) {
        //this.container = container;
        var _this = this;
        var _a, _b, _c, _d;
        // State
        this.currentUser = null;
        this.currentPage = 'auth';
        // Socket Connections
        this.generalSocket = null;
        this.TournamentSocket = null;
        this.authManager = new AuthManager_js_1.AuthManager(this.handleBackToCheckOtp.bind(this));
        this.routerManager = new RouterManager_js_1.RouterManager(function (user) {
            _this.currentUser = user;
            // this.updateCurrentPage();
        });
        this.websocketManager = new WebsocketManager_js_1.WebsocketManager();
        // Managers
        this.uiManager = new UIManager_js_1.UIManager(container);
        this.languageManager = new LangManager_js_1.LanguageManager(this.routerManager);
        this.checkManager = new CheckManager_js_1.CheckManager(this.languageManager);
        // Initialize pages
        this.authPage = new AuthPage_js_1.AuthPage(this.uiManager, this.authManager, this.checkManager, this.languageManager, this.handleLogin.bind(this), this.handleRegister.bind(this), this.appHandleForgotPassword.bind(this), this.handleChangePassword.bind(this), this.handleShowGuestPage.bind(this), this.handleError.bind(this));
        this.menuPage = new MenuPage_js_1.MenuPage(this.uiManager, this.handlePlayGameAI.bind(this), this.handlePlayGameLocal.bind(this), this.handlePlayGameOnline.bind(this), this.handleChatWithFriends.bind(this), this.handleSettings.bind(this), this.handleLogout.bind(this));
        this.gamePageAI = new GameAiPage_js_1.AIPage(this.uiManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.gamePageLocal = new GameLocalPage_js_1.GamePageLocal(this.uiManager, this.handleBackToMenu.bind(this));
        this.gamePageOnline = new GameRemotePage_js_1.RemotePage(this.uiManager, this.handleBackToMenu.bind(this), this.currentUser);
        this.guestPage = new GuestPage_js_1.GuestPage(this.uiManager, this.handleBackToAuth.bind(this), this.handleConnectAsGuest.bind(this));
        this.checkOtpPage = new CheckOtp_js_1.CheckOtp(this.uiManager, this.languageManager, this.handleOtpVerificationComplete.bind(this), this.handleNewChangePassword.bind(this), this.handleBackToUpdateProfile.bind(this), this.handleBackToAuth.bind(this));
        this.updateProfilePage = new UpdateProfilePage_js_1.UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
        if (this.currentUser)
            this.settingsPage = new SettingsPage_js_1.SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), (_a = this.currentUser) !== null && _a !== void 0 ? _a : null, (_c = (_b = this.currentUser) === null || _b === void 0 ? void 0 : _b.isGuest) !== null && _c !== void 0 ? _c : true);
        this.liveChatPage = new LiveChatPage_js_1.LiveChatPage(this.uiManager, this.routerManager, this.languageManager, this.websocketManager, this.handleBackToMenu.bind(this), (_d = this.currentUser) !== null && _d !== void 0 ? _d : null);
        this.setupEventListeners();
        this.initialize();
    }
    /**********************************************************************************************/
    /**************************************** INITIALIZATION *************************************/
    /**********************************************************************************************/
    /**
     * Setup event listeners for auth and router changes
     */
    App.prototype.setupEventListeners = function () {
        var _this = this;
        // Listen to auth changes
        this.authManager.addListener(function (user) {
            _this.currentUser = user;
            _this.updateCurrentPage();
        });
        // Listen to router changes
        this.routerManager.addListener(function (page) {
            _this.currentPage = page;
            _this.render();
        });
    };
    /**
     * Initialize the application: check user session, setup sockets, and render
     */
    App.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, wsManager;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.getConnectedUser()];
                    case 1:
                        _a.currentUser = _b.sent();
                        return [4 /*yield*/, this.languageManager.init()];
                    case 2:
                        _b.sent();
                        if (this.currentUser) {
                            this.currentPage = 'menu';
                            wsManager = WebsocketManager_js_1.WebsocketManager.getInstance();
                            wsManager.init(window.location.origin);
                            // Expose the game socket for GameManager (imported from `../app.js`)
                            exports.gameSocket = wsManager.gameSocket;
                            // Route "new-game" to the currently active game page
                            wsManager.onGame('new-game', function (data) {
                                if (_this.currentPage === 'game-ai') {
                                    _this.gamePageAI.setupGame(data);
                                }
                                else if (_this.currentPage === 'game-local') {
                                    _this.gamePageLocal.setupGame(data);
                                }
                                else if (_this.currentPage === 'game-online') {
                                    _this.gamePageOnline.setupGame(data);
                                }
                            });
                            if (this.currentUser && !this.currentUser.isGuest) {
                                // this.menuPage.setWebsocketManager(wsManager);
                                this.liveChatPage.setWebsocketManager(wsManager);
                            }
                            // this.gamePageOnline.setWebsocketManager(wsManager);
                        }
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the currently connected user from server or localStorage
     */
    App.prototype.getConnectedUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, result, user, guestUser, guestNickname, guestAvatar, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('auth/me'), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        user = {
                            id: result.data.user.user_id,
                            username: result.data.user.pseudo,
                            email: result.data.user.user_mail,
                            avatar: result.data.user.avatar,
                            isGuest: false
                        };
                        return [2 /*return*/, user];
                    case 3:
                        if (res.status === 401) {
                        }
                        else {
                            console.warn("getConnectedUser: unexpected status ".concat(res.status));
                        }
                        guestUser = null;
                        guestNickname = localStorage.getItem("guestNickname");
                        guestAvatar = localStorage.getItem("guestAvatar");
                        if (guestAvatar && guestNickname) {
                            guestUser = {
                                username: guestNickname,
                                avatar: guestAvatar,
                                isGuest: true
                            };
                            return [2 /*return*/, guestUser];
                        }
                        return [2 /*return*/, null];
                    case 4:
                        err_1 = _a.sent();
                        if (err_1 instanceof TypeError && err_1.message.includes("NetworkError")) {
                            console.debug("getConnectedUser: server internal error");
                        }
                        else {
                            console.error("getConnectedUser: unexpected error →", err_1);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Update current page based on user authentication status
     */
    App.prototype.updateCurrentPage = function () {
        if (this.currentUser) {
            this.routerManager.navigateTo('menu');
        }
        else {
            this.routerManager.navigateTo('auth');
        }
    };
    /**********************************************************************************************/
    /**************************************** SOCKET MANAGEMENT ***********************************/
    /**********************************************************************************************/
    /**********************************************************************************************/
    /**************************************** RENDERING *******************************************/
    /**********************************************************************************************/
    /**
     * Render the current page based on router state
     */
    App.prototype.render = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, text;
            var _this = this;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        this.uiManager.clear();
                        _a = this;
                        return [4 /*yield*/, this.getConnectedUser()];
                    case 1:
                        _a.currentUser = _f.sent();
                        console.log("CURRENT USER RENDER: ", this.currentUser);
                        switch (this.currentPage) {
                            case 'auth':
                                this.authPage.render();
                                break;
                            case 'menu':
                                requestAnimationFrame(function () {
                                    _this.menuPage.render(_this.currentUser);
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
                                text = {};
                                (_b = this.authManager.otpData) !== null && _b !== void 0 ? _b : { otp_id: 'temp_otp_id', context: 'signup', handler: function () { return console.log('Default handler called'); } };
                                console.log("Using OTP params:", this.authManager.otpData);
                                this.checkOtpPage.render(text, this.authManager.otpData);
                                break;
                            case 'settings':
                                this.settingsPage = new SettingsPage_js_1.SettingsPage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.authPage, this.handleBackToMenu.bind(this), this.handleBackToUpdateProfile.bind(this), (_c = this.currentUser) !== null && _c !== void 0 ? _c : null, (_e = (_d = this.currentUser) === null || _d === void 0 ? void 0 : _d.isGuest) !== null && _e !== void 0 ? _e : true);
                                this.settingsPage.render();
                                break;
                            case 'update-profile':
                                this.updateProfilePage = new UpdateProfilePage_js_1.UpdateProfilePage(this.uiManager, this.routerManager, this.authManager, this.languageManager, this.handleSettings.bind(this), this.handleBackToUpdateProfile.bind(this), this.currentUser);
                                this.updateProfilePage.render();
                                break;
                            case 'live-chat':
                                this.liveChatPage = new LiveChatPage_js_1.LiveChatPage(this.uiManager, this.routerManager, this.languageManager, this.websocketManager, this.handleBackToMenu.bind(this), this.currentUser);
                                this.liveChatPage.render(this.currentUser);
                                break;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**********************************************************************************************/
    /**************************************** AUTH HANDLERS **************************************/
    /**********************************************************************************************/
    /**
     * Handle user login
     */
    App.prototype.handleLogin = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var text, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        text = {};
                        return [4 /*yield*/, this.authManager.login({ username: username, password: password }, text)];
                    case 1:
                        result = _a.sent();
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
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleRegister = function (username, email, password, confirmPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var text, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        text = {};
                        return [4 /*yield*/, this.authManager.register({ username: username, email: email, password: password, confirmPassword: confirmPassword }, text)];
                    case 1:
                        result = _a.sent();
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
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.appHandleForgotPassword = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Forgot password requested for:', email);
                        return [4 /*yield*/, this.authManager.forgotPassword(email)];
                    case 1:
                        response = _a.sent();
                        console.log('Response ', response);
                        if (response.success && response.needsVerification) {
                            this.routerManager.navigateTo('check-otp', response.verificationData);
                        }
                        else if (!response.success) {
                            console.error(response.error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleChangePassword = function (email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var otpId, response;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('Change password requested for:', email);
                        otpId = (_a = this.authManager.otpData) === null || _a === void 0 ? void 0 : _a.otp_id;
                        if (!otpId)
                            return [2 /*return*/, console.error("OTP ID missing")];
                        return [4 /*yield*/, this.authManager.changePassword(email, password, otpId)];
                    case 1:
                        response = _b.sent();
                        if (response.success) {
                            console.log("Password changed succesfully");
                            this.authManager.otpData = null;
                            this.authPage.showLogin();
                        }
                        else {
                            console.error(response.error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    App.prototype.handleNewChangePassword = function (success) {
        if (success) {
            console.log('OTP verification successful, redirecting to change password');
            this.authPage.handleChangePassword;
        }
        else {
            console.log('OTP verification failed');
            // Stay on check-otp page to retry
        }
    };
    App.prototype.handleOtpVerificationComplete = function (success) {
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
    };
    App.prototype.handleLogout = function () {
        this.authManager.logout();
    };
    App.prototype.handleError = function (error) {
        this.authPage.showError(error);
    };
    App.prototype.handleConnectAsGuest = function (nickname, avatar) {
        var _this = this;
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
        var wsManager = WebsocketManager_js_1.WebsocketManager.getInstance();
        wsManager.init(window.location.origin);
        exports.gameSocket = wsManager.gameSocket;
        wsManager.onGame('new-game', function (data) {
            if (_this.currentPage === 'game-ai') {
                _this.gamePageAI.setupGame(data);
            }
            else if (_this.currentPage === 'game-local') {
                _this.gamePageLocal.setupGame(data);
            }
            else if (_this.currentPage === 'game-online') {
                _this.gamePageOnline.setupGame(data);
            }
        });
        console.log('Playing as guest:', nickname, 'with avatar:', avatar);
        this.routerManager.navigateTo('menu');
    };
    /**********************************************************************************************/
    /**************************************** NAVIGATION HANDLERS ********************************/
    /**********************************************************************************************/
    App.prototype.handleBackToMenu = function () {
        this.routerManager.navigateTo('menu');
    };
    App.prototype.handleBackToAuth = function () {
        this.routerManager.navigateTo('auth');
    };
    App.prototype.handleShowGuestPage = function () {
        this.routerManager.navigateTo('guest');
    };
    App.prototype.handleSettings = function () {
        this.routerManager.navigateTo('settings');
    };
    App.prototype.handleBackToCheckOtp = function () {
        this.routerManager.navigateTo('check-otp');
        this.render();
    };
    App.prototype.handleBackToUpdateProfile = function (success) {
        if (success) {
            console.log("Email updated successfully!");
            this.routerManager.navigateTo('update-profile');
        }
        else {
            console.log("Problem to update e-mail");
            // this.routerManager.navigateTo('update-profile');
        }
    };
    /**********************************************************************************************/
    /**************************************** GAME HANDLERS **************************************/
    /**********************************************************************************************/
    App.prototype.handlePlayGameAI = function () {
        // TODO: Implement AI game logic
        console.log('Starting AI game...');
        if (this.gamePageAI) {
            this.gamePageAI.render(this.currentUser);
        }
        this.routerManager.navigateTo('game-ai');
    };
    App.prototype.handlePlayGameLocal = function () {
        // TODO: Implement local multiplayer logic
        console.log('Starting local multiplayer game...');
        this.routerManager.navigateTo('game-local');
    };
    App.prototype.handlePlayGameOnline = function () {
        // TODO: Implement online multiplayer logic
        console.log('Starting online multiplayer game...');
        this.routerManager.navigateTo('game-online');
    };
    /**********************************************************************************************/
    /**************************************** USER HANDLERS **************************************/
    /**********************************************************************************************/
    App.prototype.handleChatWithFriends = function () {
        // TODO: Implement chat functionality
        console.log('Chat with friends functionality not yet implemented');
        if (this.currentUser && this.currentUser.isGuest == false)
            this.routerManager.navigateTo('live-chat');
        else
            console.log('Connect to chat wih friends');
    };
    return App;
}());
exports.App = App;
