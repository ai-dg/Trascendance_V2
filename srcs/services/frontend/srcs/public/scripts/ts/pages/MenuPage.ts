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
  private onLogout: (reason: string) => void;
  private onShowPrivacyPolicy: () => void;
  private onShowTermsOfService: () => void;

  private _logoutArmed = false;
  private _logoutArmTimeout: ReturnType<typeof setTimeout> | null = null;
  private _menuRenderTime = 0;

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
      icon: 'multiplayer',
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
    onLogout: (reason: string) => void,
    onShowPrivacyPolicy: () => void,
    onShowTermsOfService: () => void
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
    this.onShowPrivacyPolicy = onShowPrivacyPolicy;
    this.onShowTermsOfService = onShowTermsOfService;
  }

  public render(user: User | null): void {
    this._logoutArmed = false;
    if (this._logoutArmTimeout) clearTimeout(this._logoutArmTimeout);
    this._logoutArmTimeout = setTimeout(() => {
      this._logoutArmed = true;
      this._logoutArmTimeout = null;
    }, 1000);
    this._menuRenderTime = Date.now();

    const navEntry = typeof performance !== 'undefined' && (performance as any).getEntriesByType
      ? (performance as any).getEntriesByType('navigation')[0]
      : undefined;
    const navType = navEntry?.type ?? 'unknown';
    console.log('[MENU_RENDER_START]', { navType, visibility: document.visibilityState, now: Date.now() });

    if (user && (user as any).pseudo && !user.username) {
        user = {
            ...user,
            username: (user as any).pseudo,
            id: (user as any).user_id || user.id,
            email: (user as any).user_mail || user.email,
        } as User;
    }
    
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

    // this.menuItems.forEach((item) => {
    //   const menuItem = this.uiManager.createElement('div', 'group bg-black/40 backdrop-blur-sm border-2 border-transparent hover:border-[var(--item-color)] rounded-lg p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_var(--item-color)] relative overflow-hidden');
    //   menuItem.style.setProperty('--item-color', item.color);

    //   // Animated background
    //   const animatedBg = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-br from-transparent via-[var(--item-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300');
    //   menuItem.appendChild(animatedBg);


    //   // Icon
    //   const iconContainer = this.uiManager.createElement('div', 'flex justify-center mb-4');
    //   const icon = this.uiManager.createIcon(item.icon, 'w-12 h-12 transition-all duration-300 group-hover:scale-110');
    //   icon.style.color = item.color;
    //   iconContainer.appendChild(icon);

    //   // Label
    //   const label = this.uiManager.createElement('h3', 'retro-text text-xl mb-2');
    //   label.textContent = item.label;
    //   label.style.color = item.color;

    //   const content = this.uiManager.createElement('div', 'relative z-10 text-center');
    //   content.appendChild(iconContainer);
    //   content.appendChild(label);

    //   // Scan line effect
    //   const scanLine = this.uiManager.createElement('div', 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300');
    //   const scanLineInner = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-b from-transparent via-[var(--item-color)]/10 to-transparent animate-pulse');
    //   scanLineInner.style.backgroundSize = '100% 200%';
    //   scanLine.appendChild(scanLineInner);


    //   menuItem.appendChild(content);
    //   menuItem.appendChild(scanLine);
    //   menuItem.addEventListener('click', item.action);
    //});


    ////////////////////////////////////////////////
    ////////// SOCIAL HEADER + ADD FRIEND //////////
    ////////////////////////////////////////////////

    // div lateral social
    const socialDiv = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-6');
    socialDiv.style.minHeight = '480px';

    const socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');

    const socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
    socialHeader.textContent = 'SOCIAL';

    const addFriendBtn = this.uiManager.createElement('button', 'px-2 py-1 text-sm bg-black text-red-500 border border-red-500 rounded');
    addFriendBtn.innerHTML = '+';

    const addFriendDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 hidden');
    const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black') as HTMLInputElement;
    friendInput.placeholder = 'Username';
    const sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
    sendFriendBtn.textContent = 'Send';

    addFriendDiv.appendChild(friendInput);
    addFriendDiv.appendChild(sendFriendBtn);

    addFriendBtn.addEventListener('click', () => {
        addFriendDiv.classList.toggle('hidden');
    });

    socialHeaderWrapper.appendChild(socialHeader);
    socialHeaderWrapper.appendChild(addFriendBtn);
    socialDiv.appendChild(socialHeaderWrapper);
    socialDiv.appendChild(addFriendDiv);

    // Online List
    const onlineList = this.uiManager.createElement('div', 'w-full mb-6');
    const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
    onlineTitle.textContent = 'Online';

    const onlineListContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
    onlineListContent.textContent = 'List of online users goes here...';

    onlineList.appendChild(onlineTitle);
    onlineList.appendChild(onlineListContent);
    socialDiv.appendChild(onlineList);

    // Notifications
    const notifications = this.uiManager.createElement('div', 'w-full');
    const notificationsTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
    notificationsTitle.textContent = 'Notifications';

    const notificationsContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
    notificationsContent.textContent = 'Notifications list goes here...';

    notifications.appendChild(notificationsTitle);
    notifications.appendChild(notificationsContent);
    socialDiv.appendChild(notifications);

    ///////////////////////////////////
    /////////// Main Grid /////////////
    ///////////////////////////////////
    // Main layout: two columns side by side, centred
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
      (friendId, username, avatar) => {
        sessionStorage.setItem('selectedFriendId', friendId.toString());
        sessionStorage.setItem('selectedFriendUsername', username);
        if (avatar != null && avatar !== '') {
          sessionStorage.setItem('selectedFriendAvatar', avatar);
        }
        this.onChatWithFriends();
      },
      () => {},
      () => {}
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
    const logoutButton = this.uiManager.createElement('button', 'retro-button bg-transparent text-red-400 px-6 py-3 rounded border-2 border-red-400 hover:bg-red-400 hover:text-black transition-all duration-200 flex items-center gap-2') as HTMLButtonElement;
    logoutButton.textContent = 'LOGOUT ';
    logoutButton.setAttribute('type', 'button');
    logoutButton.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (!this._logoutArmed) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[LOGOUT_BLOCKED_EARLY_CLICK]', { reason: 'keydown', key: e.key, logoutArmed: this._logoutArmed });
      }
    });
    logoutButton.addEventListener('click', (e: MouseEvent) => {
      const navEntry = typeof performance !== 'undefined' && (performance as any).getEntriesByType
        ? (performance as any).getEntriesByType('navigation')[0]
        : undefined;
      const navType = navEntry?.type ?? 'unknown';
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const timeSinceMenuRender = Date.now() - this._menuRenderTime;
      const isPointerClick = (e as PointerEvent).pointerType === 'mouse' || (e as PointerEvent).pointerType === 'touch';
      const diagnostic = {
        type: e.type,
        isTrusted: e.isTrusted,
        pointerType: (e as PointerEvent).pointerType ?? 'n/a',
        isPointerClick,
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        timeStamp: e.timeStamp,
        visibilityState: document.visibilityState,
        navType,
        timeSinceBootMs: typeof performance !== 'undefined' ? Math.round(performance.now()) : 0,
        timeSinceMenuRenderMs: timeSinceMenuRender,
        logoutArmed: this._logoutArmed,
        buttonRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      };
      console.log('[LOGOUT_CLICK]', diagnostic);

      if (!e.isTrusted) return;
      if (!this._logoutArmed) {
        console.log('[LOGOUT_BLOCKED_EARLY_CLICK]', diagnostic);
        return;
      }
      if (!isPointerClick) {
        console.log('[LOGOUT_BLOCKED_EARLY_CLICK]', { reason: 'not pointer (keyboard?)', diagnostic });
        return;
      }
      this.onLogout('user_click_logout');
    });
    const logoutIcon = this.uiManager.createIcon('logout', 'w-4 h-4');
    logoutButton.appendChild(logoutIcon);
    footer.appendChild(logoutButton);
    console.log('[LOGOUT_BUTTON_ATTACHED]', { when: 'footer', performanceNow: typeof performance !== 'undefined' ? performance.now() : 0 });

    // Version Info
    const versionInfo = this.uiManager.createElement('div', 'text-center mt-8 retro-text text-xs');
    const versionText = this.uiManager.createElement('div', 'opacity-40', 'MADE BY DIEGO, CHRISTOPHE, NATHALIA, MARI AND RALPH');
    const linksRow = this.uiManager.createElement('div', 'mt-8 mb-8 flex justify-center gap-4');
    const privacyLink = this.uiManager.createElement('span', 'text-[#00ffff] cursor-pointer hover:text-[#ff1493] transition-colors duration-200 underline');
    privacyLink.textContent = 'Privacy Policy';
    privacyLink.addEventListener('click', () => this.onShowPrivacyPolicy());
    const termsLink = this.uiManager.createElement('span', 'text-[#00ffff] cursor-pointer hover:text-[#ff1493] transition-colors duration-200 underline');
    termsLink.textContent = 'Terms of Service';
    termsLink.addEventListener('click', () => this.onShowTermsOfService());
    versionInfo.appendChild(versionText);
    linksRow.appendChild(privacyLink);
    linksRow.appendChild(termsLink);
    versionInfo.appendChild(linksRow);

    content.appendChild(header);
    content.appendChild(mainGrid);
    content.appendChild(footer);
    content.appendChild(versionInfo);

    container.appendChild(content);

    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
    console.log('[MENU_RENDER_END] logout button in DOM', { performanceNow: typeof performance !== 'undefined' ? performance.now() : 0 });

  }

  public setRouterManager(routerManager: RouterManager): void {
    this.routerManager = routerManager;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

}
