import { getGameAsGuest, getGameAsUser } from "./gameInterface.js";
import { navigateTo, setupBackButton } from "./navigation.js";
import type { Translations } from "./types.js";
import { getElement } from "./script.js";
import { isConnectedUser, initCSRFToken } from "./login.js";
import { getUrl } from "./urls.js";

export async function getConnectedUser() {
    try {
        const res = await fetch(getUrl('auth/me'), {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to get user');
        const result = await res.json();
        if (result.success) {
            return result.data.user;
        }
    } catch (err) {
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
    } catch (err) {
        console.error("getCurrentUser error:", err);
        return null;
    }
}

export function getGuestNickname() {
  const nickname = localStorage.getItem("guestNickname");
  const avatar = localStorage.getItem("guestAvatar");

  if (!nickname || !avatar) {
    return { nickname: "Guest", avatar: "/default.png" }; 
  }

  return { nickname, avatar };
}



export async function showGame(text: Translations) {

    let gameDiv = document.getElementById('gameScreen') as HTMLDivElement | null;
    const contentDiv = getElement<HTMLDivElement>('content')!;

    const isConnected = await isConnectedUser();
    console.log("user is connected : ", isConnected);
    
    if (!gameDiv) {
        gameDiv = document.createElement('div');
        gameDiv.id = 'gameScreen';
        gameDiv.className = 'flex flex-col w-full h-screen bg-gray-900';
        gameDiv.innerHTML = `
        <header id="gameHeader" class="w-full bg-white p-4 shadow-md flex justify-between items-center">
        <h1 id="gameHeaderTitle" class="text-xl font-bold">Game Header</h1>
        </header>
        <main class="flex-1 w-full bg-gray-700 flex items-center justify-center">
        <canvas id="gameCanvas" class="w-full h-full"></canvas>
        </main>
        <button id="exitGameBtn" class="text-red-500">Exit</button>
        `;
        getElement<HTMLDivElement>('app')!.appendChild(gameDiv);
    }
    
    contentDiv.style.display = 'none';
    gameDiv.style.display = 'flex';
    
    const headerTitle = getElement<HTMLHeadingElement>('gameHeaderTitle');
    if (isConnected) {
        const user = await getCurrentUser();
        if (user) {
            headerTitle.textContent = user.pseudo;
        }
        else {
            headerTitle.textContent = "Not connected";
        }
    }
    else {
        const guest = getGuestNickname();
        headerTitle.textContent = guest.nickname;
    }

    // exit game button
    getElement<HTMLButtonElement>('exitGameBtn')!.onclick = () => {
        gameDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        if(isConnected)
            navigateTo(text, "home");
        else
            navigateTo(text, "guestPlay");
    };
}


