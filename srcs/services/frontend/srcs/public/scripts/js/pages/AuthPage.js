"use strict";
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
exports.AuthPage = void 0;
var CheckManager_js_1 = require("../modules/CheckManager.js");
var AuthPage = /** @class */ (function () {
    function AuthPage(uiManager, authManager, checkManager, languageManager, onLogin, onRegister, onForgotPassword, onChangePassword, onPlayAsGuest, onError) {
        this.isLogin = true;
        this.showForgotPassword = false;
        this.showChangePassword = false;
        this.formData = {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        };
        this.errors = [];
        this.text = {};
        this.uiManager = uiManager;
        this.authManager = authManager;
        this.languageManager = languageManager;
        this.onLogin = onLogin;
        this.onRegister = onRegister;
        this.onForgotPassword = onForgotPassword;
        this.onChangePassword = onChangePassword;
        this.onPlayAsGuest = onPlayAsGuest;
        this.onError = onError;
        this.boundHandleSubmit = this.handleSubmit.bind(this);
        this.checkManager = new CheckManager_js_1.CheckManager(this.languageManager);
        this.authManager.setHandlers({
            onChangePasswordRequest: this.handleChangePassword.bind(this),
        });
    }
    AuthPage.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    //////////////////////////////////////////////
    //////////////////DESIGN PAGE ////////////////
    //////////////////////////////////////////////
    AuthPage.prototype.render = function () {
        var _this = this;
        console.log("render: ", this.showChangePassword);
        var container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        var content = this.uiManager.createElement('div', 'relative z-10');
        content.style.width = '600px';
        var card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
        // Header
        var header = this.uiManager.createElement('div', 'text-center mb-8');
        var title = this.uiManager.createElement('h1', 'retro-title text-3x2 mb-2', this.showForgotPassword
            ? this.t('reset_password')
            : this.showChangePassword
                ? this.t('change_password')
                : (this.isLogin ? this.t('login') : this.t('register')));
        var subtitle = this.uiManager.createElement('p', 'retro-subtitle text-sm', this.showForgotPassword
            ? this.t('enter_email_to_reset')
            : this.showChangePassword
                ? this.t('enter_new_password')
                : this.t(''));
        header.appendChild(title);
        header.appendChild(subtitle);
        // Error messages
        if (this.errors.length > 0) {
            var errorContainer_1 = this.uiManager.createElement('div', 'mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg');
            this.errors.forEach(function (error) {
                var errorDiv = _this.uiManager.createElement('div', 'retro-text text-sm text-red-400', error);
                errorContainer_1.appendChild(errorDiv);
            });
            card.appendChild(errorContainer_1);
        }
        // Form
        var form = this.uiManager.createElement('form', 'space-y-6');
        form.addEventListener('submit', this.boundHandleSubmit);
        if (this.showForgotPassword) {
            var emailField = this.createField(this.t('email'), 'email', 'email', this.t('enter_email'));
            form.appendChild(emailField);
            var submitButton = this.uiManager.createButton(this.t('reset_password'), 'retro-button auth-btn auth-btn-primary', function () { return _this.onForgotPassword(_this.formData.email); });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        else if (this.showChangePassword) {
            var passwordField = this.createField(this.t('password'), 'password', 'password', this.t('enter_new_password_placeholder'));
            var passwordConfirmField = this.createField(this.t('password_confirm'), 'password', 'confirmPassword', this.t('enter_again_new_password'));
            form.appendChild(passwordField);
            form.appendChild(passwordConfirmField);
            var submitButton = this.uiManager.createButton(this.t('change_password'), 'retro-button auth-btn auth-btn-primary', function () { });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        else {
            var usernameField = this.createField(this.t('username'), 'text', 'username', this.t('enter_username'));
            form.appendChild(usernameField);
            if (!this.isLogin) {
                var emailField = this.createField(this.t('email'), 'email', 'email', this.t('enter_email'));
                form.appendChild(emailField);
            }
            var passwordField = this.createField(this.t('password'), 'password', 'password', this.t('enter_password'));
            form.appendChild(passwordField);
            if (!this.isLogin) {
                var confirmPasswordField = this.createField(this.t('confirm_password'), 'password', 'confirmPassword', this.t('confirm_password_placeholder'));
                form.appendChild(confirmPasswordField);
            }
            var submitButton = this.uiManager.createButton(this.isLogin ? this.t('login') : this.t('create_account'), this.isLogin
                ? 'retro-button auth-btn auth-btn-primary text-lg'
                : 'retro-button auth-btn auth-btn-oauth', function () { });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        // Toggle section
        var toggleContainer = this.uiManager.createElement('div', 'text-center mt-6');
        if (this.showForgotPassword) {
            var backToLoginButton = this.uiManager.createElement('button', 'toggle-link');
            backToLoginButton.textContent = this.t('back_to_login');
            backToLoginButton.type = 'button';
            backToLoginButton.addEventListener('click', this.handleBackToLogin.bind(this));
            toggleContainer.appendChild(backToLoginButton);
        }
        else if (this.showChangePassword) {
            var backToLoginButton = this.uiManager.createElement('button', 'toggle-link');
            backToLoginButton.textContent = this.t('wrong_email');
            backToLoginButton.type = 'button';
            backToLoginButton.addEventListener('click', this.handleBackToForgotPassword.bind(this));
            toggleContainer.appendChild(backToLoginButton);
        }
        else {
            var toggleButton = this.uiManager.createElement('button', 'toggle-link');
            toggleButton.textContent = this.isLogin ? this.t('dont_have_account') : this.t('already_have_account');
            toggleButton.type = 'button';
            toggleButton.addEventListener('click', this.toggleMode.bind(this));
            toggleContainer.appendChild(toggleButton);
            if (this.isLogin) {
                var forgotPasswordContainer = this.uiManager.createElement('div', 'text-center mt-3');
                var forgotPasswordButton = this.uiManager.createElement('button', 'toggle-link');
                forgotPasswordButton.textContent = this.t('forgot_your_password');
                forgotPasswordButton.type = 'button';
                forgotPasswordButton.addEventListener('click', this.handleForgotPassword.bind(this));
                forgotPasswordContainer.appendChild(forgotPasswordButton);
                toggleContainer.appendChild(forgotPasswordContainer);
            }
        }
        card.appendChild(header);
        card.appendChild(form);
        if (!this.showForgotPassword || !this.showChangePassword) {
            var oauthContainer = this.uiManager.createElement('div', 'mt-6 space-y-3');
            var divider = this.uiManager.createElement('div', 'flex items-center my-4');
            var dividerLine = this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent');
            divider.appendChild(dividerLine);
            divider.appendChild(this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent'));
            // Register buttons
            var googleBtn = this.uiManager.createButton(this.t('sign_in_with_google'), 'retro-button auth-btn auth-btn-google', function () { return _this.handleGoogleSignIn(); });
            var auth42Btn = this.uiManager.createButton(this.t('sign_in_with_42'), 'retro-button auth-btn auth-btn-42', function () { return _this.handle42SignIn(); });
            oauthContainer.appendChild(divider);
            oauthContainer.appendChild(googleBtn);
            oauthContainer.appendChild(auth42Btn);
            var playAsGuestBtn = this.uiManager.createButton(this.t('play_as_guest'), 'retro-button auth-btn auth-btn-guest', this.onPlayAsGuest);
            oauthContainer.appendChild(playAsGuestBtn);
            card.appendChild(oauthContainer);
        }
        card.appendChild(toggleContainer);
        card.appendChild(this.createLanguageSelector());
        content.appendChild(card);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    };
    //////////////////////////////////////////////
    ///////////// CREATE ELEMENTS ////////////////
    //////////////////////////////////////////////
    AuthPage.prototype.createField = function (label, type, name, placeholder) {
        var _this = this;
        var fieldContainer = this.uiManager.createElement('div');
        var labelElement = this.uiManager.createElement('label', 'retro-text text-sm block mb-2', label);
        fieldContainer.appendChild(labelElement);
        var input = this.uiManager.createInput(type, placeholder, 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        input.value = this.formData[name];
        input.addEventListener('input', function (e) {
            var target = e.target;
            _this.formData[name] = target.value;
            if (_this.errors.length > 0) {
                _this.errors = [];
                _this.render();
            }
        });
        fieldContainer.appendChild(input);
        return fieldContainer;
    };
    AuthPage.prototype.createLanguageSelector = function () {
        var _this = this;
        var languages = [
            { code: "en", flag: "🇬🇧" },
            { code: "fr", flag: "🇫🇷" },
            { code: "pt", flag: "🇧🇷" },
            { code: "et", flag: "🇪🇪" },
        ];
        var currentLangCode = this.languageManager.getCurrentLang();
        var currentLangIndex = languages.findIndex(function (l) { return l.code === currentLangCode; });
        if (currentLangIndex === -1)
            currentLangIndex = 0;
        var wrapper = this.uiManager.createElement("div", "flex items-center justify-center gap-2 mt-6 cursor-pointer");
        var label = this.uiManager.createElement("span", "retro-text text-[#ff1493]", "LANGUAGE:");
        var flag = this.uiManager.createElement("span", "text-2xl", languages[currentLangIndex].flag);
        flag.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
            var nextLang, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentLangIndex = (currentLangIndex + 1) % languages.length;
                        nextLang = languages[currentLangIndex];
                        flag.textContent = nextLang.flag;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.languageManager.setLang(nextLang.code)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.languageManager.loadTranslations()];
                    case 3:
                        _a.sent();
                        this.render();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.error("Error changing language:", err_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
        wrapper.appendChild(label);
        wrapper.appendChild(flag);
        return wrapper;
    };
    AuthPage.prototype.toggleMode = function () {
        this.isLogin = !this.isLogin;
        this.formData = { username: '', email: '', password: '', confirmPassword: '' };
        this.errors = [];
        this.render();
    };
    //////////////////////////////////////////////
    ///////////// HANDLERS ///////////////////////
    //////////////////////////////////////////////
    AuthPage.prototype.handleGoogleSignIn = function () {
        // TODO: Implement Google OAuth
        console.log('Google Sign In clicked');
        // This would typically redirect to Google OAuth or open a popup
    };
    AuthPage.prototype.handle42SignIn = function () {
        console.log('42 Sign In clicked');
        window.location.href = "".concat(window.location.origin, "/auth/42/login");
    };
    AuthPage.prototype.handleForgotPassword = function () {
        this.showForgotPassword = true;
        this.errors = [];
        this.render();
    };
    AuthPage.prototype.handleChangePassword = function () {
        this.showForgotPassword = false;
        this.showChangePassword = true;
        this.errors = [];
        this.render();
    };
    AuthPage.prototype.handleBackToLogin = function () {
        this.showForgotPassword = false;
        this.errors = [];
        this.render();
    };
    AuthPage.prototype.handleBackToForgotPassword = function () {
        this.showChangePassword = false;
        this.showForgotPassword = true;
        this.errors = [];
        this.render();
    };
    AuthPage.prototype.handleSubmit = function (e) {
        console.log("handleSubmit called");
        e.preventDefault();
        this.errors = [];
        if (this.showForgotPassword) {
            if (!this.formData.email) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            this.onForgotPassword(this.formData.email);
            return;
        }
        else if (this.showChangePassword) {
            if (!this.formData.password || !this.formData.confirmPassword) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            console.log(this.formData.password, " ", this.formData.confirmPassword);
            if (this.formData.password !== this.formData.confirmPassword) {
                console.log("strings dont match");
                var newErrors = [];
                newErrors.push('Password do not match');
                this.errors = newErrors;
                this.render();
                return;
            }
            var passwordErrors = this.checkManager.checkPassword(this.formData.password);
            if (passwordErrors.length > 0) {
                this.errors = passwordErrors;
                this.render();
                return;
            }
            console.log("strings matched");
            this.onChangePassword(this.formData.email, this.formData.password, this.formData.confirmPassword);
            return;
        }
        else if (this.isLogin) {
            if (!this.formData.username || !this.formData.password) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            this.onLogin(this.formData.username, this.formData.password);
            return;
        }
        else {
            var newErrors = [];
            if (!this.formData.username || !this.formData.email || !this.formData.password || !this.formData.confirmPassword) {
                newErrors.push('Please fill in all fields');
            }
            if (this.formData.password !== this.formData.confirmPassword) {
                newErrors.push('Passwords do not match');
            }
            if (this.formData.password.length < 6) {
                newErrors.push('Password must be at least 6 characters');
            }
            if (!/\S+@\S+\.\S+/.test(this.formData.email)) {
                newErrors.push('Please enter a valid email');
            }
            if (newErrors.length > 0) {
                this.errors = newErrors;
                this.render();
                return;
            }
            this.onRegister(this.formData.username, this.formData.email, this.formData.password, this.formData.confirmPassword);
            return;
        }
    };
    //////////////////////////////////////////////
    ///////////// SHOW FUNCTIONS /////////////////
    //////////////////////////////////////////////
    AuthPage.prototype.showError = function (error) {
        this.errors = [error];
        this.render();
    };
    AuthPage.prototype.showLogin = function () {
        this.showForgotPassword = false;
        this.showChangePassword = false;
        this.isLogin = true;
        this.errors = [];
        this.render();
    };
    return AuthPage;
}());
exports.AuthPage = AuthPage;
