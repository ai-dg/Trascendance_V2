import { getTraductions, toggleLanguage } from "./languageManager.js"
import { Translations } from "./types.js"
import { getElement } from "./script.js"
import { logoutHandler } from "./login.js"
import { navigateTo, setupBackButton } from "./navigation.js"
import { getCurrentUser } from "./showGame.js"
import { changeUsername, changeEmail, changePassword } from "./changeProfile.js"
import { getUrl } from "./urls.js"
import { setupPasswordToggle } from "./validator.js"

export function getConnectedOptions(text: Translations) {
	return `
		<h2 class="text-xl font-bold mb-4 text-white">${text.options}</h2>
		<p class="text-white">${text.optionsMessage}</p>
		<div class="mt-6">
		  <p class="text-white">${text.lang}
		  <button id="langToggleBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
		   ${text.language}
		  </button></p>
          <br>
          <button id="updateProfileBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
		   Update Profile
		  </button></p>
		</div>
		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}

 export async function initConnectedOptions(text: Translations)
 {
    const user = await getCurrentUser();
    const contentDiv = getElement<HTMLDivElement>('content');
    contentDiv.innerHTML = getConnectedOptions(text);

    // update profile button
    const updateProfileBtn = getElement<HTMLButtonElement>("updateProfileBtn");
    updateProfileBtn.addEventListener('click', () => {
        navigateTo(text, "updateProfile");
    });

    // change language button
    const langToggleBtn = getElement<HTMLButtonElement>("langToggleBtn");
    langToggleBtn.addEventListener('click', toggleLanguage);
    
    // back button
    setupBackButton(text, "");

 }

 export async function getUpdateProfile(text:Translations) {

    const user = await getCurrentUser();

    return `
		<h2 class="text-xl font-bold mb-4 text-white">Update Profile</h2>
		
		<div class="mb-4">
			<label class="block text-white mb-1">Username: <span class="font-semibold">${user?.pseudo ?? ''}</span></label>
			<br>
            <div class="flex space-x-2">
				<input id="usernameInput" type="text" placeholder="New username"
					class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
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
					class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
				<button id="changeEmailBtn"
					class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change</button>
			</div>
		</div>
        <br>

		<div class="mb-4">
			<label class="block text-white mb-1">Password:</label>
			<br>
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
			<br>
			<button id="changePasswordBtn"
				class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change Password</button>
			</form>
		</div>
		<div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
		<button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	`;
 }

 export async function showUpdateProfile(text:Translations) {
    const contentDiv = getElement<HTMLDivElement>('content');
    contentDiv.innerHTML = await getUpdateProfile(text);
	
	const errorDiv = getElement<HTMLDivElement>('formErrors');
	errorDiv.innerHTML = "";

	setupPasswordToggle('togglePasswd', 'passwd');
  	setupPasswordToggle('togglePasswdConfirm', 'passwdConfirm');

    getElement<HTMLButtonElement>('changeUsernameBtn')?.addEventListener('click', async () => {
		const newUsername = (getElement<HTMLInputElement>('usernameInput')?.value ?? '').trim();
		console.log("Change username ->", newUsername);

		if (!newUsername) {
		    errorDiv.innerHTML = "No username entered";
		    return;
		}
	
		console.log("Change username ->", newUsername);
	
		const result = await changeUsername(newUsername);
		if (result.success) {
		    alert("✅ Username changed to: " + result.username);
		} else {
		    errorDiv.innerHTML = "Error: " + result.message;
		}
	});

	getElement<HTMLButtonElement>('changeEmailBtn')?.addEventListener('click', async () => {
		const newEmail = (getElement<HTMLInputElement>('emailInput')?.value ?? '').trim();
		console.log("Change email ->", newEmail);

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
	    	errorDiv.innerHTML = "Invalid email format";
	    	return;
		}
		if (!newEmail) {
		    errorDiv.innerHTML = "No email entered";
		    return;
		}

		const res = await fetch(getUrl('auth/verify-email-valid'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: newEmail })
		});

		const valid = await res.json();
		if (!valid.success) {
			errorDiv.innerHTML = valid.message;
			return ;
		} else {
			console.log("email is valid");
		}
	
		console.log("Change email ->", newEmail);
	
		const result = await changeEmail(text, newEmail);
		if (result.success) {
		    alert("✅ Email changed to: " + result.email);
		} else {
		    errorDiv.innerHTML = "Error: " + result.message;
		}

	});

	getElement<HTMLButtonElement>('changePasswordBtn')?.addEventListener('click', async () => {
		const passwdInput = getElement<HTMLInputElement>('passwd');
		const passwdInputConfirm = getElement<HTMLInputElement>('passwd');
		const newPass = (passwdInput?.value ?? '').trim();
		const confirmPass = (passwdInputConfirm?.value ?? '').trim();
		if (newPass !== confirmPass) {
			errorDiv.innerHTML = "Passwords do not match!";
			return;
		}
		console.log("Change password ->", newPass);

		const res = await changePassword(text);
		if (res.success) {
			alert("✅ Password changed to: " + res.password);
			passwdInput.value = '';
			passwdInputConfirm.value = '';
		} else {
			errorDiv.innerHTML = "Error: " + res.message;
		}

	});

    // back button
    setupBackButton(text, "showOptions");
 }
