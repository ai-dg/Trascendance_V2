export class GuestPage {
    constructor(uiManager, onBack, onPlayAsGuest) {
        this.selectedAvatar = 'avatar1';
        this.uiManager = uiManager;
        this.onBack = onBack;
        this.onPlayAsGuest = onPlayAsGuest;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
        content.style.maxWidth = '600px';
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-4xl mb-4', 'GUEST MODE');
        const separator = this.uiManager.createElement('div', 'w-full h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent mb-8');
        header.appendChild(title);
        header.appendChild(separator);
        // Main Card
        const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8');
        // Nickname Section
        const nicknameSection = this.uiManager.createElement('div', 'mb-8');
        const nicknameLabel = this.uiManager.createElement('label', 'retro-text text-sm block mb-2', 'NICKNAME');
        const nicknameInput = this.uiManager.createInput('text', 'Enter your nickname', 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        nicknameInput.setAttribute('maxlength', '20');
        nicknameSection.appendChild(nicknameLabel);
        nicknameSection.appendChild(nicknameInput);
        // Separator
        const separator2 = this.uiManager.createElement('div', 'w-full h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent my-8');
        // Avatar Selection Section
        const avatarSection = this.uiManager.createElement('div', 'mb-8');
        const avatarLabel = this.uiManager.createElement('h2', 'retro-text text-xl text-center mb-6', 'CHOOSE YOUR AVATAR');
        const avatarContainer = this.uiManager.createAvatarSelector((avatarId) => {
            const element = avatarContainer.querySelector(`[data-avatar="${avatarId}"]`);
            if (element instanceof HTMLElement) {
                this.selectAvatar(avatarId, element);
            }
        }, this.selectedAvatar);
        avatarSection.appendChild(avatarLabel);
        avatarSection.appendChild(avatarContainer);
        // Separator
        const separator3 = this.uiManager.createElement('div', 'w-full h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent my-8');
        // Action Buttons
        const buttonContainer = this.uiManager.createElement('div', 'flex flex-col gap-4');
        const playButton = this.uiManager.createButton('PLAY', 'retro-button bg-[#ff1493] text-black px-8 py-3 rounded border-2 border-[#ff1493] hover:bg-transparent hover:text-[#ff1493] transition-all duration-200 font-bold text-lg', () => this.handlePlay());
        const returnButton = this.uiManager.createButton('RETURN', 'retro-button bg-transparent text-[#00ffff] px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', this.onBack);
        buttonContainer.appendChild(playButton);
        buttonContainer.appendChild(returnButton);
        // Assemble card
        card.appendChild(nicknameSection);
        card.appendChild(separator2);
        card.appendChild(avatarSection);
        card.appendChild(separator3);
        card.appendChild(buttonContainer);
        // Assemble content
        content.appendChild(header);
        content.appendChild(card);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
        // Set first avatar as selected by default
        this.selectAvatar('avatar1', avatarContainer.querySelector('[data-avatar="avatar1"]'));
    }
    selectAvatar(avatarId, element) {
        // Remove selection from all avatars
        const allAvatars = document.querySelectorAll('[data-avatar]');
        allAvatars.forEach(avatar => {
            const circle = avatar.querySelector('div');
            circle.classList.remove('border-[#ff1493]', 'ring-4', 'ring-[#ff1493]/50', 'scale-110');
            circle.classList.add('border-transparent');
        });
        // Add selection to clicked avatar
        const circle = element.querySelector('div');
        circle.classList.remove('border-transparent');
        circle.classList.add('border-[#ff1493]', 'ring-4', 'ring-[#ff1493]/50', 'scale-110');
        this.selectedAvatar = avatarId;
    }
    handlePlay() {
        const nicknameInput = document.querySelector('input[type="text"]');
        const nickname = nicknameInput.value.trim();
        // Map avatar ID to filename
        const avatarMap = {
            'avatar1': 'avatar1',
            'avatar2': 'avatar2',
            'avatar3': 'avatar3'
        };
        const avatarFilename = avatarMap[this.selectedAvatar] || 'default.png';
        if (!nickname) {
            // Show error or use default
            this.onPlayAsGuest('Guest', avatarFilename);
        }
        else {
            this.onPlayAsGuest(nickname, avatarFilename);
        }
    }
}
