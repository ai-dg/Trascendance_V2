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
