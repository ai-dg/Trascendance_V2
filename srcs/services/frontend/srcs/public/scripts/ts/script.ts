import test from 'node:test';
import { getDisconnectedHome, getConnectedHome, initConnectedHome, initDisconnectedHome, getSignupForm} from './interface.js';
import { loadLanguage, toggleLanguage, languages, currentLangIndex } from './languageManager.js';
import { initCSRFToken, isConnectedUser, logUser, registerUser } from './login.js';
import type { params, Translations } from './types.js'
import { OTPValidationHandler } from './handlers.js';
import { getUrl } from './urls.js';
import { setupPasswordToggle, validateForm, setupSignUpForm, showVerificationCode, setupBackButton } from './validator.js';

console.log("Script working properly");  // to remove


document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(languages[currentLangIndex].code, 'home');
});

export function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento #${id} not found`);
  return el as T;
}


// show sign up
export function showSignUp(text: Translations) {
  const contentDiv = getElement<HTMLDivElement>("content");
  contentDiv.innerHTML = getSignupForm(text);

  setupPasswordToggle('togglePasswd', 'passwd');
  setupPasswordToggle('togglePasswdConfirm', 'passwdConfirm');

  const form = getElement<HTMLFormElement>("signupForm"); 
  setupSignUpForm(form, text);

  const backBtn = getElement<HTMLButtonElement>("backBtn");
  backBtn.addEventListener("click", () => showHome(text));
}

// show sign in
export function showSignIn(text: Translations) {
  console.log(">> showSignIn() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.signinTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" name="pseudo" required placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <div class="relative">
        <input type="password" name"password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
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

  // show password button
  setupPasswordToggle("togglePasswd", "passwd");
  setupPasswordToggle("togglePasswdConfirm", "passwdConfirm");

  const errorDiv = getElement<HTMLDivElement>("formErrors");


  // login form
  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");
  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    const loginInput = form.querySelector('input[type="text"]') as HTMLInputElement;
    if (!loginInput)
      console.error("Failed to find input element");
    const login = loginInput.value;
    const passwdInput = form.querySelector('input[type="password"]') as HTMLInputElement;
    if (!passwdInput)
      console.error("Failed to find input element");
    const passwd = passwdInput.value;
    // To remove after auth working
    const view = 'signin';
	  logUser(login, passwd, text, view);
    // showVerificationCode(text, view);
  });

  // forgot password button
  const forgotPasswd = getElement<HTMLButtonElement>("forgotPasswd");
  forgotPasswd.addEventListener("click", () => showForgotPasswd(text));

  // back button
  setupBackButton(text, "");
}

export function showForgotPasswd(text: Translations) {
  console.log(">> showForgotPasswd() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.forgotPasswd}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" name="email" placeholder="${text.email}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <button type="forgotPasswd" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.resetPasswd}</button>
      <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
      </form>
  `;

  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");
  form.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
	const email = form.email.value;
	console.log(email);
	const url = getUrl('auth/reset-password')
	try{
		const res = await fetch(url, {
			method: "POST",
			headers:{
				"content-type": "application/json"
			},
			body: JSON.stringify({email})
		})
		if (!res.ok)
			// TODO: handle this message
			console.log("KO");
		else {
			const result = await res.json();
			console.log(result.message)
			if (result.success)
			{
				showVerificationCode(text, "", {otp_id: result.otp_id, context: "reset-password", handler: ()=>{console.log("Success ! go back to login page !")}, } )
			}
			else
			{
				// TODO: handle this message
				console.log("fail")
			}
		}
	}
	catch(err){
		// TODO: handle this message
		console.log(err)

	}
	alert("MAIL SENDED")

})

  // back button
  setupBackButton(text, "signin");
}

export function showGuestPlay(text: Translations) {
  console.log(">> showGuestPlay() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = `
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

      <button type="submit" class="bg-green-500 hover:bg-green-600 text-white py-2 rounded">${text.play}</button>
    </form>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;

  let selectedAvatar = null;

  // avatar choices
  document.querySelectorAll('.avatar-option').forEach(img => {
    img.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(i => i.classList.remove('border-blue-500'));
      img.classList.add('border-blue-400');
      selectedAvatar = (img as HTMLImageElement).getAttribute('src');
    });
  });

  // nickname form
  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");
  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();
    const nicknameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
    if (!nicknameInput)
      console.error("Failed to find input element");
    const nickname = nicknameInput.value;
  });

  // back button
  setupBackButton(text, "");
}

export function showOptions(text: Translations) {
  console.log(">> showOptions() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = `
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

  // change language button
  const langToggleBtn = getElement<HTMLButtonElement>("langToggleBtn");
  langToggleBtn.addEventListener('click', toggleLanguage);

  // back button
  setupBackButton(text, "");

}

export async function showHome(text: Translations) {
	
  if (!text) return;
  const contentDiv = getElement<HTMLDivElement>('content');

	const isConnected = await isConnectedUser();
console.log("user is connected : ", isConnected);
	if (isConnected)
	{
		await initCSRFToken()
		contentDiv.innerHTML = await getConnectedHome()
		await initConnectedHome(text);
	}
	else
	{
		contentDiv.innerHTML = await getDisconnectedHome();
		await initDisconnectedHome(text);
	}
}
