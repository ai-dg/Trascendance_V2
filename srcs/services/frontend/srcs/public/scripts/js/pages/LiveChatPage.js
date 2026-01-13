export class LiveChatPage {
    constructor(uiManager, routerManager, languageManager, generalSocket, onBack, currentUser) {
        this.friendRequests = new Map();
        this.currentUser = null;
        this.currentSelectedFriend = null;
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.languageManager = languageManager;
        this.generalSocket = generalSocket;
        this.onBack = onBack;
        this.currentUser = currentUser;
    }
    t(key) {
        return this.languageManager.t(key);
    }
    render(user) {
        console.log("live-chat for:", user);
        if (this.currentSelectedFriend == null && user != null)
            this.currentSelectedFriend = user;
        const container = this.uiManager.createElement('div', 'retro-container size-full p-8');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-12');
        const title = this.uiManager.createElement('h1', 'retro-title mb-4', 'LIVE CHAT');
        header.appendChild(title);
        container.appendChild(header);
        // Profile Column
        const profileDiv = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 min-h-[700px] flex-shrink-0 w-60');
        profileDiv.style.minHeight = '600px';
        profileDiv.id = 'profile-div';
        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer');
        if (!this.currentSelectedFriend || !this.currentSelectedFriend.avatar)
            avatarImg.src = 'public/avatars/default.png';
        else if (this.currentSelectedFriend.avatar.startsWith('http'))
            avatarImg.src = this.currentSelectedFriend.avatar;
        else
            avatarImg.src = `public/avatars/${this.currentSelectedFriend.avatar}.png`;
        const username = this.uiManager.createElement('p', 'retro-subtitle text-lg text-[#00ffff] font-bold');
        username.textContent = this.currentSelectedFriend ? this.currentSelectedFriend.username : 'USERNAME';
        const btnDiv = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        const deleteBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-red rounded');
        deleteBtn.id = 'delete-friend-btn';
        deleteBtn.textContent = "DELETE FRIEND";
        deleteBtn.className += ' hidden';
        const blockBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-red rounded');
        blockBtn.id = 'block-friend-btn';
        blockBtn.textContent = "BLOCK FRIEND";
        blockBtn.className += ' hidden';
        btnDiv.appendChild(deleteBtn);
        btnDiv.appendChild(blockBtn);
        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(username);
        avatarSection.appendChild(btnDiv);
        profileDiv.appendChild(avatarSection);
        // Chat Column
        const chatDiv = this.uiManager.createElement('div', 'flex flex-col flex-grow bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 min-h-[700px] justify-between');
        chatDiv.style.minWidth = '600px';
        // Main container of chat
        const messagesDiv = this.uiManager.createElement('div', 'flex-1 flex flex-col mb-2');
        // Title
        const messagesTitle = this.uiManager.createElement('div', 'text-[#00ffff] text-sm mb-2 opacity-60');
        messagesTitle.textContent = 'Messages';
        // Field of messages
        const messagesContainer = this.uiManager.createElement('div', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto');
        messagesContainer.style.minHeight = '500px';
        messagesContainer.id = 'messages-div';
        messagesDiv.appendChild(messagesTitle);
        messagesDiv.appendChild(messagesContainer);
        const inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
        const inputField = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
        const sendButton = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendButton.textContent = 'SEND';
        sendButton.addEventListener('click', () => {
            const message = inputField.value.trim();
            if (message === '')
                return;
            this.addMessage(message, true);
        });
        inputDiv.appendChild(inputField);
        inputDiv.appendChild(sendButton);
        chatDiv.appendChild(messagesDiv);
        chatDiv.appendChild(inputDiv);
        // Social Div
        const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/40 backdrop-blur-sm border-2 border-[#9d4edd] rounded-lg flex flex-col py-6 px-4 min-h-[700px]');
        // Social Header
        const socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');
        const socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
        socialHeader.textContent = 'SOCIAL';
        const addFriendBtn = this.uiManager.createElement('button', 'px-2 py-1 text-sm bg-black text-red-500 border border-red-500 rounded');
        addFriendBtn.innerHTML = 'ADD +';
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
        mainGrid.style.alignItems = 'start';
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
    async getUsernameById(id) {
        try {
            const res = await fetch(this.routerManager.getUrl('/auth/username-id'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
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
        this.generalSocket.off('block-friend-status');
        this.generalSocket.off('remove-friend-status');
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
        this.generalSocket.on('block-friend-status', (data) => {
            console.log("Block friend status:", data);
            if (data.success && this.currentUser) {
                this.loadFriendsList(this.currentUser?.id);
            }
            else {
                console.error("Failed to block friend:", data.message);
            }
        });
        this.generalSocket.on('remove-friend-status', (data) => {
            console.log("Remove friend status:", data);
            if (data.success && this.currentUser) {
                this.loadFriendsList(this.currentUser?.id);
            }
            else {
                console.error("Failed to remove friend:", data.message);
            }
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
                const resData = await res.json();
                console.error('Response data:', resData);
                return;
            }
            const data = await res.json();
            console.log("Pending requests response:", data);
            if (data.success && data.requests && data.requests.length > 0) {
                data.requests.forEach((request) => {
                    this.addFriendRequestNotification(request.senderId, request.message);
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
    async displayFriends(friends) {
        const container = document.getElementById('friends-container');
        if (!container) {
            console.error("Friends container not found");
            return;
        }
        const profileDiv = document.getElementById('profile-div');
        if (!profileDiv) {
            console.error("Profile Div not found");
            return;
        }
        container.innerHTML = '';
        for (const friend of friends) {
            const username = friend.username;
            const friendItem = this.uiManager.createElement('div', 'p-2 bg-black/40 border border-[#00ffff]/30 rounded hover:bg-black/60 cursor-pointer transition-colors');
            const friendName = this.uiManager.createElement('p', 'text-[#00ffff] text-sm');
            friendName.textContent = username || `User ${username}`;
            friendItem.addEventListener('click', async () => {
                this.currentSelectedFriend = {
                    username: friend.username,
                    id: friend.id,
                    avatar: friend.avatar,
                    isGuest: false,
                    nbrId: friend.id
                };
                console.log("Selected friend:", friend);
                this.updateProfileView();
                profileDiv.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('hidden');
                });
            });
            friendItem.appendChild(friendName);
            container.appendChild(friendItem);
        }
        ;
        this.setupFriendActionButtons();
    }
    ;
    updateProfileView() {
        const profileDiv = document.getElementById('profile-div');
        if (!profileDiv)
            return;
        const friendImg = profileDiv.querySelector('img');
        const friendPseudo = profileDiv.querySelector('p');
        console.log("Updating profile view for friend:", this.currentSelectedFriend);
        let friend = this.currentSelectedFriend;
        if (!friend) {
            friend = this.currentUser;
            this.currentSelectedFriend = this.currentUser;
        }
        console.log("Using friend for profile view:", this.currentSelectedFriend);
        if (friend && friendImg) {
            if (!friend.avatar)
                friendImg.src = 'public/avatars/default.png';
            else if (friend.avatar.startsWith('http'))
                friendImg.src = friend.avatar;
            else
                friendImg.src = `public/avatars/${friend.avatar}.png`;
        }
        if (friend && friendPseudo) {
            friendPseudo.textContent = friend.username;
        }
        const deleteBtn = document.getElementById('delete-friend-btn');
        const blockBtn = document.getElementById('block-friend-btn');
        if (this.currentSelectedFriend && this.currentUser && this.currentSelectedFriend.id === this.currentUser.id) {
            if (deleteBtn)
                deleteBtn.classList.add('hidden');
            if (blockBtn)
                blockBtn.classList.add('hidden');
        }
    }
    setupFriendActionButtons() {
        const blockBtn = document.getElementById('block-friend-btn');
        const deleteBtn = document.getElementById('delete-friend-btn');
        if (blockBtn) {
            const newBlockBtn = blockBtn.cloneNode(true);
            blockBtn.replaceWith(newBlockBtn);
            newBlockBtn.addEventListener('click', () => {
                if (!this.currentSelectedFriend)
                    return;
                console.log("Blocking friend:", this.currentSelectedFriend.id);
                if (this.generalSocket) {
                    this.generalSocket.emit('block-friend', {
                        friendId: this.currentSelectedFriend.id
                    });
                }
                this.currentSelectedFriend = null;
                this.updateProfileView();
            });
        }
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.replaceWith(newDeleteBtn);
            newDeleteBtn.addEventListener('click', () => {
                if (!this.currentSelectedFriend)
                    return;
                console.log("Removing friend:", this.currentSelectedFriend.id);
                if (this.generalSocket) {
                    this.generalSocket.emit('remove-friend', {
                        friendId: this.currentSelectedFriend.id
                    });
                }
                this.currentSelectedFriend = null;
                this.updateProfileView();
            });
        }
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
    /**********************************************************************************************/
    /**************************************** LIVE-CHAT **************************************/
    /**********************************************************************************************/
    addMessage(text, isMine) {
        const messagesContainer = document.getElementById('messages-div');
        if (!messagesContainer)
            return;
        const wrapper = this.uiManager.createElement('div', `flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`);
        const bubble = this.uiManager.createElement('div', isMine
            ? 'bg-[#ffffff] text-white px-3 py-2 rounded-lg max-w-[70%]'
            : 'bg-white/70 text-[#ffffff] border border-[#00ffff]/40 px-3 py-2 rounded-lg max-w-[70%]');
        bubble.textContent = text;
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
