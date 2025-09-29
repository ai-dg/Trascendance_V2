export class AboutPage {
    constructor(uiManager, onBack) {
        this.uiManager = uiManager;
        this.onBack = onBack;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-4xl');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', 'ABOUT');
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle', 'TRANSCENDENCE PROJECT');
        header.appendChild(title);
        header.appendChild(subtitle);
        // Back Button
        const backButton = this.uiManager.createButton('BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2 mb-8', this.onBack);
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        // Main Content
        const mainContent = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 mb-8');
        // Project Description
        const description = this.uiManager.createElement('div', 'mb-8');
        const descTitle = this.uiManager.createElement('h2', 'retro-text text-xl mb-4 text-[#ff1493]', 'PROJECT DESCRIPTION');
        const descText = this.uiManager.createElement('p', 'retro-text text-sm leading-relaxed mb-4', 'Transcendence is a retro-futuristic Pong game built with modern web technologies. ' +
            'Experience the nostalgia of classic arcade gaming with a cyberpunk aesthetic and smooth gameplay.');
        const descText2 = this.uiManager.createElement('p', 'retro-text text-sm leading-relaxed', 'This project showcases advanced frontend development techniques, real-time multiplayer capabilities, ' +
            'and a beautiful synthwave-inspired user interface.');
        description.appendChild(descTitle);
        description.appendChild(descText);
        description.appendChild(descText2);
        // Features
        const features = this.uiManager.createElement('div', 'mb-8');
        const featuresTitle = this.uiManager.createElement('h2', 'retro-text text-xl mb-4 text-[#00ffff]', 'FEATURES');
        const featuresList = this.uiManager.createElement('div', 'grid md:grid-cols-2 gap-4');
        const featureItems = [
            'Retro-futuristic UI Design',
            'Real-time Multiplayer',
            'Guest Play Mode',
            'User Authentication',
            'Leaderboard System',
            'Customizable Settings',
            'Responsive Design',
            'Modern Web Technologies'
        ];
        featureItems.forEach(feature => {
            const featureItem = this.uiManager.createElement('div', 'flex items-center gap-2 retro-text text-sm');
            const featureIcon = this.uiManager.createIcon('check', 'w-4 h-4 text-[#9d4edd]');
            const featureText = this.uiManager.createElement('span', '', feature);
            featureItem.appendChild(featureIcon);
            featureItem.appendChild(featureText);
            featuresList.appendChild(featureItem);
        });
        features.appendChild(featuresTitle);
        features.appendChild(featuresList);
        // Technology Stack
        const techStack = this.uiManager.createElement('div', 'mb-8');
        const techTitle = this.uiManager.createElement('h2', 'retro-text text-xl mb-4 text-[#9d4edd]', 'TECHNOLOGY STACK');
        const techGrid = this.uiManager.createElement('div', 'grid grid-cols-2 md:grid-cols-4 gap-4');
        const technologies = [
            { name: 'TypeScript', color: '#3178c6' },
            { name: 'HTML5', color: '#e34f26' },
            { name: 'CSS3', color: '#1572b6' },
            { name: 'WebSocket', color: '#ff6600' },
            { name: 'Canvas API', color: '#ffd700' },
            { name: 'LocalStorage', color: '#4caf50' },
            { name: 'Fetch API', color: '#2196f3' },
            { name: 'Tailwind CSS', color: '#06b6d4' }
        ];
        technologies.forEach(tech => {
            const techItem = this.uiManager.createElement('div', 'text-center p-3 rounded border-2 border-transparent hover:border-current transition-colors');
            techItem.style.borderColor = tech.color;
            techItem.style.color = tech.color;
            const techName = this.uiManager.createElement('div', 'retro-text text-sm font-bold', tech.name);
            techItem.appendChild(techName);
            techGrid.appendChild(techItem);
        });
        techStack.appendChild(techTitle);
        techStack.appendChild(techGrid);
        // Version Info
        const versionInfo = this.uiManager.createElement('div', 'text-center');
        const versionTitle = this.uiManager.createElement('h2', 'retro-text text-lg mb-2 text-[#ff1493]', 'VERSION INFORMATION');
        const versionText = this.uiManager.createElement('p', 'retro-text text-sm', 'Version 1.0.0 • Built with ❤️ for the 42 Community');
        const buildDate = this.uiManager.createElement('p', 'retro-text text-xs opacity-60 mt-2', `Build Date: ${new Date().toLocaleDateString()}`);
        versionInfo.appendChild(versionTitle);
        versionInfo.appendChild(versionText);
        versionInfo.appendChild(buildDate);
        mainContent.appendChild(description);
        mainContent.appendChild(features);
        mainContent.appendChild(techStack);
        mainContent.appendChild(versionInfo);
        // Footer
        const footer = this.uiManager.createElement('div', 'text-center retro-text text-xs opacity-40');
        const footerText = this.uiManager.createElement('p', '', '© 2024 Transcendence Project • All Rights Reserved');
        footer.appendChild(footerText);
        content.appendChild(header);
        content.appendChild(backButton);
        content.appendChild(mainContent);
        content.appendChild(footer);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
}
