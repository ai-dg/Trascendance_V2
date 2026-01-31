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
exports.UpdateProfilePage = void 0;
var CheckManager_js_1 = require("../modules/CheckManager.js");
var UpdateProfilePage = /** @class */ (function () {
    function UpdateProfilePage(uiManager, routerManager, authManager, languageManager, onBack, onUpdateProfile, user) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.onBack = onBack;
        this.user = user !== null && user !== void 0 ? user : null;
        this.authManager = authManager;
        this.languageManager = languageManager;
        this.checkManager = new CheckManager_js_1.CheckManager(this.languageManager);
        this.onUpdateProfile = onUpdateProfile;
    }
    UpdateProfilePage.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    UpdateProfilePage.prototype.render = function () {
        var container = this.buildProfilePage();
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    };
    UpdateProfilePage.prototype.buildProfilePage = function () {
        var _this = this;
        var _a, _b;
        var container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
        var card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full max-w-md flex flex-col items-center gap-8 mt-16');
        // Avatar Section
        var avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2');
        var avatarImg = this.uiManager.createElement('img', 'rounded-full border-2 border-[#ff1493] cursor-pointer');
        avatarImg.style.width = '200px';
        avatarImg.style.height = '200px';
        if (!this.user || !this.user.avatar) {
            avatarImg.src = 'public/avatars/default.png';
        }
        else if (this.user.avatar.startsWith('http')) {
            avatarImg.src = this.user.avatar;
        }
        else {
            avatarImg.src = "public/avatars/".concat(this.user.avatar, ".png");
        }
        avatarImg.alt = this.t('avatarAlt');
        avatarImg.title = this.t('avatarTitle');
        avatarImg.addEventListener('click', function () {
            console.log('Change avatar clicked');
            _this.renderAvatarSelector();
        });
        var avatarLabel = this.uiManager.createElement('p', 'retro-subtitle text-sm opacity-70', this.t('clickToChangeAvatar'));
        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(avatarLabel);
        var createField = function (labelText, inputType, placeholder, changeHandler, withConfirm, currentValue) {
            if (withConfirm === void 0) { withConfirm = false; }
            var fieldContainer = _this.uiManager.createElement('div', 'flex flex-col gap-2 w-full');
            var label = _this.uiManager.createElement('label', 'retro-text text-sm text-[#00ffff]', labelText);
            fieldContainer.appendChild(label);
            if (currentValue) {
                var currentValueText = _this.uiManager.createElement('p', 'text-[#ff1493] text-sm italic mb-1', "".concat(_this.t('current'), ": ").concat(currentValue));
                fieldContainer.appendChild(currentValueText);
            }
            var inputWrapper = _this.uiManager.createElement('div', 'relative w-full');
            var input = _this.uiManager.createElement('input', 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text' +
                (inputType === 'password' ? ' pr-10' : ''));
            input.type = inputType;
            input.placeholder = placeholder;
            inputWrapper.appendChild(input);
            if (inputType === 'password') {
                var toggleBtn = _this.uiManager.createElement('button', "\n                absolute right-2 text-[#ff1493] bg-black rounded\n                hover:text-black hover:bg-[#ff1493]\n                focus:outline-none transition-all duration-150\n                p-1\n              ");
                toggleBtn.type = 'button';
                toggleBtn.innerHTML = '👁️';
                toggleBtn.addEventListener('click', function () {
                    input.type = input.type === 'password' ? 'text' : 'password';
                });
                inputWrapper.appendChild(toggleBtn);
            }
            fieldContainer.appendChild(inputWrapper);
            var confirmInput;
            if (withConfirm) {
                var confirmWrapper = _this.uiManager.createElement('div', 'relative w-full');
                confirmInput = _this.uiManager.createElement('input', 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text pr-10');
                confirmInput.type = inputType;
                confirmInput.placeholder = "".concat(_this.t('confirm'), " ").concat(placeholder.toLowerCase());
                confirmWrapper.appendChild(confirmInput);
                var confirmToggle = _this.uiManager.createElement('button', "\n                absolute right-2 text-[#ff1493] bg-black rounded\n                hover:text-black hover:bg-[#ff1493]\n                focus:outline-none transition-all duration-150\n                p-1\n              ");
                confirmToggle.type = 'button';
                confirmToggle.innerHTML = '👁️';
                confirmToggle.addEventListener('click', function () {
                    confirmInput.type = confirmInput.type === 'password' ? 'text' : 'password';
                });
                confirmWrapper.appendChild(confirmToggle);
                fieldContainer.appendChild(confirmWrapper);
            }
            var errorDiv = _this.uiManager.createElement('div', 'text-red-500 text-sm mt-1');
            fieldContainer.appendChild(errorDiv);
            var button = _this.uiManager.createButton(_this.t('change'), 'retro-button bg-transparent text-[#ff1493] px-4 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200 self-end', function () { return __awaiter(_this, void 0, void 0, function () {
                var err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("".concat(labelText, " changed to:"), input.value, withConfirm ? confirmInput === null || confirmInput === void 0 ? void 0 : confirmInput.value : '');
                            errorDiv.innerHTML = '';
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, changeHandler(input.value, confirmInput === null || confirmInput === void 0 ? void 0 : confirmInput.value)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            errorDiv.textContent = err_1.message || 'Error updating field';
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            fieldContainer.appendChild(button);
            return { fieldContainer: fieldContainer, errorDiv: errorDiv };
        };
        // let errorDiv: HTMLElement | undefined;
        // Username Field
        var _c = createField(this.t('username'), 'text', this.t('usernamePlaceholder'), function (value) { return __awaiter(_this, void 0, void 0, function () {
            var usernameErrors, res, message3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        usernameErrors = this.checkManager.checkUsername(value);
                        if (usernameErrors.length > 0) {
                            if (usernameErrorDiv)
                                usernameErrorDiv.innerHTML = '';
                            usernameErrors.forEach(function (error) {
                                var errorMessage = _this.uiManager.createElement('p', '', error);
                                usernameErrorDiv === null || usernameErrorDiv === void 0 ? void 0 : usernameErrorDiv.appendChild(errorMessage);
                            });
                            console.log("usernameErrors:", usernameErrors);
                            console.log(usernameErrorDiv);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('auth/update-username'), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: "include",
                                body: JSON.stringify({ username: value })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        message3 = _a.sent();
                        throw new Error(message3.message || this.t('failedUpdateUsername'));
                    case 3:
                        if (this.user)
                            this.user.username = value;
                        this.render();
                        return [2 /*return*/];
                }
            });
        }); }, false, (_a = this.user) === null || _a === void 0 ? void 0 : _a.username), usernameField = _c.fieldContainer, usernameErrorDiv = _c.errorDiv;
        // Email Field
        var _d = createField(this.t('email'), 'email', this.t('emailPlaceholder'), function (value) { return __awaiter(_this, void 0, void 0, function () {
            var emailErrors, res, message, data1, res3, message, data, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!value)
                            throw new Error(this.t('noEmailEntered'));
                        emailErrors = this.checkManager.checkEmail(value);
                        if (emailErrors.length > 0) {
                            if (emailErrorDiv)
                                emailErrorDiv.innerHTML = '';
                            emailErrors.forEach(function (error) {
                                var errorMessage = _this.uiManager.createElement('p', '', error);
                                emailErrorDiv === null || emailErrorDiv === void 0 ? void 0 : emailErrorDiv.appendChild(errorMessage);
                            });
                            console.log("emailErrors:", emailErrors);
                            console.log(emailErrorDiv);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/verify-email-valid'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: "include",
                                body: JSON.stringify({ email: value })
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        message = _a.sent();
                        throw new Error(message.message || this.t('failedRequestOTP'));
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        data1 = _a.sent();
                        console.log("OTP sent:", data1);
                        if (!data1.success)
                            throw new Error(data1.message || this.t('failedUpdateEmail'));
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/verify-email'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: "include",
                                body: JSON.stringify({ email: value })
                            })];
                    case 6:
                        res3 = _a.sent();
                        if (!!res3.ok) return [3 /*break*/, 8];
                        return [4 /*yield*/, res3.json()];
                    case 7:
                        message = _a.sent();
                        throw new Error(message.message || this.t('failedRequestOTP'));
                    case 8: return [4 /*yield*/, res3.json()];
                    case 9:
                        data = _a.sent();
                        this.routerManager.navigateTo('check-otp', data.otp_id);
                        this.authManager.otpData = {
                            otp_id: data.otp_id,
                            context: "verify-email",
                            handler: function () { return __awaiter(_this, void 0, void 0, function () {
                                var res2, message2, error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 4, , 5]);
                                            return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/update-email'), {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    credentials: 'include',
                                                    body: JSON.stringify({ email: value })
                                                })];
                                        case 1:
                                            res2 = _a.sent();
                                            if (!!res2.ok) return [3 /*break*/, 3];
                                            return [4 /*yield*/, res2.json()];
                                        case 2:
                                            message2 = _a.sent();
                                            if (this.authManager.otpData)
                                                this.authManager.otpData.context = "update-profile";
                                            throw new Error(message2.message || this.t('failedUpdateEmail'));
                                        case 3:
                                            if (this.user)
                                                this.user.email = value;
                                            if (this.authManager.otpData)
                                                this.authManager.otpData.context = "update-profile";
                                            this.render();
                                            return [3 /*break*/, 5];
                                        case 4:
                                            error_2 = _a.sent();
                                            if (error_2 instanceof Error) {
                                                if (this.authManager.otpData)
                                                    this.authManager.otpData.context = "update-profile";
                                                throw new Error(error_2.message || this.t('failedUpdateEmail'));
                                            }
                                            else {
                                                if (this.authManager.otpData)
                                                    this.authManager.otpData.context = "update-profile";
                                                throw new Error(this.t('failedUpdateEmail'));
                                            }
                                            return [3 /*break*/, 5];
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            }); }
                        };
                        return [3 /*break*/, 11];
                    case 10:
                        error_1 = _a.sent();
                        if (error_1 instanceof Error)
                            throw new Error(error_1.message || this.t('failedRequestOTP'));
                        else
                            throw new Error(this.t('failedRequestOTP'));
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        }); }, false, (_b = this.user) === null || _b === void 0 ? void 0 : _b.email), emailField = _d.fieldContainer, emailErrorDiv = _d.errorDiv;
        // Password Fields (with confirm)
        var _e = createField(this.t('password'), 'password', this.t('enter_password'), function (value, confirmValue) { return __awaiter(_this, void 0, void 0, function () {
            var passwordErrors, res, message;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // TODO: checks to add
                        if (value !== confirmValue)
                            throw new Error("Passwords don't match");
                        passwordErrors = this.checkManager.checkPassword(value);
                        if (passwordErrors.length > 0) {
                            if (passwordErrorDiv)
                                passwordErrorDiv.innerHTML = '';
                            passwordErrors.forEach(function (error) {
                                var errorMessage = _this.uiManager.createElement('p', '', error);
                                passwordErrorDiv === null || passwordErrorDiv === void 0 ? void 0 : passwordErrorDiv.appendChild(errorMessage);
                            });
                            console.log("passwordErrors:", passwordErrors);
                            console.log(passwordErrorDiv);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('auth/update-password'), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: "include",
                                body: JSON.stringify({ password: value })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        message = _a.sent();
                        throw new Error(message.message || this.t('failedUpdatePassword'));
                    case 3:
                        this.render();
                        return [2 /*return*/];
                }
            });
        }); }, true), passwordField = _e.fieldContainer, passwordErrorDiv = _e.errorDiv;
        card.appendChild(avatarSection);
        card.appendChild(usernameField);
        card.appendChild(emailField);
        card.appendChild(passwordField);
        // delete account
        var deleteButton = this.uiManager.createButton(this.t('deleteAccount'), 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', function () {
            console.log('DELETE ACCOUNT clicked');
            _this.handlerDeleteAccount();
        });
        // Back button (optional)
        var backButton = this.uiManager.createButton(this.t('backToSettings'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', function () {
            _this.onBack();
        });
        card.appendChild(deleteButton);
        card.appendChild(backButton);
        container.appendChild(card);
        return container;
    };
    UpdateProfilePage.prototype.renderAvatarSelector = function () {
        var _this = this;
        var _a;
        var container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        var card = this.uiManager.createElement('div', 
        // Card large ("bannière") mais contenu gardé étroit au centre
        'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full flex flex-col items-center');
        card.style.width = '1300px';
        var inner = this.uiManager.createElement('div', 'w-full max-w-md flex flex-col items-center gap-8');
        var title = this.uiManager.createElement('h1', 
        // inline-flex => le titre ne "s'étire" pas en largeur avec la bannière
        'retro-title text-sm mb-6 inline-flex text-center', this.t('chooseYourAvatar'));
        var avatarContainer = this.uiManager.createAvatarSelector(function (avatarId) { return __awaiter(_this, void 0, void 0, function () {
            var res, text, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/update-avatar'), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ avatar: avatarId }),
                            })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text()];
                    case 2:
                        text = _a.sent();
                        throw new Error(text || this.t('failedUpdateAvatar'));
                    case 3:
                        if (this.user)
                            this.user.avatar = avatarId;
                        this.render();
                        return [3 /*break*/, 5];
                    case 4:
                        err_2 = _a.sent();
                        console.error('Error updating avatar:', err_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); }, (_a = this.user) === null || _a === void 0 ? void 0 : _a.avatar);
        var backButton = this.uiManager.createButton(this.t('back'), 'retro-button bg-transparent text-[#00ffff] px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', function () { return _this.render(); });
        var titleWrapper = this.uiManager.createElement('div', 'w-full flex justify-center');
        titleWrapper.style.width = '300%';
        titleWrapper.appendChild(title);
        inner.appendChild(titleWrapper);
        inner.appendChild(avatarContainer);
        inner.appendChild(backButton);
        card.appendChild(inner);
        container.appendChild(card);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    };
    UpdateProfilePage.prototype.handlerDeleteAccount = function () {
        var _this = this;
        console.log("Opening delete confirmation screen");
        var container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        var card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff0000] rounded-lg p-8 shadow-[0_0_30px_#ff0000] w-full max-w-md flex flex-col items-center gap-6 text-center');
        var title = this.uiManager.createElement('h1', 'retro-title text-3xl text-[#ff0000]', this.t('areYouSure'));
        var warningText = this.uiManager.createElement('p', 'text-[#ff6666] text-sm' + ' mb-4', this.t('permanentActionWarning'));
        var passwordWrapper = this.uiManager.createElement('div', 'relative w-full');
        var passwordInput = this.uiManager.createElement('input', 'w-full px-6 py-4 pr-10 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        passwordInput.type = 'password';
        passwordInput.placeholder = this.t('enterYourPassword');
        passwordWrapper.appendChild(passwordInput);
        var toggleButton = this.uiManager.createElement('button', "\n                absolute top-1/2 right-2 transform -translate-y-1/2 z-10\n                text-[#ff1493] bg-black rounded\n                focus:outline-none transition-all duration-150\n                p-1\n              ");
        toggleButton.type = 'button';
        toggleButton.innerHTML = '👁️';
        toggleButton.addEventListener('click', function () {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        });
        passwordWrapper.appendChild(toggleButton);
        var deleteButton = this.uiManager.createButton(this.t('deleteAccount'), 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', function () { return __awaiter(_this, void 0, void 0, function () {
            var password, res, text, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        password = passwordInput.value.trim();
                        if (!password) {
                            alert(this.t('enterPasswordAlert'));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!this.user) {
                            alert(this.t('userNotFoundAlert'));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('auth/delete-account'), {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                    email: this.user.email,
                                    password: password,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.text()];
                    case 3:
                        text = _a.sent();
                        throw new Error(text || this.t('failedDeleteAccount'));
                    case 4:
                        alert(this.t('accountDeleteSuccess'));
                        window.location.href = '/';
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        console.error('Error deleting account:', err_3);
                        alert(this.t('errorDeletingAccount'));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        var backButton = this.uiManager.createButton(this.t('cancel'), 'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', function () { return _this.render(); });
        card.appendChild(title);
        card.appendChild(warningText);
        card.appendChild(passwordWrapper);
        card.appendChild(deleteButton);
        card.appendChild(backButton);
        container.appendChild(card);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    };
    return UpdateProfilePage;
}());
exports.UpdateProfilePage = UpdateProfilePage;
