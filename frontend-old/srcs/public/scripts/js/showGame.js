import { navigateTo } from "./navigation.js";
import { getElement } from "./script.js";
import { isConnectedUser } from "./login.js";
import { getUrl } from "./urls.js";
export async function getConnectedUser() {
    try {
        const res = await fetch(getUrl('auth/me'), {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok)
            throw new Error('Failed to get user');
        const result = await res.json();
        if (result.success) {
            return result.data.user;
        }
    }
    catch (err) {
        console.error(err);
    }
    return null;
}
export async function getCurrentUser() {
    try {
        const res = await fetch(getUrl('auth/me'), {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) {
            return null;
        }
        const result = await res.json();
        if (result.success) {
            return result.user;
        }
        return null;
    }
    catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}
export function getGuestNickname() {
    const nickname = localStorage.getItem("guestNickname");
    const avatar = localStorage.getItem("guestAvatar");
    if (!nickname || !avatar) {
        return { nickname: "Guest", avatar: "/avatar/default.png" };
    }
    return { nickname, avatar };
}
export async function showGame(text) {
    let gameDiv = document.getElementById('gameScreen');
    const contentDiv = getElement('content');
    const isConnected = await isConnectedUser();
    console.log("user is connected : ", isConnected);
    if (!gameDiv) {
        gameDiv = document.createElement('div');
        gameDiv.id = 'gameScreen';
        gameDiv.className = 'flex flex-col w-full h-screen bg-gray-900';
        gameDiv.innerHTML = `
        <header id="gameHeader" class="w-full bg-white p-4 shadow-md flex justify-between items-center space-x-4">
        <img id="avatar-option" class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
        <h1 id="gameHeaderTitle" class="text-xl font-bold">Game Header</h1>
        </header>
        <main class="flex-1 w-full bg-gray-700 flex items-center justify-center">
        <canvas id="gameCanvas" class="w-full h-full"></canvas>
        </main>
        <button id="exitGameBtn" class="text-red-500">Exit</button>
        `;
        getElement('app').appendChild(gameDiv);
    }
    contentDiv.style.display = 'none';
    gameDiv.style.display = 'flex';
    const avatarImg = getElement('avatar-option');
    const headerTitle = getElement('gameHeaderTitle');
    if (isConnected) {
        const user = await getCurrentUser();
        if (user) {
            headerTitle.textContent = user.pseudo;
            console.log("JUST before user.avatar showGame");
            if (user.avatar) {
                console.log("user.avatar: ", user.avatar);
                avatarImg.src = user.avatar;
            }
            else
                avatarImg.src = '/public/avatars/default.png';
        }
        else {
            headerTitle.textContent = "Not connected";
            avatarImg.src = '/public/avatars/default.png';
        }
    }
    else {
        const guest = getGuestNickname();
        headerTitle.textContent = guest.nickname;
        avatarImg.src = guest.avatar || '/public/avatars/default.png';
    }
    // exit game button
    getElement('exitGameBtn').onclick = () => {
        gameDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        if (isConnected)
            navigateTo(text, "home");
        else
            navigateTo(text, "guestPlay");
    };
}
