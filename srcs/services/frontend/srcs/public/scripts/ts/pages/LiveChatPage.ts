import { UIManager } from '../modules/UIManager.js';
import type { User } from '../modules/TypesManager.js';
import type { LanguageManager } from '../modules/LangManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import { Socket } from "socket.io-client";


export class LiveChatPage {
    private uiManager: UIManager;
    private routerManager: RouterManager;
    private languageManager: LanguageManager;
    private generalSocket: Socket | null;
    private onBack: () => void;

    constructor(
        uiManager: UIManager,
        routerManager: RouterManager,
        languageManager: LanguageManager,
        generalSocket: Socket | null,
        onBack: () => void
    ) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.languageManager = languageManager;
        this.generalSocket = generalSocket;
        this.onBack = onBack;
    }

    private t(key: string): string {
      return this.languageManager.t(key);
    }

    public render(user: User | null): void {
        console.log("live-chat for:", user);

        const container = this.uiManager.createElement('div', 'retro-container size-full p-8');

        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-12');
        const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'LIVE CHAT');
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-lg', 'CHAT WITH FRIENDS');
        header.appendChild(title);
        header.appendChild(subtitle);
        container.appendChild(header);

        // Profile Column
        const profileDiv = this.uiManager.createElement('div', 'bg-black/60 p-4 min-h-[700px] flex-shrink-0 w-60');
        profileDiv.textContent = 'User Profile goes here';

        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer') as HTMLImageElement;
        if (!user || !user.avatar)
            avatarImg.src = 'public/avatars/default.png';
        else if (user.avatar.startsWith('http'))
            avatarImg.src = user.avatar;
        else
            avatarImg.src = `public/avatars/${user.avatar}.png`;

        const username = this.uiManager.createElement('p', 'retro-subtitle text-lg text-[#00ffff] font-bold');
        username.textContent = user ? user.username : 'USERNAME';

        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(username);

        profileDiv.appendChild(avatarSection);

        // Chat Column
        const chatDiv = this.uiManager.createElement('div', 'flex flex-col flex-grow bg-black/60 p-4 min-h-[700px]');

        const messagesDiv = this.uiManager.createElement('div', 'flex-1 overflow-y-auto mb-2 p-2 border border-gray-700 rounded');
        messagesDiv.textContent = 'Chat messages go here...';

        const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
        const inputField = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
        const sendButton = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendButton.textContent = 'Send';

        inputDiv.appendChild(inputField);
        inputDiv.appendChild(sendButton);

        chatDiv.appendChild(messagesDiv);
        chatDiv.appendChild(inputDiv);

        // Social Div
        const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/60 backdrop-blur-md border-l-2 border-[#00ffff] flex flex-col py-6 px-4 min-h-[700px]');
        
        // Social Header
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

        const errorMessageDiv = this.uiManager.createElement('div', 'hidden text-red-500 text-sm mt-2');
        errorMessageDiv.textContent = 'Error: User not found or already a friend.';

        addFriendDiv.appendChild(friendInput);
        addFriendDiv.appendChild(sendFriendBtn);

        addFriendBtn.addEventListener('click', () => {
            addFriendDiv.classList.toggle('hidden');
        });

        sendFriendBtn.addEventListener('click', async () => {
            const username = friendInput.value.trim();

            if (!username) {
                errorMessageDiv.textContent = 'Please enter a username';
                errorMessageDiv.classList.remove('hidden');
            }

            if (user) {
                try {
                    const senderId = user.id;
                    const receiverId = await this.getIdByUsername(username);
                
                    if (!receiverId) {
                        errorMessageDiv.textContent = "User id not found";
                        errorMessageDiv.classList.remove('hidden');
                        return;
                    }
                
                    if (this.generalSocket) {
                    
                        // Listen for backend confirmations
                        this.generalSocket.on("friend-request-status", (msg) => {
                            console.log("Live-chat says:", msg);
                        });
                    
                        // Send request
                        this.generalSocket.emit("add-friend", {
                            senderId,
                            receiverId
                        });
                    }
                
                    console.log("Friend request sent via socket.io!");
                } catch (error) {
                    console.error("Error sending friend request:", error);
                    errorMessageDiv.textContent = "Failed to send request. Please try again.";
                    errorMessageDiv.classList.remove('hidden');
                }
            }

        });

        socialHeaderWrapper.appendChild(socialHeader);
        socialHeaderWrapper.appendChild(addFriendBtn);
        socialDiv.appendChild(socialHeaderWrapper);
        socialDiv.appendChild(addFriendDiv);

        const onlineList = this.uiManager.createElement('div', 'w-full mb-6');
        const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        onlineTitle.textContent = 'Online';
        const onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        onlineContent.textContent = 'List of online users goes here...';
        onlineList.appendChild(onlineTitle);
        onlineList.appendChild(onlineContent);

        
        socialDiv.appendChild(onlineList);

        const notifList = this.uiManager.createElement('div', 'w-full');
        const notifTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        notifTitle.textContent = 'Notifications';
        const notifContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        notifContent.textContent = 'Notifications list goes here...';
        notifList.appendChild(notifTitle);
        notifList.appendChild(notifContent);
        socialDiv.appendChild(notifList);

        // Main Grid
        const mainGrid = this.uiManager.createElement('div', 'flex justify-center gap-2 w-full');
        mainGrid.style.alignItems = 'stretch';
        mainGrid.style.minHeight = '700px';

        mainGrid.appendChild(profileDiv);
        mainGrid.appendChild(chatDiv);
        mainGrid.appendChild(socialDiv);

        const backDiv = this.uiManager.createElement('div', 'flex justify-center items-center h-screen');

        // Back button (optional)
        const backButton = this.uiManager.createButton(
          this.t('backToSettings'),
          'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4',
          () => {
            console.log('Back to settings clicked');
            this.onBack();
          }
        );

        backDiv.appendChild(backButton);
        container.appendChild(mainGrid);
        container.append(backDiv);

        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }

    private async getIdByUsername(username: string) {
        try {
            const res = await fetch(this.routerManager.getUrl('/auth/id-username'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (!res.ok) {
                console.error('Error fetching user data');
                return ;
            }

            const data = await res.json();

            if (!data.success) {
                console.error('Couldn\'t find username');
                return ;
            } else {
                const userId = data.data.user.user_id;
                console.log('User ID found for friend request: ', userId);
                return userId;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }


}

