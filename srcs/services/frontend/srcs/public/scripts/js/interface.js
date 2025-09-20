import { getTraductions } from "./languageManager.js";
import { getElement } from "./script.js";
import { logoutHandler } from "./login.js";
import { navigateTo } from "./navigation.js";
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
export function getSignupForm(text) {
    return `
	<h2 class="text-xl font-bold mb-6 text-white">${text.signupTitle}</h2>
	<form id="signupForm" class="flex flex-col space-y-4">
	  <input id="login" type="text" required placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
	  <input id="email" type="text" required placeholder="${text.email}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
	  <div class="relative">
		<input id="passwd" type="password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
		<button type="button" id="togglePasswd" required class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
		  👁️
		</button>
	  </div>
	  <div class="relative">
		<input id="passwdConfirm" type="password" placeholder="${text.passwdConfirm}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
		<button type="button" id="togglePasswdConfirm" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
		  👁️
		</button>
	  </div>
	  <button type="submit" id="submit-login" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signupBtn}</button>
	  <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
	  </form>
	<br>
	<h3 class="text-xl font-bold mb-6 text-white">${text.otherUp}</h3>
	<button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">GOOGLE SIGN IN</button>
	<br><br>
	<button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">42AUTH</button>
	<br>
	<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;
}
export function getSigninForm(text) {
    return `
		<h2 class="text-xl font-bold mb-6 text-white">${text.signinTitle}</h2>
		<form class="flex flex-col space-y-4">
		  <input type="text" name="pseudo" required placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
		  <div class="relative">
			<input id="passwd" type="password" name="password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
			<button type="button" id="togglePasswd" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
			  👁️
			</button>
		  </div>
		  <button id="forgotPasswd" type="submit" class="text-sm italic bg-transparent text-red-600 border-none hover:underline">${text.forgotPasswd}</button>
		  <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signin}</button>
		  <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
		</form>
		<br>
		<h3 class="text-xl font-bold mb-6 text-white">${text.other}</h3>
		<button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">GOOGLE SIGN IN</button>
		<br><br>
		<button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">42AUTH</button>
		<br>
		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}
export function getGuestPlay(text) {
    return `
	    <h2 class="text-xl font-bold mb-6 text-white">${text.guestTitle}</h2>
	    <form class="flex flex-col space-y-4">
	      <input type="text" placeholder="${text.nickname}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none" required>
	      <label class="text-white text-left">${text.chooseAvatar}</label>
	      <div class="flex justify-center space-x-4 pt-2">
	        <img src="/public/avatars/avatar1.png" alt="Avatar 1"
	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	        <img src="/public/avatars/avatar2.png" alt="Avatar 2"
	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	        <img src="/public/avatars/avatar3.png" alt="Avatar 3"
	          class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	      </div>
		  <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
	      <button id="playBtn" type="submit" class="bg-green-500 hover:bg-green-600 text-white py-2 rounded">${text.play}</button>
	    </form>
	    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}
export function getOptions(text) {
    return `
		<h2 class="text-xl font-bold mb-4 text-white">${text.options}</h2>
		<p class="text-white">${text.optionsMessage}</p>
		<div class="mt-6">
		  <p class="text-white">${text.lang}
		  <button id="langToggleBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
		   ${text.language}
		  </button></p>
		</div>
		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}
export function getForgotPass(text) {
    return `
    <h2 class="text-xl font-bold mb-6 text-white">${text.forgotPasswd}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" name="email" placeholder="${text.email}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
      <button type="forgotPasswd" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.resetPasswd}</button>
      <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
      </form>
  `;
}
export function getChangePass(text) {
    return `
    <h2 class="text-xl font-bold mb-6 text-white">${text.changePass}</h2>
    <form class="flex flex-col space-y-4">
     <div class="relative">
		<input id="passwd" type="password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
		<button type="button" id="togglePasswd" required class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
		  👁️
		</button>
	  </div>
	  <div class="relative">
		<input id="passwdConfirm" type="password" placeholder="${text.passwdConfirm}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
		<button type="button" id="togglePasswdConfirm" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
		  👁️
		</button>
		</div>
		
      <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
      <button type="changePasswd" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.changeBtn}</button>
     <br>
	  <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
      </form>
  `;
}
export async function getConnectedHome() {
    const text = await getTraductions();
    return `<h1 id="title" class="text-2xl font-bold text-white mb-6">TRANSCENDENCE</h1>
            <div class="menu flex flex-col space-y-4">
                <button id="playBtn" class="bg-transparent text-white border-none hover:underline">${text.play}</button>
                <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
                <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
				<button id="logoutBtn" class="bg-transparent text-white border-none hover:underline">${text.logout}</button>
            </div>`;
}
export async function initDisconnectedHome(text) {
    // sign up button
    const signupBtn = getElement("signupBtn");
    signupBtn.addEventListener("click", () => navigateTo(text, "signup"));
    // sign in button
    const signinBtn = getElement("signinBtn");
    signinBtn.addEventListener("click", () => navigateTo(text, "signin"));
    // play as guest button
    const playAsGuestBtn = getElement("playAsGuestBtn");
    playAsGuestBtn.addEventListener("click", () => navigateTo(text, "guestPlay"));
    // options button
    const optionsBtn = getElement("optionsBtn");
    optionsBtn.addEventListener("click", () => navigateTo(text, "options"));
}
export async function initConnectedHome(text) {
    // play button
    const playBtn = getElement("playBtn");
    playBtn.addEventListener("click", () => navigateTo(text, "game", false));
    // options button
    const optionsBtn = getElement("optionsBtn");
    optionsBtn.addEventListener("click", () => navigateTo(text, "options"));
    // logout button
    const logoutBtn = getElement("logoutBtn");
    logoutBtn.addEventListener("click", logoutHandler);
}
