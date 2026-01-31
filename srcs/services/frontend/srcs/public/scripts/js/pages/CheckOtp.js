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
exports.CheckOtp = void 0;
var CheckManager_js_1 = require("../modules/CheckManager.js");
var OTPManager_js_1 = require("../modules/OTPManager.js");
var CheckOtp = /** @class */ (function () {
    function CheckOtp(uiManager, languageManager, onVerificationComplete, onChangePassword, onUpdateProfile, onBack) {
        this.uiManager = uiManager;
        this.languageManager = languageManager;
        this.otpManager = new OTPManager_js_1.OTPManagers();
        this.onVerificationComplete = onVerificationComplete;
        this.onChangePassword = onChangePassword;
        this.onUpdateProfile = onUpdateProfile;
        this.onBack = onBack;
        this.check = new CheckManager_js_1.CheckManager(this.languageManager);
    }
    CheckOtp.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    CheckOtp.prototype.render = function (text, params) {
        var container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        var content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
        var card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
        // Header
        var header = this.uiManager.createElement('div', 'text-center mb-8');
        var title = this.uiManager.createElement('h1', 'retro-text text-3xl font-bold text-[#00ffff] mb-2');
        title.textContent = text.verifyTitle || this.t("verifyTitle");
        var subtitle = this.uiManager.createElement('p', 'text-white/80 text-sm');
        subtitle.textContent = text.verifyInstruction || this.t("verifyInstruction");
        header.appendChild(title);
        header.appendChild(subtitle);
        // OTP Container
        var otpContainer = this.uiManager.createElement('div', 'space-y-6');
        var codeContainer = this.uiManager.createElement('div', 'flex justify-center space-x-2');
        codeContainer.id = 'codeContainer';
        // Create 6 input fields for the verification code
        for (var i = 0; i < 6; i++) {
            var input = this.uiManager.createElement('input', 'w-12 h-12 text-center rounded bg-black/60 border-2 border-[#00ffff] text-[#00ffff] focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493] retro-text text-xl');
            input.id = "code-".concat(i);
            input.type = 'text';
            input.maxLength = 1;
            codeContainer.appendChild(input);
        }
        // Error Display
        var errorDiv = this.uiManager.createElement('div', 'text-red-400 text-center text-sm hidden');
        errorDiv.id = 'otpError';
        // Buttons
        var buttonContainer = this.uiManager.createElement('div', 'space-y-3');
        var verifyBtn = this.uiManager.createButton(text.verify || this.t("verify"), 'w-full retro-button bg-[#00ffff] text-black hover:bg-[#00ffff]/80 hover:text-black border-2 border-[#00ffff] py-3', function () { });
        verifyBtn.id = 'verifyBtn';
        var backBtn = this.uiManager.createButton(text.back || this.t("back"), 'w-full retro-button bg-transparent text-[#00ffff] hover:bg-[#00ffff]/10 border-2 border-[#00ffff] py-3', function () { });
        backBtn.id = 'backBtn';
        buttonContainer.appendChild(verifyBtn);
        buttonContainer.appendChild(backBtn);
        otpContainer.appendChild(codeContainer);
        otpContainer.appendChild(errorDiv);
        otpContainer.appendChild(buttonContainer);
        // Assemble the card
        card.appendChild(header);
        card.appendChild(otpContainer);
        content.appendChild(card);
        container.appendChild(content);
        // Clear existing content and add new content
        this.uiManager.container.innerHTML = '';
        this.uiManager.container.appendChild(container);
        // Set up event listeners
        this.setupEventListeners(params, text);
    };
    CheckOtp.prototype.setupEventListeners = function (params, text) {
        var _this = this;
        var inputs = document.querySelectorAll('#codeContainer input');
        if (!inputs) {
            console.error("Failed to find inputs element");
            return;
        }
        // Auto-focus and move to next input
        inputs.forEach(function (input, idx) {
            input.addEventListener('input', function () {
                input.value = input.value.replace(/\D/g, '');
                if (input.value.length === 1 && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });
        });
        // Verify button
        var verifyBtn = this.check.getElement('verifyBtn');
        verifyBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.otpManager.OTPValidationHandler(params, inputs)];
                    case 1:
                        result = _a.sent();
                        if (!result.success) {
                            this.showError(result.error || this.t("otpError")); // Use translation for error message
                        }
                        console.log("Params context: ", params.context);
                        if (params.context === 'verify') {
                            // this.onChangePassword(result.success);
                            console.log("Skipping params.handler()");
                            return [2 /*return*/];
                        }
                        else if (params.context === 'update-email') {
                            console.log("Going to update profile");
                            this.onUpdateProfile(result.success);
                        }
                        this.onVerificationComplete(result.success);
                        return [2 /*return*/];
                }
            });
        }); });
        // Back button
        var backBtn = this.check.getElement('backBtn');
        backBtn.addEventListener('click', function () {
            _this.onBack();
        });
    };
    CheckOtp.prototype.showError = function (message) {
        // Create or update error display
        var errorDiv = document.getElementById('otpError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'otpError';
            errorDiv.className = 'text-red-400 text-center mt-4';
            var verifyBtn = document.getElementById('verifyBtn');
            if (verifyBtn && verifyBtn.parentNode) {
                verifyBtn.parentNode.insertBefore(errorDiv, verifyBtn.nextSibling);
            }
        }
        errorDiv.textContent = message;
    };
    CheckOtp.prototype.hideError = function () {
        var errorDiv = document.getElementById('otpError');
        if (errorDiv) {
            errorDiv.textContent = '';
        }
    };
    return CheckOtp;
}());
exports.CheckOtp = CheckOtp;
