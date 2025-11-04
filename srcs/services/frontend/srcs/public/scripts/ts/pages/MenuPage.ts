import { UIManager } from '../modules/UIManager.js';
import type { User } from '../modules/TypesManager.js';

export class MenuPage {
  private uiManager: UIManager;
  private onPlayGameAI: () => void;
  private onPlayGameLocal: () => void;
  private onPlayGameOnline: () => void;
  private onViewLeaderboard: () => void;
  private onChatWithFriends: () => void;
  private onSettings: () => void;
  private onLogout: () => void;

  private menuItems = [
    {
      icon: 'zap',
      label: 'PLAY PONG WITH AI',
      action: () => this.onPlayGameAI(),
      color: '#ff1493',
      description: 'Start a new game with AI'
    },
    {
      icon: 'gamepad',
      label: 'PLAY PONG WITH LOCAL GAMER',
      action: () => this.onPlayGameLocal(),
      color: '#ff1493',
      description: 'Start a new game with a local gamer'
    },
    {
      icon: 'users',  
      label: 'PLAY PONG WITH ONLINE GAMER',
      action: () => this.onPlayGameOnline(),
      color: '#ff1493',
      description: 'Start a new game with a online gamer'
    },
    {
      icon: 'trophy',
      label: 'LEADERBOARD',
      action: () => this.onViewLeaderboard(),
      color: '#00ffff',
      description: 'View high scores'
    },
    {
      icon: 'chat',
      label: 'CHAT WITH FRIENDS',
      action: () => this.onChatWithFriends(),
      color: '#00ffff',
      description: 'Chat with friends'
    },
    {
      icon: 'settings',
      label: 'SETTINGS',
      action: () => this.onSettings(),
      color: '#9d4edd',
      description: 'Customize your experience'
    }
  ];

  constructor(
    uiManager: UIManager,
    onPlayGameAI: () => void,
    onPlayGameLocal: () => void,
    onPlayGameOnline: () => void,
    onViewLeaderboard: () => void,
    onChatWithFriends: () => void,
    onSettings: () => void,
    onLogout: () => void
  ) {
    this.uiManager = uiManager;
    this.onPlayGameAI = onPlayGameAI;
    this.onPlayGameLocal = onPlayGameLocal;
    this.onPlayGameOnline = onPlayGameOnline;
    this.onViewLeaderboard = onViewLeaderboard;
    this.onChatWithFriends = onChatWithFriends;
    this.onSettings = onSettings;
    this.onLogout = onLogout;
  }

  public render(user: User | null): void {
    // const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
    const container = this.uiManager.createElement('div', 'retro-container size-full flex p-8');
    
    const content = this.uiManager.createElement('div', 'relative z-10 w-full flex-1 mx-auto');
    content.style.maxWidth = '1000px';
    
    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-12');
    const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'NEON ARCADE');
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-lg', 'WELCOME TO THE SYNTHWAVE DIMENSION');
    
    header.appendChild(title);
    header.appendChild(subtitle);
    
    // User Welcome
    if (user) {
      const userWelcome = this.uiManager.createElement('div', 'mt-6 flex items-center justify-center gap-3 retro-text');
      const userIcon = this.uiManager.createIcon('user', 'w-5 h-5 text-[#00ffff]');
      const userText = this.uiManager.createElement('span', 'text-[#00ffff]', `PLAYER: ${user.username.toUpperCase()}`);
      
      // Avatar
      const avatarImg = this.uiManager.createElement('img', 'w-8 h-8 rounded-full border-2 border-[#00ffff] object-cover') as HTMLImageElement;
      if (!user.avatar) {
        avatarImg.src = 'public/avatars/default.png';
      } else if (user.avatar.startsWith('http')) {
        avatarImg.src = user.avatar;
      } else {
        avatarImg.src = `public/avatars/${user.avatar}.png`;
      }
      avatarImg.alt = 'User Avatar';
      
      userWelcome.appendChild(userIcon);
      userWelcome.appendChild(avatarImg);
      userWelcome.appendChild(userText);
      header.appendChild(userWelcome);
    }
    
    // Main Menu Grid
    const menuGrid = this.uiManager.createElement('div', 'grid md:grid-cols-3 gap-6 mb-12');
    
    this.menuItems.forEach((item, index) => {
      const menuItem = this.uiManager.createElement('div', 'group bg-black/40 backdrop-blur-sm border-2 border-transparent hover:border-[var(--item-color)] rounded-lg p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_var(--item-color)] relative overflow-hidden');
      menuItem.style.setProperty('--item-color', item.color);
      
      // Animated background
      const animatedBg = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-br from-transparent via-[var(--item-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      menuItem.appendChild(animatedBg);
      
      const content = this.uiManager.createElement('div', 'relative z-10 text-center');
      
      // Icon
      const iconContainer = this.uiManager.createElement('div', 'flex justify-center mb-4');
      const icon = this.uiManager.createIcon(item.icon, 'w-12 h-12 transition-all duration-300 group-hover:scale-110');
      icon.style.color = item.color;
      iconContainer.appendChild(icon);
      
      // Label
      const label = this.uiManager.createElement('h3', 'retro-text text-xl mb-2');
      label.textContent = item.label;
      label.style.color = item.color;
      
      // Description
      const description = this.uiManager.createElement('p', 'text-sm opacity-60 retro-text', item.description);
      
      content.appendChild(iconContainer);
      content.appendChild(label);
      content.appendChild(description);
      
      // Scan line effect
      const scanLine = this.uiManager.createElement('div', 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300');
      const scanLineInner = this.uiManager.createElement('div', 'absolute inset-0 bg-gradient-to-b from-transparent via-[var(--item-color)]/10 to-transparent animate-pulse');
      scanLineInner.style.backgroundSize = '100% 200%';
      scanLine.appendChild(scanLineInner);

      menuItem.appendChild(content);
      menuItem.appendChild(scanLine);
      menuItem.addEventListener('click', item.action);
      
      menuGrid.appendChild(menuItem);
    });


    // div lateral social
    const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/60 backdrop-blur-md border-l-2 border-[#00ffff] flex flex-col py-6 px-4 mb-12');
    socialDiv.style.minHeight = '700px';
    socialDiv.style.border = '2px solid red';

    // Social header
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

    // Main Grid
    const mainGrid = this.uiManager.createElement('div', 'flex gap-6 w-full');

    // Menu Grid Wrapper
    const menuGridWrapper = this.uiManager.createElement('div', 'flex-1 h-full');
    menuGridWrapper.appendChild(menuGrid);

    // Social Div Wrapper
    const socialDivWrapper = this.uiManager.createElement('div', 'w-80 flex flex-col flex-shrink-0');
    socialDivWrapper.style.justifySelf = 'end';
    socialDivWrapper.appendChild(socialDiv);

    mainGrid.style.alignItems = 'stretch';

    mainGrid.appendChild(menuGridWrapper);
    mainGrid.appendChild(socialDivWrapper);
    
    // Stats Panel
    const statsPanel = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-6 mb-8');
    
    const statsHeader = this.uiManager.createElement('div', 'flex items-center justify-center gap-2 mb-4');
    const statsIcon = this.uiManager.createIcon('zap', 'w-5 h-5 text-[#ff1493]');
    const statsTitle = this.uiManager.createElement('h3', 'retro-text text-lg text-[#ff1493]', 'ARCADE STATS');
    statsHeader.appendChild(statsIcon);
    statsHeader.appendChild(statsTitle);
    
    const statsGrid = this.uiManager.createElement('div', 'grid grid-cols-3 gap-6 text-center');
    
    const stats = [
      { value: '0', label: 'GAMES PLAYED', color: '#00ffff' },
      { value: '0', label: 'WINS', color: '#ff1493' },
      { value: '0', label: 'HIGH SCORE', color: '#9d4edd' }
    ];
    
    stats.forEach(stat => {
      const statItem = this.uiManager.createElement('div');
      const statValue = this.uiManager.createElement('div', 'retro-text text-2xl mb-1', stat.value);
      statValue.style.color = stat.color;
      const statLabel = this.uiManager.createElement('div', 'retro-text text-xs opacity-60', stat.label);
      statItem.appendChild(statValue);
      statItem.appendChild(statLabel);
      statsGrid.appendChild(statItem);
    });
    
    statsPanel.appendChild(statsHeader);
    statsPanel.appendChild(statsGrid);
    
    // Footer
    const footer = this.uiManager.createElement('div', 'flex justify-center gap-6');
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
    const versionText = this.uiManager.createElement('p', '', 'NEON ARCADE v1.0 • POWERED BY SYNTHWAVE TECHNOLOGY');
    versionInfo.appendChild(versionText);
    
    content.appendChild(header);
    content.appendChild(mainGrid);
    content.appendChild(statsPanel);
    content.appendChild(footer);
    content.appendChild(versionInfo);
    
    container.appendChild(content);
    
    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
  }
}