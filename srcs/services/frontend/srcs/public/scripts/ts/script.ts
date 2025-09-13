import test from 'node:test';
import { getDisconnectedHome, getConnectedHome, initConnectedHome, initDisconnectedHome, getSignupForm, getSigninForm, getGuestPlay, getOptions, getForgotPass, getChangePass} from './interface.js';
import { loadLanguage, toggleLanguage, languages, currentLangIndex, currentTexts } from './languageManager.js';
import { initCSRFToken, isConnectedUser, logUser, registerUser } from './login.js';
import type { params, Translations } from './types.js'
import { OTPValidationHandler } from './handlers.js';
import { getUrl } from './urls.js';
import { setupPasswordToggle, validateForm, setupSignUpForm, showVerificationCode, setupChangePassForm } from './validator.js';
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

export async function showForgotPasswd(text: Translations) {
  console.log(">> showForgotPasswd() called");  // to remove
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = getForgotPass(text);

  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");

  form.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

  // check email validity
  const errorDiv = getElement<HTMLDivElement>("formErrors");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) {
    errorDiv.innerHTML = text.errEmail;
    return ;
  }

  errorDiv.innerHTML = '';
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
				const is_valid = await showVerificationCode(text, "", {
          otp_id: result.otp_id, 
          context: "login",
          handler: () => {console.log("Success OTP!")}
        });
        
        if (is_valid) {
          const newPasswd = await showChangePass(text);

          const changeRes = await fetch(getUrl('auth/reset-password/otp-validation'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            otp_id: result.otp_id,
            password: newPasswd
          })
        });
        const changeResult = await changeRes.json();
        if (changeResult.success) {
          console.log("Password changed!");
        } else {
          errorDiv.innerHTML = changeResult.message || "Error";
        }
        }
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
	

})

  // back button
  setupBackButton(text, "signin");
}

export async function showChangePass(text: Translations) {
  const contentDiv = getElement<HTMLDivElement>('content');
  contentDiv.innerHTML = getChangePass(text);

  setupPasswordToggle('togglePasswd', 'passwd');
  setupPasswordToggle('togglePasswdConfirm', 'passwdConfirm');

  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");

  const pass = await setupChangePassForm(form, text);


  setupBackButton(text, "signin");

  return pass;

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
