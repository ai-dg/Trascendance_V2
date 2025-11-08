import { AuthManager } from "./AuthManager.js";
import type { LanguageManager } from "./LangManager.js";
import type { Translations } from "./TypesManager.js";


export class CheckManager {
    private auth: AuthManager;
    private languageManager: LanguageManager;

    // TODO: maybe should get Translations text in the constructor
    constructor(languageManager: LanguageManager) {
        this.auth = new AuthManager(() => 
            console.log("To register user or login in someone"));
        this.languageManager = languageManager;
    }
    
    private t(key: string): string {
        return this.languageManager.t(key);
    }
    

    public getElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id);
        if (!el)
            throw new Error(`Element #${id} not found`);
        return el as T;
    }

    public checkEmail(email: string): string[] {
        const errors: string[] = [];

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push(this.t('errEmail'));
        return errors;
    }


    public checkPassword(passwd: string) {
        const errors: string[] = [];

        if (passwd.length < 8) errors.push(this.t('errLength'));
        if (!/[A-Z]/.test(passwd)) errors.push(this.t('errUpper'));
        if (!/[a-z]/.test(passwd)) errors.push(this.t('errLower'));
        if (!/[0-9]/.test(passwd)) errors.push(this.t('errNbr'));

        return errors;
    }

    public checkUsername(login: string) {
        const errors: string[] = [];

        if (!/^[A-Za-z0-9]+$/.test(login)) {
           errors.push(this.t('errInvalidChars') || "Username can only have lettres and numbers");
        }

        if (login.length < 3) errors.push(this.t('errTooShort') || "Username too short");
        if (login.length > 20) errors.push(this.t('errTooLong') || "Username too long");

        return errors;
    }

    private checkForm(login: string, email: string, passwd: string) {
        let errors: string[] = [];

        errors = errors.concat(this.checkUsername(login));
        errors = errors.concat(this.checkEmail(email));
        errors = errors.concat(this.checkPassword(passwd));

        return errors;
        
    }


    public setupSignUpForm(form: HTMLFormElement) {
      form.addEventListener("submit", (e: Event) => {
        e.preventDefault();
    
        const login = (form.querySelector('#login') as HTMLInputElement).value.trim();
        const email = (form.querySelector('#email') as HTMLInputElement).value.trim();
        const passwd = (form.querySelector('#passwd') as HTMLInputElement).value.trim();
        const passwdConfirm = (form.querySelector('#passwdConfirm') as HTMLInputElement).value.trim();
    
        const errorDiv = this.getElement<HTMLDivElement>('formErrors');
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

