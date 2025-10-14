import { AuthManager } from "./AuthManager.js";
import { Translations } from "./TypesManager.js";


export class CheckManager {
    private auth: AuthManager;

    // TODO: maybe should get Translations text in the constructor
    constructor() {
        this.auth = new AuthManager(() => 
            console.log("To register user or login in someone"));
    }


    public getElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el)
            throw new Error(`Element #${id} not found`);
        return el as T;
    }

    public checkEmail(text: Translations, email: string): string[] {
        const errors: string[] = [];

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(text.errEmail);
        return errors;
    }


    public checkPassword(text: Translations, passwd: string) {
        const errors: string[] = [];

        if (passwd.length < 8) errors.push(text.errLength);
        if (!/[A-Z]/.test(passwd)) errors.push(text.errUpper);
        if (!/[a-z]/.test(passwd)) errors.push(text.errLower);
        if (!/[0-9]/.test(passwd)) errors.push(text.errNbr);

        return errors;
    }

    public checkUsername(text: Translations, login: string) {
        const errors: string[] = [];

        if (!/^[A-Za-z0-9]+$/.test(login)) {
           errors.push(text.errInvalidChars || "Username can only have lettres and numbers");
        }

        if (login.length < 3) errors.push(text.errTooShort || "Username too short");
        if (login.length > 20) errors.push(text.errTooLong || "Username too long");

        return errors;
    }

    private checkForm(text: Translations, login: string, email: string, passwd: string) {
        let errors: string[] = [];

        errors = errors.concat(this.checkUsername(text, login));
        errors = errors.concat(this.checkEmail(text, email));
        errors = errors.concat(this.checkPassword(text, passwd));

        return errors;
        
    }


    public setupSignUpForm(form: HTMLFormElement, text: Translations) {
      form.addEventListener("submit", (e: Event) => {
        e.preventDefault();
    
        const login = (form.querySelector('#login') as HTMLInputElement).value.trim();
        const email = (form.querySelector('#email') as HTMLInputElement).value.trim();
        const passwd = (form.querySelector('#passwd') as HTMLInputElement).value.trim();
        const passwdConfirm = (form.querySelector('#passwdConfirm') as HTMLInputElement).value.trim();
    
        const errorDiv = this.getElement<HTMLDivElement>('formErrors');
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


    public setupChangePassForm(form: HTMLFormElement, text: Translations) {
        return new Promise((resolve, reject) => {
            form.addEventListener("submit", (e: Event) => {
                e.preventDefault();

                const passwd = (form.querySelector('#passwd') as HTMLInputElement).value.trim();
                const passwdConfirm = (form.querySelector('#passwdConfirm') as HTMLInputElement).value.trim();

                const errorDiv = this.getElement<HTMLDivElement>('formErrors');
                let errors: string[] = [];

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

