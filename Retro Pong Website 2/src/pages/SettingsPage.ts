import { UIManager } from '../modules/UIManager';

interface Settings {
  soundEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  fullscreen: boolean;
  scanLines: boolean;
  glowEffects: boolean;
  ballSpeed: number;
  paddleSpeed: number;
  showFPS: boolean;
  colorTheme: string;
}

interface ColorTheme {
  id: string;
  name: string;
  colors: string[];
}

export class SettingsPage {
  private uiManager: UIManager;
  private onBack: () => void;
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

  private colorThemes: ColorTheme[] = [
    { id: 'synthwave', name: 'SYNTHWAVE', colors: ['#ff1493', '#00ffff', '#9d4edd'] },
    { id: 'classic', name: 'CLASSIC', colors: ['#00ff00', '#ffff00', '#ff0000'] },
    { id: 'cyberpunk', name: 'CYBERPUNK', colors: ['#ff00ff', '#00ff00', '#0080ff'] },
    { id: 'neon', name: 'NEON', colors: ['#ff6600', '#ff0080', '#8000ff'] }
  ];

  constructor(uiManager: UIManager, onBack: () => void) {
    this.uiManager = uiManager;
    this.onBack = onBack;
  }

  public render(): void {
    const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
    
    const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl');
    
    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-8');
    const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', 'SETTINGS');
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle', 'CUSTOMIZE YOUR ARCADE EXPERIENCE');
    
    header.appendChild(title);
    header.appendChild(subtitle);
    
    // Back Button
    const backButton = this.uiManager.createButton(
      'BACK TO MENU',
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
    
    // Color Theme
    const themeCard = this.createColorThemeCard();
    
    settingsGrid.appendChild(audioCard);
    settingsGrid.appendChild(visualCard);
    settingsGrid.appendChild(gameCard);
    settingsGrid.appendChild(themeCard);
    
    // Reset Button
    const resetContainer = this.uiManager.createElement('div', 'text-center mt-8');
    const resetButton = this.uiManager.createButton(
      'RESET TO DEFAULTS',
      'retro-button bg-transparent text-red-400 px-6 py-3 rounded border-2 border-red-400 hover:bg-red-400 hover:text-black transition-all duration-200',
      () => this.resetToDefaults()
    );
    resetContainer.appendChild(resetButton);
    
    // Save Notice
    const saveNotice = this.uiManager.createElement('div', 'text-center mt-6 retro-text text-xs opacity-40');
    const noticeText = this.uiManager.createElement('p', '', 'SETTINGS ARE SAVED AUTOMATICALLY • CHANGES APPLY IMMEDIATELY');
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

  private createColorThemeCard(): HTMLElement {
    const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff6600] rounded-lg p-6');
    
    const header = this.uiManager.createElement('div', 'flex items-center gap-3 mb-6');
    const icon = this.uiManager.createIcon('palette', 'w-6 h-6 text-[#ff6600]');
    const title = this.uiManager.createElement('h3', 'retro-text text-lg text-[#ff6600]', 'COLOR THEME');
    
    header.appendChild(icon);
    header.appendChild(title);
    
    const themesGrid = this.uiManager.createElement('div', 'grid grid-cols-2 gap-3');
    
    this.colorThemes.forEach(theme => {
      const themeCard = this.uiManager.createElement('div', 'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200');
      themeCard.style.borderColor = this.settings.colorTheme === theme.id ? '#ff6600' : 'rgba(255, 255, 255, 0.2)';
      themeCard.style.backgroundColor = this.settings.colorTheme === theme.id ? 'rgba(255, 102, 0, 0.2)' : 'transparent';
      
      const themeContent = this.uiManager.createElement('div', 'text-center');
      const themeName = this.uiManager.createElement('div', 'retro-text text-sm mb-2', theme.name);
      
      const colorsContainer = this.uiManager.createElement('div', 'flex justify-center gap-2');
      theme.colors.forEach(color => {
        const colorDot = this.uiManager.createElement('div', 'w-4 h-4 rounded-full border border-white/20');
        colorDot.style.backgroundColor = color;
        colorsContainer.appendChild(colorDot);
      });
      
      themeContent.appendChild(themeName);
      themeContent.appendChild(colorsContainer);
      themeCard.appendChild(themeContent);
      
      themeCard.addEventListener('click', () => {
        this.settings.colorTheme = theme.id;
        this.render(); // Re-render to update selection
      });
      
      themesGrid.appendChild(themeCard);
    });
    
    card.appendChild(header);
    card.appendChild(themesGrid);
    
    return card;
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