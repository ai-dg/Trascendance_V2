import { getTraductions } from "./script.js"
import { Translations } from "./types.js"
import { showSignUp, showGuestPlay, showOptions, showSignIn } from "./script.js"
import { logoutHandler } from "./login.js"


export async function getDisconnectedHome(){
	const text = await getTraductions()
	return `<h1 id="title" class="text-2xl font-bold text-white mb-6">TRANSCENDENCE</h1>
            <div class="menu flex flex-col space-y-4">
                <button id="signupBtn" class="bg-transparent text-red-600 border-none hover:underline">${text.signup}</button>
                <button id="signinBtn" class="bg-transparent text-white border-none hover:underline">${text.signin}</button>
                <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
                <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
                <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
            </div>`
}



export function getSignupForm(text: Translations)
{
	return `
	<h2 class="text-xl font-bold mb-6 text-white">${text.signupTitle}</h2>
	<form class="flex flex-col space-y-4">
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



export async function getConnectedHome(){
	const text = await getTraductions()
	return `<h1 id="title" class="text-2xl font-bold text-white mb-6">TRANSCENDENCE</h1>
            <div class="menu flex flex-col space-y-4">
                <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
                <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
                <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
				<button id="logoutBtn" class="bg-transparent text-white border-none hover:underline">${text.logout}</button>
            </div>`
}


 export async function initDisconnectedHome(text:Translations)
 {
		// sign up button
	const signupBtn = document.getElementById("signupBtn") as HTMLButtonElement;
	if (!signupBtn)
		console.error("Failed to find signupBtn element");
	signupBtn.addEventListener("click", () => showSignUp(text));

		// sign in button
		const signinBtn = document.getElementById("signinBtn") as HTMLButtonElement;
		if (!signinBtn)
			console.error("Failed to find signinBtn element");
		signinBtn.addEventListener("click", () => showSignIn(text));

		// play as guest button
		const playAsGuestBtn = document.getElementById("playAsGuestBtn") as HTMLButtonElement;
		if (!playAsGuestBtn)
			console.error("Failed to find playAsGuestBtn element");
		playAsGuestBtn.addEventListener("click", () => showGuestPlay(text));

		// options button
		const optionsBtn = document.getElementById("optionsBtn") as HTMLButtonElement;
		if (!optionsBtn)
			console.error("Failed to find optionsBtn element");
		optionsBtn.addEventListener("click", () => showOptions(text));
 }
 
 
 export async function initConnectedHome(text: Translations)
 {

	  // options button
	const optionsBtn = document.getElementById("optionsBtn") as HTMLButtonElement;
	if (!optionsBtn)
		console.error("Failed to find optionsBtn element");
	else
		optionsBtn.addEventListener("click", () => showOptions(text));

	// logout button
	const logoutBtn = document.getElementById("logoutBtn") as HTMLElement;
	if (!logoutBtn)
		console.error("Failed to find logoutBtn element");
	else
		logoutBtn.addEventListener("click", logoutHandler);

 }