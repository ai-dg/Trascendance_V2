import { getTraductions } from "./script.js";
import { showSignUp, showGuestPlay, showOptions, showSignIn } from "./script.js";
import { logoutHandler } from "./login.js";
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
export async function initDisconnectedHome(text) {
    // sign up button
    const signupBtn = document.getElementById("signupBtn");
    if (!signupBtn)
        console.error("Failed to find signupBtn element");
    signupBtn.addEventListener("click", () => showSignUp(text));
    // sign in button
    const signinBtn = document.getElementById("signinBtn");
    if (!signinBtn)
        console.error("Failed to find signinBtn element");
    signinBtn.addEventListener("click", () => showSignIn(text));
    // play as guest button
    const playAsGuestBtn = document.getElementById("playAsGuestBtn");
    if (!playAsGuestBtn)
        console.error("Failed to find playAsGuestBtn element");
    playAsGuestBtn.addEventListener("click", () => showGuestPlay(text));
    // options button
    const optionsBtn = document.getElementById("optionsBtn");
    if (!optionsBtn)
        console.error("Failed to find optionsBtn element");
    optionsBtn.addEventListener("click", () => showOptions(text));
}
export async function initConnectedHome(text) {
    // options button
    const optionsBtn = document.getElementById("optionsBtn");
    if (!optionsBtn)
        console.error("Failed to find optionsBtn element");
    else
        optionsBtn.addEventListener("click", () => showOptions(text));
    // logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn)
        console.error("Failed to find logoutBtn element");
    else
        logoutBtn.addEventListener("click", logoutHandler);
}
