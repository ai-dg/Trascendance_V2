"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveChatPage = void 0;
var LiveChatPage = /** @class */ (function () {
    function LiveChatPage(uiManager, routerManager, languageManager, wsManager, onBack, currentUser) {
        this.wsManager = null;
        this.friendRequests = new Map();
        this.currentUser = null;
        this.currentSelectedFriend = null;
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.languageManager = languageManager;
        this.wsManager = wsManager;
        this.onBack = onBack;
        this.currentUser = currentUser;
    }
    LiveChatPage.prototype.t = function (key) {
        return this.languageManager.t(key);
    };
    LiveChatPage.prototype.setWebsocketManager = function (manager) {
        this.wsManager = manager;
        var errorMessageDiv = document.getElementById('error-message-div');
        var friendInput = document.getElementById('friend-input');
        this.setupSocketListeners(errorMessageDiv, friendInput);
    };
    LiveChatPage.prototype.render = function (user) {
        var _this = this;
        console.log("live-chat for:", user);
        if (this.currentSelectedFriend == null && user != null)
            this.currentSelectedFriend = user;
        var container = this.uiManager.createElement('div', 'retro-container size-full p-8');
        // Header
        var header = this.uiManager.createElement('div', 'text-center mb-12');
        var title = this.uiManager.createElement('h1', 'retro-title mb-4', 'LIVE CHAT');
        header.appendChild(title);
        container.appendChild(header);
        // Profile Column
        var profileDiv = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-4 min-h-[700px] flex-shrink-0 w-60');
        profileDiv.style.minHeight = '600px';
        profileDiv.id = 'profile-div';
        var avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        var avatarImg = this.uiManager.createElement('img', 'w-12 h-12 rounded-full border-2 border-[#ff1493] cursor-pointer');
        if (!this.currentSelectedFriend || !this.currentSelectedFriend.avatar)
            avatarImg.src = 'public/avatars/default.png';
        else if (this.currentSelectedFriend.avatar.startsWith('http'))
            avatarImg.src = this.currentSelectedFriend.avatar;
        else
            avatarImg.src = "public/avatars/".concat(this.currentSelectedFriend.avatar, ".png");
        var username = this.uiManager.createElement('p', 'retro-subtitle text-lg text-[#00ffff] font-bold');
        username.textContent = this.currentSelectedFriend ? this.currentSelectedFriend.username : 'USERNAME';
        var btnDiv = this.uiManager.createElement('div', 'flex flex-col items-center gap-2 mt-2');
        var deleteBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-red rounded');
        deleteBtn.id = 'delete-friend-btn';
        deleteBtn.textContent = "DELETE FRIEND";
        deleteBtn.className += ' hidden';
        var blockBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-red rounded');
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
        var chatDiv = this.uiManager.createElement('div', 'flex flex-col flex-grow bg-black/40 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 min-h-[700px] justify-between');
        chatDiv.style.minWidth = '600px';
        // Main container of chat
        var messagesDiv = this.uiManager.createElement('div', 'flex-1 flex flex-col mb-2');
        // Title
        var messagesTitle = this.uiManager.createElement('div', 'text-[#00ffff] text-sm mb-2 opacity-60');
        messagesTitle.textContent = 'Messages';
        // Field of messages
        var messagesContainer = this.uiManager.createElement('div', 'flex-1 bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-4 overflow-y-auto');
        messagesContainer.style.minHeight = '500px';
        messagesContainer.id = 'messages-div';
        messagesDiv.appendChild(messagesTitle);
        messagesDiv.appendChild(messagesContainer);
        var inputDiv = this.uiManager.createElement('div', 'flex gap-2 mt-2 flex-shrink-0');
        var inputField = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
        var sendButton = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendButton.textContent = 'SEND';
        sendButton.addEventListener('click', function () {
            var message = inputField.value.trim();
            if (message === '')
                return;
            _this.addMessage(message, true);
        });
        inputDiv.appendChild(inputField);
        inputDiv.appendChild(sendButton);
        chatDiv.appendChild(messagesDiv);
        chatDiv.appendChild(inputDiv);
        // Social Div
        var socialDiv = this.uiManager.createElement('div', 'w-80 bg-black/40 backdrop-blur-sm border-2 border-[#9d4edd] rounded-lg flex flex-col py-6 px-4 min-h-[700px]');
        // Social Header
        var socialHeaderWrapper = this.uiManager.createElement('div', 'flex items-center justify-between mb-4');
        var socialHeader = this.uiManager.createElement('h3', 'retro-text text-xl text-[#00ffff]');
        socialHeader.textContent = 'SOCIAL';
        var addFriendBtn = this.uiManager.createElement('button', 'px-2 py-1 text-sm bg-black text-red-500 border border-red-500 rounded');
        addFriendBtn.innerHTML = 'ADD +';
        var addFriendDiv = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 hidden');
        var friendInput = this.uiManager.createElement('input', 'flex-1 p-2 rounded text-black');
        friendInput.placeholder = 'Username';
        friendInput.id = 'friend-input';
        var sendFriendBtn = this.uiManager.createElement('button', 'px-4 py-2 bg-[#00ffff] text-black rounded');
        sendFriendBtn.textContent = 'Send';
        var errorMessageDiv = this.uiManager.createElement('div', 'hidden text-red-500 text-sm mt-2');
        errorMessageDiv.id = 'error-message-div';
        addFriendDiv.appendChild(friendInput);
        addFriendDiv.appendChild(sendFriendBtn);
        addFriendDiv.appendChild(errorMessageDiv);
        addFriendBtn.addEventListener('click', function () {
            addFriendDiv.classList.toggle('hidden');
        });
        // Setup socket listeners immediately
        this.setupSocketListeners(errorMessageDiv, friendInput);
        sendFriendBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
            var username, senderId, receiverId, res, resData, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = friendInput.value.trim();
                        if (!username) {
                            errorMessageDiv.textContent = 'Please enter a username';
                            errorMessageDiv.classList.remove('hidden', 'text-green-500');
                            errorMessageDiv.classList.add('text-red-500');
                            return [2 /*return*/];
                        }
                        if (!user) return [3 /*break*/, 8];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        senderId = user.id;
                        return [4 /*yield*/, this.getIdByUsername(username)];
                    case 2:
                        receiverId = _a.sent();
                        if (!receiverId) {
                            errorMessageDiv.textContent = "User id not found";
                            errorMessageDiv.classList.remove('hidden', 'text-green-500');
                            errorMessageDiv.classList.add('text-red-500');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/friend-request'), {
                                method: 'POST',
                                credentials: 'include',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ senderId: senderId, receiverId: receiverId })
                            })];
                    case 3:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, res.json()];
                    case 4:
                        resData = _a.sent();
                        throw new Error(resData.message || 'Failed to send friend request');
                    case 5: return [4 /*yield*/, res.json()];
                    case 6:
                        data = _a.sent();
                        if (!data.success) {
                            throw new Error(data.message || 'Failed to send friend request');
                        }
                        errorMessageDiv.textContent = "Friend request sent!";
                        errorMessageDiv.classList.remove('hidden', 'text-red-500');
                        errorMessageDiv.classList.add('text-green-500');
                        friendInput.value = '';
                        console.log("Friend request sent via socket.io!");
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Error sending friend request:", error_1);
                        errorMessageDiv.textContent = "Failed to send request. Please try again.";
                        errorMessageDiv.classList.remove('hidden', 'text-green-500');
                        errorMessageDiv.classList.add('text-red-500');
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); });
        socialHeaderWrapper.appendChild(socialHeader);
        socialHeaderWrapper.appendChild(addFriendBtn);
        socialDiv.appendChild(socialHeaderWrapper);
        socialDiv.appendChild(addFriendDiv);
        // Online list
        var onlineList = this.uiManager.createElement('div', 'w-full mb-6');
        onlineList.id = 'friends-container';
        var onlineTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        onlineTitle.textContent = 'Friends';
        var onlineContent = this.uiManager.createElement('div', 'text-[#00ffff] opacity-80');
        onlineContent.textContent = 'List of friends goes here...';
        onlineList.appendChild(onlineTitle);
        onlineList.appendChild(onlineContent);
        socialDiv.appendChild(onlineList);
        // Notifications section
        var notifList = this.uiManager.createElement('div', 'w-full');
        var notifTitle = this.uiManager.createElement('h4', 'retro-text text-lg text-[#00ffff] mb-2');
        notifTitle.textContent = 'Notifications';
        // Container for all friend request notifications
        var notificationsContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 mt-2 max-h-96 overflow-y-auto');
        notificationsContainer.id = 'notifications-container';
        notifList.appendChild(notifTitle);
        notifList.appendChild(notificationsContainer);
        socialDiv.appendChild(notifList);
        // Main Grid
        var mainGrid = this.uiManager.createElement('div', 'flex justify-center gap-2 w-full');
        mainGrid.style.alignItems = 'start';
        mainGrid.appendChild(profileDiv);
        mainGrid.appendChild(chatDiv);
        mainGrid.appendChild(socialDiv);
        var backDiv = this.uiManager.createElement('div', 'flex justify-center items-center h-screen');
        var backButton = this.uiManager.createButton(this.t('backToSettings'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4', function () {
            console.log('Back to settings clicked');
            _this.onBack();
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
    };
    LiveChatPage.prototype.getIdByUsername = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, userId, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/id-username'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: username })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            console.error('Error fetching user data');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        if (!data.success) {
                            console.error('Couldn\'t find username');
                            return [2 /*return*/];
                        }
                        else {
                            userId = data.data.user.user_id;
                            console.log('User ID found for friend request: ', userId);
                            return [2 /*return*/, userId];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Error:", error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LiveChatPage.prototype.getUsernameById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, userId, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/auth/username-id'), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: id })
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            console.error('Error fetching user data');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        if (!data.success) {
                            console.error('Couldn\'t find username');
                            return [2 /*return*/];
                        }
                        else {
                            userId = data.data.user.user_id;
                            console.log('User ID found for friend request: ', userId);
                            return [2 /*return*/, userId];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Error:", error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LiveChatPage.prototype.setupSocketListeners = function (errorMessageDiv, friendInput) {
        return __awaiter(this, void 0, void 0, function () {
            var requests, data;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.wsManager) {
                            console.log("No generalSocket available");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        requests = _a.sent();
                        return [4 /*yield*/, requests.json()];
                    case 2:
                        data = _a.sent();
                        if (data.success && data.requests) {
                            data.requests.forEach(function (request) {
                                _this.addFriendRequestNotification(request.senderId, request.message);
                            });
                            console.log("Loaded ".concat(data.requests.length, " pending friend requests on socket setup"));
                        }
                        this.wsManager.offGeneral('notifications');
                        this.wsManager.onGeneral('notifications', function (data) {
                            console.log("Received notification:", data);
                            switch (data.type) {
                                case 'friend-request':
                                    _this.addFriendRequestNotification(data.senderId, data.message);
                                    break;
                                case 'friend-request-accepted':
                                    if (_this.currentUser) {
                                        _this.loadFriendsList(_this.currentUser.id);
                                    }
                                    break;
                                case 'friend-removed':
                                    if (_this.currentUser) {
                                        _this.loadFriendsList(_this.currentUser.id);
                                    }
                                    break;
                                case 'clear-notification':
                                    _this.removeFriendRequestNotification(data.senderId);
                                    break;
                                default:
                                    console.warn("Unknown notification type:", data.type);
                                    break;
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    LiveChatPage.prototype.addFriendRequestNotification = function (senderId, message) {
        return __awaiter(this, void 0, void 0, function () {
            var container, notifCard, notifMessage, notifButtons, acceptBtn, rejectBtn;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.friendRequests.has(senderId)) {
                    console.log("Notification already exists for sender:", senderId);
                    return [2 /*return*/];
                }
                container = document.getElementById('notifications-container');
                if (!container) {
                    console.error("Notifications container not found");
                    return [2 /*return*/];
                }
                notifCard = this.uiManager.createElement('div', 'p-3 bg-black/80 border border-[#ff1493] rounded');
                notifMessage = this.uiManager.createElement('p', 'text-[#00ffff] text-sm mb-2');
                notifMessage.textContent = message;
                notifButtons = this.uiManager.createElement('div', 'flex gap-2');
                acceptBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-green-500 text-black rounded hover:bg-green-400');
                acceptBtn.textContent = 'Accept';
                rejectBtn = this.uiManager.createElement('button', 'px-3 py-1 text-xs bg-red-500 text-black rounded hover:bg-red-400');
                rejectBtn.textContent = 'Reject';
                acceptBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                    var res, error_4;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ senderId: senderId, action: 'accept' })
                                    })];
                            case 1:
                                res = _b.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                error_4 = _b.sent();
                                console.error("Error accepting friend request:", error_4);
                                return [3 /*break*/, 3];
                            case 3:
                                this.removeFriendRequestNotification(senderId);
                                this.loadFriendsList((_a = this.currentUser) === null || _a === void 0 ? void 0 : _a.id);
                                return [2 /*return*/];
                        }
                    });
                }); });
                rejectBtn.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                    var res, error_5;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/friend-request-response'), {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({ senderId: senderId, action: 'reject' })
                                    })];
                            case 1:
                                res = _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                error_5 = _a.sent();
                                console.error("Error rejecting friend request:", error_5);
                                return [3 /*break*/, 3];
                            case 3:
                                this.removeFriendRequestNotification(senderId);
                                return [2 /*return*/];
                        }
                    });
                }); });
                notifButtons.appendChild(acceptBtn);
                notifButtons.appendChild(rejectBtn);
                notifCard.appendChild(notifMessage);
                notifCard.appendChild(notifButtons);
                container.appendChild(notifCard);
                this.friendRequests.set(senderId, { senderId: senderId, message: message, element: notifCard });
                console.log("Added notification for sender ".concat(senderId, ". Total notifications: ").concat(this.friendRequests.size));
                return [2 /*return*/];
            });
        });
    };
    LiveChatPage.prototype.removeFriendRequestNotification = function (senderId) {
        var notification = this.friendRequests.get(senderId);
        if (!notification) {
            console.log("No notification found for sender:", senderId);
            return;
        }
        notification.element.remove();
        this.friendRequests.delete(senderId);
        console.log("Removed notification for sender ".concat(senderId, ". Remaining: ").concat(this.friendRequests.size));
    };
    LiveChatPage.prototype.loadPendingFriendRequests = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, resData, data, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log("Loading pending friend requests for user:", userId);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/pending-requests'), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        console.error('Failed to load pending requests:', res.status);
                        return [4 /*yield*/, res.json()];
                    case 2:
                        resData = _a.sent();
                        console.error('Response data:', resData);
                        return [2 /*return*/];
                    case 3: return [4 /*yield*/, res.json()];
                    case 4:
                        data = _a.sent();
                        console.log("Pending requests response:", data);
                        if (data.success && data.requests && data.requests.length > 0) {
                            data.requests.forEach(function (request) {
                                _this.addFriendRequestNotification(request.senderId, request.message);
                            });
                            console.log("Loaded ".concat(data.requests.length, " pending friend requests"));
                        }
                        else {
                            console.log("No pending friend requests found");
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        console.error("Error loading pending friend requests:", error_6);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    LiveChatPage.prototype.loadFriendsList = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Loading friends list for user:", userId);
                        return [4 /*yield*/, fetch(this.routerManager.getUrl('/live-chat/get-friends'), {
                                method: 'GET',
                                credentials: 'include'
                            })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            console.error('Failed to load friends:', res.status);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        console.log("Friends list response:", data);
                        if (data.success && data.friends && data.friends.length > 0) {
                            this.displayFriends(data.friends);
                            console.log("Loaded ".concat(data.friends.length, " friends"));
                        }
                        else {
                            console.log("No friends found");
                            this.displayNoFriends();
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        console.error("Error loading friends:", error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LiveChatPage.prototype.displayFriends = function (friends) {
        return __awaiter(this, void 0, void 0, function () {
            var container, profileDiv, _loop_1, this_1, _i, friends_1, friend;
            var _this = this;
            return __generator(this, function (_a) {
                container = document.getElementById('friends-container');
                if (!container) {
                    console.error("Friends container not found");
                    return [2 /*return*/];
                }
                profileDiv = document.getElementById('profile-div');
                if (!profileDiv) {
                    console.error("Profile Div not found");
                    return [2 /*return*/];
                }
                container.innerHTML = '';
                _loop_1 = function (friend) {
                    var username = friend.username;
                    var friendItem = this_1.uiManager.createElement('div', 'p-2 bg-black/40 border border-[#00ffff]/30 rounded hover:bg-black/60 cursor-pointer transition-colors');
                    var friendName = this_1.uiManager.createElement('p', 'text-[#00ffff] text-sm');
                    friendName.textContent = username || "User ".concat(username);
                    friendItem.addEventListener('click', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            this.currentSelectedFriend = {
                                username: friend.username,
                                id: friend.id,
                                avatar: friend.avatar,
                                isGuest: false,
                                nbrId: friend.id
                            };
                            console.log("Selected friend:", friend);
                            this.updateProfileView();
                            profileDiv.querySelectorAll('button').forEach(function (btn) {
                                btn.classList.remove('hidden');
                            });
                            return [2 /*return*/];
                        });
                    }); });
                    friendItem.appendChild(friendName);
                    container.appendChild(friendItem);
                };
                this_1 = this;
                for (_i = 0, friends_1 = friends; _i < friends_1.length; _i++) {
                    friend = friends_1[_i];
                    _loop_1(friend);
                }
                ;
                this.setupFriendActionButtons();
                return [2 /*return*/];
            });
        });
    };
    ;
    LiveChatPage.prototype.updateProfileView = function () {
        var profileDiv = document.getElementById('profile-div');
        if (!profileDiv)
            return;
        var friendImg = profileDiv.querySelector('img');
        var friendPseudo = profileDiv.querySelector('p');
        console.log("Updating profile view for friend:", this.currentSelectedFriend);
        var friend = this.currentSelectedFriend;
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
                friendImg.src = "public/avatars/".concat(friend.avatar, ".png");
        }
        if (friend && friendPseudo) {
            friendPseudo.textContent = friend.username;
        }
        var deleteBtn = document.getElementById('delete-friend-btn');
        var blockBtn = document.getElementById('block-friend-btn');
        if (this.currentSelectedFriend && this.currentUser && this.currentSelectedFriend.id === this.currentUser.id) {
            if (deleteBtn)
                deleteBtn.classList.add('hidden');
            if (blockBtn)
                blockBtn.classList.add('hidden');
        }
    };
    LiveChatPage.prototype.setupFriendActionButtons = function () {
        var _this = this;
        var blockBtn = document.getElementById('block-friend-btn');
        var deleteBtn = document.getElementById('delete-friend-btn');
        if (blockBtn) {
            var newBlockBtn = blockBtn.cloneNode(true);
            blockBtn.replaceWith(newBlockBtn);
            newBlockBtn.addEventListener('click', function () {
                if (!_this.currentSelectedFriend)
                    return;
                console.log("Blocking friend:", _this.currentSelectedFriend.id);
                var resBlock = fetch(_this.routerManager.getUrl('/live-chat/block-friend'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ friendId: _this.currentSelectedFriend.id })
                }).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                    var data;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!response.ok) {
                                    console.error('Failed to block friend:', response.status);
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, response.json()];
                            case 1:
                                data = _a.sent();
                                if (data.success) {
                                    console.log("Friend blocked successfully");
                                    if (this.currentUser) {
                                        this.loadFriendsList(this.currentUser.id);
                                    }
                                }
                                else {
                                    console.error("Failed to block friend:", data.message);
                                }
                                return [2 /*return*/];
                        }
                    });
                }); });
                _this.currentSelectedFriend = null;
                _this.updateProfileView();
            });
        }
        if (deleteBtn) {
            var newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.replaceWith(newDeleteBtn);
            newDeleteBtn.addEventListener('click', function () {
                if (!_this.currentSelectedFriend)
                    return;
                console.log("Removing friend:", _this.currentSelectedFriend.id);
                var res = fetch(_this.routerManager.getUrl('/live-chat/remove-friend'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ friendId: _this.currentSelectedFriend.id })
                }).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                    var data;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!response.ok) {
                                    console.error('Failed to remove friend:', response.status);
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, response.json()];
                            case 1:
                                data = _a.sent();
                                if (data.success) {
                                    console.log("Friend removed successfully");
                                    if (this.currentUser) {
                                        this.loadFriendsList(this.currentUser.id);
                                    }
                                }
                                else {
                                    console.error("Failed to remove friend:", data.message);
                                }
                                return [2 /*return*/];
                        }
                    });
                }); });
                _this.currentSelectedFriend = null;
                _this.updateProfileView();
            });
        }
    };
    LiveChatPage.prototype.displayNoFriends = function () {
        var container = document.getElementById('friends-container');
        if (!container)
            return;
        container.innerHTML = '';
        var emptyMessage = this.uiManager.createElement('p', 'text-[#00ffff]/50 text-sm italic');
        emptyMessage.textContent = 'No friends yet. Add some!';
        container.appendChild(emptyMessage);
    };
    /**********************************************************************************************/
    /**************************************** LIVE-CHAT **************************************/
    /**********************************************************************************************/
    LiveChatPage.prototype.addMessage = function (text, isMine) {
        var messagesContainer = document.getElementById('messages-div');
        if (!messagesContainer)
            return;
        var wrapper = this.uiManager.createElement('div', "flex mb-2 ".concat(isMine ? 'justify-end' : 'justify-start'));
        var bubble = this.uiManager.createElement('div', isMine
            ? 'bg-[#ffffff] text-white px-3 py-2 rounded-lg max-w-[70%]'
            : 'bg-white/70 text-[#ffffff] border border-[#00ffff]/40 px-3 py-2 rounded-lg max-w-[70%]');
        bubble.textContent = text;
        wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };
    return LiveChatPage;
}());
exports.LiveChatPage = LiveChatPage;
