import { UIManager } from "./UIManager";
import { WebsocketManager } from "./WebsocketManager";
import type { User } from "./TypesManager";
import type { RouterManager } from "./RouterManager";

export class SocialManager {
    private uiManager: UIManager;
    private wsManager: WebsocketManager;
    private routerManager: RouterManager;
    private currentUser: User | null = null;

    private friendRequests: Map<number, {senderId: number, message: string, element: HTMLElement}> = new Map();
    private chatNotifications: Map<number, { senderId: number, element: HTMLElement }> = new Map();
    private getCurrentSelectedFriendId: () => number | null;
    private onFriendSelected: (friendId: number, friendUsername: string) => void;

    constructor(
        uiManager: UIManager,
        routerManager: RouterManager,
        wsManager: WebsocketManager,
        currentUser: User | null,
        getCurrentSelectedFriendId: () => any | null,
        onFriendSelect: (friendId: number, friendUsername: string) => void
    ) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.wsManager = wsManager;
        this.currentUser = currentUser;
        this.getCurrentSelectedFriendId = getCurrentSelectedFriendId;
        this.onFriendSelected = onFriendSelect;
    }

    private isChatOpenWith(sId: number): boolean {
        return this.getCurrentSelectedFriendId() === sId;
    }

    public render(parentElement: HTMLElement): void {
        // Social Div
        const socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/40 backdrop-blur-sm border-2 border-[#9d4edd] rounded-lg flex flex-col py-6 px-4 min-h-[700px]');
        socialDiv.style.minHeight = '480px';

        // Social Header
        const socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');
        const socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
        socialHeader.textContent = 'SOCIAL';

        const addFriendBtn = this.uiManager.createElement('button', 'px-2 py-1 text-sm bg-black text-red-500 border border-red-500 rounded');
        addFriendBtn.innerHTML = 'ADD +';

        const addFriendDiv = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 hidden');
        const friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black') as HTMLInputElement;
        friendInput.placeholder = 'Username';
        friendInput.id = 'friend-input';
        const sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendFriendBtn.textContent = 'Send';

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
                errorMessageDiv.textContent = 'Please enter a username';
                errorMessageDiv.classList.remove('hidden', 'text-green-500');
                errorMessageDiv.classList.add('text-red-500');
                return;
            }

            if (this.currentUser) {
                await this.addFriend(username);
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
        
        // Container for all notifications
        const notificationsContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto');
        notificationsContainer.id = 'notifications-container';
        
        notifList.appendChild(notifTitle);
        notifList.appendChild(notificationsContainer);
        socialDiv.appendChild(notifList);

        parentElement.appendChild(socialDiv);

        this.setupSocketListeners();
        this.loadFriendsList(); 
        this.loadPendingFriendRequests();
        this.syncSocialPanel();
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

    private async getUsernameById(id: string) {
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
            } else {
                console.log
                const username = data.data.user.pseudo;
                console.log('Username found for friend request: ', username);
                return username;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    private async addFriend(username: string): Promise<void> {
        const errorMessageDiv = document.getElementById('error-message-div') as HTMLDivElement;
        const friendInput = document.getElementById('friend-input') as HTMLInputElement;

        try {
            if (this.currentUser) {
                const senderId = this.currentUser.id;
                const receiverId = await this.getIdByUsername(username);
                
                if (!receiverId) {
                    errorMessageDiv.textContent = "User id not found";
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
                    body: JSON.stringify({ senderId, receiverId })
                });
            
                if (!res.ok) {
                    const resData = await res.json();
                    throw new Error(resData.message || 'Failed to send friend request');
                }
            
                const data = await res.json();
                if (!data.success) {
                    throw new Error(data.message || 'Failed to send friend request');
                }
            
                errorMessageDiv.textContent = "Friend request sent!";
                errorMessageDiv.classList.remove('hidden', 'text-red-500');
                errorMessageDiv.classList.add('text-green-500');
                friendInput.value = '';
                console.log("Friend request sent via socket.io!");
            }
        } catch (error) {
            console.error("Error sending friend request:", error);
            errorMessageDiv.textContent = "Failed to send request. Please try again.";
            errorMessageDiv.classList.remove('hidden', 'text-green-500');
            errorMessageDiv.classList.add('text-red-500');
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
            
            notifCard.appendChild(text);
            notifCard.addEventListener('click', () => {
                this.wsManager.clearNotification(notif.senderId);
                this.syncSocialPanel();
                this.onFriendSelected(notif.senderId, notif.username);
            });

            container.appendChild(notifCard);
        });
    }


    private async setupSocketListeners(): Promise<void> {
        const errorMessageDiv = document.getElementById('error-message-div') as HTMLDivElement;
        const friendInput = document.getElementById('friend-input') as HTMLInputElement;

        if (!this.wsManager) {
            console.log("No generalSocket available");
            return;
        }

        const requests = await fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
            method: 'GET',
            credentials: 'include'
        });
        const data = await requests.json();
        if (data.success && data.requests) {
            data.requests.forEach((request: any) => {
                this.addFriendRequestNotification(
                    request.senderId,
                    request.message
                );
            });
            console.log(`Loaded ${data.requests.length} pending friend requests on socket setup`);
        }

        this.wsManager.offGeneral('notifications');

        this.wsManager.onGeneral('notifications', async (data) => {
            console.log("Received notification:", data);
            
            switch (data.type) {
                case 'friend-request':
                    this.addFriendRequestNotification(
                        data.senderId,
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
                    break;
                
                case 'clear-notification':
                    this.removeFriendRequestNotification(data.senderId);
                    break;

                case 'new-message':
                    const sId = Number(data.senderId);
                    if (this.wsManager) {
                        // Use provided username or fetch it
                        const username = data.username || await this.getUsernameById(data.senderId.toString());
                        this.wsManager.saveNotification(sId, username, data.message);
                    }
                    if (!this.isChatOpenWith(sId)) {
                        this.syncSocialPanel();
                    }
                    break;

                default:
                    console.warn("Unknown notification type:", data.type);
                    break;
            }

        });
    }


    private async addFriendRequestNotification(senderId: number, message: string): Promise<void> {
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
        
        acceptBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ senderId: senderId, action: 'accept' })
                });
            } catch (error) {
                console.error("Error accepting friend request:", error);
            }
            this.removeFriendRequestNotification(senderId);
            this.loadFriendsList();
        });

        rejectBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ senderId: senderId, action: 'reject' })
                });
            } catch (error) {
                console.error("Error rejecting friend request:", error);
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

    private removeFriendRequestNotification(senderId: number): void {
        const notification = this.friendRequests.get(senderId);
        if (!notification) {
            console.log("No notification found for sender:", senderId);
            return;
        }

        notification.element.remove();
        
        this.friendRequests.delete(senderId);
        
        console.log(`Removed notification for sender ${senderId}. Remaining: ${this.friendRequests.size}`);
    }

    private async loadPendingFriendRequests(): Promise<void> {
        try {
            // console.log("Loading pending friend requests for user:", userId);
            
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
                data.requests.forEach((request: any) => {
                    this.addFriendRequestNotification(
                        request.senderId,
                        request.message
                    );
                });
                console.log(`Loaded ${data.requests.length} pending friend requests`);
            } else {
                console.log("No pending friend requests found");
            }
        } catch (error) {
            console.error("Error loading pending friend requests:", error);
        }
    }

    public async loadFriendsList(): Promise<void> {
        try {
            // console.log("Loading friends list for user:", userId);
            
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
            } else {
                console.log("No friends found");
                this.displayNoFriends();
            }
        } catch (error) {
            console.error("Error loading friends:", error);
        }
    }

    private displayNoFriends(): void {
        const container = document.getElementById('friends-container');
        if (!container) return;

        container.innerHTML = '';
        const emptyMessage = this.uiManager.createElement('p', 'text-[#00ffff]/50 text-sm italic');
        emptyMessage.textContent = 'No friends yet. Add some!';
        container.appendChild(emptyMessage);
    }
    

    private async displayFriends(friends: any[]): Promise<void> {
        const container = document.getElementById('friends-container');
        if (!container) {
            console.error("Friends container not found");
            return;
        }
    
        container.innerHTML = '';

        for (const friend of friends) {
            const username = friend.username;
        
            const friendItem = this.uiManager.createElement(
                'div',
                'p-2 bg-black/40 border border-[#00ffff]/30 rounded hover:bg-black/60 cursor-pointer transition-colors'
            );
        
            const friendName = this.uiManager.createElement('p', 'text-[#00ffff] text-sm');
            friendName.textContent = username || `User ${username}`;

            const friendId = Number(friend.id);
            friendItem.addEventListener('click', async () => {
                this.wsManager.clearNotification(friendId);
                this.syncSocialPanel();
                
                this.onFriendSelected(friendId, username);
            });
                    
            friendItem.appendChild(friendName);
            container.appendChild(friendItem);
            
        }

        // this.setupFriendActionButtons(); TO DO THAT IN LIVE CHAT PAGE !!!!
    }

}
