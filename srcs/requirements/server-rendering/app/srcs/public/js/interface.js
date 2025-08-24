import { getTraductions } from "./script.js";
export async function getDisconnectedHome() {
    const text = await getTraductions();
    return `<h1 id="title" class="text-2xl font-bold text-white mb-6">TRANSCENDENCE</h1>
            <div class="menu flex flex-col space-y-4">
                <button id="signupBtn" class="bg-transparent text-red-600 border-none hover:underline">${text.signup}</button>
                <button id="signinBtn" class="bg-transparent text-white border-none hover:underline">${text.signin}</button>
                <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
                <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
                <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
            </div>`;
}
export async function getConnectedHome() {
    const text = await getTraductions();
    return `<h1 id="title" class="text-2xl font-bold text-white mb-6">TRANSCENDENCE</h1>
            <div class="menu flex flex-col space-y-4">
                <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
                <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
                <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
				<button id="logoutBtn" class="bg-transparent text-white border-none hover:underline">${text.logout}</button>
            </div>`;
}
