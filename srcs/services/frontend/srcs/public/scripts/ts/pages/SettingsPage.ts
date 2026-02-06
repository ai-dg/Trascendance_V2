import type { AuthManager } from '../modules/AuthManager.js';
import { LanguageManager } from '../modules/LangManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import type { User, Settings } from '../modules/TypesManager.js';
import { UIManager } from '../modules/UIManager.js';
import type { AuthPage } from './AuthPage.js';
import { UpdateProfilePage } from './UpdateProfilePage.js';
import { Logger } from '../modules/Logger.js';


export class SettingsPage {
  private static readonly SETTINGS_STORAGE_KEY = 'arcade_settings';

  private uiManager: UIManager;
  private routerManager: RouterManager;
  private authManager: AuthManager;
  private languageManager: LanguageManager;
  private authPage: AuthPage;
  private onBack: () => void;
  private onUpdateProfile: (success: boolean) => void;
  private settings: Settings = {
    ballSpeed: 6,
    paddleSpeed: 8,
  };

  private isViewBlockedUsers: boolean = false;

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

  private loadSettingsFromStorage(): void {
    try {
      const raw = localStorage.getItem(SettingsPage.SETTINGS_STORAGE_KEY);
      if (!raw)
        return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object')
        return;

      this.settings = {
        ...this.settings,
        ...parsed,
        ballSpeed: typeof parsed.ballSpeed === 'number' ? parsed.ballSpeed : this.settings.ballSpeed,
        paddleSpeed: typeof parsed.paddleSpeed === 'number' ? parsed.paddleSpeed : this.settings.paddleSpeed,
      };
    } catch {
      // Ignore storage parse issues
    }
  }

  private saveSettingsToStorage(): void {
    try {
      localStorage.setItem(SettingsPage.SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage write issues
    }
  }

  public render(): void {
    this.loadSettingsFromStorage();

    const container = this.uiManager.createElement('div', 'retro-container min-h-screen w-full flex flex-col items-center justify-center p-8');

    if (this.isViewBlockedUsers) {
      this.showBlockedUsers(container);
    } else {
      this.renderSettingsPage(container);
    }

    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
  }

  private renderSettingsPage(container: HTMLElement): void {
    const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl');

    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-8');
    const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', this.t('options'));

    header.appendChild(title);

    // Back Button
    const backButton = this.uiManager.createButton(
      this.t('backtoMenu'),
      'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] mt-4 hover:text-black transition-all duration-200 flex items-center justify-center gap-2 mb-8 mx-auto',
      this.onBack
    );
    const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
    backButton.appendChild(backIcon);

    // Settings Grid
    const settingsGrid = this.uiManager.createElement('div', 'grid md:grid-cols-2 gap-8');


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
      userSettings = this.guestSettings();
    }
    else {
      userSettings = this.userSettings();
    }

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
    content.appendChild(settingsGrid);
    content.appendChild(resetContainer);
    content.appendChild(backButton);
    content.appendChild(saveNotice);

    container.appendChild(content);
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

  private createSliderSetting(label: string, key: keyof Settings, min: number, max: number, unit: string): HTMLElement
  {
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

    slider.addEventListener('input', (e) =>
    {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value);
      (this.settings as any)[key] = value;
      valueElement.textContent = `${value}${unit}`;
      slider.style.background = `linear-gradient(to right, #ff1493 0%, #ff1493 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`;

      this.saveSettingsToStorage();
    });

    container.appendChild(header);
    container.appendChild(slider);

    return container;
  }

  private guestSettings(): HTMLElement {
  const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 rounded-lg p-6');
  card.style.borderColor = '#ff1493';

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
    () => Logger.log("to handle signin")
  );

  // Sign Up Button
  const signUpBtn = this.uiManager.createButton(
    this.t("signup"),
    "w-full retro-button bg-transparent text-[#ff1493] border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black py-3",
    () => Logger.log("to handle signup")
  );

  // 42Auth Button
  const auth42Btn = this.uiManager.createButton(
    "this",
    "w-full retro-button bg-[#00babc] text-white hover:bg-[#00a0a2] border-2 border-[#00babc] py-3 flex items-center justify-center gap-3",
    () => this.authPage.handle42SignIn()
  );

  buttonsContainer.appendChild(signInBtn);
  buttonsContainer.appendChild(signUpBtn);
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
      Logger.log('UPDATE PROFILE clicked');
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

  const button2 = this.uiManager.createButton(
    this.t('blocked_users') || "Blocked Users",
    'retro-button bg-transparent text-[#ff1493] px-4 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200',
    () => {
      this.isViewBlockedUsers = true;
      this.render();
     }
  );


  buttonsContainer.appendChild(button1);
  buttonsContainer.appendChild(button2);

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
      { code: "et", flag: "🇪🇪" },
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
        Logger.error("Error changing language:", err);
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(flag);

    return wrapper;
  }

  private resetToDefaults(): void {
    this.settings = {
      ballSpeed: 6,
      paddleSpeed: 8,
    };
    this.saveSettingsToStorage();
    this.render();
  }

  private async showBlockedUsers(container: HTMLElement): Promise<void> {
      const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-2xl flex flex-col items-center');

          const header = this.uiManager.createElement('div', 'text-center mb-8');
          const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4 text-red-500', this.t('blocked_users') || 'BLOCKED USERS');
          header.appendChild(title);

          const backButton = this.uiManager.createButton(
            this.t('back'),
            'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mb-6',
            () => {
              this.isViewBlockedUsers = false;
              this.render();
            }
          );

          const listCard = this.uiManager.createElement('div', 'w-full bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-6 min-h-[300px]');
          const listContainer = this.uiManager.createElement('div', 'flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2');
          listContainer.innerHTML = '<div class="text-[#00ffff] text-center animate-pulse mt-10">Loading...</div>';

          listCard.appendChild(listContainer);
          content.appendChild(header);
          content.appendChild(backButton);
          content.appendChild(listCard);
          container.appendChild(content);

          this.fetchBlockedUsers(listContainer);
  }

  private async fetchBlockedUsers(listContainer: HTMLElement): Promise<void> {
    try {
      const res = await fetch(this.routerManager.getUrl('/live-chat/blocked-users'), {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      listContainer.innerHTML = '';

      if (!data.blockedUsers || data.blockedUsers.length === 0) {
        const emptyMsg = this.uiManager.createElement('p', 'text-gray-500 text-center italic', this.t('no_blocked_users') || 'No blocked users found.');
        listContainer.appendChild(emptyMsg);
      } else {
        data.blockedUsers.forEach((blockedUser: any) => {
          const row = this.createBlockedUserRow(blockedUser, listContainer);
          listContainer.appendChild(row);
        });
      }

    } catch (error) {
      Logger.error(error);
      listContainer.innerHTML = '<p class="text-red-500 text-center">Error loading list.</p>';
    }
  }

  private createBlockedUserRow(user: any, parentContainer: HTMLElement): HTMLElement {
    const row = this.uiManager.createElement('div', 'flex items-center justify-between bg-white/5 p-3 rounded border border-white/10transition-all duration-300');

    const nameInfo = this.uiManager.createElement('div', 'flex items-center gap-3');

    const avatar = this.uiManager.createElement('img', 'w-8 h-8 rounded-full object-cover bg-gray-700') as HTMLImageElement;
    if (!user.avatar) {
        avatar.src = 'public/avatars/default.png';
    } else if (user.avatar.startsWith('http')) {
        avatar.src = user.avatar;
    } else {
        avatar.src = `public/avatars/${user.avatar}.png`;
    }

    const name = this.uiManager.createElement('span', 'text-[#00ffff] font-bold tracking-wider', user.username);

    nameInfo.appendChild(avatar);
    nameInfo.appendChild(name);

    const unblockBtn = this.uiManager.createButton(
      'UNBLOCK',
      'text-xs bg-red-500/20 text-red-400 border border-red-500 px-3 py-1 rounded hover:bg-red-500 hover:text-black transition-colors',
      async () => {
        const btn = unblockBtn as HTMLButtonElement;
        btn.disabled = true;
        btn.textContent = '...';
        await this.unblockUser(user.id, row);
      }
    );

    row.appendChild(nameInfo);
    row.appendChild(unblockBtn);

    return row;
  }

  private async unblockUser(userIdToUnblock: number, rowElement: HTMLElement): Promise<void> {
  try {
      const res = await fetch(this.routerManager.getUrl('/live-chat/unblock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ blockedId: userIdToUnblock })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        rowElement.style.opacity = '0';
        rowElement.style.transform = 'translateX(20px)';
        setTimeout(() => rowElement.remove(), 300);
      } else {
        Logger.warn('Failed to unblock user');
      }
    } catch (error) {
      Logger.error('Error unblocking user:', error);
    }
  }
}

