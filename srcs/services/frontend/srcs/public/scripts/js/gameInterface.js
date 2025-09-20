export function getGameAsGuest(text) {
    return `
        <div id="gameScreen" class="flex flex-col min-h-screen w-full h-screen bg-gray-900">
            <header id="gameHeader" class="bg-white p-4 shadow-md flex justify-between items-center">
              <h1 class="text-xl font-bold">Game Header</h1>
            </header>
            <main class="flex-1 bg-gray-700 flex items-center justify-center">
                <canvas id="gameCanvas" class="w-full h-full"></canvas>
            </main>
            <button id="exitGameBtn" class="text-red-500">Exit</button>
        </div>
    `;
}
export function getGameAsUser(text) {
    return `
        <div id="gameScreen" class="flex flex-col min-h-screen w-full h-screen bg-gray-900">
            <header id="gameHeader" class="bg-white p-4 shadow-md flex justify-between items-center">
              <h1 class="text-xl font-bold">Game Header</h1>
            </header>
            <main class="flex-1 bg-gray-700 flex items-center justify-center">
                <canvas id="gameCanvas" class="w-full h-full"></canvas>
            </main>
            <button id="exitGameBtn" class="text-red-500">Exit</button>
        </div>
    `;
}
