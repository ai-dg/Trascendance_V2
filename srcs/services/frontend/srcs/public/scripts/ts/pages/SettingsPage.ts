import type { AuthManager } from '../modules/AuthManager.js';
import { LanguageManager } from '../modules/LangManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import { User, Settings, ColorTheme  } from '../modules/TypesManager.js';
import { UIManager } from '../modules/UIManager.js';
import type { AuthPage } from './AuthPage.js';
import { UpdateProfilePage } from './UpdateProfilePage.js';


export class SettingsPage {
  private uiManager: UIManager;
  private routerManager: RouterManager;
  private authManager: AuthManager;
  private languageManager: LanguageManager;
  private authPage: AuthPage;
  private onBack: () => void;
  private onUpdateProfile: (success: boolean) => void;
  private settings: Settings = {
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

  private t(key: string): string {
    return this.languageManager.t(key);
  }

  constructor(uiManager: UIManager, routerManager: RouterManager, authManager: AuthManager, languageManager: LanguageManager, authPage: AuthPage, onBack: () => void, onUpdateProfile: (success: boolean) => void, private user?: User | null, private isGuest: boolean = false) {
    this.uiManager = uiManager;
    this.routerManager = routerManager;
    this.authManager = authManager;
    this.languageManager = languageManager;
    this.authPage = authPage;
    this.onBack = onBack;
    this.onUpdateProfile = onUpdateProfile;
  }

  public render(): void {
    const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
    
    const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl');
    
    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-8');
    const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', this.t('options'));
    //const subtitle = this.uiManager.createElement('p', 'retro-subtitle', this.t('optionsMessage'));
    
    header.appendChild(title);
    //header.appendChild(subtitle);
    
    // Back Button
    const backButton = this.uiManager.createButton(
      this.t('backtoMenu'),
      'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mb-8',
      this.onBack
    );
    const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
    backButton.appendChild(backIcon);
    
    // Settings Grid
    const settingsGrid = this.uiManager.createElement('div', 'grid md:grid-cols-2 gap-8');
    
    // Audio Settings
    const audioCard = this.createSettingsCard(
      'AUDIO',
      'volume',
      '#ff1493',
      [
        this.createToggleSetting('SOUND ENABLED', 'soundEnabled'),
        this.createSliderSetting('MUSIC VOLUME', 'musicVolume', 0, 100, '%'),
        this.createSliderSetting('EFFECTS VOLUME', 'effectsVolume', 0, 100, '%')
      ]
    );
    
    // Visual Settings
    const visualCard = this.createSettingsCard(
      'DISPLAY',
      'monitor',
      '#00ffff',
      [
        this.createToggleSetting('FULLSCREEN', 'fullscreen'),
        this.createToggleSetting('SCAN LINES', 'scanLines'),
        this.createToggleSetting('GLOW EFFECTS', 'glowEffects'),
        this.createToggleSetting('SHOW FPS', 'showFPS')
      ]
    );
    
    // Game Settings
    const gameCard = this.createSettingsCard(
      'GAMEPLAY',
      'gamepad',
      '#9d4edd',
      [
        this.createSliderSetting('BALL SPEED', 'ballSpeed', 3, 12, ''),
        this.createSliderSetting('PADDLE SPEED', 'paddleSpeed', 4, 15, '')
      ]
    );
    
    
    // Update profile or sign in with language manager in both
    let userSettings: HTMLElement | undefined;
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
    const resetContainer = this.uiManager.createElement('div', 'text-center mt-8');
    const resetButton = this.uiManager.createButton(
      this.t("resettoDefaults"),
      'retro-button bg-transparent text-red-400 px-6 py-3 rounded border-2 border-red-400 hover:bg-red-400 hover:text-black transition-all duration-200',
      () => this.resetToDefaults()
    );
    resetContainer.appendChild(resetButton);
    
    // Save Notice
    const saveNotice = this.uiManager.createElement('div', 'text-center mt-6 retro-text text-xs opacity-40');
    const noticeText = this.uiManager.createElement('p', '', this.t("settingsSaved"));
    saveNotice.appendChild(noticeText);
    
    content.appendChild(header);
    content.appendChild(backButton);
    content.appendChild(settingsGrid);
    content.appendChild(resetContainer);
    content.appendChild(saveNotice);
    
    container.appendChild(content);
    
    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
  }

  private createSettingsCard(title: string, iconName: string, color: string, settings: HTMLElement[]): HTMLElement {
    const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
    card.style.borderColor = color;
    
    const header = this.uiManager.createElement('div', 'flex items-center gap-3 mb-6');
    const icon = this.uiManager.createIcon(iconName, 'w-6 h-6');
    icon.style.color = color;
    const titleElement = this.uiManager.createElement('h3', 'retro-text text-lg');
    titleElement.textContent = title;
    titleElement.style.color = color;
    
    header.appendChild(icon);
    header.appendChild(titleElement);
    
    const settingsContainer = this.uiManager.createElement('div', 'space-y-6');
    settings.forEach(setting => {
      settingsContainer.appendChild(setting);
    });
    
    card.appendChild(header);
    card.appendChild(settingsContainer);
    
    return card;
  }

  private createToggleSetting(label: string, key: keyof Settings): HTMLElement {
    const container = this.uiManager.createElement('div', 'flex items-center justify-between');
    
    const labelElement = this.uiManager.createElement('label', 'retro-text text-sm', label);
    
    const toggle = this.uiManager.createElement('button', 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff1493] focus:ring-offset-2');
    const currentValue = this.settings[key] as boolean;
    toggle.style.backgroundColor = currentValue ? '#ff1493' : '#374151';
    
    const toggleInner = this.uiManager.createElement('span', 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform');
    toggleInner.style.transform = currentValue ? 'translateX(6px)' : 'translateX(1px)';
    
    toggle.appendChild(toggleInner);
    
    toggle.addEventListener('click', () => {
      (this.settings as any)[key] = !currentValue;
      const newValue = !currentValue;
      toggle.style.backgroundColor = newValue ? '#ff1493' : '#374151';
      toggleInner.style.transform = newValue ? 'translateX(6px)' : 'translateX(1px)';
    });
    
    container.appendChild(labelElement);
    container.appendChild(toggle);
    
    return container;
  }

  private createSliderSetting(label: string, key: keyof Settings, min: number, max: number, unit: string): HTMLElement {
    const container = this.uiManager.createElement('div');
    
    const header = this.uiManager.createElement('div', 'flex items-center justify-between mb-3');
    const labelElement = this.uiManager.createElement('label', 'retro-text text-sm', label);
    const valueElement = this.uiManager.createElement('span', 'retro-text text-sm text-[#00ffff]');
    const currentValue = this.settings[key] as number;
    valueElement.textContent = `${currentValue}${unit}`;
    
    header.appendChild(labelElement);
    header.appendChild(valueElement);
    
    const slider = this.uiManager.createElement('input', 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer') as HTMLInputElement;
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = currentValue.toString();
    slider.style.background = `linear-gradient(to right, #ff1493 0%, #ff1493 ${((currentValue - min) / (max - min)) * 100}%, #374151 ${((currentValue - min) / (max - min)) * 100}%, #374151 100%)`;
    
    slider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value);
      (this.settings as any)[key] = value;
      valueElement.textContent = `${value}${unit}`;
      slider.style.background = `linear-gradient(to right, #ff1493 0%, #ff1493 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`;
    });
    
    container.appendChild(header);
    container.appendChild(slider);
    
    return container;
  }

  private guestSettings(): HTMLElement {
  const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
  card.style.borderColor = '#ff1493';

  // const header = this.uiManager.createElement(
  //   "h2",
  //   "retro-title text-[#ff1493] text-2xl mb-2",
  //   this.t("welcomeGuest")
  // );
  const subtitle = this.uiManager.createElement(
    "p",
    "retro-text text-center text-sm opacity-70",
    this.t("guestMessage")
  );

  const buttonsContainer = this.uiManager.createElement(
    "div",
    "w-full flex flex-col gap-4 mt-4"
  );

  // Sign In Button
  const signInBtn = this.uiManager.createButton(
    this.t("signin"),
    "w-full retro-button bg-[#00ffff] text-black hover:bg-[#00ffff]/80 border-2 border-[#00ffff] py-3",
    () => console.log("to handle signin") 
  );

  // Sign Up Button
  const signUpBtn = this.uiManager.createButton(
    this.t("signup"),
    "w-full retro-button bg-transparent text-[#ff1493] border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black py-3",
    () => console.log("to handle signup") 
  );

  // Google Sign In Button
  const googleBtn = this.uiManager.createButton(
    this.t("sign_in_with_google"),
    "w-full retro-button bg-white text-black hover:bg-gray-100 border-2 border-white py-3 flex items-center justify-center gap-3",
    () => this.authPage.handleGoogleSignIn() 
  );

  // 42Auth Button
  const auth42Btn = this.uiManager.createButton(
    "this",
    "w-full retro-button bg-[#00babc] text-white hover:bg-[#00a0a2] border-2 border-[#00babc] py-3 flex items-center justify-center gap-3",
    () => this.authPage.handle42SignIn() 
  );

  buttonsContainer.appendChild(signInBtn);
  buttonsContainer.appendChild(signUpBtn);
  buttonsContainer.appendChild(googleBtn);
  buttonsContainer.appendChild(auth42Btn);

  //card.appendChild(header);
  card.appendChild(subtitle);
  card.appendChild(buttonsContainer);
  card.appendChild(this.createLanguageSelector(false));

  return card;
}

  private userSettings(): HTMLElement {
  const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
  const color = '#ff1493';
  card.style.borderColor = color;

  // Header
  const header = this.uiManager.createElement('div', 'flex items-center gap-3 mb-6');
  const icon = this.uiManager.createIcon('user', 'w-6 h-6');
  icon.style.color = color;
  const title = this.uiManager.createElement('h3', 'retro-text text-lg');
  title.textContent = this.t("user_settings");

  header.appendChild(icon);
  header.appendChild(title);

  // Buttons container
  const buttonsContainer = this.uiManager.createElement('div', 'flex flex-col items-center gap-4');

  const button1 = this.uiManager.createButton(
    this.t('update_profile'),
    'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200',
    () => {
      console.log('UPDATE PROFILE clicked');
      const updateProfilePage = new UpdateProfilePage(
        this.uiManager,
        this.routerManager,
        this.authManager,
        this.languageManager,
        () => this.render(),
        this.onUpdateProfile.bind(this),
        this.user
      );
      updateProfilePage.render();
    });

  buttonsContainer.appendChild(button1);

  card.appendChild(header);
  card.appendChild(buttonsContainer);
  card.appendChild(this.createLanguageSelector(true));

  return card;
}

  private createLanguageSelector(includeUserId = false): HTMLElement {
    const languages = [
      { code: "en", flag: "🇬🇧" },
      { code: "fr", flag: "🇫🇷" },
      { code: "pt", flag: "🇧🇷" },
    ];

    const currentLangCode = this.languageManager.getCurrentLang();
    let currentLangIndex = languages.findIndex(l => l.code === currentLangCode);
    if (currentLangIndex === -1) currentLangIndex = 0;

    const wrapper = this.uiManager.createElement("div", "flex items-center gap-2 mt-6 cursor-pointer");
    const label = this.uiManager.createElement("span", "retro-text text-[#ff1493]", this.t("language"));
    const flag = this.uiManager.createElement("span", "text-2xl", languages[currentLangIndex].flag);

    flag.addEventListener("click", async () => {
      currentLangIndex = (currentLangIndex + 1) % languages.length;
      const nextLang = languages[currentLangIndex];
      flag.textContent = nextLang.flag;
      try {
        if (includeUserId && this.user && this.user.id)
          await this.languageManager.setLang(nextLang.code, this.user.id);
        else
          await this.languageManager.setLang(nextLang.code);
        await this.render();
      } catch (err) {
        console.error("Error changing language:", err);
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(flag);

    return wrapper;
  }

  private resetToDefaults(): void {
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
  }
}

