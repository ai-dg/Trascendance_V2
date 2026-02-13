import { UIManager } from '../modules/UIManager.js';
import type { User } from '../modules/TypesManager.js';
import type { LanguageManager } from '../modules/LangManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import type { Socket } from "socket.io-client";
import type { WebsocketManager } from '../modules/WebsocketManager.js';
import { SocialManager } from '../modules/SocialManager.js';
import { Logger } from '../modules/Logger.js';

export class LiveChatPage {
    private uiManager: UIManager;
    private routerManager: RouterManager;
    private languageManager: LanguageManager;
    private wsManager: WebsocketManager | null = null;
    private onBack: () => void;

    private currentUser: User | null = null;
    private currentSelectedFriend: User | null = null;
    private socialManager: SocialManager | null = null;

    constructor(
        uiManager: UIManager,
        routerManager: RouterManager,
        languageManager: LanguageManager,
        wsManager: WebsocketManager | null,
        onBack: () => void,
        currentUser: User | null
    ) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.languageManager = languageManager;
        this.wsManager = wsManager;
        this.onBack = onBack;
        this.currentUser = currentUser;
    }

    private t(key: string): string {
        return this.languageManager.t(key);
    }


    public async render(user: User | null): Promise<void> {
        Logger.log("live-chat for:", user);

        this.checkSessionStorageForRedirect();

        const container = this.uiManager.createElement('div', 'retro-container size-full p-8');

        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-12');
        const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'LIVE CHAT');
        header.appendChild(title);
        container.appendChild(header);

        // Profile Column
        const profileDiv = this.createProfileColumn();

        // Chat Column
        const chatDiv = this.createChatColumn();

        // Social Div
        const socialWrapper = this.uiManager.createElement('div', 'w-80 flex flex-col flex-shrink-0');
        if (this.wsManager) {
            this.socialManager = new SocialManager(
                this.uiManager,
                this.routerManager,
                this.wsManager,
                this.currentUser,
                () => this.currentSelectedFriend ? this.currentSelectedFriend.nbrId : null,
                (friendId, username, avatar) => this.handleFriendSelection(friendId, username, avatar),
                (senderId, message) => {
                    if (this.currentSelectedFriend && senderId === this.currentSelectedFriend.nbrId) {
                        this.addMessage(message, false);
                    }
                }

            );
            this.socialManager.render(socialWrapper);
        }
        // Main Grid
        const mainGrid = this.uiManager.createElement('div', 'flex justify-center gap-2 w-full');
        mainGrid.style.alignItems = 'start';

        mainGrid.appendChild(profileDiv);
        mainGrid.appendChild(chatDiv);
        mainGrid.appendChild(socialWrapper);

        const backDiv = this.uiManager.createElement('div', 'flex justify-center items-center h-screen');

        const backButton = this.uiManager.createButton(
            this.t('BACK TO MENU'),
            'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4',
            () => {
                Logger.log('Back to menu clicked');
                this.onBack();
            }
        );

        backDiv.appendChild(backButton);
        container.appendChild(mainGrid);
        container.append(backDiv);

        this.uiManager.clear();
        this.uiManager.container.appendChild(container);

        if (this.currentSelectedFriend) {
            await this.handleFriendSelection(this.currentSelectedFriend.nbrId, this.currentSelectedFriend.username, this.currentSelectedFriend.avatar);
        }
    }

    private createProfileColumn(): HTMLElement {
        const profileDiv = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 flex-shrink-0 w-60');
        profileDiv.id = 'profile-div';
        profileDiv.style.minHeight = '350px';

        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer') as HTMLImageElement;
        avatarSection.style.width = '100px';
        avatarSection.style.height = '100px';
        avatarImg.style.width = '100px';
        avatarImg.style.height = '100px';

        if (!this.currentSelectedFriend || !this.currentSelectedFriend.avatar)
            avatarImg.src = 'public/avatars/unknownPlayer.jpeg';
        else if (this.currentSelectedFriend.avatar.startsWith('http'))
            avatarImg.src = this.currentSelectedFriend.avatar;
        else
            avatarImg.src = `public/avatars/${this.currentSelectedFriend.avatar}.png`;

        const username = this.uiManager.createElement('p', 'retro-subtitle text-lg text-[#00ffff] font-bold');
        if (!this.currentSelectedFriend || !this.currentSelectedFriend.username)
            username.textContent = ' ';
        else
            username.textContent = this.currentSelectedFriend.username;

        const btnDiv = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const deleteBtn = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        deleteBtn.id = 'delete-friend-btn';
        deleteBtn.textContent = "DELETE";
        deleteBtn.className += ' hidden';
        const blockBtn = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        blockBtn.id = 'block-friend-btn';
        blockBtn.textContent = "BLOCK";
        blockBtn.className += ' hidden';

        btnDiv.appendChild(deleteBtn);
        btnDiv.appendChild(blockBtn);

        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(username);
        avatarSection.appendChild(btnDiv);
        profileDiv.appendChild(avatarSection);

        return profileDiv;
    }

    private createChatColumn(): HTMLElement {
        const chatDiv = this.uiManager.createElement('div', 'flex flex-col flex-grow bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 min-h-[700px] justify-between');
        chatDiv.style.minWidth = '600px';

        // Main container of chat
        const messagesDiv = this.uiManager.createElement('div', 'flex-1 flex flex-col mb-2');
        // Title
        const messagesTitle = this.uiManager.createElement('div', 'text-[#00ffff] text-sm mb-2 opacity-60');
        messagesTitle.textContent = 'Messages';
        // Field of messages
        const messagesContainer = this.uiManager.createElement('div', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4');
        messagesContainer.style.maxHeight = '500px';
        messagesContainer.style.minHeight = '500px';
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.id = 'messages-div';
        messagesDiv.appendChild(messagesTitle);
        messagesDiv.appendChild(messagesContainer);
        const messagesSelectFriendText = this.uiManager.createElement('div', 'text-3xl text-[#ff1493] text-center retro-text');
        messagesSelectFriendText.textContent = 'SELECT A FRIEND TO CHAT';
        messagesSelectFriendText.style.marginTop = '200px';
        messagesContainer.appendChild(messagesSelectFriendText);
        messagesSelectFriendText.id = 'messages-select-friend-text';
        messagesSelectFriendText.className += ' hidden';

        // Challenge to Pong button
        const challengeButton = this.uiManager.createButton(
            '⚔️  Challenge',
            'retro-button bg-transparent text-[#ff1493] px-3 py-1 rounded border border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all text-sm hidden',
            () => this.sendGameInvite()
        );
        challengeButton.id = 'challenge-button';

        const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
        const inputField = this.uiManager.createElement('input', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        inputField.id = 'input-field';
        inputField.className += ' hidden';
        const sendButton = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        sendButton.textContent = 'SEND';
        sendButton.className += ' hidden';
        sendButton.id = 'send-button';
        if (this.currentSelectedFriend) {
            inputField.classList.remove('hidden');
            sendButton.classList.remove('hidden');
            challengeButton.classList.remove('hidden');
            messagesSelectFriendText.classList.add('hidden');
        } else {
            messagesSelectFriendText.classList.remove('hidden');
        }
        inputDiv.appendChild(challengeButton);
        inputField.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter'){
                e.preventDefault();
                sendButton.click();
            }
        });
        sendButton.addEventListener('click', async () => this.sendMessage(inputField as HTMLInputElement));
        inputDiv.appendChild(inputField);
        inputDiv.appendChild(sendButton);
        chatDiv.appendChild(messagesDiv);
        chatDiv.appendChild(inputDiv);
        return chatDiv;
    }

    // --- Game Invite: Send, Respond, Join, Card Rendering ---
    private async sendGameInvite(): Promise<void> {
        if (!this.currentSelectedFriend) return;
        const friendId = this.currentSelectedFriend.nbrId;
        const challengeButton = document.getElementById('challenge-button') as HTMLButtonElement;
        if (challengeButton) challengeButton.disabled = true;
        this.showFeedback(""); // Clear previous feedback
        try {
            const res = await fetch('/live-chat/send-game-invite', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: friendId })
            });
            const data = await res.json();
            if (!data.success) {
                this.showFeedback(data.message || 'Failed to send invite', true);
                if (challengeButton) challengeButton.disabled = false;
                return;
            }
            this.addGameCard(data.messageId, 'pending', null, true);
            this.showFeedback(this.t('Invite sent!'), false);
        } catch (error: any) {
            Logger.error("Error sending game invite:", error);
            this.showFeedback(error?.message || 'Failed to send invite', true);
            if (challengeButton) challengeButton.disabled = false;
        }
    }

    private async respondToGameInvite(messageId: number, action: 'accept' | 'decline'): Promise<void> {
        this.showFeedback("");
        try {
            const res = await fetch('/live-chat/respond-to-game-invite', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, action })
            });
            const data = await res.json();
            if (!data.success) {
                this.showFeedback(data.message || 'Failed to respond', true);
                return;
            }
            // Card will be updated via socket notification
        } catch (error: any) {
            Logger.error("Error responding to invite:", error);
            this.showFeedback(error?.message || 'Failed to respond', true);
        }
    }
    // Show feedback or error message in chat UI
    private showFeedback(message: string, isError: boolean = false): void {
        let feedbackDiv = document.getElementById('game-invite-feedback');
        if (!feedbackDiv) {
            const chatDiv = document.querySelector('#messages-div')?.parentElement;
            if (!chatDiv) return;
            feedbackDiv = this.uiManager.createElement('div', 'mt-2 text-center', '');
            feedbackDiv.id = 'game-invite-feedback';
            chatDiv.insertBefore(feedbackDiv, chatDiv.firstChild);
        }
        feedbackDiv.textContent = message;
        feedbackDiv.className = 'mt-2 text-center retro-text ' + (isError ? 'text-red-400' : 'text-green-400');
        if (!message) feedbackDiv.style.display = 'none';
        else feedbackDiv.style.display = '';
    }
    // Listen for real-time updates to update challenge button and feedback
    public setWebsocketManager(manager: WebsocketManager): void {
        this.wsManager = manager;
        // Listen for notifications (game invite state changes)
        this.wsManager.onGeneral('notifications', (data: any) => {
            if (!data?.payload) return;
            const { type, messageId, state } = data.payload;
            if ([
                'game-invite',
                'game-invite-accepted',
                'game-invite-declined',
                'game-invite-expired',
                'game-state-update'
            ].includes(type)) {
                this.handleGameInviteNotification(type, data.payload);
            }
        });
    }

    private handleGameInviteNotification(type: string, payload: any): void {
        const challengeButton = document.getElementById('challenge-button') as HTMLButtonElement;
        switch (type) {
            case 'game-invite':
                // Show incoming invite card for the invitee
                if (challengeButton) challengeButton.disabled = true;
                if (String(payload.senderId) !== String(this.currentUser?.id)) {
                    this.addGameCard(payload.messageId, 'pending', null, false);
                }
                break;
            case 'game-invite-accepted':
                this.showFeedback(this.t('Challenge accepted!'), false);
                if (challengeButton) challengeButton.disabled = true;
                // Update existing card or add accepted card with join button
                this.updateGameCard(payload.messageId, 'accepted', payload.gameUUID);
                break;
            case 'game-invite-declined':
                this.showFeedback(this.t('Challenge declined'), true);
                if (challengeButton) challengeButton.disabled = false;
                this.updateGameCard(payload.messageId, 'declined', null);
                break;
            case 'game-invite-expired':
                this.showFeedback(this.t('Invite expired'), true);
                if (challengeButton) challengeButton.disabled = false;
                this.updateGameCard(payload.messageId, 'expired', null);
                break;
            case 'game-state-update':
                if (payload.state === 'finished' || payload.state === 'disconnected') {
                    if (challengeButton) challengeButton.disabled = false;
                } else if (payload.state === 'in_progress') {
                    if (challengeButton) challengeButton.disabled = true;
                }
                break;
        }
    }

    private updateGameCard(messageId: number, state: string, gameUUID: string | null): void {
        const card = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
        if (!card) return;
        card.setAttribute('data-game-state', state);
        // Re-render card content using class-based selectors
        const content = card.querySelector('.game-card-content') as HTMLElement;
        let actions = card.querySelector('.game-card-actions') as HTMLElement;
        if (content) {
            switch (state) {
                case 'accepted':
                    content.textContent = '✅ Challenge accepted!';
                    break;
                case 'declined':
                    content.textContent = '❌ Challenge declined';
                    break;
                case 'expired':
                    content.textContent = '⏱️ Invite expired';
                    break;
            }
        }
        if (state === 'accepted' && gameUUID) {
            if (!actions) {
                actions = this.uiManager.createElement('div', 'game-card-actions flex gap-2');
                card.appendChild(actions);
            }
            actions.innerHTML = '';
            const joinBtn = this.uiManager.createButton(
                '🎮 Join Game',
                'bg-[#ff1493] text-black px-4 py-2 rounded hover:bg-[#ff1493]/80 text-xs font-bold',
                () => this.joinPrivateGame(gameUUID)
            );
            actions.appendChild(joinBtn);
        } else if (actions) {
            actions.innerHTML = '';
        }
    }

    private joinPrivateGame(gameUUID: string): void {
        this.routerManager.navigateTo('game-online', {
            mode: 'private',
            gameUUID: gameUUID
        });
    }

    private addGameCard(
        messageId: number,
        state: string,
        metadata: any,
        isMine: boolean,
        gameUUID: string | null = null
    ): void {
        const messagesDiv = document.querySelector('#messages-div');
        if (!messagesDiv) return;
        const cardWrapper = this.uiManager.createElement(
            'div',
            `flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`
        );
        const card = this.uiManager.createElement(
            'div',
            'game-invite-card bg-gradient-to-br from-[#9d4edd]/20 to-[#ff1493]/20 border-2 border-[#9d4edd] rounded-lg p-4 max-w-xs'
        );
        card.setAttribute('data-message-id', messageId.toString());
        card.setAttribute('data-game-state', state);
        // Header
        const header = this.uiManager.createElement('div', 'flex items-center gap-2 mb-2');
        const icon = this.uiManager.createElement('span', 'text-2xl');
        icon.textContent = '🎮';
        const title = this.uiManager.createElement('span', 'text-[#00ffff] font-bold retro-text');
        title.textContent = 'PONG CHALLENGE';
        header.appendChild(icon);
        header.appendChild(title);
        card.appendChild(header);
        // State-specific content
        const content = this.uiManager.createElement('div', 'game-card-content text-white text-sm mb-3');
        const actions = this.uiManager.createElement('div', 'game-card-actions flex gap-2');
        switch (state) {
            case 'pending':
                content.textContent = isMine ? 'Waiting for response...' : 'You have been challenged!';
                if (!isMine) {
                    const acceptBtn = this.uiManager.createButton(
                        'Accept',
                        'bg-green-500 text-black px-4 py-2 rounded hover:bg-green-400 text-xs',
                        () => this.respondToGameInvite(messageId, 'accept')
                    );
                    const declineBtn = this.uiManager.createButton(
                        'Decline',
                        'bg-red-500 text-black px-4 py-2 rounded hover:bg-red-400 text-xs',
                        () => this.respondToGameInvite(messageId, 'decline')
                    );
                    actions.appendChild(acceptBtn);
                    actions.appendChild(declineBtn);
                }
                break;
            case 'declined':
                content.textContent = '❌ Challenge declined';
                break;
            case 'accepted':
                content.textContent = '✅ Challenge accepted!';
                if (gameUUID) {
                    const joinBtn = this.uiManager.createButton(
                        '🎮 Join Game',
                        'bg-[#ff1493] text-black px-4 py-2 rounded hover:bg-[#ff1493]/80 text-xs font-bold',
                        () => this.joinPrivateGame(gameUUID)
                    );
                    actions.appendChild(joinBtn);
                }
                break;
            case 'in_progress':
                content.textContent = '🎯 Game in progress...';
                if (metadata && metadata.player1Score !== undefined) {
                    const score = this.uiManager.createElement('div', 'text-[#00ffff] text-xs mt-1');
                    score.textContent = `Score: ${metadata.player1Score} - ${metadata.player2Score}`;
                    content.appendChild(score);
                }
                break;
            case 'disconnected':
                content.textContent = '⚠️  Player disconnected';
                if (gameUUID) {
                    const reconnectBtn = this.uiManager.createButton(
                        'Reconnect',
                        'bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 text-xs',
                        () => this.joinPrivateGame(gameUUID)
                    );
                    actions.appendChild(reconnectBtn);
                }
                break;
            case 'finished':
                const winnerId = metadata?.winner;
                const didIWin = winnerId === this.currentUser?.id;
                content.textContent = didIWin ? '🏆 You won!' : '😞 You lost';
                const score = this.uiManager.createElement('div', 'text-[#00ffff] text-xs mt-1');
                score.textContent = `Final: ${metadata.player1Score} - ${metadata.player2Score}`;
                content.appendChild(score);
                const rematchBtn = this.uiManager.createButton(
                    'Rematch',
                    'bg-[#9d4edd] text-black px-4 py-2 rounded hover:bg-[#9d4edd]/80 text-xs',
                    () => this.sendGameInvite()
                );
                actions.appendChild(rematchBtn);
                break;
            case 'expired':
                content.textContent = '⏱️  Invite expired';
                break;
        }
        card.appendChild(content);
        if (actions.childElementCount > 0) {
            card.appendChild(actions);
        }
        cardWrapper.appendChild(card);
        messagesDiv.appendChild(cardWrapper);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    private async checkSessionStorageForRedirect() {
        const storedId = sessionStorage.getItem('selectedFriendId');
        const storedUsername = sessionStorage.getItem('selectedFriendUsername');

        // const res = await this.getUsernameById(storedId || '');
        // const avatar = res.json
        // PEGAR AVATAR AQUIIIIII
        if (storedId && storedUsername) {
            this.currentSelectedFriend = {
                id: storedId,
                username: storedUsername,
                avatar: '',
                isGuest: false,
                nbrId: Number(storedId)
            };

            sessionStorage.removeItem('selectedFriendId');
            sessionStorage.removeItem('selectedFriendUsername');
        }
    }

    private async handleFriendSelection(friendId: any, username: string, avatar?: string | null) {
        Logger.log("Handling friend selection:", username);

        this.currentSelectedFriend = {
            username: username,
            id: friendId,
            avatar: avatar ?? '',
            isGuest: false,
            nbrId: Number(friendId)
        };

        this.updateProfileView();
        await this.loadChatHistory(friendId);

        this.setupFriendActionButtons();

        const profileDiv = document.getElementById('profile-div');
        profileDiv?.querySelectorAll('button').forEach(btn => btn.classList.remove('hidden'));
        document.getElementById('send-button')?.classList.remove('hidden');
        document.getElementById('input-field')?.classList.remove('hidden');
        document.getElementById('challenge-button')?.classList.remove('hidden');
        document.getElementById('messages-text')?.classList.remove('hidden');
    }

    private updateProfileView(): void {
        const profileDiv = document.getElementById('profile-div');
        if (!profileDiv || !this.currentSelectedFriend) return;

        const friendImg = profileDiv.querySelector('img') as HTMLImageElement;
        const friendPseudo = profileDiv.querySelector('p');
        const friend = this.currentSelectedFriend;

        if (friendImg) {
            if (!friend.avatar) friendImg.src = 'public/avatars/default.png';
            else if (friend.avatar.startsWith('http')) friendImg.src = friend.avatar;
            else friendImg.src = `public/avatars/${friend.avatar}.png`;
        }

        if (friendPseudo) {
            friendPseudo.textContent = friend.username;
        }
    }

    private async sendMessage(inputField: HTMLInputElement): Promise<void> {
        const message = inputField.value.trim();
        if (message === '' || !this.currentSelectedFriend) return;

        try {
            const res = await fetch(this.routerManager.getUrl('/live-chat/send-message'), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId: this.currentSelectedFriend.id, message: message })
            });
            if (!res.ok) {
                Logger.error('Failed to send message:', res.status);
                return;
            }
            if (res.ok) {
                this.addMessage(message, true);
                inputField.value = '';
                inputField.focus();
            }
        } catch (error) {
            Logger.error("Error sending message:", error);
        }
    }

    private addMessage(text: string, isMine: boolean): void {
        const messagesContainer = document.getElementById('messages-div');
        if (!messagesContainer) return;

        const wrapper = this.uiManager.createElement(
            'div',
            `flex mb-2 w-full ${isMine ? 'justify-end' : 'justify-start'}`
        );

        const bubble = this.uiManager.createElement(
            'div',
            isMine
            ? 'bg-black text-[#ff1493] border border-[#ff1493]/40 px-3 py-2 rounded-lg max-w-[70%]'
            : 'bg-white/70 text-[#ffffff] border border-[#00ffff]/40 px-3 py-2 rounded-lg max-w-[70%]'
        );

        bubble.textContent = text;
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    private async loadChatHistory(friendId: any): Promise<void> {
        const messagesContainer = document.getElementById('messages-div');
        if (messagesContainer) messagesContainer.innerHTML = '';

        if (!friendId || friendId === this.currentUser?.id) return;

        try {
            const res = await fetch(this.routerManager.getUrl(`/live-chat/get-messages?friendId=${friendId}`), {
                credentials: 'include'
            });
            const data = await res.json();

            if (data.success && data.messages) {
                data.messages.forEach((msg: any) => {
                    const isMine = String(msg.sender_id) === String(this.currentUser?.id);
                    if (msg.message_type === 'game-invite') {
                        let parsedMetadata = null;
                        if (msg.game_metadata && typeof msg.game_metadata === 'string' && msg.game_metadata.trim()) {
                            try { parsedMetadata = JSON.parse(msg.game_metadata); } catch { parsedMetadata = null; }
                        }
                        this.addGameCard(
                            msg.message_id,
                            msg.game_state || 'pending',
                            parsedMetadata,
                            isMine,
                            msg.game_uuid || null
                        );
                    } else {
                        this.addMessage(msg.content, isMine);
                    }
                });
            }
        } catch (err) {
            Logger.error("Error loading chat history:", err);
        }
    }

    private setupFriendActionButtons(): void {
        const blockBtn = document.getElementById('block-friend-btn');
        const deleteBtn = document.getElementById('delete-friend-btn');

        if (blockBtn) {
            const newBlockBtn = blockBtn.cloneNode(true) as HTMLElement;
            blockBtn.replaceWith(newBlockBtn);

            newBlockBtn.addEventListener('click', () => this.handleBlockFriend());
        }

        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true) as HTMLElement;
            deleteBtn.replaceWith(newDeleteBtn);

            newDeleteBtn.addEventListener('click', () => this.handleDeleteFriend());
        }
    }

    private async handleBlockFriend() {
        if (!this.currentSelectedFriend) return;

        Logger.log("Blocking friend:", this.currentSelectedFriend.nbrId);

        try {
            const res = await fetch(this.routerManager.getUrl('/live-chat/block-friend'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: this.currentSelectedFriend.nbrId })
            });

            const data = await res.json();
            if (data.success) {
                Logger.log("Friend blocked successfully");
                this.socialManager?.loadFriendsList();
                this.currentSelectedFriend = null;
                this.updateProfileView();
            } else {
                Logger.error("Failed to block friend:", data.message);
            }
        } catch (err) {
            Logger.error("Error blocking friend:", err);
        }
    }

    private async handleDeleteFriend() {
        if (!this.currentSelectedFriend) return;

        Logger.log("Removing friend:", this.currentSelectedFriend.nbrId);
        try {
            const res = await fetch(this.routerManager.getUrl('/live-chat/remove-friend'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: this.currentSelectedFriend.nbrId })
            });
            const data = await res.json();
            if (data.success) {
                Logger.log("Friend removed");

                this.socialManager?.loadFriendsList();

                this.currentSelectedFriend = null;
                this.updateProfileView();
            }
        } catch (err) {
            Logger.error("Error removing friend:", err);
        }
    }
}
