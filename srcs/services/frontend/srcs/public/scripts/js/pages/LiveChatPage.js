// import { UIManager } from '../modules/UIManager.js';
// import type { User } from '../modules/TypesManager.js';
// import type { LanguageManager } from '../modules/LangManager.js';
// import type { RouterManager } from '../modules/RouterManager.js';
// import { Socket } from "socket.io-client";
export class LiveChatPage {
    constructor(uiManager, routerManager, languageManager, generalSocket, onBack) {
        this.friendRequests = new Map();
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.languageManager = languageManager;
        this.generalSocket = generalSocket;
        this.onBack = onBack;
    }
    t(key) {
        return this.languageManager.t(key);
    }
    render(user) {
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
        const avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer');
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
        const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
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
        // Setup socket listeners immediately
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
                }
                catch (error) {
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
        onlineList.id = 'friends-container';
        const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        onlineTitle.textContent = 'Friends';
        const onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        onlineContent.textContent = 'List of friends goes here...';
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
        const backButton = this.uiManager.createButton(this.t('backToSettings'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4', () => {
            console.log('Back to settings clicked');
            this.onBack();
        });
        backDiv.appendChild(backButton);
        container.appendChild(mainGrid);
        container.append(backDiv);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
        if (user) {
            this.loadFriendsList(user.id);
            this.loadPendingFriendRequests(user.id);
        }
    }
    async getIdByUsername(username) {
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
            }
            else {
                const userId = data.data.user.user_id;
                console.log('User ID found for friend request: ', userId);
                return userId;
            }
        }
        catch (error) {
            console.error("Error:", error);
        }
    }
    setupSocketListeners(errorMessageDiv, friendInput) {
        if (!this.generalSocket) {
            console.log("No generalSocket available");
            return;
        }
        this.generalSocket.off('friend-request');
        this.generalSocket.off('friend-request-status');
        this.generalSocket.off('friend-request-result');
        this.generalSocket.on('friend-request', (data) => {
            console.log("Received friend request:", data);
            const { senderId, message } = data;
            this.addFriendRequestNotification(senderId, message);
        });
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
            }
            else {
                errorMessageDiv.textContent = msg.message || "Failed to send request";
                errorMessageDiv.classList.remove('hidden', 'text-green-500');
                errorMessageDiv.classList.add('text-red-500');
            }
        });
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
    addFriendRequestNotification(senderId, message) {
        if (this.friendRequests.has(senderId)) {
            console.log("Notification already exists for sender:", senderId);
            return;
        }
        const container = document.getElementById('notifications-container');
        if (!container) {
            console.error("Notifications container not found");
            return;
        }
        const notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#ff1493] rounded');
        const notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] text-sm mb-2');
        notifMessage.textContent = message;
        const notifButtons = this.uiManager.createElement('div', 'flex gap-2');
        const acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-green-500 text-black rounded hover:bg-green-400');
        acceptBtn.textContent = 'Accept';
        const rejectBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-red-500 text-black rounded hover:bg-red-400');
        rejectBtn.textContent = 'Reject';
        acceptBtn.addEventListener('click', () => {
            if (this.generalSocket) {
                this.generalSocket.emit('friend-request-response', {
                    senderId,
                    action: 'accept'
                });
            }
            this.removeFriendRequestNotification(senderId);
        });
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
        container.appendChild(notifCard);
        this.friendRequests.set(senderId, { senderId, message, element: notifCard });
        console.log(`Added notification for sender ${senderId}. Total notifications: ${this.friendRequests.size}`);
    }
    removeFriendRequestNotification(senderId) {
        const notification = this.friendRequests.get(senderId);
        if (!notification) {
            console.log("No notification found for sender:", senderId);
            return;
        }
        notification.element.remove();
        this.friendRequests.delete(senderId);
        console.log(`Removed notification for sender ${senderId}. Remaining: ${this.friendRequests.size}`);
    }
    async loadPendingFriendRequests(userId) {
        try {
            console.log("Loading pending friend requests for user:", userId);
            const res = await fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) {
                console.error('Failed to load pending requests:', res.status);
                return;
            }
            const data = await res.json();
            console.log("Pending requests response:", data);
            if (data.success && data.requests && data.requests.length > 0) {
                data.requests.forEach((request) => {
                    this.addFriendRequestNotification(request.senderId, request.message || `User ${request.senderId} wants to be your friend!`);
                });
                console.log(`Loaded ${data.requests.length} pending friend requests`);
            }
            else {
                console.log("No pending friend requests found");
            }
        }
        catch (error) {
            console.error("Error loading pending friend requests:", error);
        }
    }
    async loadFriendsList(userId) {
        try {
            console.log("Loading friends list for user:", userId);
            const res = await fetch(this.routerManager.getUrl('/live-chat/get-friends'), {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) {
                console.error('Failed to load friends:', res.status);
                return;
            }
            const data = await res.json();
            console.log("Friends list response:", data);
            if (data.success && data.friends && data.friends.length > 0) {
                this.displayFriends(data.friends);
                console.log(`Loaded ${data.friends.length} friends`);
            }
            else {
                console.log("No friends found");
                this.displayNoFriends();
            }
        }
        catch (error) {
            console.error("Error loading friends:", error);
        }
    }
    displayFriends(friends) {
        const container = document.getElementById('friends-container');
        if (!container) {
            console.error("Friends container not found");
            return;
        }
        container.innerHTML = '';
        friends.forEach((friend) => {
            const friendItem = this.uiManager.createElement('div', 'p-2 bg-black/40 border border-[#00ffff]/30 rounded hover:bg-black/60 cursor-pointer transition-colors');
            const friendName = this.uiManager.createElement('p', 'text-[#00ffff] text-sm');
            friendName.textContent = friend.username || `User ${friend.friend_id}`;
            friendItem.appendChild(friendName);
            container.appendChild(friendItem);
        });
    }
    displayNoFriends() {
        const container = document.getElementById('friends-container');
        if (!container)
            return;
        container.innerHTML = '';
        const emptyMessage = this.uiManager.createElement('p', 'text-[#00ffff]/50 text-sm italic');
        emptyMessage.textContent = 'No friends yet. Add some!';
        container.appendChild(emptyMessage);
    }
}
