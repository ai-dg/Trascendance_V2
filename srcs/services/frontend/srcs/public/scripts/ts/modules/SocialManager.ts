import { UIManager } from "./UIManager";
import { WebsocketManager } from "./WebsocketManager";
import type { User } from "./TypesManager";
import type { RouterManager } from "./RouterManager";
import type { LanguageManager } from "./LangManager";
import { Logger } from "./Logger.js";
export class SocialManager {
    private uiManager: UIManager;
    private wsManager: WebsocketManager;
    private routerManager: RouterManager;
    private languageManager: LanguageManager;
    private currentUser: User | null = null;

    private friendRequests: Map<number, {senderId: number, message: string, element: HTMLElement}> = new Map();
    private chatNotifications: Map<number, { senderId: number, element: HTMLElement }> = new Map();
    private pendingGameInvites: Map<string, { element: HTMLElement }> = new Map();
    private static readonly DEBUG_INVITE = false;
    private getCurrentSelectedFriendId: () => number | null;
    private onFriendSelected: (friendId: number, friendUsername: string, friendAvatar?: string | null) => void;
    private onNewMessage: (senderId: number, message: string) => void;
    private onGameInvite: (senderId: number) => void;
    constructor(
        uiManager: UIManager,
        routerManager: RouterManager,
        wsManager: WebsocketManager,
        languageManager: LanguageManager,
        currentUser: User | null,
        getCurrentSelectedFriendId: () => any | null,
        onFriendSelect: (friendId: number, friendUsername: string, friendAvatar?: string | null) => void,
        onNewMessage: (senderId: number, message: string) => void,
        onGameInvite: (senderId: number) => void
    
    ) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.wsManager = wsManager;
        this.languageManager = languageManager;
        this.currentUser = currentUser;
        this.getCurrentSelectedFriendId = getCurrentSelectedFriendId;
        this.onNewMessage = onNewMessage;
        this.onFriendSelected = onFriendSelect;
        this.onGameInvite = onGameInvite;
    }

    private t(key: string): string {
        return this.languageManager.t(key);
    }

    private isChatOpenWith(sId: number): boolean {
        const currentId = this.getCurrentSelectedFriendId();
        return Number(currentId) === sId;
    }

    public async isUserOnline(userId: number): Promise<boolean> {
        console.log("Checking online status for user:", userId);
        const res = await fetch(this.routerManager.getUrl('/live-chat/online'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        console.log("Response received for online status check:", res);
        if (!res.ok) {
            console.info('[SocialManager]', 'Online status check failed for user', userId);
            return false;
        }
        
        const data = await res.json();
        console.log("Parsed JSON result for online status check:", data);
        if (!data || typeof data.online === 'undefined') {
            console.info('[SocialManager]', 'Invalid response format for online status check for user', userId);
            return false;
        }
        if (data.online == true) {
            console.log(`User ${userId} is online`);
            return true;
        } else {
            console.log(`User ${userId} is offline`);
            return false;
        }
    }

    public render(parentElement: HTMLElement): void {
        const isGuest = !this.currentUser || (this.currentUser as any).isGuest === true;

        // Social Div
        const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/40 backdrop-blur-sm border-2 border-[#9d4edd] rounded-lg flex flex-col py-6 px-4 min-h-[700px]');
        socialDiv.style.minHeight = '480px';

        // Social Header
        const socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');
        const socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
        socialHeader.textContent = this.t('social') || 'SOCIAL';
        socialHeaderWrapper.appendChild(socialHeader);

        if (!isGuest) {
            const addFriendBtn = this.uiManager.createElement('div', 'mt-1 px-1');
            const img = this.uiManager.createElement('img', 'w-6 h-6') as HTMLImageElement;
            img.style.width = '25px';
            img.style.height = '25px';
            img.src = 'public/avatars/add.png';
            addFriendBtn.appendChild(img);
        

            const addFriendDiv = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 hidden');
            const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black') as HTMLInputElement;
            friendInput.placeholder = this.t('username') || 'Username';
            friendInput.id = 'friend-input';
            const sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 mb-4 bg-[#00ffff] text-black rounded');
            sendFriendBtn.textContent = this.t('send') || 'Send';

            const errorMessageDiv = this.uiManager.createElement('div', 'hidden text-red-500 text-sm mt-2');
            errorMessageDiv.id = 'error-message-div';

            addFriendDiv.appendChild(friendInput);
            addFriendDiv.appendChild(sendFriendBtn);
            addFriendDiv.appendChild(errorMessageDiv);

            addFriendBtn.addEventListener('click', () => {
                addFriendDiv.classList.toggle('hidden');
            });

            sendFriendBtn.addEventListener('click', async () => {
                const username = friendInput.value.trim();

                if (!username) {
                    errorMessageDiv.textContent = this.t('pleaseEnterUsername') || 'Please enter a username';
                    errorMessageDiv.classList.remove('hidden', 'text-green-500');
                    errorMessageDiv.classList.add('text-red-500');
                    return;
                }

                if (this.currentUser) {
                    await this.addFriend(username);
                }
            });

            socialHeaderWrapper.appendChild(addFriendBtn);
            socialDiv.appendChild(socialHeaderWrapper);
            socialDiv.appendChild(addFriendDiv);
        } else {
            socialDiv.appendChild(socialHeaderWrapper);
        }

        // Online list
        const onlineList = this.uiManager.createElement('div', 'w-full mb-6');
        onlineList.id = 'friends-container';
        const onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        onlineTitle.textContent = this.t('friends') || 'Friends';
        const onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        
        if (isGuest) {
            onlineContent.textContent = this.t('guestSocialDisabled') || 'Social features are not available in guest mode.';
        } else {
            onlineContent.textContent = this.t('friendsListPlaceholder') || 'List of friends goes here...';
        }

        onlineList.appendChild(onlineTitle);
        onlineList.appendChild(onlineContent);
        socialDiv.appendChild(onlineList);

        // Notifications section
        const notifList = this.uiManager.createElement('div', 'w-full');
        const notifTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        notifTitle.textContent = this.t('notifications') || 'Notifications';
        
        // Container for all notifications
        const notificationsContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto');
        notificationsContainer.id = 'notifications-container';

        notifList.appendChild(notifTitle);
        notifList.appendChild(notificationsContainer);
        socialDiv.appendChild(notifList);

        parentElement.appendChild(socialDiv);

        if (!isGuest) {
            this.setupSocketListeners();
            this.loadFriendsList();
            this.loadPendingFriendRequests();
            this.restorePendingGameInvites(notificationsContainer);
            this.syncSocialPanel();
        }
    }

    /** Re-show game invite notifications from persistent store (e.g. after navigating back to Live Chat / Menu).
     * @param container - The notifications container element (required: it may not be in document yet when called from render) */
    private restorePendingGameInvites(container: HTMLElement): void {
        if (!container) return;
        for (const payload of this.wsManager.getPendingReceivedGameInvites()) {
            if (!this.pendingGameInvites.has(payload.inviteId)) {
                this.addGameInviteNotificationToContainer(payload, container);
            }
        }
    }

    private async getIdByUsername(username: string) {
        try {
            const res = await fetch(this.routerManager.getUrl('/auth/id-username'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (!res.ok) {
                console.info('[SocialManager]', 'Fetch user data failed');
                return;
            }

            const data = await res.json();
            if (!data.success) {
                console.info('[SocialManager]','Couldn\'t find username');
                return;
            } else {
                const userId = data.data.user.user_id;
                console.log('User ID found for friend request: ', userId);
                return userId;
            }
        } catch (error) {
            console.info('[SocialManager]', 'Exception:', error);
        }
    }

    private async getUsernameById(id: string) {
        try {
            const res = await fetch(this.routerManager.getUrl('/auth/username-id'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) {
                console.info('[SocialManager]', 'Fetch user data failed');
                return;
            }

            const data = await res.json();

            if (!data.success) {
                console.info('[SocialManager]','Couldn\'t find username');
                return;
            } else {
                Logger.log
                const username = data.data.user.pseudo;
                Logger.log('Username found for friend request: ', username);
                return username;
            }
        } catch (error) {
            console.info('[SocialManager]', 'Exception:', error);
        }
    }

    private async addFriend(username: string): Promise<void> {
        const errorMessageDiv = document.getElementById('error-message-div') as HTMLDivElement;
        const friendInput = document.getElementById('friend-input') as HTMLInputElement;

        const sendFriendBtn = friendInput.nextElementSibling as HTMLButtonElement;
        try {
            if (this.currentUser) {
                if (sendFriendBtn) {
                    sendFriendBtn.disabled = true;
                    sendFriendBtn.textContent = '';
                }

                const senderId = this.currentUser.id;
                const receiverId = await this.getIdByUsername(username);
                const payload = { senderId, receiverId };
                console.log('[ADD_FRIEND_SEND] me.id=', senderId, 'target(receiverId)=', receiverId, 'full payload=', payload);
                
                if (!receiverId) {
                    errorMessageDiv.textContent = this.t('userIdNotFound') || "User id not found";
                    errorMessageDiv.classList.remove('hidden', 'text-green-500');
                    errorMessageDiv.classList.add('text-red-500');
                    return;
                }
                if (Number(receiverId) === Number(this.currentUser.id)) {
                    errorMessageDiv.textContent = this.t('cannotAddSelf') || "You cannot add yourself as a friend";
                    errorMessageDiv.classList.remove('hidden', 'text-green-500');
                    errorMessageDiv.classList.add('text-red-500');
                    return;
                }

                const res = await fetch(this.routerManager.getUrl('/live-chat/friend-request'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                let data;
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    data = await res.json();
                } else {
                    const text = await res.text();
                    Logger.warn("Unexpected server response:", text);
                    data = { message: text || res.statusText };
                }
                if (!data.success) {
                    console.info('[SocialManager]', 'Send friend request failed:', data.message || 'Request failed');
                    errorMessageDiv.textContent = data.message || this.t('requestFailedTryAgain') || "Request failed. Please try again.";
                    errorMessageDiv.classList.remove('hidden', 'text-green-500');
                    errorMessageDiv.classList.add('text-red-500');
                    return;
                }
            
                errorMessageDiv.textContent = this.t('friendRequestSent') || "Friend request sent!";
                errorMessageDiv.classList.remove('hidden', 'text-red-500');
                errorMessageDiv.classList.add('text-green-500');
                friendInput.value = '';
                Logger.log("Friend request sent via socket.io!");
            }
        } catch (error) {
            console.info('[SocialManager]', 'Send friend request failed:', error);
            errorMessageDiv.textContent = this.t('failedSendRequestTryAgain') || "Failed to send request. Please try again.";
            errorMessageDiv.classList.remove('hidden', 'text-green-500');
            errorMessageDiv.classList.add('text-red-500');
        } finally {
            if (sendFriendBtn) {
                sendFriendBtn.disabled = false; 
                sendFriendBtn.textContent = this.t('send') || 'Send';
            }
        }
    }

    public syncSocialPanel(): void {
        const container = document.getElementById('notifications-container');
        if (!container || !this.wsManager) return;

        const chatNotifs = container.querySelectorAll('div[id^="chat-notif-"]');
        chatNotifs.forEach(notif => notif.remove());

        const pending = this.wsManager.getPendingNotifications();
        // Not only chat notifs...
        pending.forEach(notif => {
            const notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#00ffff] rounded cursor-pointer mb-2 hover:bg-black/60');
            notifCard.id = `chat-notif-${notif.senderId}`;

            const text = this.uiManager.createElement('p', 'text-[#00ffff] text-sm');
            text.textContent = `${notif.username}: ${notif.message}`;

            // Added Avatar for profileColumn
            notifCard.appendChild(text);
            notifCard.addEventListener('click', async () => {
                const senderId = Number(notif.senderId);
                this.wsManager.clearNotification(senderId);
                this.syncSocialPanel();

                const avatar = await this.getAvatarById(senderId);
                this.onFriendSelected(senderId, notif.username, avatar);
            });

            container.appendChild(notifCard);
        });
    }

    private async getAvatarById(id: number): Promise<string | null> {
        try {
            const res = await fetch(this.routerManager.getUrl('/auth/username-id'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: String(id) })
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data?.data?.user?.avatar ?? null;
        } catch (error) {
            console.info('[SocialManager]', 'Fetch avatar failed:', error);
            return null;
        }
    }


    private async setupSocketListeners(): Promise<void> {
        // Skip for guests - they don't have social features
        if (!this.currentUser || this.currentUser.isGuest) {
            return;
        }

        const errorMessageDiv = document.getElementById('error-message-div') as HTMLDivElement;
        const friendInput = document.getElementById('friend-input') as HTMLInputElement;

        if (!this.wsManager) {
            Logger.log("No generalSocket available");
            return;
        }

        try {
            const requests = await fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
                method: 'GET',
                credentials: 'include'
            });

            if (requests.ok) {
                const data = await requests.json();
                if (data.success && data.requests) {
                    data.requests.forEach((request: any) => {
                        this.addFriendRequestNotification(
                            request.senderId,
                            request.message
                        );
                    });
                    Logger.log(`Loaded ${data.requests.length} pending friend requests on socket setup`);
                }
            }
        } catch (error) {
            // Silently handle errors
        }

        this.wsManager.offGeneral('notifications');

        this.wsManager.onGeneral('notifications', async (data) => {
            console.log("Received notification:", data);
            if (data.type === 'friend-request' || data.type === 'friend-request-accepted') {
                console.log('[ADD_FRIEND_RECV] event=', data.type, 'payload=', data);
            }
            
            switch (data.type) {
                case 'friend-request':
                    this.addFriendRequestNotification(
                        data.userId,
                        data.message
                    );
                    break;

                case 'friend-request-accepted':
                    if (this.currentUser) {
                        this.loadFriendsList();
                    }
                    break;

                case 'friend-removed':
                    if (this.currentUser) {
                        this.loadFriendsList();
                    }
                    const removerId = Number(data.userId);
                    if (this.isChatOpenWith(removerId)) {
                        if (this.onNewMessage) this.onNewMessage(removerId, "🚫 " + (this.t('blockedOrUnfriended') || "You have been blocked or unfriended."));
                    }
                    break;

                case 'clear-notification':
                    this.removeFriendRequestNotification(data.senderId);
                    break;

                case 'new-message':
                    const sId = Number(data.senderId);
                    const username = data.username || await this.getUsernameById(data.senderId.toString());
                    if (this.isChatOpenWith(sId)) {
                        Logger.debug("New message from open chat:", data.message);
                        if (this.onNewMessage) this.onNewMessage(sId, data.message);
                        this.markMessageAsRead(sId);
                    } else {
                        Logger.debug("New message notification for closed chat from user:", sId);
                        if (this.wsManager)
                            this.wsManager.saveNotification(sId, username, data.message);
                        this.syncSocialPanel();
                    }
                    break;

                case 'message-read':
                    const readerId = Number(data.readerId);
                    if (this.isChatOpenWith(readerId)) {
                        this.updateReadStatus();
                    }
                    break;

                case 'friend-blocked':
                    if (this.currentUser) {
                        this.loadFriendsList();
                    }
                    Logger.debug("User blocked notification for user:", data.friendId);
                    const blockedId = Number(data.friendId);
                    if (this.isChatOpenWith(blockedId)) {
                        if (this.onNewMessage) this.onNewMessage(blockedId, "🚫 " + (this.t('youBlockedThisUser') || "You blocked this user."));
                    }
                    break;

                case 'unblocked':
                    if (this.currentUser) {
                        this.loadFriendsList();
                    }
                    console.log("User unblocked notification for user:", data.friendId);
                    break;

                case 'game-invite':
                    if (SocialManager.DEBUG_INVITE) console.log('[INVITE_RECV]', data);
                    this.wsManager.addPendingReceivedGameInvite(data);
                    this.addGameInviteNotification(data);
                    break;
                case 'game-invite-accepted':
                    if (SocialManager.DEBUG_INVITE) console.log('[INVITE_ACCEPT]', data);
                    this.handleGameInviteAccepted(data);
                    break;
                case 'game-invite-declined':
                    if (SocialManager.DEBUG_INVITE) console.log('[INVITE_DECLINE]', data);
                    this.handleGameInviteDeclined(data);
                    break;

                case 'typing':
                    const typingId = Number(data.senderId);
                    if (this.isChatOpenWith(typingId)) {
                        if (this.onTyping) this.onTyping(typingId);
                    }
                    break;

                default:
                    console.info('[SocialManager]',"Unknown notification type:", data.type);
                    break;
            }

        });
    }

    public updateReadStatus(): void {
        const icons = document.querySelectorAll('.message-status-icon');
        icons.forEach(icon => {
            (icon as HTMLElement).style.color = '#00ffff';
        });
    }

    public async markMessageAsRead(senderId: number): Promise<void> {
        try {
            await fetch(this.routerManager.getUrl('/live-chat/is-read'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId })
            });
        } catch (error) {
            console.info('[SocialManager]', 'Mark message as read failed:', error);
        }
    }

    public onTyping?:(senderId: number) => void;

    private isTypingCooldown: boolean = false;

    public async sendTypingSignal(friendId: number): Promise<void> {
        if (this.isTypingCooldown) return;
        this.isTypingCooldown = true;
        setTimeout(() => {
            this.isTypingCooldown = false;
        }, 3000);
        try {
            await fetch(this.routerManager.getUrl('/live-chat/typing'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: friendId })
            });
        } catch (error) {
            console.info('[SocialManager]', 'Send typing signal failed:', error);
        }
    }


    private async addFriendRequestNotification(senderId: number, message: string): Promise<void> {
        if (this.friendRequests.has(senderId)) {
            Logger.log("Notification already exists for sender:", senderId);
            return;
        }

        const container = document.getElementById('notifications-container');
        if (!container) {
            console.info('[SocialManager]',"Notifications container not found");
            return;
        }

        const notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#ff1493] rounded');

        const notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] text-sm mb-2');
        notifMessage.textContent = message;

        const notifButtons = this.uiManager.createElement('div', 'flex gap-2');
        const acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-green-500 text-black rounded hover:bg-green-400') as HTMLButtonElement;
        acceptBtn.textContent = this.t('accept') || 'Accept';

        const rejectBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-red-500 text-black rounded hover:bg-red-400') as HTMLButtonElement;
        rejectBtn.textContent = this.t('reject') || 'Reject';
        
        acceptBtn.addEventListener('click', async () => {
            acceptBtn.disabled = true;
            rejectBtn.disabled = true;
            try {
                const res = await fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ senderId: senderId, action: 'accept' })
                });
                if (!res.ok) {
                    console.info('[SocialManager]', 'Accept friend request failed:', res.status);
                    acceptBtn.disabled = false;
                    rejectBtn.disabled = false;
                    return;
                }
                this.removeFriendRequestNotification(senderId);
                this.loadFriendsList();
            } catch (err) {
                console.info('[SocialManager]', 'Accept friend request failed:', err);
                acceptBtn.disabled = false;
                rejectBtn.disabled = false;
            }
        });

        rejectBtn.addEventListener('click', async () => {
            try {
                Logger.debug(`Rejecting friend request from sender ${senderId}`);
                const res = await fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ senderId: senderId, action: 'reject' })
                });
                let data;
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await res.json();
                } else {
                    data = { message: await res.text() };
                }

                if (!res.ok || (data && !data.success)) {
                    console.info('[SocialManager]', 'Reject friend request failed:', data?.message || res.status);
                    return;
                }
                this.removeFriendRequestNotification(senderId);
                this.syncSocialPanel();
            } catch (err) {
                console.info('[SocialManager]', 'Reject friend request failed:', err);
            }
        });

        notifButtons.appendChild(acceptBtn);
        notifButtons.appendChild(rejectBtn);
        notifCard.appendChild(notifMessage);
        notifCard.appendChild(notifButtons);

        container.appendChild(notifCard);

        this.friendRequests.set(senderId, { senderId, message, element: notifCard });
        
        console.log(`Added notification for sender ${senderId}. Total notifications: ${this.friendRequests.size}`);
    }

    private addGameInviteNotification(data: { inviteId: string; fromUserId: number; toUserId: number; gameUUID: string; fromUsername?: string | null; message?: string | null }): void {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        this.addGameInviteNotificationToContainer(data, container);
    }

    private addGameInviteNotificationToContainer(data: { inviteId: string; fromUserId: number; toUserId: number; gameUUID: string; fromUsername?: string | null; message?: string | null }, container: HTMLElement): void {
        const { inviteId, fromUsername, message } = data;
        if (this.pendingGameInvites.has(inviteId)) return;
        const text = message || (fromUsername ? `${fromUsername} ${this.t('invitedYouToPlay') || 'invited you to play'}` : (this.t('invitedToGame') || 'You were invited to a game'));
        const notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#ff1493] rounded');
        const notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] text-sm mb-2');
        notifMessage.textContent = text;
        const notifButtons = this.uiManager.createElement('div', 'flex gap-2');
        const acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-green-500 text-black rounded hover:bg-green-400') as HTMLButtonElement;
        acceptBtn.textContent = this.t('accept') || 'Accept';
        const declineBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-red-500 text-black rounded hover:bg-red-400') as HTMLButtonElement;
        declineBtn.textContent = this.t('decline') || 'Decline';
        acceptBtn.addEventListener('click', () => {
            acceptBtn.disabled = true;
            declineBtn.disabled = true;
            this.wsManager.emitGeneral('game-invite-accept', { inviteId });
            this.wsManager.removePendingReceivedGameInvite(inviteId);
            this.removeGameInviteNotification(inviteId);
        });
        declineBtn.addEventListener('click', () => {
            acceptBtn.disabled = true;
            declineBtn.disabled = true;
            this.wsManager.emitGeneral('game-invite-decline', { inviteId });
            this.wsManager.removePendingReceivedGameInvite(inviteId);
            this.removeGameInviteNotification(inviteId);
        });
        notifButtons.appendChild(acceptBtn);
        notifButtons.appendChild(declineBtn);
        notifCard.appendChild(notifMessage);
        notifCard.appendChild(notifButtons);
        container.appendChild(notifCard);
        this.pendingGameInvites.set(inviteId, { element: notifCard });
    }

    private removeGameInviteNotification(inviteId: string): void {
        const entry = this.pendingGameInvites.get(inviteId);
        if (entry) {
            entry.element.remove();
            this.pendingGameInvites.delete(inviteId);
        }
    }

    private showToast(message: string, durationMs: number = 4000): void {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        const el = this.uiManager.createElement('div', 'p-2 bg-black/90 border border-[#00ffff] rounded text-[#00ffff] text-sm');
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => el.remove(), durationMs);
    }

    private handleGameInviteAccepted(data: { inviteId: string; fromUserId: number; toUserId: number; gameUUID: string }): void {
        const myId = this.currentUser ? Number(this.currentUser.id) : null;
        if (myId === null) return;
        this.wsManager.removePendingReceivedGameInvite(data.inviteId);
        if (myId === Number(data.toUserId)) {
            this.routerManager.navigateTo('game-online', { joinGameUUID: data.gameUUID });
        } else if (myId === Number(data.fromUserId)) {
            this.showToast(this.t('inviteAcceptedWaiting') || 'Invite accepted! Waiting for opponent...');
        }
    }

    private handleGameInviteDeclined(data: { inviteId: string; fromUserId: number; toUserId: number }): void {
        const myId = this.currentUser ? Number(this.currentUser.id) : null;
        if (myId !== null && myId === Number(data.fromUserId)) {
            this.showToast(this.t('inviteDeclined') || 'Invite declined.');
            window.dispatchEvent(new CustomEvent('game-invite-declined'));
        }
    }

    private removeFriendRequestNotification(senderId: number): void {
        const notification = this.friendRequests.get(senderId);
        if (!notification) {
            Logger.log("No notification found for sender:", senderId);
            return;
        }

        notification.element.remove();

        this.friendRequests.delete(senderId);

        Logger.log(`Removed notification for sender ${senderId}. Remaining: ${this.friendRequests.size}`);
    }

    private async loadPendingFriendRequests(): Promise<void> {
        // Skip for guests - they don't have friend requests
        if (!this.currentUser || this.currentUser.isGuest) {
            return;
        }

        try {
            // console.log("Loading pending friend requests for user:", userId);

            const res = await fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) {
                console.info('[SocialManager]','Failed to load pending requests:', res.status);
                const resData = await res.json();
                console.info('[SocialManager]','Response data:', resData);
                return;
            }

            const data = await res.json();
            Logger.log("Pending requests response:", data);

            if (data.success && data.requests && data.requests.length > 0) {
                data.requests.forEach((request: any) => {
                    this.addFriendRequestNotification(
                        request.senderId,
                        request.message
                    );
                });
                Logger.log(`Loaded ${data.requests.length} pending friend requests`);
            } else {
                Logger.log("No pending friend requests found");
            }
        } catch (error) {
            console.info('[SocialManager]', 'Load pending friend requests failed:', error);
        }
    }

    public async loadFriendsList(): Promise<void> {
        // Skip for guests - they don't have friends list
        if (!this.currentUser || this.currentUser.isGuest) {
            this.displayNoFriends();
            return;
        }

        try {
            // console.log("Loading friends list for user:", userId);

            const res = await fetch(this.routerManager.getUrl('/live-chat/get-friends'), {
                method: 'GET',
                credentials: 'include'
            });

            if (!res.ok) {
                console.info('[SocialManager]','Failed to load friends:', res.status);
                return;
            }

            const data = await res.json();
            Logger.log("Friends list response:", data);

            if (data.success && data.friends && data.friends.length > 0) {
                const friendIds = data.friends.map((f: any) => f.id);
                console.log('[ADD_FRIEND_STATE] about to display friends, ids=', friendIds, 'me.id=', this.currentUser?.id);
                this.displayFriends(data.friends);
                Logger.log(`Loaded ${data.friends.length} friends`);
            } else {
                Logger.log("No friends found");
                this.displayNoFriends();
            }
        } catch (error) {
            console.info('[SocialManager]', 'Load friends failed:', error);
        }
    }

    private displayNoFriends(): void {
        const container = document.getElementById('friends-container');
        if (!container) return;

        container.innerHTML = '';
        const emptyMessage = this.uiManager.createElement('p', 'text-[#00ffff]/50 text-sm italic');
        emptyMessage.textContent = this.t('noFriendsYet') || 'No friends yet. Add some!';
        container.appendChild(emptyMessage);
    }


    private async displayFriends(friends: any[]): Promise<void> {
        const container = document.getElementById('friends-container');
        if (!container) {
            console.info('[SocialManager]',"Friends container not found");
            return;
        }

        container.innerHTML = '';

        const myId = this.currentUser ? Number(this.currentUser.id) : null;
        for (const friend of friends) {
            const friendIdNum = Number(friend.id);
            if (myId !== null && friendIdNum === myId) {
                console.info('[SocialManager]','[ADD_FRIEND_STATE] Skipping self in friends list (guard)');
                continue;
            }
            const username = friend.username;

            const friendItem = this.uiManager.createElement(
                'div',
                'p-2 bg-black/40 border border-[#00ffff]/30 rounded hover:bg-black/60 cursor-pointer transition-colors'
            );

            const friendName = this.uiManager.createElement('p', 'text-[#00ffff] text-sm');
            friendName.textContent = username || `${this.t('user') || 'User'} ${username}`;

            const friendId = friendIdNum;
            const online = await this.isUserOnline(friend.id);
            if (online) {
                friendName.textContent += ` (${this.t('online') || 'Online'})`;
            }
            friendItem.addEventListener('click', async () => {
                this.wsManager.clearNotification(friendId);
                this.syncSocialPanel();

                this.onFriendSelected(friendId, username, friend.avatar);
            });

            friendItem.appendChild(friendName);
            container.appendChild(friendItem);

        }

        // this.setupFriendActionButtons(); TO DO THAT IN LIVE CHAT PAGE !!!!
    }

}
