import { UIManager } from '../modules/UIManager.js';
import { WebsocketManager } from '../modules/WebsocketManager.js';
import type { User } from '../modules/TypesManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import { SocialManager } from '../modules/SocialManager.js';

export class MenuPage {
  private uiManager: UIManager;
  private wsManager: WebsocketManager | null = null;
  private routerManager: RouterManager | null = null;
  private currentUser: User | null = null;
  private socialManager: SocialManager | null = null;

  private onPlayGameAI: () => void;
  private onPlayGameLocal: () => void;
  private onPlayGameOnline: () => void;
  private onChatWithFriends: () => void;
  private onSettings: () => void;
  private onLogout: () => void;

  private menuItems = [
    {
      icon: 'zap',
      label: 'AI',
      action: () => this.onPlayGameAI(),
      color: '#ff1493',
    },
    {
      icon: 'monitor',
      label: 'LOCAL',
      action: () => this.onPlayGameLocal(),
      color: '#ff1493',
    },
    {
      icon: 'monitor',
      label: 'ONLINE',
      action: () => this.onPlayGameOnline(),
      color: '#ff1493',
    },
    {
      icon: 'chat',
      label: 'LIVE CHAT',
      action: () => this.onChatWithFriends(),
      color: '#00ffff',
    },
    {
      icon: 'settings',
      label: 'SETTINGS',
      action: () => this.onSettings(),
      color: '#9d4edd',
    }
  ];

  constructor(
    uiManager: UIManager,
    wsManager: WebsocketManager,
    routerManager: RouterManager,
    onPlayGameAI: () => void,
    onPlayGameLocal: () => void,
    onPlayGameOnline: () => void,
    onChatWithFriends: () => void,
    onSettings: () => void,
    onLogout: () => void
  ) {
    this.uiManager = uiManager;
    this.wsManager = wsManager;
    this.routerManager = routerManager;
    this.onPlayGameAI = onPlayGameAI;
    this.onPlayGameLocal = onPlayGameLocal;
    this.onPlayGameOnline = onPlayGameOnline;
    this.onChatWithFriends = onChatWithFriends;
    this.onSettings = onSettings;
    this.onLogout = onLogout;
  }

  public render(user: User | null): void {
    this.currentUser = user;

    const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
    const content = this.uiManager.createElement('div', 'relative z-10 w-full flex-1 mx-auto flex flex-col items-center');
    content.style.maxWidth = '1400px';

    ///////////////////////////////////
    /////////// Header ////////////////
    ///////////////////////////////////

    const header = this.uiManager.createElement('div', 'text-center mb-12');
    const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'TRANSCENDENCE');
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-lg', 'WELCOME TO THE RETRO PONG');

    header.appendChild(title);
    header.appendChild(subtitle);
  
    if (user) {
      const userWelcome = this.uiManager.createElement('div', 'mt-6 flex items-center justify-center gap-3 retro-text');
      const userText = this.uiManager.createElement('span', 'text-[#00ffff]', `PLAYER: ${user.username.toUpperCase()}`);
      userText.style.fontSize = '1.5rem';

      // Avatar
      const avatarImg = this.uiManager.createElement('img', 'rounded-full object-cover') as HTMLImageElement;
      avatarImg.style.width = '110px';
      avatarImg.style.height = '110px';
      if (!user.avatar) {
        avatarImg.src = 'public/avatars/default.png';
      } else if (user.avatar.startsWith('http')) {
        avatarImg.src = user.avatar;
      } else {
        // Accept both "avatar1" and "avatar1.png"
        avatarImg.src = user.avatar.endsWith('.png')
          ? `public/avatars/${user.avatar}`
          : `public/avatars/${user.avatar}.png`;
      }
      avatarImg.alt = 'User Avatar';

      userWelcome.appendChild(avatarImg);
      userWelcome.appendChild(userText);
      header.appendChild(userWelcome);
    }
  
    /////////////////////////////////
    /////////// Menu Grid ///////////
    /////////////////////////////////
  
    // Modes Rectangle Selection
    const playRectangle = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-6');
    playRectangle.style.boxShadow = '0 0 30px rgba(255, 20, 147, 0.3)';
    playRectangle.style.minWidth = '700px';
    
    const playTitle = this.uiManager.createElement('h3', 'retro-text text-2xl text-[#ff1493] text-center mb-6');
    playTitle.textContent = 'GAME MODES';
    playRectangle.appendChild(playTitle);
    
    const playGrid = this.uiManager.createElement('div', 'grid md:grid-cols-3 gap-6');

    this.menuItems.slice(0, 3).forEach((item) => {
      const menuItem = this.uiManager.createElement('div', 'group bg-black/40 backdrop-blur-sm border-2 border-transparent hover:border-[var(--item-color)] rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_var(--item-color)] relative overflow-hidden');
      menuItem.style.setProperty('--item-color', item.color);

      // Animated background
      const animatedBg = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-br from-transparent via-[var(--item-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      menuItem.appendChild(animatedBg);
      
      // Icon
      const iconContainer = this.uiManager.createElement('div', 'flex justify-center mb-4');
      const icon = this.uiManager.createIcon(item.icon, 'w-12 h-12 transition-all duration-300 group-hover:scale-110');
      icon.style.color = item.color;
      iconContainer.appendChild(icon);
      
      // Label
      const label = this.uiManager.createElement('h3', 'retro-text text-lg mb-2');
      label.textContent = item.label;
      label.style.color = item.color;
      
      const content = this.uiManager.createElement('div', 'relative z-10 text-center');
      content.appendChild(iconContainer);
      content.appendChild(label);

      // Scan line effect
      const scanLine = this.uiManager.createElement('div', 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      const scanLineInner = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-b from-transparent via-[var(--item-color)]/10 to-transparent animate-pulse');
      scanLineInner.style.backgroundSize = '100% 200%';
      scanLine.appendChild(scanLineInner);

      menuItem.appendChild(content);
      menuItem.appendChild(scanLine);
      menuItem.addEventListener('click', item.action);

      playGrid.appendChild(menuItem);
    });
    
    playRectangle.appendChild(playGrid);

    const otherButtonsGrid = this.uiManager.createElement('div', 'grid md:grid-cols-2 gap-6 mb-8');

    this.menuItems.slice(3).forEach((item) => {
      const menuItem = this.uiManager.createElement('div', 'group bg-black/40 backdrop-blur-sm border-2 border-transparent hover:border-[var(--item-color)] rounded-lg p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_var(--item-color)] relative overflow-hidden');
      menuItem.style.setProperty('--item-color', item.color);

      // Animated background
      const animatedBg = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-br from-transparent via-[var(--item-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      menuItem.appendChild(animatedBg);
      
      // Icon
      const iconContainer = this.uiManager.createElement('div', 'flex justify-center mb-4');
      const icon = this.uiManager.createIcon(item.icon, 'w-12 h-12 transition-all duration-300 group-hover:scale-110');
      icon.style.color = item.color;
      iconContainer.appendChild(icon);
      
      // Label
      const label = this.uiManager.createElement('h3', 'retro-text text-xl mb-2');
      label.textContent = item.label;
      label.style.color = item.color;
      
      const content = this.uiManager.createElement('div', 'relative z-10 text-center');
      content.appendChild(iconContainer);
      content.appendChild(label);

      // Scan line effect
      const scanLine = this.uiManager.createElement('div', 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      const scanLineInner = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-b from-transparent via-[var(--item-color)]/10 to-transparent animate-pulse');
      scanLineInner.style.backgroundSize = '100% 200%';
      scanLine.appendChild(scanLineInner);

      menuItem.appendChild(content);
      menuItem.appendChild(scanLine);
      menuItem.addEventListener('click', item.action);

      otherButtonsGrid.appendChild(menuItem);
    });

    
    ///////////////////////////////////
    /////////// Main Grid /////////////
    ///////////////////////////////////
    // Layout principal de la page : 2 colonnes côte à côte, centrées
    const mainGrid = this.uiManager.createElement('div', 'flex gap-6 w-full justify-center');

    // Menu Grid Wrapper
  const menuGridWrapper = this.uiManager.createElement('div', 'flex-1 h-full flex flex-col gap-6');
  menuGridWrapper.appendChild(playRectangle);
  menuGridWrapper.appendChild(otherButtonsGrid);

  // Social Div Wrapper
  const socialDivWrapper = this.uiManager.createElement('div', 'w-80 flex flex-col flex-shrink-0');
  socialDivWrapper.style.justifySelf = 'end';
  
  
  if (this.wsManager && this.routerManager) {
    this.socialManager = new SocialManager(
      this.uiManager,
      this.routerManager,
      this.wsManager,
      this.currentUser,
      () => null,
      (friendId, username) => {
        sessionStorage.setItem('selectedFriendId', friendId.toString());
        sessionStorage.setItem('selectedFriendUsername', username);
        this.onChatWithFriends();
      }
    );
    this.socialManager.render(socialDivWrapper);
  }

  mainGrid.style.alignItems = 'stretch';

  mainGrid.appendChild(menuGridWrapper);
  mainGrid.appendChild(socialDivWrapper);


    //////////////////////////////////
    /////////// Footer ////////////////
    //////////////////////////////////
  
    const footer = this.uiManager.createElement('div', 'flex justify-center gap-6 mt-12');
    const logoutButton = this.uiManager.createButton(
      'LOGOUT',
      'retro-button bg-transparent text-red-400 px-6 py-3 rounded border-2 border-red-400 hover:bg-red-400 hover:text-black transition-all duration-200 flex items-center gap-2',
      this.onLogout
    );
    const logoutIcon = this.uiManager.createIcon('logout', 'w-4 h-4');
    logoutButton.appendChild(logoutIcon);
    footer.appendChild(logoutButton);

    // Version Info
    const versionInfo = this.uiManager.createElement('div', 'text-center mt-8 retro-text text-xs opacity-40');
    const versionText = this.uiManager.createElement('p', '', 'MADE BY DIEGO, CHRISTOPHE, NATHALIA, MARI AND RALPH');
    versionInfo.appendChild(versionText);

    content.appendChild(header);
    content.appendChild(mainGrid);
    content.appendChild(footer);
    content.appendChild(versionInfo);

    container.appendChild(content);

    this.uiManager.clear();
    this.uiManager.container.appendChild(container);

  }

  public setRouterManager(routerManager: RouterManager): void {
    this.routerManager = routerManager;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

}
