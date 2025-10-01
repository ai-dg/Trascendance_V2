export class AuthPage {
    constructor(uiManager, onLogin, onRegister, onForgotPassword, onPlayAsGuest, onError) {
        this.isLogin = true;
        this.showForgotPassword = false;
        this.formData = {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        };
        this.errors = [];
        this.text = {};
        this.uiManager = uiManager;
        this.onLogin = onLogin;
        this.onRegister = onRegister;
        this.onForgotPassword = onForgotPassword;
        this.onPlayAsGuest = onPlayAsGuest;
        this.onError = onError;
    }
    render() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
        const card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-3x2 mb-2', this.showForgotPassword ? 'RESET PASSWORD' : (this.isLogin ? 'LOGIN' : 'REGISTER'));
        const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-sm', this.showForgotPassword ? 'ENTER YOUR EMAIL TO RESET' : (this.isLogin ? 'ACCESS THE ARCADE' : 'JOIN THE ARCADE'));
        header.appendChild(title);
        header.appendChild(subtitle);
        // Error Messages
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
        form.addEventListener('submit', this.handleSubmit.bind(this));
        if (this.showForgotPassword) {
            // Forgot Password Form - only email field
            const emailField = this.createField('EMAIL', 'email', 'email', 'Enter your email');
            form.appendChild(emailField);
            // Submit button for forgot password
            const submitButton = this.uiManager.createButton('RESET PASSWORD', 'w-full retro-button bg-[#ff1493] text-black hover:bg-transparent hover:text-[#ff1493] border-2 border-[#ff1493] py-3', () => this.onForgotPassword(this.formData.email));
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        else {
            // Normal Login/Register Form
            // Username field
            const usernameField = this.createField('USERNAME', 'text', 'username', 'Enter username');
            form.appendChild(usernameField);
            // Email field (only for register)
            if (!this.isLogin) {
                const emailField = this.createField('EMAIL', 'email', 'email', 'Enter email');
                form.appendChild(emailField);
            }
            // Password field
            const passwordField = this.createField('PASSWORD', 'password', 'password', 'Enter password');
            form.appendChild(passwordField);
            // Confirm Password field (only for register)
            if (!this.isLogin) {
                const confirmPasswordField = this.createField('CONFIRM PASSWORD', 'password', 'confirmPassword', 'Confirm password');
                form.appendChild(confirmPasswordField);
            }
            // Submit button
            const submitButton = this.uiManager.createButton(this.isLogin ? 'LOGIN' : 'CREATE ACCOUNT', 'w-full retro-button bg-[#ff1493] text-black hover:bg-transparent hover:text-[#ff1493] border-2 border-[#ff1493] py-3', () => { });
            submitButton.type = 'submit';
            form.appendChild(submitButton);
        }
        // Toggle button
        const toggleContainer = this.uiManager.createElement('div', 'text-center mt-6');
        if (this.showForgotPassword) {
            // Show "Back to Login" when in forgot password mode
            const backToLoginButton = this.uiManager.createElement('button', 'toggle-link');
            backToLoginButton.textContent = "Back to LOGIN";
            backToLoginButton.type = 'button';
            backToLoginButton.addEventListener('click', this.handleBackToLogin.bind(this));
            toggleContainer.appendChild(backToLoginButton);
        }
        else {
            // Show normal toggle buttons
            const toggleButton = this.uiManager.createElement('button', 'toggle-link');
            toggleButton.textContent = this.isLogin ? "Don't have an account? REGISTER" : "Already have an account? LOGIN";
            toggleButton.type = 'button';
            toggleButton.addEventListener('click', this.toggleMode.bind(this));
            toggleContainer.appendChild(toggleButton);
            // Forgot password button (only show on login mode)
            if (this.isLogin) {
                const forgotPasswordContainer = this.uiManager.createElement('div', 'text-center mt-3');
                const forgotPasswordButton = this.uiManager.createElement('button', 'toggle-link');
                forgotPasswordButton.textContent = "Forgot your password?";
                forgotPasswordButton.type = 'button';
                forgotPasswordButton.addEventListener('click', this.handleForgotPassword.bind(this));
                forgotPasswordContainer.appendChild(forgotPasswordButton);
                toggleContainer.appendChild(forgotPasswordContainer);
            }
        }
        const demoInfo = this.uiManager.createElement('div', 'mt-6 p-4 bg-[#9d4edd]/20 border border-[#9d4edd] rounded-lg');
        const demoText = this.uiManager.createElement('div', 'retro-text text-xs text-[#9d4edd] text-center', 'TRANSCENDANCE PROJECT');
        demoInfo.appendChild(demoText);
        card.appendChild(header);
        card.appendChild(form);
        // OAuth Buttons (only show when not in forgot password mode)
        if (!this.showForgotPassword) {
            const oauthContainer = this.uiManager.createElement('div', 'mt-6 space-y-3');
            // Divider
            const divider = this.uiManager.createElement('div', 'flex items-center my-4');
            const dividerLine = this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent');
            const dividerText = this.uiManager.createElement('span', 'px-4 retro-text text-sm text-[#ff1493]', 'OR');
            divider.appendChild(dividerLine);
            divider.appendChild(dividerText);
            divider.appendChild(this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent'));
            // Google Sign In Button
            const googleBtn = this.uiManager.createButton('SIGN IN WITH GOOGLE', 'w-full retro-button bg-white text-black hover:bg-gray-100 border-2 border-white py-3 flex items-center justify-center gap-3', () => this.handleGoogleSignIn());
            // 42Auth Button
            const auth42Btn = this.uiManager.createButton('SIGN IN WITH 42', 'w-full retro-button bg-[#00babc] text-white hover:bg-[#00a0a2] border-2 border-[#00babc] py-3 flex items-center justify-center gap-3', () => this.handle42SignIn());
            oauthContainer.appendChild(divider);
            oauthContainer.appendChild(googleBtn);
            oauthContainer.appendChild(auth42Btn);
            const playAsGuestBtn = this.uiManager.createButton('PLAY AS GUEST', 'w-full retro-button bg-[#00ffff] text-black hover:bg-[#00ffff]/80 hover:text-black border-2 border-[#00ffff] py-3 mt-6', this.onPlayAsGuest);
            card.appendChild(oauthContainer);
            card.appendChild(playAsGuestBtn);
        }
        card.appendChild(toggleContainer);
        card.appendChild(demoInfo);
        content.appendChild(card);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
    createField(label, type, name, placeholder) {
        const fieldContainer = this.uiManager.createElement('div');
        const labelElement = this.uiManager.createElement('label', 'retro-text text-sm block mb-2', label);
        fieldContainer.appendChild(labelElement);
        const input = this.uiManager.createInput(type, placeholder, 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        input.value = this.formData[name];
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
    handleSubmit(e) {
        e.preventDefault();
        this.errors = [];
        if (this.isLogin) {
            if (!this.formData.username || !this.formData.password) {
                this.errors.push('Please fill in all fields');
                this.render();
                return;
            }
            this.onLogin(this.formData.username, this.formData.password);
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
        }
    }
    toggleMode() {
        this.isLogin = !this.isLogin;
        this.formData = { username: '', email: '', password: '', confirmPassword: '' };
        this.errors = [];
        this.render();
    }
    handleGoogleSignIn() {
        // TODO: Implement Google OAuth
        console.log('Google Sign In clicked');
        // This would typically redirect to Google OAuth or open a popup
    }
    handle42SignIn() {
        // TODO: Implement 42 OAuth
        console.log('42 Sign In clicked');
        // This would typically redirect to 42 OAuth or open a popup
    }
    handleForgotPassword() {
        this.showForgotPassword = true;
        this.errors = [];
        this.render();
    }
    handleBackToLogin() {
        this.showForgotPassword = false;
        this.errors = [];
        this.render();
    }
    showError(error) {
        this.errors = [error];
        this.render();
    }
}
