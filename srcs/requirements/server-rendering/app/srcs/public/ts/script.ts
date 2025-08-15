import { cleanListeners, getSignupForm, initLoginButton } from './login.js';
import type { Translations } from './types.js'

console.log("Script working properly");  // to remove

document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(languages[currentLangIndex].code, 'home');
});

function showSignUp(text: Translations) {
  console.log(">> showSignUp() called"); // to remove
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
  contentDiv.innerHTML = getSignupForm(text);

  // show password button
  const togglePasswdBtn = document.getElementById('togglePasswd') as HTMLButtonElement;
  if (!togglePasswdBtn)
    console.error("Failed to find togglePasswdBtn element");

  const passwdInput = document.getElementById('passwd') as HTMLInputElement;
  if (!passwdInput)
    console.error("Failed to find passwdInput element");

  if (togglePasswdBtn && passwdInput) {
    togglePasswdBtn.addEventListener("click", () => {
      const isPassword = passwdInput.type === "password";
      passwdInput.type = isPassword ? "text" : "password";
    });
  }

  const togglePasswdConfirmBtn = document.getElementById('togglePasswdConfirm') as HTMLButtonElement;
  if (!togglePasswdConfirmBtn)
    console.error("Failed to find togglePasswdConfirmBtn element");

  const passwdConfirmInput = document.getElementById('passwdConfirm') as HTMLInputElement;
  if (!passwdConfirmInput)
    console.error("Failed to find passwdConfirmInput element");

  if (togglePasswdConfirmBtn && passwdConfirmInput) {
    togglePasswdConfirmBtn.addEventListener("click", () => {
      const isPassword = passwdConfirmInput.type === "password";
      passwdConfirmInput.type = isPassword ? "text" : "password";
    });
  }

  // sign up form
  const form = document.querySelector("form") as HTMLFormElement;
  if (!form)
    console.error("Failed to find form element");
  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    const errorDiv = document.getElementById('formErrors') as HTMLDivElement;
    if (!errorDiv)
      console.error("Failed to find errorDiv element");

    const loginInput = form.querySelector('input[id="login"]') as HTMLInputElement;
    if (!loginInput)
      console.error("Failed to find input element");
    const login = loginInput.value.trim();

    const emailInput = form.querySelector('input[id="email"]') as HTMLInputElement;
    if (!emailInput)
      console.error("Failed to find input element");
    const email = emailInput.value.trim();

    const passwdInput = form.querySelector('input[id="passwd"]') as HTMLInputElement;
    if (!passwdInput)
      console.error("Failed to find input element");
    const passwd = passwdInput.value.trim();

    const passwdConfirmInput = form.querySelector('input[id="passwdConfirm"]') as HTMLInputElement;
    if (!passwdConfirmInput)
      console.error("Failed to find input element");
    const passwdConfirm = passwdConfirmInput.value.trim();
    
    const errors: string[] = [];
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(text.errEmail);
    }

    if (passwd.length < 8) {
      errors.push(text.errLength);
    }
    if (!/[A-Z]/.test(passwd)) {
      errors.push(text.errUpper);
    }
    if (!/[a-z]/.test(passwd)) {
      errors.push(text.errLower);
    }
    if (!/[0-9]/.test(passwd)) {
      errors.push(text.errNbr);
    }
    if (passwdConfirm !== undefined && passwd !== passwdConfirm) {
      errors.push(text.errMatch);
    }
    if (errors.length > 0) {
      errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
      return;
    }

    errorDiv.innerHTML = '';

    // To remove after auth working
    const view = 'signup';
    showVerificationCode(text, view);

  });

  // back button
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  backBtn.addEventListener("click", () => showHome(text));
	initLoginButton()
}

// show verification code for 2FA
function showVerificationCode(text: Translations, view: string) {
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv) {
    console.error("Failed to find content element");
    return;
  }

  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-4 text-white">${text.verifyTitle}</h2>
    <p class="text-white mb-4">${text.verifyInstruction}</p>
    <div id="codeContainer" class="flex justify-center space-x-2">
      ${Array.from({ length: 6 })
        .map((_, i) => `<input id="code-${i}" type="text" maxlength="1" class="w-10 h-10 text-center rounded bg-gray-700 text-white focus:outline-none" />`)
        .join('')}
    </div>
    <button id="verifyBtn" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">${text.verify}</button>
    <br>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;

  const inputs = document.querySelectorAll<HTMLInputElement>('#codeContainer input');
  if (!inputs)
    console.error("Failed to find inputs element");
  inputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '');
      if (input.value.length === 1 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
    });
  });

  // verify button
  const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement;
  if (!verifyBtn)
    console.error("Failed to find verifyBtn element");
  verifyBtn.addEventListener('click', () => {
    const code = Array.from(inputs).map(i => i.value).join('');
  });

  // back button
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  if (view === 'signin')
    backBtn.addEventListener("click", () => showSignIn(text));
  else if (view === 'signup')
    backBtn.addEventListener("click", () => showSignUp(text));
}

function showSignIn(text: Translations) {
  console.log(">> showSignIn() called");  // to remove
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.signinTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" required placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <div class="relative">
        <input type="password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
        <button type="button" id="togglePasswd" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
          👁️
        </button>
      </div>
      <button id="forgotPasswd" type="submit" class="text-sm italic bg-transparent text-red-600 border-none hover:underline">${text.forgotPasswd}</button>
      <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signin}</button>
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
  const togglePasswdBtn = document.getElementById('togglePasswd') as HTMLButtonElement;
  if (!togglePasswdBtn)
    console.error("Failed to find togglePasswdBtn element");

  const passwdInput = document.querySelector('input[type="password"]') as HTMLInputElement;
  if (!passwdInput)
    console.error("Failed to find passwdInput element");

  if (togglePasswdBtn && passwdInput) {
    togglePasswdBtn.addEventListener("click", () => {
      const isPassword = passwdInput.type === "password";
      passwdInput.type = isPassword ? "text" : "password";
    });
  }

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
    showVerificationCode(text, view);
  });

  // forgot password button
  const forgotPasswd = document.getElementById("forgotPasswd") as HTMLButtonElement;
  if (!forgotPasswd)
    console.error("Failed to find forgotPasswd element");
  forgotPasswd.addEventListener("click", () => showForgotPasswd(text));

  // back button
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  backBtn.addEventListener("click", () => showHome(text));
}

function showForgotPasswd(text: Translations) {
  console.log(">> showForgotPasswd() called");  // to remove
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.forgotPasswd}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" placeholder="${text.email}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <button type="forgotPasswd" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.resetPasswd}</button>
      <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
      </form>
  `;

  // back button
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  backBtn.addEventListener("click", () => showSignIn(text));
}

function showGuestPlay(text: Translations) {
  console.log(">> showGuestPlay() called");  // to remove
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
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
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  backBtn.addEventListener("click", () => showHome(text));
}

function showOptions(text: Translations) {
  console.log(">> showOptions() called");  // to remove
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
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
  const langToggleBtn = document.getElementById('langToggleBtn') as HTMLButtonElement;
  if (!langToggleBtn)
    console.error("Failed to find langToggleBtn element");
  langToggleBtn.addEventListener('click', toggleLanguage);

  // back button
  const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
  if (!backBtn)
    console.error("Failed to find backBtn element");
  backBtn.addEventListener("click", () => showHome(text));}

function showHome(text: Translations) {
	cleanListeners()
  if (!text) return;
  const contentDiv = document.getElementById('content') as HTMLDivElement;
  if (!contentDiv)
    console.error("Failed to find content element");
  contentDiv.innerHTML = `
    <h1 id="title" class="text-2xl font-bold text-white mb-6">${text.title}</h1>
    <div class="flex flex-col space-y-4" id="buttonsContainer">
      <button id="signupBtn" class="bg-transparent text-red-600 border-none hover:underline">${text.signup}</button>
      <button id="signinBtn" class="bg-transparent text-white border-none hover:underline">${text.signin}</button>
      <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
      <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
      <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
    </div>
  `;

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

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' }
];

let currentLangIndex = 0;
let currentTexts = null;

async function loadLanguage(langCode: string, view = 'home') {
  try {
    const res = await fetch(`/api/translations?lang=${langCode}`);
    if (!res.ok) throw new Error('Failed to load translations');

    const data = await res.json();
    currentTexts = data.text;
    currentLangIndex = languages.findIndex(l => l.code === langCode);
    if (currentLangIndex === -1) currentLangIndex = 0;
    if (view === 'options')
      showOptions(currentTexts);
    else
      showHome(currentTexts);
  } catch (err) {
    console.error(err);
  }
}

function toggleLanguage() {
  currentLangIndex = (currentLangIndex + 1) % languages.length;
  const nextLang = languages[currentLangIndex].code;
  loadLanguage(nextLang, 'options');
}

// loadLanguage(languages[currentLangIndex].code);