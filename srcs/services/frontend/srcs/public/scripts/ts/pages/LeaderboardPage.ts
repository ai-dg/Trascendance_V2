import { UIManager } from '../modules/UIManager.js';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  games: number;
  winRate: number;
}

export class LeaderboardPage {
  private uiManager: UIManager;
  private onBack: () => void;

  private leaderboardData: LeaderboardEntry[] = [
    { rank: 1, username: 'NEON_MASTER', score: 2840, games: 156, winRate: 89 },
    { rank: 2, username: 'RETRO_KING', score: 2650, games: 142, winRate: 85 },
    { rank: 3, username: 'SYNTH_WAVE', score: 2420, games: 128, winRate: 82 },
    { rank: 4, username: 'CYBER_ACE', score: 2180, games: 98, winRate: 78 },
    { rank: 5, username: 'PIXEL_PRO', score: 1950, games: 87, winRate: 75 },
    { rank: 6, username: 'GLITCH_HERO', score: 1720, games: 76, winRate: 71 },
    { rank: 7, username: 'NEON_NINJA', score: 1520, games: 65, winRate: 68 },
    { rank: 8, username: 'RETRO_RIDER', score: 1340, games: 54, winRate: 65 },
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
    const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', 'LEADERBOARD');
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle', 'TOP ARCADE CHAMPIONS');
    
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
    
    // Leaderboard Table
    const tableContainer = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg overflow-hidden');
    
    // Table Header
    const tableHeader = this.uiManager.createElement('div', 'bg-[#ff1493]/20 p-4');
    const headerRow = this.uiManager.createElement('div', 'grid grid-cols-5 gap-4 retro-text text-sm text-[#ff1493]');
    
    const headers = ['RANK', 'PLAYER', 'SCORE', 'GAMES', 'WIN RATE'];
    headers.forEach(headerText => {
      const headerCell = this.uiManager.createElement('div', headerText === 'SCORE' || headerText === 'GAMES' || headerText === 'WIN RATE' ? 'text-center' : '', headerText);
      headerRow.appendChild(headerCell);
    });
    
    tableHeader.appendChild(headerRow);
    tableContainer.appendChild(tableHeader);
    
    // Table Body
    const tableBody = this.uiManager.createElement('div', 'divide-y divide-[#ff1493]/20');
    
    this.leaderboardData.forEach(entry => {
      const row = this.uiManager.createElement('div', 'p-4 hover:bg-[#ff1493]/10 transition-colors duration-200');
      const rowContent = this.uiManager.createElement('div', 'grid grid-cols-5 gap-4 items-center');
      
      // Rank
      const rankCell = this.uiManager.createElement('div', 'flex items-center gap-3');
      const rankIcon = this.getRankIcon(entry.rank);
      const rankNumber = this.uiManager.createElement('span', 'retro-text');
      rankNumber.textContent = `#${entry.rank}`;
      rankNumber.style.color = this.getRankColor(entry.rank);
      rankCell.appendChild(rankIcon);
      rankCell.appendChild(rankNumber);
      
      // Username
      const usernameCell = this.uiManager.createElement('div', 'retro-text');
      usernameCell.textContent = entry.username;
      usernameCell.style.color = this.getRankColor(entry.rank);
      
      // Score
      const scoreCell = this.uiManager.createElement('div', 'text-center retro-text text-[#00ffff]');
      scoreCell.textContent = entry.score.toLocaleString();
      
      // Games
      const gamesCell = this.uiManager.createElement('div', 'text-center retro-text text-[#9d4edd]');
      gamesCell.textContent = entry.games.toString();
      
      // Win Rate
      const winRateCell = this.uiManager.createElement('div', 'text-center');
      const winRateText = this.uiManager.createElement('div', 'retro-text text-[#ff1493]');
      winRateText.textContent = `${entry.winRate}%`;
      
      const progressBar = this.uiManager.createElement('div', 'w-full bg-black/40 rounded-full h-2 mt-1');
      const progressFill = this.uiManager.createElement('div', 'bg-gradient-to-r from-[#ff1493] to-[#00ffff] h-2 rounded-full transition-all duration-500');
      progressFill.style.width = `${entry.winRate}%`;
      
      winRateCell.appendChild(winRateText);
      winRateCell.appendChild(progressBar);
      progressBar.appendChild(progressFill);
      
      rowContent.appendChild(rankCell);
      rowContent.appendChild(usernameCell);
      rowContent.appendChild(scoreCell);
      rowContent.appendChild(gamesCell);
      rowContent.appendChild(winRateCell);
      
      row.appendChild(rowContent);
      tableBody.appendChild(row);
    });
    
    tableContainer.appendChild(tableBody);
    
    // Stats Footer
    const statsFooter = this.uiManager.createElement('div', 'mt-8 grid grid-cols-3 gap-6');
    
    const stats = [
      { value: '8', label: 'ACTIVE PLAYERS', color: '#ff1493' },
      { value: '247', label: 'GAMES TODAY', color: '#00ffff' },
      { value: '2840', label: 'RECORD SCORE', color: '#9d4edd' }
    ];
    
    stats.forEach(stat => {
      const statCard = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 text-center');
      statCard.style.borderColor = stat.color;
      
      const statValue = this.uiManager.createElement('div', 'retro-text text-2xl mb-2');
      statValue.textContent = stat.value;
      statValue.style.color = stat.color;
      
      const statLabel = this.uiManager.createElement('div', 'retro-text text-sm opacity-60');
      statLabel.textContent = stat.label;
      
      statCard.appendChild(statValue);
      statCard.appendChild(statLabel);
      statsFooter.appendChild(statCard);
    });
    
    // Update Notice
    const updateNotice = this.uiManager.createElement('div', 'text-center mt-8 retro-text text-xs opacity-40');
    const noticeText = this.uiManager.createElement('p', '', 'LEADERBOARD UPDATES EVERY 60 SECONDS • LAST UPDATE: NOW');
    updateNotice.appendChild(noticeText);
    
    content.appendChild(header);
    content.appendChild(backButton);
    content.appendChild(tableContainer);
    content.appendChild(statsFooter);
    content.appendChild(updateNotice);
    
    container.appendChild(content);
    
    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
  }

  private getRankIcon(rank: number): HTMLElement {
    switch (rank) {
      case 1:
        return this.createTrophyIcon('#ff1493');
      case 2:
        return this.createMedalIcon('#00ffff');
      case 3:
        return this.createAwardIcon('#9d4edd');
      default:
        const icon = this.uiManager.createElement('div', 'w-6 h-6 flex items-center justify-center retro-text text-sm');
        icon.textContent = rank.toString();
        return icon;
    }
  }

  private getRankColor(rank: number): string {
    switch (rank) {
      case 1: return '#ff1493';
      case 2: return '#00ffff';
      case 3: return '#9d4edd';
      default: return '#ffffff';
    }
  }

  private createTrophyIcon(color: string): HTMLElement {
    const icon = this.uiManager.createElement('div', 'w-6 h-6');
    icon.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${color}">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15l-2 5L7 18l5-2 5 2-3 2-2-5zM12 15l2-5 5 2-3 2-2 5-2-5z"></path>
    </svg>`;
    return icon;
  }

  private createMedalIcon(color: string): HTMLElement {
    const icon = this.uiManager.createElement('div', 'w-6 h-6');
    icon.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${color}">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
    </svg>`;
    return icon;
  }

  private createAwardIcon(color: string): HTMLElement {
    const icon = this.uiManager.createElement('div', 'w-6 h-6');
    icon.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${color}">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
    </svg>`;
    return icon;
  }
}