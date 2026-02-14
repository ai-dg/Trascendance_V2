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

    public setWebsocketManager(manager: WebsocketManager) : void {
        this.wsManager = manager;
        
    }

    public async render(user: User | null): Promise<void> {
        console.log("live-chat for:", user);

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
                },
                (senderId) => {
                    this.handleGameInvite(senderId);
                }
                
            
            );
            this.socialManager.onTyping = (senderId) => {

                this.showTypingIndicator();
            };
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
                console.log('Back to menu clicked');
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
        profileDiv.style.minHeight = '380px';

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
        
        const inviteBtn = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        inviteBtn.id = 'invite-friend-btn';
        inviteBtn.textContent = "INVITE";
        inviteBtn.className += ' hidden';
        const deleteBtn = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        deleteBtn.id = 'delete-friend-btn';
        deleteBtn.textContent = "DELETE";
        deleteBtn.className += ' hidden';
        const blockBtn = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        blockBtn.id = 'block-friend-btn';
        blockBtn.textContent = "BLOCK";
        blockBtn.className += ' hidden';

        btnDiv.appendChild(inviteBtn);
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

        const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
        const inputField = this.uiManager.createElement('input', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto text-[#00ffff]') as HTMLInputElement;
        inputField.id = 'input-field';
        inputField.className += ' hidden';
        const sendButton = this.uiManager.createElement('button', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto text-[#00ffff]');
        sendButton.textContent = 'SEND';
        sendButton.className += ' hidden';
        sendButton.id = 'send-button';
        if (this.currentSelectedFriend)
        {   
            inputField.classList.remove('hidden');
            sendButton.classList.remove('hidden');
            messagesSelectFriendText.classList.add('hidden');
        }
        else
        {
            inputField.classList.add('hidden');
            sendButton.classList.add('hidden');
            messagesSelectFriendText.classList.remove('hidden');
        }

        inputField.addEventListener('input', () => {
            if (inputField.value.length > 0 && this.currentSelectedFriend && this.currentSelectedFriend.nbrId) {
                this.socialManager?.sendTypingSignal(this.currentSelectedFriend.nbrId);
            }
        });

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

    public updateReadStatus(): void {
        const icons = document.querySelectorAll(`.message-status-icon`);
        icons.forEach(icon => {
            (icon as HTMLElement).style.color = '#00ffff';
        });
    }

    private typingTimeout: any = null;

    private showTypingIndicator(): void {
        const messagesContainer = document.getElementById('messages-div');
        if (!messagesContainer) return;

        let typingDiv = document.getElementById('typing-indicator');
        if (!typingDiv) {
                typingDiv = this.uiManager.createElement('div', 'text-xs text-[#00ffff] ml-4 mb-2 animate-pulse italic');
                typingDiv.id = 'typing-indicator';
                typingDiv.textContent = 'Typing...';
                messagesContainer.appendChild(typingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            if (this.typingTimeout) clearTimeout(this.typingTimeout);
        
            this.typingTimeout = setTimeout(() => {
                const div = document.getElementById('typing-indicator');
                if (div) div.remove();
            }, 3500);
        }

    private async handleFriendSelection(friendId: any, username: string, avatar?: string | null) {
        console.log("Handling friend selection:", username);

        const online = await this.socialManager?.isUserOnline(Number(friendId)) ?? false;
        
        this.currentSelectedFriend = {
            username: username,
            id: friendId,
            avatar: avatar ?? '',
            isGuest: false,
            nbrId: Number(friendId),
            online: online
        };

        if (this.socialManager) {
            await this.socialManager.markMessageAsRead(Number(friendId));
        }

        this.updateProfileView();
        await this.loadChatHistory(friendId);
        
        this.setupFriendActionButtons();

        const profileDiv = document.getElementById('profile-div');
        profileDiv?.querySelectorAll('button').forEach(btn => btn.classList.remove('hidden'));
        document.getElementById('send-button')?.classList.remove('hidden');
        document.getElementById('input-field')?.classList.remove('hidden');
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

    private addMessage(text: string, isMine: boolean, isRead: boolean = false): void {
        const messagesContainer = document.getElementById('messages-div');
        if (!messagesContainer)
            return;

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

        if (isMine) {
            const statusIcon = this.uiManager.createElement('span', 'ml-2 text-xs');

            statusIcon.style.color = isRead ? '#00ffff' : '#888'; 
            statusIcon.textContent = '✓✓';
            statusIcon.classList.add('message-status-icon');

            const content = this.uiManager.createElement('div', 'flex items-end justify-between gap-2');
            content.appendChild(document.createTextNode(text));
            content.appendChild(statusIcon);
            
            bubble.innerHTML = '';
            bubble.appendChild(content);
        }

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
                    const isMine = msg.sender_id === this.currentUser?.id;
                    this.addMessage(msg.content, isMine);
                });
            }
        } catch (err) {
            Logger.error("Error loading chat history:", err);
        }
    }

    private setupFriendActionButtons(): void {
        const inviteBtn = document.getElementById('invite-friend-btn');
        const blockBtn = document.getElementById('block-friend-btn');
        const deleteBtn = document.getElementById('delete-friend-btn');

        if (inviteBtn){
            const newInviteBtn = inviteBtn.cloneNode(true) as HTMLElement;
            inviteBtn.replaceWith(newInviteBtn);

            newInviteBtn.addEventListener('click', () => this.handleInviteFriend());
        }
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

    private async handleGameInvite(senderId: number) {
        if (!this.currentSelectedFriend)
            return;
        // this.wsManager?.emitGame('game-invite', { friendId: senderId, message: 'You have been invited to a game by ' + this.currentUser?.username });
        this.routerManager.navigateTo('game-online');
    }

    private async handleInviteFriend() {
        if (!this.currentSelectedFriend || !this.wsManager)
            return;
        const friendId = this.currentSelectedFriend.nbrId;
        if (friendId == null)
            return;
        const message = 'You have been invited to a game by ' + (this.currentUser?.username ?? 'Someone');
        const toUsername = this.currentSelectedFriend.username ?? undefined;
        if (typeof (window as any).DEBUG_INVITE !== 'undefined' && (window as any).DEBUG_INVITE) {
            console.log('[INVITE_SEND]', { toFriendId: friendId, message });
        }
        this.wsManager.setPendingGameInvite(friendId, message, toUsername);
        this.routerManager.navigateTo('game-online');
        this.wsManager.gameSocket?.emit('request-game-uid', { type: 'remote' });
    }

    private async handleBlockFriend() {
        if (!this.currentSelectedFriend) return;

        console.log("Blocking friend:", this.currentSelectedFriend.nbrId);
        
        try {
            const res = await fetch(this.routerManager.getUrl('/live-chat/block-friend'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: this.currentSelectedFriend.nbrId })
            });

            const data = await res.json();
            if (data.success) {
                console.log("Friend blocked successfully");
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

        console.log("Removing friend:", this.currentSelectedFriend.nbrId);
        try {
            const res = await fetch(this.routerManager.getUrl('/live-chat/remove-friend'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: this.currentSelectedFriend.nbrId })
            });
            const data = await res.json();
            if (data.success) {
                console.log("Friend removed");
                
                this.socialManager?.loadFriendsList(); 
                
                this.currentSelectedFriend = null;
                this.updateProfileView();
            }
        } catch (err) {
            Logger.error("Error removing friend:", err);
        }
    }
}
