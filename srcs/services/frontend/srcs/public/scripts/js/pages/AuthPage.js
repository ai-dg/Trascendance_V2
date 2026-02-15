import { CheckManager } from '../modules/CheckManager.js';
import { Logger } from '../modules/Logger.js';
export class AuthPage {
    constructor(uiManager, authManager, checkManager, languageManager, onLogin, onRegister, onForgotPassword, onChangePassword, onPlayAsGuest, onError) {
        this.isLogin = true;
        this.showForgotPassword = false;
        this.showChangePassword = false;
        this.formData = {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        };
        this.errors = [];
        this.text = {};
        this.uiManager = uiManager;
        this.authManager = authManager;
        this.languageManager = languageManager;
        this.onLogin = onLogin;
        this.onRegister = onRegister;
        this.onForgotPassword = onForgotPassword;
        this.onChangePassword = onChangePassword;
        this.onPlayAsGuest = onPlayAsGuest;
        this.onError = onError;
        this.boundHandleSubmit = this.handleSubmit.bind(this);
        this.checkManager = new CheckManager(this.languageManager);
        this.authManager.setHandlers({
            onChangePasswordRequest: this.handleChangePassword.bind(this),
        });
    }
    t(key) {
        return this.languageManager.t(key);
    }
    //////////////////////////////////////////////
    //////////////////DESIGN PAGE ////////////////
    //////////////////////////////////////////////
    render() {
        console.log("render: ", this.showChangePassword);
        const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10');
        content.style.width = '600px';
        const card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-3x2 mb-2', this.showForgotPassword
            ? this.t('reset_password')
            : this.showChangePassword
                ? this.t('change_password')
                : (this.isLogin ? this.t('login') : this.t('register')));
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-sm', this.showForgotPassword
            ? this.t('enter_email_to_reset')
            : this.showChangePassword
                ? this.t('enter_new_password')
                : this.t(''));
        header.appendChild(title);
        header.appendChild(subtitle);
        // Error messages
        if (this.errors.length > 0) {
            const errorContainer = this.uiManager.createElement('div', 'mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg');
            this.errors.forEach(error => {
                const errorDiv = this.uiManager.createElement('div', 'retro-text text-sm text-red-400', error);
                errorContainer.appendChild(errorDiv);
            });
            card.appendChild(errorContainer);
        }
        // Form
        const form = this.uiManager.createElement('form', 'space-y-6');
        form.addEventListener('submit', this.boundHandleSubmit);
        if (this.showForgotPassword) {
            const emailField = this.createField(this.t('email'), 'email', 'email', this.t('enter_email'));
            form.appendChild(emailField);
            const submitButton = this.uiManager.createButton(this.t('reset_password'), 'retro-button auth-btn auth-btn-primary', () => this.onForgotPassword(this.formData.email));
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        else if (this.showChangePassword) {
            const passwordField = this.createField(this.t('password'), 'password', 'password', this.t('enter_new_password_placeholder'));
            const passwordConfirmField = this.createField(this.t('password_confirm'), 'password', 'confirmPassword', this.t('enter_again_new_password'));
            form.appendChild(passwordField);
            form.appendChild(passwordConfirmField);
            const submitButton = this.uiManager.createButton(this.t('change_password'), 'retro-button auth-btn auth-btn-primary', () => { });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        else {
            const usernameField = this.createField(this.t('username'), 'text', 'username', this.t('enter_username'));
            form.appendChild(usernameField);
            if (!this.isLogin) {
                const emailField = this.createField(this.t('email'), 'email', 'email', this.t('enter_email'));
                form.appendChild(emailField);
            }
            const passwordField = this.createField(this.t('password'), 'password', 'password', this.t('enter_password'));
            form.appendChild(passwordField);
            if (!this.isLogin) {
                const confirmPasswordField = this.createField(this.t('confirm_password'), 'password', 'confirmPassword', this.t('confirm_password_placeholder'));
                form.appendChild(confirmPasswordField);
            }
            const submitButton = this.uiManager.createButton(this.isLogin ? this.t('login') : this.t('create_account'), this.isLogin
                ? 'retro-button auth-btn auth-btn-primary text-lg'
                : 'retro-button auth-btn auth-btn-oauth', () => { });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        // Toggle section
        const toggleContainer = this.uiManager.createElement('div', 'text-center mt-6');
        if (this.showForgotPassword) {
            const backToLoginButton = this.uiManager.createElement('button', 'toggle-link');
            backToLoginButton.textContent = this.t('back_to_login');
            backToLoginButton.type = 'button';
            backToLoginButton.addEventListener('click', this.handleBackToLogin.bind(this));
            toggleContainer.appendChild(backToLoginButton);
        }
        else if (this.showChangePassword) {
            const backToLoginButton = this.uiManager.createElement('button', 'toggle-link');
            backToLoginButton.textContent = this.t('wrong_email');
            backToLoginButton.type = 'button';
            backToLoginButton.addEventListener('click', this.handleBackToForgotPassword.bind(this));
            toggleContainer.appendChild(backToLoginButton);
        }
        else {
            const toggleButton = this.uiManager.createElement('button', 'toggle-link');
            toggleButton.textContent = this.isLogin ? this.t('dont_have_account') : this.t('already_have_account');
            toggleButton.type = 'button';
            toggleButton.addEventListener('click', this.toggleMode.bind(this));
            toggleContainer.appendChild(toggleButton);
            if (this.isLogin) {
                const forgotPasswordContainer = this.uiManager.createElement('div', 'text-center mt-3');
                const forgotPasswordButton = this.uiManager.createElement('button', 'toggle-link');
                forgotPasswordButton.textContent = this.t('forgot_your_password');
                forgotPasswordButton.type = 'button';
                forgotPasswordButton.addEventListener('click', this.handleForgotPassword.bind(this));
                forgotPasswordContainer.appendChild(forgotPasswordButton);
                toggleContainer.appendChild(forgotPasswordContainer);
            }
        }
        card.appendChild(header);
        card.appendChild(form);
        if (!this.showForgotPassword || !this.showChangePassword) {
            const oauthContainer = this.uiManager.createElement('div', 'mt-6 space-y-3');
            const divider = this.uiManager.createElement('div', 'flex items-center my-4');
            const dividerLine = this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent');
            divider.appendChild(dividerLine);
            divider.appendChild(this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent'));
            // Register buttons
            const auth42Btn = this.uiManager.createButton(this.t('sign_in_with_42'), 'retro-button auth-btn auth-btn-42', () => this.handle42SignIn());
            oauthContainer.appendChild(divider);
            oauthContainer.appendChild(auth42Btn);
            const playAsGuestBtn = this.uiManager.createButton(this.t('play_as_guest'), 'retro-button auth-btn auth-btn-guest', this.onPlayAsGuest);
            oauthContainer.appendChild(playAsGuestBtn);
            card.appendChild(oauthContainer);
        }
        card.appendChild(toggleContainer);
        card.appendChild(this.createLanguageSelector());
        content.appendChild(card);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
    //////////////////////////////////////////////
    ///////////// CREATE ELEMENTS ////////////////
    //////////////////////////////////////////////
    createField(label, type, name, placeholder) {
        const fieldContainer = this.uiManager.createElement('div');
        const labelElement = this.uiManager.createElement('label', 'retro-text text-sm block mb-2', label);
        fieldContainer.appendChild(labelElement);
        const input = this.uiManager.createInput(type, placeholder, 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        input.value = this.formData[name];
        // Add autocomplete attribute for password fields
        if (type === 'password') {
            if (this.isLogin && name === 'password') {
                input.setAttribute('autocomplete', 'current-password');
            }
            else if (!this.isLogin || this.showChangePassword || this.showForgotPassword) {
                input.setAttribute('autocomplete', 'new-password');
            }
        }
        else if (type === 'email') {
            input.setAttribute('autocomplete', 'email');
        }
        else if (name === 'username') {
            input.setAttribute('autocomplete', 'username');
        }
        input.addEventListener('input', (e) => {
            const target = e.target;
            this.formData[name] = target.value;
            if (this.errors.length > 0) {
                this.errors = [];
                this.render();
            }
        });
        fieldContainer.appendChild(input);
        return fieldContainer;
    }
    createLanguageSelector() {
        const languages = [
            { code: "en", flag: "🇬🇧" },
            { code: "fr", flag: "🇫🇷" },
            { code: "pt", flag: "🇧🇷" },
            { code: "et", flag: "🇪🇪" },
        ];
        const currentLangCode = this.languageManager.getCurrentLang();
        let currentLangIndex = languages.findIndex(l => l.code === currentLangCode);
        if (currentLangIndex === -1)
            currentLangIndex = 0;
        const wrapper = this.uiManager.createElement("div", "flex items-center justify-center gap-2 mt-6 cursor-pointer");
        const label = this.uiManager.createElement("span", "retro-text text-[#ff1493]", "LANGUAGE:");
        const flag = this.uiManager.createElement("span", "text-2xl", languages[currentLangIndex].flag);
        flag.addEventListener("click", async () => {
            currentLangIndex = (currentLangIndex + 1) % languages.length;
            const nextLang = languages[currentLangIndex];
            flag.textContent = nextLang.flag;
            try {
                await this.languageManager.setLang(nextLang.code);
                await this.languageManager.loadTranslations();
                this.render();
            }
            catch (err) {
                Logger.info("Language change failed:", err);
            }
        });
        wrapper.appendChild(label);
        wrapper.appendChild(flag);
        return wrapper;
    }
    toggleMode() {
        this.isLogin = !this.isLogin;
        this.formData = { username: '', email: '', password: '', confirmPassword: '' };
        this.errors = [];
        this.render();
    }
    //////////////////////////////////////////////
    ///////////// HANDLERS ///////////////////////
    //////////////////////////////////////////////
    handle42SignIn() {
        console.log('42 Sign In clicked');
        window.location.href = `${window.location.origin}/auth/42/login`;
    }
    handleForgotPassword() {
        this.showForgotPassword = true;
        this.errors = [];
        this.render();
    }
    handleChangePassword() {
        this.showForgotPassword = false;
        this.showChangePassword = true;
        this.errors = [];
        this.render();
    }
    handleBackToLogin() {
        this.showForgotPassword = false;
        this.errors = [];
        this.render();
    }
    handleBackToForgotPassword() {
        this.showChangePassword = false;
        this.showForgotPassword = true;
        this.errors = [];
        this.render();
    }
    handleSubmit(e) {
        console.log("handleSubmit called");
        e.preventDefault();
        this.errors = [];
        if (this.showForgotPassword) {
            if (!this.formData.email) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            this.onForgotPassword(this.formData.email);
            return;
        }
        else if (this.showChangePassword) {
            if (!this.formData.password || !this.formData.confirmPassword) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            console.log(this.formData.password, " ", this.formData.confirmPassword);
            if (this.formData.password !== this.formData.confirmPassword) {
                console.log("strings dont match");
                const newErrors = [];
                newErrors.push('Password do not match');
                this.errors = newErrors;
                this.render();
                return;
            }
            const passwordErrors = this.checkManager.checkPassword(this.formData.password);
            if (passwordErrors.length > 0) {
                this.errors = passwordErrors;
                this.render();
                return;
            }
            console.log("strings matched");
            this.onChangePassword(this.formData.email, this.formData.password, this.formData.confirmPassword);
            return;
        }
        else if (this.isLogin) {
            if (!this.formData.username || !this.formData.password) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            this.onLogin(this.formData.username, this.formData.password);
            return;
        }
        else {
            const newErrors = [];
            if (!this.formData.username || !this.formData.email || !this.formData.password || !this.formData.confirmPassword) {
                newErrors.push('Please fill in all fields');
            }
            if (this.formData.password !== this.formData.confirmPassword) {
                newErrors.push('Passwords do not match');
            }
            if (this.formData.password.length < 6) {
                newErrors.push('Password must be at least 6 characters');
            }
            if (!/\S+@\S+\.\S+/.test(this.formData.email)) {
                newErrors.push('Please enter a valid email');
            }
            if (newErrors.length > 0) {
                this.errors = newErrors;
                this.render();
                return;
            }
            this.onRegister(this.formData.username, this.formData.email, this.formData.password, this.formData.confirmPassword);
            return;
        }
    }
    //////////////////////////////////////////////
    ///////////// SHOW FUNCTIONS /////////////////
    //////////////////////////////////////////////
    showError(error) {
        this.errors = [error];
        this.render();
    }
    showLogin() {
        this.showForgotPassword = false;
        this.showChangePassword = false;
        this.isLogin = true;
        this.errors = [];
        this.render();
    }
}
