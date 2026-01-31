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
exports.AuthManager = void 0;
var ErrorManager_js_1 = require("./ErrorManager.js");
var RouterManager_js_1 = require("./RouterManager.js");
var OTPManager_js_1 = require("./OTPManager.js");
var AuthManager = /** @class */ (function () {
    function AuthManager(onBackToCheckOtp) {
        this.onBackToCheckOtp = onBackToCheckOtp;
        this.currentUser = null;
        this.listeners = [];
        this.otpData = null;
        this.router = new RouterManager_js_1.RouterManager();
        this.loadUserFromStorage();
        this.onBackToCheckOtp = onBackToCheckOtp;
        this.otpManager = new OTPManager_js_1.OTPManagers();
    }
    AuthManager.prototype.setHandlers = function (handlers) {
        this.onChangePasswordRequest = handlers.onChangePasswordRequest;
    };
    AuthManager.prototype.loadUserFromStorage = function () {
        var stored = localStorage.getItem('arcade_user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
            }
            catch (error) {
                console.error('Error loading user from storage:', error);
                localStorage.removeItem('arcade_user');
            }
        }
    };
    AuthManager.prototype.saveUserToStorage = function () {
        if (this.currentUser) {
            localStorage.setItem('arcade_user', JSON.stringify(this.currentUser));
        }
        else {
            localStorage.removeItem('arcade_user');
        }
    };
    AuthManager.prototype.isConnectedUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.router.getUrl('auth/is-connected');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(url, {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json"
                                },
                                credentials: "include",
                                body: JSON.stringify({})
                            })];
                    case 2:
                        res = _a.sent();
                        if (!res.ok) {
                            console.log("failed");
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, res.json()];
                    case 3:
                        result = _a.sent();
                        if (result.success)
                            return [2 /*return*/, true];
                        else
                            return [2 /*return*/, false];
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.log(err_1);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.getConnectedUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, result, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/me'), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            return [2 /*return*/, result.data.user];
                        }
                        _a.label = 3;
                    case 3:
                        if (res.status === 401) {
                        }
                        else {
                            console.warn("getConnectedUser: unexpected response (".concat(res.status, ")"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_2 = _a.sent();
                        if (err_2 instanceof TypeError && err_2.message.includes("NetworkError")) {
                            console.debug("getConnectedUser: server internal error");
                        }
                        else {
                            console.error("getConnectedUser: unexpected error →", err_2);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    AuthManager.prototype.getCurrentUser = function () {
        console.log("current user:", this.currentUser);
        return this.currentUser;
    };
    AuthManager.prototype.isAuthenticated = function () {
        return this.currentUser !== null;
    };
    AuthManager.prototype.login = function (credentials, text) {
        return __awaiter(this, void 0, void 0, function () {
            var loginInput, passwdInput, view, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loginInput = credentials.username;
                        if (!loginInput.trim()) {
                            return [2 /*return*/, { success: false, error: 'Username is required' }];
                        }
                        passwdInput = credentials.password;
                        if (!passwdInput.trim()) {
                            return [2 /*return*/, { success: false, error: 'Password is required' }];
                        }
                        view = 'signin';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.logUser(loginInput, passwdInput, text, view)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Login failed:', error_1);
                        return [2 /*return*/, { success: false, error: 'Login failed. Please try again.' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.logUser = function (pseudo, password, text, view) {
        return __awaiter(this, void 0, void 0, function () {
            var form, res, texttext, result, errorMessage, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        form = {
                            pseudo: pseudo,
                            password: password
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/login'), {
                                method: 'POST',
                                headers: {
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify(form)
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.text()];
                    case 3:
                        texttext = _b.sent();
                        console.log("DEBUG RESPONSE:", texttext);
                        result = JSON.parse(texttext);
                        if (!result) {
                            return [2 /*return*/, { success: false, error: "Server error" }];
                        }
                        if (!result.success) {
                            errorMessage = ((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || result.error
                                || result.message || 'Unknown error';
                            return [2 /*return*/, { success: false, error: errorMessage }];
                        }
                        else {
                            // Store OTP data for the CheckOtp page
                            this.otpData = {
                                otp_id: result.otp_id,
                                context: "login",
                                handler: this.otpManager.signupSuccessHandler
                            };
                            console.log("OTP data stored:", this.otpData);
                            this.onBackToCheckOtp();
                            // Return success with verification data
                            return [2 /*return*/, {
                                    success: true,
                                    needsVerification: true,
                                    verificationData: {
                                        otp_id: result.otp_id || 'temp_otp_id',
                                        context: "login",
                                        handler: "signupSuccessHandler"
                                    }
                                }];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _b.sent();
                        console.error('Login error:', error_2);
                        return [2 /*return*/, { success: false, error: "Network error. Please try again." }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.register = function (form, text) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, login, email, passwd, passwdConfirm, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errors = [];
                        login = form.username;
                        email = form.email;
                        passwd = form.password;
                        passwdConfirm = form.confirmPassword;
                        if (!login.trim())
                            errors.push('Username is required');
                        if (!email.trim())
                            errors.push('Email is required');
                        if (!passwd)
                            errors.push('Password is required');
                        if (passwd !== passwdConfirm)
                            errors.push('Passwords do not match');
                        if (passwd.length < 6)
                            errors.push('Password must be at least 6 characters');
                        if (!/\S+@\S+\.\S+/.test(email))
                            errors.push('Please enter a valid email');
                        if (errors.length > 0) {
                            return [2 /*return*/, { success: false, error: errors.join(', ') }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.registerUser(login, passwd, email, 'signup')];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Registration failed:', error_3);
                        return [2 /*return*/, { success: false, error: 'Registration failed. Please try again.' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.registerUser = function (pseudo, password, email, view) {
        return __awaiter(this, void 0, void 0, function () {
            var errorDiv, avatar, form, res, result, errorMessage, err_3, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        errorDiv = document.getElementById('formErrors');
                        avatar = "default.png";
                        form = {
                            email: email,
                            pseudo: pseudo,
                            password: password,
                            avatar: avatar
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/signup'), {
                                method: 'POST',
                                headers: {
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify(form)
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        result = _b.sent();
                        if (!result) {
                            if (errorDiv) {
                                errorDiv.textContent = "Server error";
                            }
                            return [2 /*return*/, { success: false, error: "Server error" }];
                        }
                        if (!result.success) {
                            errorMessage = ((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || result.error || result.message || 'Unknown error';
                            if (errorDiv) {
                                errorDiv.textContent = errorMessage;
                            }
                            return [2 /*return*/, { success: false, error: errorMessage }];
                        }
                        else {
                            //window.location.href ="/";
                            // checkVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler})
                            // Store OTP data for the CheckOtp page
                            this.otpData = {
                                otp_id: result.otp_id,
                                context: "signup",
                                handler: this.otpManager.signupSuccessHandler
                            };
                            console.log("OTP data stored:", this.otpData);
                            this.onBackToCheckOtp();
                            if (errorDiv) {
                                errorDiv.textContent = result.message;
                            }
                            console.log("a confirmation mail has been sended");
                            // Return success with verification data
                            return [2 /*return*/, {
                                    success: true,
                                    needsVerification: true,
                                    verificationData: {
                                        otp_id: result.otp_id || 'temp_otp_id',
                                        context: "signup",
                                        handler: "signupSuccessHandler"
                                    }
                                }];
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_3 = _b.sent();
                        errorMessage = (0, ErrorManager_js_1.getErrorMessage)(err_3);
                        if (errorDiv) {
                            errorDiv.textContent = errorMessage;
                        }
                        return [2 /*return*/, { success: false, error: errorMessage }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.initCSRFToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, result, token, el, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/csrf-token'), {
                                method: "GET",
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res)
                            console.error("can't connect to server, please try again later");
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            token = result.data.csrfToken;
                            el = document.createElement("meta");
                            el.setAttribute('name', 'csrf-token');
                            el.setAttribute('content', token);
                            document.head.appendChild(el);
                        }
                        else {
                            console.error("Not authenticated...");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_4 = _a.sent();
                        console.error((0, ErrorManager_js_1.getErrorMessage)(err_4));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ;
    AuthManager.prototype.getCSRFToken = function () {
        var meta = document.querySelector("meta[name='csrf-token']");
        if (!meta)
            return "";
        var csrf_token = meta.getAttribute('content');
        if (!csrf_token)
            return "";
        return "";
    };
    AuthManager.prototype.logoutHandler = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, result, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = this.router.getUrl("auth/logout");
                        return [4 /*yield*/, fetch(url, {
                                method: "POST",
                                headers: {
                                    "x-csrf-token": this.getCSRFToken()
                                },
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            console.log("Somethig went wrong here");
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        localStorage.removeItem("guestNickname");
                        localStorage.removeItem("guestAvatar");
                        this.currentUser = null;
                        this.saveUserToStorage();
                        this.notifyListeners();
                        window.location.href = '/';
                        return [3 /*break*/, 4];
                    case 3:
                        err_5 = _a.sent();
                        console.log(err_5);
                        window.location.href = '/';
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.forgotPassword = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var res, result, err_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("in authmanager: otpdata: ", this.otpData);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/reset-password'), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: email })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, { success: false, error: "Failed to request password reset" }];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        if (!result.success)
                            return [2 /*return*/, { success: false, error: result.message || "Unknown error" }];
                        this.otpData = {
                            otp_id: result.otp_id,
                            context: "verify",
                            handler: function () {
                                var _a;
                                console.log("OTP verified, triggering Change Password UI first");
                                (_a = _this.onChangePasswordRequest) === null || _a === void 0 ? void 0 : _a.call(_this);
                            }
                        };
                        console.log("OTP data stored HERE:", this.otpData); // TODO: remove this line
                        this.onBackToCheckOtp();
                        console.log("AQUI DPS DE onbacktocheckotp"); // TODO: remove this line
                        // Return success with verification data
                        return [2 /*return*/, {
                                success: true,
                                needsVerification: true,
                                verificationData: {
                                    otp_id: result.otp_id || 'temp_otp_id',
                                    context: "verify",
                                    handler: function () {
                                        console.log("OTP verified, triggering Change Password UI");
                                        // this.onChangePasswordRequest?.();
                                    }
                                }
                            }];
                    case 3:
                        err_6 = _a.sent();
                        console.error("forgotPassword error:", err_6);
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.changePassword = function (email, password, otpId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, result, err_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(this.router.getUrl('auth/reset-password/otp-validation'), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: email, otp_id: otpId, password: password })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, { success: false, error: "Failed to change password" }];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        result = _a.sent();
                        if (!result.success)
                            return [2 /*return*/, { success: false, error: result.message || "Unknown error" }];
                        return [2 /*return*/, { success: true }];
                    case 3:
                        err_7 = _a.sent();
                        console.error("changePassword error:", err_7);
                        return [2 /*return*/, { success: false, error: "Network error" }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.prototype.logout = function () {
        this.logoutHandler();
        this.currentUser = null;
        // this.saveUserToStorage();
        this.notifyListeners();
    };
    AuthManager.prototype.addListener = function (callback) {
        var _this = this;
        this.listeners.push(callback);
        return function () {
            _this.listeners = _this.listeners.filter(function (l) { return l !== callback; });
        };
    };
    AuthManager.prototype.notifyListeners = function () {
        var _this = this;
        this.listeners.forEach(function (callback) { return callback(_this.currentUser); });
    };
    return AuthManager;
}());
exports.AuthManager = AuthManager;
