import { getElement, showSignIn, showSignUp, showHome, showGuestPlay, showForgotPasswd, showOptions } from "./script.js";
import { params, Translations } from "./types.js";
import { registerUser } from "./login.js";
import { OTPValidationHandler } from "./handlers.js";

export function setupPasswordToggle(buttonId: string, inputId: string) {
  const btn = getElement<HTMLButtonElement>(buttonId);
  const input = getElement<HTMLInputElement>(inputId);

  btn.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
  });
}

export function validateForm(login: string, email: string, passwd: string, passwdConfirm: string, text: Translations): string[] {
  const errors: string[] = [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(text.errEmail);
  if (passwd.length < 8) errors.push(text.errLength);
  if (!/[A-Z]/.test(passwd)) errors.push(text.errUpper);
  if (!/[a-z]/.test(passwd)) errors.push(text.errLower);
  if (!/[0-9]/.test(passwd)) errors.push(text.errNbr);
  if (passwd !== passwdConfirm) errors.push(text.errMatch);

  return errors;
}

export function setupSignUpForm(form: HTMLFormElement, text: Translations) {
  form.addEventListener("submit", (e: Event) => {
    e.preventDefault();

    const login = (form.querySelector('#login') as HTMLInputElement).value.trim();
    const email = (form.querySelector('#email') as HTMLInputElement).value.trim();
    const passwd = (form.querySelector('#passwd') as HTMLInputElement).value.trim();
    const passwdConfirm = (form.querySelector('#passwdConfirm') as HTMLInputElement).value.trim();

    const errorDiv = getElement<HTMLDivElement>('formErrors');
    const errors = validateForm(login, email, passwd, passwdConfirm, text);

    if (errors.length > 0) {
      errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
      return;
    }

    errorDiv.innerHTML = '';
    registerUser(login, passwd, email, text, 'signup');
  });
}

// show verification code for 2FA
export function showVerificationCode(text: Translations, view: string, params: params) {
  const contentDiv = getElement<HTMLDivElement>('content');

  contentDiv.innerHTML = `
    <h2 class="otp-check text-xl font-bold mb-4 text-white">${text.verifyTitle}</h2>
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
  const verifyBtn = getElement<HTMLButtonElement>('verifyBtn');
  verifyBtn.addEventListener('click', async () => OTPValidationHandler(params, inputs));

  // back button
  setupBackButton(text, view);
}

export function setupBackButton(text: Translations, view: string) {
  const backBtn = getElement<HTMLButtonElement>("backBtn");

  backBtn.addEventListener("click", () => {
    switch (view) {
      case "signin":
        showSignIn(text);
        break;
      case "signup":
        showSignUp(text);
        break;
      default:
        showHome(text);
        break;
    }
  });
}

