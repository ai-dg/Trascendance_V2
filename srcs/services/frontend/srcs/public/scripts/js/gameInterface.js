import { toggleLanguage } from "./languageManager.js";
import { getElement } from "./script.js";
import { navigateTo, setupBackButton } from "./navigation.js";
import { getCurrentUser } from "./showGame.js";
export function getConnectedOptions(text) {
    return `
		<h2 class="text-xl font-bold mb-4 text-white">${text.options}</h2>
		<p class="text-white">${text.optionsMessage}</p>
		<div class="mt-6">
		  <p class="text-white">${text.lang}
		  <button id="langToggleBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
		   ${text.language}
		  </button></p>
          <button id="updateProfileBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
		   Update Profile
		  </button></p>
		</div>
		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}
export async function initConnectedOptions(text) {
    const user = await getCurrentUser();
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getConnectedOptions(text);
    // update profile button
    const updateProfileBtn = getElement("updateProfileBtn");
    updateProfileBtn.addEventListener('click', () => {
        navigateTo(text, "updateProfile");
    });
    // change language button
    const langToggleBtn = getElement("langToggleBtn");
    langToggleBtn.addEventListener('click', toggleLanguage);
    // back button
    setupBackButton(text, "");
}
export async function getUpdateProfile(text) {
    const user = await getCurrentUser();
    return `
		<h2 class="text-xl font-bold mb-4 text-white">Update Profile</h2>
		
		<div class="mb-4">
			<label class="block text-white mb-1">Username: <span class="font-semibold">${user?.pseudo ?? ''}</span></label>
			<br>
            <div class="flex space-x-2">
				<input id="usernameInput" type="text" placeholder="New username"
					class="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-400">
				<button id="changeUsernameBtn"
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change</button>
			</div>
		</div>
        <br>

		<div class="mb-4">
			<label class="block text-white mb-1">Email: <span class="font-semibold">${user?.user_mail ?? ''}</span></label>
			<br>
            <div class="flex space-x-2">
				<input id="emailInput" type="email" placeholder="New email"
					class="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-400">
				<button id="changeEmailBtn"
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change</button>
			</div>
		</div>
        <br>

		<div class="mb-4">
			<label class="block text-white mb-1">Password:</label>
			<br>
            <div class="flex flex-col space-y-2">
				<input id="passwordInput" type="password" placeholder="New password"
					class="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-400">
				<input id="confirmPasswordInput" type="password" placeholder="Confirm new password"
					class="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-400">
				<button id="changePasswordBtn"
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 self-start">Change</button>
			</div>
		</div>

		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	`;
}
export async function showUpdateProfile(text) {
    const contentDiv = getElement('content');
    contentDiv.innerHTML = await getUpdateProfile(text);
    getElement('changeUsernameBtn')?.addEventListener('click', () => {
        const newUsername = (getElement('usernameInput')?.value ?? '').trim();
        console.log("Change username ->", newUsername);
        // TODO: chamar rota update-username
    });
    getElement('changeEmailBtn')?.addEventListener('click', () => {
        const newEmail = (getElement('emailInput')?.value ?? '').trim();
        console.log("Change email ->", newEmail);
        // TODO: chamar rota update-email
    });
    getElement('changePasswordBtn')?.addEventListener('click', () => {
        const newPass = (getElement('passwordInput')?.value ?? '').trim();
        const confirmPass = (getElement('confirmPasswordInput')?.value ?? '').trim();
        if (newPass !== confirmPass) {
            alert("Passwords do not match!");
            return;
        }
        console.log("Change password ->", newPass);
        // TODO: chamar rota update-password
    });
    // back button
    setupBackButton(text, "showOptions");
}
