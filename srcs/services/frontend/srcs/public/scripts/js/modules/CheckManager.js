import { AuthManager } from "./AuthManager.js";
export class CheckManager {
    // TODO: maybe should get Translations text in the constructor
    constructor() {
        this.auth = new AuthManager(() => console.log("To register user or login in someone"));
    }
    getElement(id) {
        const el = document.getElementById(id);
        if (!el)
            throw new Error(`Element #${id} not found`);
        return el;
    }
    checkEmail(text, email) {
        const errors = [];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(text.errEmail);
        return errors;
    }
    checkPassword(text, passwd) {
        const errors = [];
        if (passwd.length < 8)
            errors.push(text.errLength);
        if (!/[A-Z]/.test(passwd))
            errors.push(text.errUpper);
        if (!/[a-z]/.test(passwd))
            errors.push(text.errLower);
        if (!/[0-9]/.test(passwd))
            errors.push(text.errNbr);
        return errors;
    }
    checkUsername(text, login) {
        const errors = [];
        if (!/^[A-Za-z0-9]+$/.test(login)) {
            errors.push(text.errInvalidChars || "Username can only have lettres and numbers");
        }
        if (login.length < 3)
            errors.push(text.errTooShort || "Username too short");
        if (login.length > 20)
            errors.push(text.errTooLong || "Username too long");
        return errors;
    }
    checkForm(text, login, email, passwd) {
        let errors = [];
        errors = errors.concat(this.checkUsername(text, login));
        errors = errors.concat(this.checkEmail(text, email));
        errors = errors.concat(this.checkPassword(text, passwd));
        return errors;
    }
    setupSignUpForm(form, text) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const login = form.querySelector('#login').value.trim();
            const email = form.querySelector('#email').value.trim();
            const passwd = form.querySelector('#passwd').value.trim();
            const passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
            const errorDiv = this.getElement('formErrors');
            const errors = this.checkForm(text, login, email, passwd);
            if (passwd != passwdConfirm)
                errors.concat("Passwords dont match!");
            if (errors.length > 0) {
                errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
                return;
            }
            errorDiv.innerHTML = '';
            this.auth.registerUser(login, passwd, email, text, 'signup');
        });
    }
    setupChangePassForm(form, text) {
        return new Promise((resolve, reject) => {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const passwd = form.querySelector('#passwd').value.trim();
                const passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
                const errorDiv = this.getElement('formErrors');
                let errors = [];
                if (!passwd || !passwdConfirm) {
                    reject(new Error("Input elements not found"));
                    return;
                }
                if (passwd != passwdConfirm)
                    errors.concat("Passwords dont match!");
                errors = errors.concat(this.checkPassword(text, passwd));
                if (errors.length > 0) {
                    errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
                    return;
                }
                errorDiv.innerHTML = '';
                resolve(passwd);
            });
        });
    }
}
// export function setupPasswordToggle(buttonId: string, inputId: string) {
//   const btn = getElement<HTMLButtonElement>(buttonId);
//   const input = getElement<HTMLInputElement>(inputId);
//   btn.addEventListener("click", () => {
//     input.type = input.type === "password" ? "text" : "password";
//   });
// }
// // show verification code for 2FA
// export async function showVerificationCode(text: Translations, view: string, params: params): Promise<boolean> {
//   return new Promise((resolve) => {
//   const contentDiv = getElement<HTMLDivElement>('content');
//   contentDiv.innerHTML = `
//     <h2 class="otp-check text-xl font-bold mb-4 text-white">${text.verifyTitle}</h2>
//     <p class="text-white mb-4">${text.verifyInstruction}</p>
//     <div id="codeContainer" class="flex justify-center space-x-2">
//       ${Array.from({ length: 6 })
//         .map((_, i) => `<input id="code-${i}" type="text" maxlength="1" class="w-10 h-10 text-center rounded bg-gray-700 text-white focus:outline-none" />`)
//         .join('')}
//     </div>
//     <button id="verifyBtn" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">${text.verify}</button>
//     <br>
//     <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
//   `;
//   const inputs = document.querySelectorAll<HTMLInputElement>('#codeContainer input');
//   if (!inputs)
//     console.error("Failed to find inputs element");
//   inputs.forEach((input, idx) => {
//     input.addEventListener('input', () => {
//       input.value = input.value.replace(/\D/g, '');
//       if (input.value.length === 1 && idx < inputs.length - 1) {
//         inputs[idx + 1].focus();
//       }
//     });
//   });
//   // verify button
//   const verifyBtn = getElement<HTMLButtonElement>('verifyBtn');
//   verifyBtn.addEventListener('click', async () => {
//     const is_valid = await OTPValidationHandler(params, inputs);
//     resolve(!!is_valid);
//   });
//   // back button
//   setupBackButton(text, view);
// });
// }
