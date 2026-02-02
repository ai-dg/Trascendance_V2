import { AuthManager } from "./AuthManager.js";
export class CheckManager {
    auth;
    languageManager;
    // TODO: maybe should get Translations text in the constructor
    constructor(languageManager) {
        this.auth = new AuthManager(() => console.log("To register user or login in someone"));
        this.languageManager = languageManager;
    }
    t(key) {
        return this.languageManager.t(key);
    }
    getElement(id) {
        const el = document.getElementById(id);
        if (!el)
            throw new Error(`Element #${id} not found`);
        return el;
    }
    checkEmail(email) {
        const errors = [];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(this.t('errEmail'));
        return errors;
    }
    checkPassword(passwd) {
        const errors = [];
        if (passwd.length < 8)
            errors.push(this.t('errLength'));
        if (!/[A-Z]/.test(passwd))
            errors.push(this.t('errUpper'));
        if (!/[a-z]/.test(passwd))
            errors.push(this.t('errLower'));
        if (!/[0-9]/.test(passwd))
            errors.push(this.t('errNbr'));
        return errors;
    }
    checkUsername(login) {
        const errors = [];
        if (!/^[A-Za-z0-9]+$/.test(login)) {
            errors.push(this.t('errInvalidChars') || "Username can only have lettres and numbers");
        }
        if (login.length < 3)
            errors.push(this.t('errTooShort') || "Username too short");
        if (login.length > 20)
            errors.push(this.t('errTooLong') || "Username too long");
        return errors;
    }
    checkForm(login, email, passwd) {
        let errors = [];
        errors = errors.concat(this.checkUsername(login));
        errors = errors.concat(this.checkEmail(email));
        errors = errors.concat(this.checkPassword(passwd));
        return errors;
    }
    setupSignUpForm(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const login = form.querySelector('#login').value.trim();
            const email = form.querySelector('#email').value.trim();
            const passwd = form.querySelector('#passwd').value.trim();
            const passwdConfirm = form.querySelector('#passwdConfirm').value.trim();
            const errorDiv = this.getElement('formErrors');
            const errors = this.checkForm(login, email, passwd);
            if (passwd != passwdConfirm)
                errors.concat("Passwords dont match!");
            if (errors.length > 0) {
                errorDiv.innerHTML = errors.map(err => `<p>- ${err}</p>`).join('');
                return;
            }
            errorDiv.innerHTML = '';
            this.auth.registerUser(login, passwd, email, 'signup');
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
                errors = errors.concat(this.checkPassword(passwd));
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
//# sourceMappingURL=CheckManager.js.map