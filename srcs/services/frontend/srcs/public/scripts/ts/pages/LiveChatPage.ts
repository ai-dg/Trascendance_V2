import { UIManager } from '../modules/UIManager.js';
import type { User } from '../modules/TypesManager.js';


export class LiveChatPage {
    private uiManager: UIManager;

    constructor(
        uiManager: UIManager
    ) {
        this.uiManager = uiManager;
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

        // Chat Column
        const chatDiv = this.uiManager.createElement('div', 'flex-1 bg-black/60 p-4 flex flex-col min-h-[700px]');

        const messagesDiv = this.uiManager.createElement('div', 'flex-1 overflow-y-auto mb-2 p-2 border border-gray-700 rounded');
        messagesDiv.textContent = 'Chat messages go here...';

        const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2');
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

        addFriendDiv.appendChild(friendInput);
        addFriendDiv.appendChild(sendFriendBtn);

        addFriendBtn.addEventListener('click', () => {
            addFriendDiv.classList.toggle('hidden');
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

        container.appendChild(mainGrid);

        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }



}

