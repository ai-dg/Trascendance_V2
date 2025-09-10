import test from 'node:test';
import { getDisconnectedHome, getConnectedHome, initConnectedHome, initDisconnectedHome, getSignupForm, getSigninForm, getGuestPlay, getOptions} from './interface.js';
import { loadLanguage, toggleLanguage, languages, currentLangIndex, currentTexts } from './languageManager.js';
import { initCSRFToken, isConnectedUser, logUser, registerUser } from './login.js';
import type { params, Translations } from './types.js'
import { OTPValidationHandler } from './handlers.js';
import { getUrl } from './urls.js';
import { setupPasswordToggle, validateForm, setupSignUpForm, showVerificationCode } from './validator.js';
import { navigateTo, setupBackButton } from './navigation.js';

console.log("Script working properly");  // to remove



document.addEventListener("DOMContentLoaded", async () => {
  await loadLanguage(languages[currentLangIndex].code, 'home');

  const initialView = (location.hash?.replace("#", "") || "home");

  history.replaceState({ view: initialView }, "", `#${initialView}`);
  console.log("initial replaceState ->", initialView);

  window.addEventListener("popstate", (event) => {
    const view = event.state?.view || location.hash.replace("#", "") || "home";
    console.log("popstate ->", view, " event.state=", event.state);
    if (currentTexts) {
      navigateTo(currentTexts, view, false);
    } else {
      showHome(currentTexts!);
    }
  });
});

export function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
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

  setupBackButton(text, "");
}

// show sign in
export function showSignIn(text: Translations) {
  console.log(">> showSignIn() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = getSigninForm(text);

  // show password button
  setupPasswordToggle("togglePasswd", "passwd");

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
  forgotPasswd.addEventListener("click", () => navigateTo(text, "forgotPass"));

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

        // add that at the history later
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
  contentDiv.innerHTML = getGuestPlay(text);

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
  contentDiv.innerHTML = getOptions(text);

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
