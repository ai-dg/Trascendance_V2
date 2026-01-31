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
exports.SettingsPage = void 0;
var UpdateProfilePage_js_1 = require("./UpdateProfilePage.js");
var SettingsPage = /** @class */ (function () {
    function SettingsPage(uiManager, routerManager, authManager, languageManager, authPage, onBack, onUpdateProfile, user, isGuest) {
        if (isGuest === void 0) { isGuest = false; }
        this.user = user;
        this.isGuest = isGuest;
        this.settings = {
            soundEnabled: true,
            musicVolume: 75,
            effectsVolume: 60,
            fullscreen: false,
            scanLines: true,
            glowEffects: true,
            ballSpeed: 6,
            paddleSpeed: 8,
            showFPS: false,
            colorTheme: 'synthwave'
        };
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.authManager = authManager;
        this.languageManager = languageManager;
        this.authPage = authPage;
        this.onBack = onBack;
        this.onUpdateProfile = onUpdateProfile;
    }
    SettingsPage.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    SettingsPage.prototype.render = function () {
        var _this = this;
        var container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
        var content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl');
        // Header
        var header = this.uiManager.createElement('div', 'text-center mb-8');
        var title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', this.t('options'));
        //const subtitle = this.uiManager.createElement('p', 'retro-subtitle', this.t('optionsMessage'));
        header.appendChild(title);
        //header.appendChild(subtitle);
        // Back Button
        var backButton = this.uiManager.createButton(this.t('backtoMenu'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mb-8', this.onBack);
        var backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        // Settings Grid
        var settingsGrid = this.uiManager.createElement('div', 'grid md:grid-cols-2 gap-8');
        // Audio Settings
        var audioCard = this.createSettingsCard('AUDIO', 'volume', '#ff1493', [
            this.createToggleSetting('SOUND ENABLED', 'soundEnabled'),
            this.createSliderSetting('MUSIC VOLUME', 'musicVolume', 0, 100, '%'),
            this.createSliderSetting('EFFECTS VOLUME', 'effectsVolume', 0, 100, '%')
        ]);
        // Visual Settings
        var visualCard = this.createSettingsCard('DISPLAY', 'monitor', '#00ffff', [
            this.createToggleSetting('FULLSCREEN', 'fullscreen'),
            this.createToggleSetting('SCAN LINES', 'scanLines'),
            this.createToggleSetting('GLOW EFFECTS', 'glowEffects'),
            this.createToggleSetting('SHOW FPS', 'showFPS')
        ]);
        // Game Settings
        var gameCard = this.createSettingsCard('GAMEPLAY', 'gamepad', '#9d4edd', [
            this.createSliderSetting('BALL SPEED', 'ballSpeed', 3, 12, ''),
            this.createSliderSetting('PADDLE SPEED', 'paddleSpeed', 4, 15, '')
        ]);
        // Update profile or sign in with language manager in both
        var userSettings;
        if (this.isGuest) {
            // create guest settings
            userSettings = this.guestSettings();
        }
        else {
            // create user settings
            userSettings = this.userSettings();
        }
        settingsGrid.appendChild(audioCard);
        settingsGrid.appendChild(visualCard);
        settingsGrid.appendChild(gameCard);
        if (userSettings)
            settingsGrid.appendChild(userSettings);
        // Reset Button
        var resetContainer = this.uiManager.createElement('div', 'text-center mt-8');
        var resetButton = this.uiManager.createButton(this.t("resettoDefaults"), 'retro-button bg-transparent text-red-400 px-6 py-3 rounded border-2 border-red-400 hover:bg-red-400 hover:text-black transition-all duration-200', function () { return _this.resetToDefaults(); });
        resetContainer.appendChild(resetButton);
        // Save Notice
        var saveNotice = this.uiManager.createElement('div', 'text-center mt-6 retro-text text-xs opacity-40');
        var noticeText = this.uiManager.createElement('p', '', this.t("settingsSaved"));
        saveNotice.appendChild(noticeText);
        content.appendChild(header);
        content.appendChild(backButton);
        content.appendChild(settingsGrid);
        content.appendChild(resetContainer);
        content.appendChild(saveNotice);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    };
    SettingsPage.prototype.createSettingsCard = function (title, iconName, color, settings) {
        var card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
        card.style.borderColor = color;
        var header = this.uiManager.createElement('div', 'flex items-center gap-3 mb-6');
        var icon = this.uiManager.createIcon(iconName, 'w-6 h-6');
        icon.style.color = color;
        var titleElement = this.uiManager.createElement('h3', 'retro-text text-lg');
        titleElement.textContent = title;
        titleElement.style.color = color;
        header.appendChild(icon);
        header.appendChild(titleElement);
        var settingsContainer = this.uiManager.createElement('div', 'space-y-6');
        settings.forEach(function (setting) {
            settingsContainer.appendChild(setting);
        });
        card.appendChild(header);
        card.appendChild(settingsContainer);
        return card;
    };
    SettingsPage.prototype.createToggleSetting = function (label, key) {
        var _this = this;
        var container = this.uiManager.createElement('div', 'flex items-center justify-between');
        var labelElement = this.uiManager.createElement('label', 'retro-text text-sm', label);
        var toggle = this.uiManager.createElement('button', 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff1493] focus:ring-offset-2');
        var currentValue = this.settings[key];
        toggle.style.backgroundColor = currentValue ? '#ff1493' : '#374151';
        var toggleInner = this.uiManager.createElement('span', 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform');
        toggleInner.style.transform = currentValue ? 'translateX(6px)' : 'translateX(1px)';
        toggle.appendChild(toggleInner);
        toggle.addEventListener('click', function () {
            _this.settings[key] = !currentValue;
            var newValue = !currentValue;
            toggle.style.backgroundColor = newValue ? '#ff1493' : '#374151';
            toggleInner.style.transform = newValue ? 'translateX(6px)' : 'translateX(1px)';
        });
        container.appendChild(labelElement);
        container.appendChild(toggle);
        return container;
    };
    SettingsPage.prototype.createSliderSetting = function (label, key, min, max, unit) {
        var _this = this;
        var container = this.uiManager.createElement('div');
        var header = this.uiManager.createElement('div', 'flex items-center justify-between mb-3');
        var labelElement = this.uiManager.createElement('label', 'retro-text text-sm', label);
        var valueElement = this.uiManager.createElement('span', 'retro-text text-sm text-[#00ffff]');
        var currentValue = this.settings[key];
        valueElement.textContent = "".concat(currentValue).concat(unit);
        header.appendChild(labelElement);
        header.appendChild(valueElement);
        var slider = this.uiManager.createElement('input', 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.value = currentValue.toString();
        slider.style.background = "linear-gradient(to right, #ff1493 0%, #ff1493 ".concat(((currentValue - min) / (max - min)) * 100, "%, #374151 ").concat(((currentValue - min) / (max - min)) * 100, "%, #374151 100%)");
        slider.addEventListener('input', function (e) {
            var target = e.target;
            var value = parseInt(target.value);
            _this.settings[key] = value;
            valueElement.textContent = "".concat(value).concat(unit);
            slider.style.background = "linear-gradient(to right, #ff1493 0%, #ff1493 ".concat(((value - min) / (max - min)) * 100, "%, #374151 ").concat(((value - min) / (max - min)) * 100, "%, #374151 100%)");
        });
        container.appendChild(header);
        container.appendChild(slider);
        return container;
    };
    SettingsPage.prototype.guestSettings = function () {
        var _this = this;
        var card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
        card.style.borderColor = '#ff1493';
        // const header = this.uiManager.createElement(
        //   "h2",
        //   "retro-title text-[#ff1493] text-2xl mb-2",
        //   this.t("welcomeGuest")
        // );
        var subtitle = this.uiManager.createElement("p", "retro-text text-center text-sm opacity-70", this.t("guestMessage"));
        var buttonsContainer = this.uiManager.createElement("div", "w-full flex flex-col gap-4 mt-4");
        // Sign In Button
        var signInBtn = this.uiManager.createButton(this.t("signin"), "w-full retro-button bg-[#00ffff] text-black hover:bg-[#00ffff]/80 border-2 border-[#00ffff] py-3", function () { return console.log("to handle signin"); });
        // Sign Up Button
        var signUpBtn = this.uiManager.createButton(this.t("signup"), "w-full retro-button bg-transparent text-[#ff1493] border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black py-3", function () { return console.log("to handle signup"); });
        // Google Sign In Button
        var googleBtn = this.uiManager.createButton(this.t("sign_in_with_google"), "w-full retro-button bg-white text-black hover:bg-gray-100 border-2 border-white py-3 flex items-center justify-center gap-3", function () { return _this.authPage.handleGoogleSignIn(); });
        // 42Auth Button
        var auth42Btn = this.uiManager.createButton("this", "w-full retro-button bg-[#00babc] text-white hover:bg-[#00a0a2] border-2 border-[#00babc] py-3 flex items-center justify-center gap-3", function () { return _this.authPage.handle42SignIn(); });
        buttonsContainer.appendChild(signInBtn);
        buttonsContainer.appendChild(signUpBtn);
        buttonsContainer.appendChild(googleBtn);
        buttonsContainer.appendChild(auth42Btn);
        //card.appendChild(header);
        card.appendChild(subtitle);
        card.appendChild(buttonsContainer);
        card.appendChild(this.createLanguageSelector(false));
        return card;
    };
    SettingsPage.prototype.userSettings = function () {
        var _this = this;
        var card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
        var color = '#ff1493';
        card.style.borderColor = color;
        // Header
        var header = this.uiManager.createElement('div', 'flex items-center gap-3 mb-6');
        var icon = this.uiManager.createIcon('user', 'w-6 h-6');
        icon.style.color = color;
        var title = this.uiManager.createElement('h3', 'retro-text text-lg');
        title.textContent = this.t("user_settings");
        header.appendChild(icon);
        header.appendChild(title);
        // Buttons container
        var buttonsContainer = this.uiManager.createElement('div', 'flex flex-col items-center gap-4');
        var button1 = this.uiManager.createButton(this.t('update_profile'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', function () {
            console.log('UPDATE PROFILE clicked');
            var updateProfilePage = new UpdateProfilePage_js_1.UpdateProfilePage(_this.uiManager, _this.routerManager, _this.authManager, _this.languageManager, function () { return _this.render(); }, _this.onUpdateProfile.bind(_this), _this.user);
            updateProfilePage.render();
        });
        buttonsContainer.appendChild(button1);
        card.appendChild(header);
        card.appendChild(buttonsContainer);
        card.appendChild(this.createLanguageSelector(true));
        return card;
    };
    SettingsPage.prototype.createLanguageSelector = function (includeUserId) {
        var _this = this;
        if (includeUserId === void 0) { includeUserId = false; }
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
        var wrapper = this.uiManager.createElement("div", "flex items-center gap-2 mt-6 cursor-pointer");
        var label = this.uiManager.createElement("span", "retro-text text-[#ff1493]", this.t("language"));
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
                        _a.trys.push([1, 7, , 8]);
                        if (!(includeUserId && this.user && this.user.id)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.languageManager.setLang(nextLang.code, this.user.id)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.languageManager.setLang(nextLang.code)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.render()];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        err_1 = _a.sent();
                        console.error("Error changing language:", err_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); });
        wrapper.appendChild(label);
        wrapper.appendChild(flag);
        return wrapper;
    };
    SettingsPage.prototype.resetToDefaults = function () {
        this.settings = {
            soundEnabled: true,
            musicVolume: 75,
            effectsVolume: 60,
            fullscreen: false,
            scanLines: true,
            glowEffects: true,
            ballSpeed: 6,
            paddleSpeed: 8,
            showFPS: false,
            colorTheme: 'synthwave'
        };
        this.render();
    };
    return SettingsPage;
}());
exports.SettingsPage = SettingsPage;
