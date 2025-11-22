// import { UIManager } from '../modules/UIManager.js';
// import type { User } from '../modules/TypesManager.js';
// import type { LanguageManager } from '../modules/LangManager.js';
// import type { RouterManager } from '../modules/RouterManager.js';
// import { Socket } from "socket.io-client";


// export class LiveChatPage {
//     private uiManager: UIManager;
//     private routerManager: RouterManager;
//     private languageManager: LanguageManager;
//     private generalSocket: Socket | null;
//     private onBack: () => void;

//     constructor(
//         uiManager: UIManager,
//         routerManager: RouterManager,
//         languageManager: LanguageManager,
//         generalSocket: Socket | null,
//         onBack: () => void
//     ) {
//         this.uiManager = uiManager;
//         this.routerManager = routerManager;
//         this.languageManager = languageManager;
//         this.generalSocket = generalSocket;
//         this.onBack = onBack;
//     }

//     private friendRequests: Map<number, {senderId: number, message: string, element: HTMLElement}> = new Map();

//     private t(key: string): string {
//       return this.languageManager.t(key);
//     }

//     public render(user: User | null): void {
//         console.log("live-chat for:", user);

//         const container = this.uiManager.createElement('div', 'retro-container size-full p-8');

//         // Header
//         const header = this.uiManager.createElement('div', 'text-center mb-12');
//         const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'LIVE CHAT');
//         const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-lg', 'CHAT WITH FRIENDS');
//         header.appendChild(title);
//         header.appendChild(subtitle);
//         container.appendChild(header);

//         // Profile Column
//         const profileDiv = this.uiManager.createElement('div', 'bg-black/60 p-4 min-h-[700px] flex-shrink-0 w-60');
//         profileDiv.textContent = 'User Profile goes here';

//         const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
//         const avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer') as HTMLImageElement;
//         if (!user || !user.avatar)
//             avatarImg.src = 'public/avatars/default.png';
//         else if (user.avatar.startsWith('http'))
//             avatarImg.src = user.avatar;
//         else
//             avatarImg.src = `public/avatars/${user.avatar}.png`;

//         const username = this.uiManager.createElement('p', 'retro-subtitle text-lg text-[#00ffff] font-bold');
//         username.textContent = user ? user.username : 'USERNAME';

//         avatarSection.appendChild(avatarImg);
//         avatarSection.appendChild(username);

//         profileDiv.appendChild(avatarSection);

//         // Chat Column
//         const chatDiv = this.uiManager.createElement('div', 'flex flex-col flex-grow bg-black/60 p-4 min-h-[700px]');

//         const messagesDiv = this.uiManager.createElement('div', 'flex-1 overflow-y-auto mb-2 p-2 border border-gray-700 rounded');
//         messagesDiv.textContent = 'Chat messages go here...';

//         const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
//         const inputField = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
//         const sendButton = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
//         sendButton.textContent = 'Send';

//         inputDiv.appendChild(inputField);
//         inputDiv.appendChild(sendButton);

//         chatDiv.appendChild(messagesDiv);
//         chatDiv.appendChild(inputDiv);

//         // Social Div
//         const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/60 backdrop-blur-md border-l-2 border-[#00ffff] flex flex-col py-6 px-4 min-h-[700px]');
        
//         // Social Header
//         const socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');
//         const socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
//         socialHeader.textContent = 'SOCIAL';

//         const addFriendBtn = this.uiManager.createElement('button', 'px-2 py-1 text-sm bg-black text-red-500 border border-red-500 rounded');
//         addFriendBtn.innerHTML = '+';

//         const addFriendDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 hidden');
//         const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black') as HTMLInputElement;
//         friendInput.placeholder = 'Username';
//         const sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
//         sendFriendBtn.textContent = 'Send';

//         const errorMessageDiv = this.uiManager.createElement('div', 'hidden text-red-500 text-sm mt-2');
//         errorMessageDiv.textContent = 'Error: User not found or already a friend.';

//         addFriendDiv.appendChild(friendInput);
//         addFriendDiv.appendChild(sendFriendBtn);

//         addFriendBtn.addEventListener('click', () => {
//             addFriendDiv.classList.toggle('hidden');
//         });

//         this.setupSocketListeners(errorMessageDiv, friendInput);

//         sendFriendBtn.addEventListener('click', async () => {
//             const username = friendInput.value.trim();

//             if (!username) {
//                 errorMessageDiv.textContent = 'Please enter a username';
//                 errorMessageDiv.classList.remove('hidden');
//             }

//             if (user) {
//                 try {
//                     const senderId = user.id;
//                     const receiverId = await this.getIdByUsername(username);
                
//                     if (!receiverId) {
//                         errorMessageDiv.textContent = "User id not found";
//                         errorMessageDiv.classList.remove('hidden');
//                         return;
//                     }
                
//                     if (this.generalSocket) {
//                         this.generalSocket.emit("add-friend", {
//                             senderId,
//                             receiverId
//                         });
//                     }
//                     console.log("Friend request sent via socket.io!");
//                 } catch (error) {
//                     console.error("Error sending friend request:", error);
//                     errorMessageDiv.textContent = "Failed to send request. Please try again.";
//                     errorMessageDiv.classList.remove('hidden');
//                 }
//             }

//         });

//         socialHeaderWrapper.appendChild(socialHeader);
//         socialHeaderWrapper.appendChild(addFriendBtn);
//         socialDiv.appendChild(socialHeaderWrapper);
//         socialDiv.appendChild(addFriendDiv);

//         const onlineList = this.uiManager.createElement('div', 'w-full mb-6');
//         const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
//         onlineTitle.textContent = 'Online';
//         const onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
//         onlineContent.textContent = 'List of online users goes here...';
//         onlineList.appendChild(onlineTitle);
//         onlineList.appendChild(onlineContent);

        
//         socialDiv.appendChild(onlineList);

//         const notifList = this.uiManager.createElement('div', 'w-full');
//         const notifTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
//         notifTitle.textContent = 'Notifications';
//         const notifContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
//         notifContent.textContent = 'Notifications list goes here...';
        
//         const friendRequestNotifDiv = this.uiManager.createElement('div', 'hidden mt-4 p-3 bg-black/80 border border-[#ff1493] rounded');
//         friendRequestNotifDiv.id = 'friend-request-notification';

//         const notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] mb-3');
//         notifMessage.className = 'notification-message';

//         const notifButtons = this.uiManager.createElement('div', 'flex gap-2');
//         const acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 bg-green-500 text-black rounded hover:bg-green-400');
//         acceptBtn.textContent = 'Accept';
//         acceptBtn.className += ' accept-btn';

//         const rejectBtn = this.uiManager.createElement('button', 'px-3 py-1 bg-red-500 text-black rounded hover:bg-red-400');
//         rejectBtn.textContent = 'Reject';
//         rejectBtn.className += ' reject-btn';

//         acceptBtn.addEventListener('click', () => this.handleAccept());
//         rejectBtn.addEventListener('click', () => this.handleReject());
        
//         notifButtons.appendChild(acceptBtn);
//         notifButtons.appendChild(rejectBtn);
//         friendRequestNotifDiv.appendChild(notifMessage);
//         friendRequestNotifDiv.appendChild(notifButtons);
//         notifList.appendChild(notifTitle);
//         notifList.appendChild(notifContent);
//         notifList.appendChild(friendRequestNotifDiv);
//         socialDiv.appendChild(notifList);

//         // Main Grid
//         const mainGrid = this.uiManager.createElement('div', 'flex justify-center gap-2 w-full');
//         mainGrid.style.alignItems = 'stretch';
//         mainGrid.style.minHeight = '700px';

//         mainGrid.appendChild(profileDiv);
//         mainGrid.appendChild(chatDiv);
//         mainGrid.appendChild(socialDiv);

//         const backDiv = this.uiManager.createElement('div', 'flex justify-center items-center h-screen');

//         // Back button (optional)
//         const backButton = this.uiManager.createButton(
//           this.t('backToSettings'),
//           'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4',
//           () => {
//             console.log('Back to settings clicked');
//             this.onBack();
//           }
//         );

//         backDiv.appendChild(backButton);
//         container.appendChild(mainGrid);
//         container.append(backDiv);

//         this.uiManager.clear();
//         this.uiManager.container.appendChild(container);
//     }

//     private async getIdByUsername(username: string) {
//         try {
//             const res = await fetch(this.routerManager.getUrl('/auth/id-username'), {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ username })
//             });
//             if (!res.ok) {
//                 console.error('Error fetching user data');
//                 return ;
//             }

//             const data = await res.json();

//             if (!data.success) {
//                 console.error('Couldn\'t find username');
//                 return ;
//             } else {
//                 const userId = data.data.user.user_id;
//                 console.log('User ID found for friend request: ', userId);
//                 return userId;
//             }
//         } catch (error) {
//             console.error("Error:", error);
//         }
//     }

//     private setupSocketListeners(errorMessageDiv: HTMLElement, friendInput: HTMLInputElement): void {
//         if (!this.generalSocket) {
//             console.log("No generalSocket available");
//             return;
//         }

//         // Remove old listeners to prevent duplicates
//         this.generalSocket.off('friend-request');
//         this.generalSocket.off('friend-request-status');
//         this.generalSocket.off('friend-request-result');

//         // Listen for incoming friend requests
//         this.generalSocket.on('friend-request', (data) => {
//             console.log("Received friend request:", data);
//             const { senderId, message } = data;
//             this.queueFriendRequest(senderId, message);
//         });

//         // Listen for status of sent requests
//         this.generalSocket.on("friend-request-status", (msg) => {
//             console.log("Friend request status:", msg);

//             if (msg.success) {
//                 errorMessageDiv.textContent = msg.message || "Friend request sent!";
//                 errorMessageDiv.classList.remove('hidden', 'text-red-500');
//                 errorMessageDiv.classList.add('text-green-500');

//                 setTimeout(() => {
//                     errorMessageDiv.classList.add('hidden');
//                     friendInput.value = '';
//                 }, 3000);
//             } else {
//                 errorMessageDiv.textContent = msg.message || "Failed to send request";
//                 errorMessageDiv.classList.remove('hidden', 'text-green-500');
//                 errorMessageDiv.classList.add('text-red-500');
//             }
//         });

//         // Listen for response results
//         this.generalSocket.on('friend-request-result', (data) => {
//             console.log("Friend request result:", data);
//             const { action, message } = data;

//             errorMessageDiv.textContent = message;
//             errorMessageDiv.classList.remove('hidden', 'text-red-500');
//             errorMessageDiv.classList.add(action === 'accept' ? 'text-green-500' : 'text-yellow-500');

//             setTimeout(() => {
//                 errorMessageDiv.classList.add('hidden');
//             }, 5000);
//         });
//     }

//     private queueFriendRequestQueue(senderId: number, message: string): void {
//         this.friendRequestQueue.push({ senderId, message });
        
//         // If no notification is currently showing, show this one
//         if (!this.currentNotification) {
//             this.showNextNotification();
//         }
//     }

//     private showNextNotification(): void {
//         if (this.friendRequestQueue.length === 0) {
//             this.currentNotification = null;
//             return;
//         }

//         const notification = this.friendRequestQueue.shift()!;
//         this.currentNotification = notification;

//         const notifDiv = document.getElementById('friend-request-notification');
//         const messageEl = document.getElementById('notification-message');

//         if (!notifDiv || !messageEl) {
//             console.error("Notification elements not found");
//             return;
//         }

//         messageEl.textContent = notification.message;
//         notifDiv.classList.remove('hidden');
//     }

//     // Handle accept button click
//     private handleAccept(): void {
//         if (!this.currentNotification) return;

//         const senderId = this.currentNotification.senderId;

//         if (this.generalSocket) {
//             this.generalSocket.emit('friend-request-response', {
//                 senderId,
//                 action: 'accept'
//             });
//         }

//         this.hideCurrentNotification();
//     }

//     // Handle reject button click
//     private handleReject(): void {
//         if (!this.currentNotification) return;

//         const senderId = this.currentNotification.senderId;

//         if (this.generalSocket) {
//             this.generalSocket.emit('friend-request-response', {
//                 senderId,
//                 action: 'reject'
//             });
//         }

//         this.hideCurrentNotification();
//     }

//     // Hide current notification and show next
//     private hideCurrentNotification(): void {
//         const notifDiv = document.getElementById('friend-request-notification');
//         if (notifDiv) {
//             notifDiv.classList.add('hidden');
//         }

//         this.currentNotification = null;

//         // Show next notification after a short delay
//         setTimeout(() => {
//             this.showNextNotification();
//         }, 300);
//     }


//     private showFriendRequestNotif(senderId: number, message: string): void {
//         console.log("showFriendRequestNotif called");
        
//         const notifDiv = document.getElementById('friend-request-notification');
//         if (!notifDiv) {
//             console.log("No notifDiv");
//             return ;
//         }
        
//         const messageEl = notifDiv.querySelector('.notification-message');
//         if (messageEl) {
//             messageEl.textContent = message;
//         }

//         notifDiv.classList.remove('hidden');

//         const acceptBtn = notifDiv.querySelector('.accept-btn');
//         const rejectBtn = notifDiv.querySelector('.reject-btn');

//         if (acceptBtn) {
//             acceptBtn.addEventListener('click', async () => {
//                 this.handleFriendRequestResponse(senderId, 'accept');
//                 notifDiv.classList.add('hidden');
//             });
//         }

//         if (rejectBtn) {
//             rejectBtn.addEventListener('click', async () => {
//                 this.handleFriendRequestResponse(senderId, 'reject');
//                 notifDiv.classList.add('hidden');
//             });
//         }
//     }

//     private handleFriendRequestResponse(senderId: number, action: string): void {
//         if (this.generalSocket) {
//             this.generalSocket.emit('friend-request-response', {
//                 senderId,
//                 action
//             });
//         }
//     }


// }



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
    private friendRequests: Map<number, {senderId: number, message: string, element: HTMLElement}> = new Map();

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

        const addFriendDiv = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 hidden');
        const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black') as HTMLInputElement;
        friendInput.placeholder = 'Username';
        const sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendFriendBtn.textContent = 'Send';

        const errorMessageDiv = this.uiManager.createElement('div', 'hidden text-red-500 text-sm mt-2');

        addFriendDiv.appendChild(friendInput);
        addFriendDiv.appendChild(sendFriendBtn);
        addFriendDiv.appendChild(errorMessageDiv);

        addFriendBtn.addEventListener('click', () => {
            addFriendDiv.classList.toggle('hidden');
        });

        // Setup socket listeners
        this.setupSocketListeners(errorMessageDiv, friendInput);

        sendFriendBtn.addEventListener('click', async () => {
            const username = friendInput.value.trim();

            if (!username) {
                errorMessageDiv.textContent = 'Please enter a username';
                errorMessageDiv.classList.remove('hidden', 'text-green-500');
                errorMessageDiv.classList.add('text-red-500');
                return;
            }

            if (user) {
                try {
                    const senderId = user.id;
                    const receiverId = await this.getIdByUsername(username);
                
                    if (!receiverId) {
                        errorMessageDiv.textContent = "User id not found";
                        errorMessageDiv.classList.remove('hidden', 'text-green-500');
                        errorMessageDiv.classList.add('text-red-500');
                        return;
                    }
                
                    if (this.generalSocket) {
                        this.generalSocket.emit("add-friend", {
                            senderId,
                            receiverId
                        });
                    }
                    console.log("Friend request sent via socket.io!");
                } catch (error) {
                    console.error("Error sending friend request:", error);
                    errorMessageDiv.textContent = "Failed to send request. Please try again.";
                    errorMessageDiv.classList.remove('hidden', 'text-green-500');
                    errorMessageDiv.classList.add('text-red-500');
                }
            }
        });

        socialHeaderWrapper.appendChild(socialHeader);
        socialHeaderWrapper.appendChild(addFriendBtn);
        socialDiv.appendChild(socialHeaderWrapper);
        socialDiv.appendChild(addFriendDiv);

        // Online list
        const onlineList = this.uiManager.createElement('div', 'w-full mb-6');
        const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        onlineTitle.textContent = 'Online';
        const onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        onlineContent.textContent = 'List of online users goes here...';
        onlineList.appendChild(onlineTitle);
        onlineList.appendChild(onlineContent);
        socialDiv.appendChild(onlineList);

        // Notifications section
        const notifList = this.uiManager.createElement('div', 'w-full');
        const notifTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        notifTitle.textContent = 'Notifications';
        
        // Container for all friend request notifications
        const notificationsContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto');
        notificationsContainer.id = 'notifications-container';
        
        notifList.appendChild(notifTitle);
        notifList.appendChild(notificationsContainer);
        socialDiv.appendChild(notifList);

        // Main Grid
        const mainGrid = this.uiManager.createElement('div', 'flex justify-center gap-2 w-full');
        mainGrid.style.alignItems = 'stretch';
        mainGrid.style.minHeight = '700px';

        mainGrid.appendChild(profileDiv);
        mainGrid.appendChild(chatDiv);
        mainGrid.appendChild(socialDiv);

        const backDiv = this.uiManager.createElement('div', 'flex justify-center items-center h-screen');

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
                return;
            }

            const data = await res.json();

            if (!data.success) {
                console.error('Couldn\'t find username');
                return;
            } else {
                const userId = data.data.user.user_id;
                console.log('User ID found for friend request: ', userId);
                return userId;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    private setupSocketListeners(errorMessageDiv: HTMLElement, friendInput: HTMLInputElement): void {
        if (!this.generalSocket) {
            console.log("No generalSocket available");
            return;
        }

        // Remove old listeners to prevent duplicates
        this.generalSocket.off('friend-request');
        this.generalSocket.off('friend-request-status');
        this.generalSocket.off('friend-request-result');

        // Listen for incoming friend requests
        this.generalSocket.on('friend-request', (data) => {
            console.log("Received friend request:", data);
            const { senderId, message } = data;
            this.addFriendRequestNotification(senderId, message);
        });

        // Listen for status of sent requests
        this.generalSocket.on("friend-request-status", (msg) => {
            console.log("Friend request status:", msg);

            if (msg.success) {
                errorMessageDiv.textContent = msg.message || "Friend request sent!";
                errorMessageDiv.classList.remove('hidden', 'text-red-500');
                errorMessageDiv.classList.add('text-green-500');

                setTimeout(() => {
                    errorMessageDiv.classList.add('hidden');
                    friendInput.value = '';
                }, 3000);
            } else {
                errorMessageDiv.textContent = msg.message || "Failed to send request";
                errorMessageDiv.classList.remove('hidden', 'text-green-500');
                errorMessageDiv.classList.add('text-red-500');
            }
        });

        // Listen for response results
        this.generalSocket.on('friend-request-result', (data) => {
            console.log("Friend request result:", data);
            const { action, message } = data;

            errorMessageDiv.textContent = message;
            errorMessageDiv.classList.remove('hidden', 'text-red-500');
            errorMessageDiv.classList.add(action === 'accept' ? 'text-green-500' : 'text-yellow-500');

            setTimeout(() => {
                errorMessageDiv.classList.add('hidden');
            }, 5000);
        });
    }

    // Add a friend request notification to the list
    private addFriendRequestNotification(senderId: number, message: string): void {
        // Don't add duplicate notifications
        if (this.friendRequests.has(senderId)) {
            console.log("Notification already exists for sender:", senderId);
            return;
        }

        const container = document.getElementById('notifications-container');
        if (!container) {
            console.error("Notifications container not found");
            return;
        }

        // Create notification card
        const notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#ff1493] rounded');
        
        const notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] text-sm mb-2');
        notifMessage.textContent = message;

        const notifButtons = this.uiManager.createElement('div', 'flex gap-2');
        const acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-green-500 text-black rounded hover:bg-green-400');
        acceptBtn.textContent = 'Accept';

        const rejectBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-red-500 text-black rounded hover:bg-red-400');
        rejectBtn.textContent = 'Reject';
        
        // Handle accept
        acceptBtn.addEventListener('click', () => {
            if (this.generalSocket) {
                this.generalSocket.emit('friend-request-response', {
                    senderId,
                    action: 'accept'
                });
            }
            this.removeFriendRequestNotification(senderId);
        });

        // Handle reject
        rejectBtn.addEventListener('click', () => {
            if (this.generalSocket) {
                this.generalSocket.emit('friend-request-response', {
                    senderId,
                    action: 'reject'
                });
            }
            this.removeFriendRequestNotification(senderId);
        });
        
        notifButtons.appendChild(acceptBtn);
        notifButtons.appendChild(rejectBtn);
        notifCard.appendChild(notifMessage);
        notifCard.appendChild(notifButtons);
        
        // Add to container
        container.appendChild(notifCard);
        
        // Store reference
        this.friendRequests.set(senderId, { senderId, message, element: notifCard });
        
        console.log(`Added notification for sender ${senderId}. Total notifications: ${this.friendRequests.size}`);
    }

    // Remove a friend request notification
    private removeFriendRequestNotification(senderId: number): void {
        const notification = this.friendRequests.get(senderId);
        if (!notification) {
            console.log("No notification found for sender:", senderId);
            return;
        }

        // Remove from DOM
        notification.element.remove();
        
        // Remove from map
        this.friendRequests.delete(senderId);
        
        console.log(`Removed notification for sender ${senderId}. Remaining: ${this.friendRequests.size}`);
    }
}