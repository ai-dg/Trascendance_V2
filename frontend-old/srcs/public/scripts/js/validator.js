import { getElement } from "./script.js";
import { setupBackButton } from "./navigation.js";
import { registerUser } from "./login.js";
import { OTPValidationHandler } from "./handlers.js";
export function setupPasswordToggle(buttonId, inputId) {
    const btn = getElement(buttonId);
    const input = getElement(inputId);
    btn.addEventListener("click", () => {
        input.type = input.type === "password" ? "text" : "password";
    });
}
export function validateForm(login, email, passwd, passwdConfirm, text) {
    const errors = [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push(text.errEmail);
    if (passwd.length < 8)
        errors.push(text.errLength);
    if (!/[A-Z]/.test(passwd))
        errors.push(text.errUpper);
    if (!/[a-z]/.test(passwd))
        errors.push(text.errLower);
    if (!/[0-9]/.test(passwd))
        errors.push(text.errNbr);
    if (passwd !== passwdConfirm)
        errors.push(text.errMatch);
    return errors;
}
export function setupSignUpForm(form, text) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const login = form.querySelector('#login').value.trim();
        const email = form.querySelector('#email').value.trim();
        const passwd = form.querySelector('#passwd').value.trim();
        const passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
        const errorDiv = getElement('formErrors');
        const errors = validateForm(login, email, passwd, passwdConfirm, text);
        if (errors.length > 0) {
            errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
            return;
        }
        errorDiv.innerHTML = '';
        registerUser(login, passwd, email, text, 'signup');
    });
}
export function setupChangePassForm(form, text) {
    return new Promise((resolve, reject) => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const passwd = form.querySelector('#passwd').value.trim();
            const passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
            const errorDiv = getElement('formErrors');
            const errors = [];
            if (!passwd || !passwdConfirm) {
                reject(new Error("Input elements not found"));
                return;
            }
            // check password validity
            errorDiv.innerHTML = '';
            if (passwd.length < 8)
                errors.push(text.errLength);
            if (!/[A-Z]/.test(passwd))
                errors.push(text.errUpper);
            if (!/[a-z]/.test(passwd))
                errors.push(text.errLower);
            if (!/[0-9]/.test(passwd))
                errors.push(text.errNbr);
            if (passwd !== passwdConfirm)
                errors.push(text.errMatch);
            if (errors.length > 0) {
                errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
                return;
            }
            errorDiv.innerHTML = '';
            // Add change [password method]
            resolve(passwd);
        });
    });
}
// show verification code for 2FA
export async function showVerificationCode(text, view, params) {
    return new Promise((resolve) => {
        const contentDiv = getElement('content');
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
        const inputs = document.querySelectorAll('#codeContainer input');
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
        const verifyBtn = getElement('verifyBtn');
        verifyBtn.addEventListener('click', async () => {
            const is_valid = await OTPValidationHandler(params, inputs);
            resolve(!!is_valid);
        });
        // back button
        setupBackButton(text, view);
    });
}
