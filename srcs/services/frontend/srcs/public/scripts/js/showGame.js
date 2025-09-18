import { getElement } from "./script.js";
export function showGuestPlayGame(text) {
    // const appDiv = getElement<HTMLDivElement>("app");
    // appDiv.innerHTML = getGameAsGuest(text);
    // document.getElementById('exitGameBtn')!.addEventListener('click', () => {
    //     navigateTo(text, "home");
    // });
    let gameDiv = document.getElementById('gameScreen');
    const contentDiv = getElement('content');
    // Se ainda não existe, cria
    if (!gameDiv) {
        gameDiv = document.createElement('div');
        gameDiv.id = 'gameScreen';
        gameDiv.className = 'flex flex-col w-full h-screen bg-gray-900';
        gameDiv.innerHTML = `
            <header id="gameHeader" class="w-full bg-white p-4 shadow-md flex justify-between items-center">
                <h1 class="text-xl font-bold">Game Header</h1>
            </header>
            <main class="flex-1 w-full bg-gray-700 flex items-center justify-center">
                <canvas id="gameCanvas" class="w-full h-full"></canvas>
            </main>
            <button id="exitGameBtn" class="text-red-500">Exit</button>
        `;
        getElement('app').appendChild(gameDiv);
    }
    // alterna visibilidade
    contentDiv.style.display = 'none';
    gameDiv.style.display = 'flex';
    // botão de sair
    getElement('exitGameBtn').onclick = () => {
        gameDiv.style.display = 'none';
        contentDiv.style.display = 'block';
    };
}
