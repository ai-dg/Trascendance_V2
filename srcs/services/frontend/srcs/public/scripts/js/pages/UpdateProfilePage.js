import { CheckManager } from '../modules/CheckManager.js';
export class UpdateProfilePage {
    constructor(uiManager, routerManager, authManager, languageManager, onBack, onUpdateProfile, user) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.onBack = onBack;
        this.user = user ?? null;
        this.authManager = authManager;
        this.languageManager = languageManager;
        this.checkManager = new CheckManager(this.languageManager);
        this.onUpdateProfile = onUpdateProfile;
    }
    t(key) {
        return this.languageManager.t(key);
    }
    render() {
        const container = this.buildProfilePage();
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
    buildProfilePage() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-start p-8');
        const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full max-w-md flex flex-col items-center gap-8');
        // Avatar Section
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', this.t('userSettingsTitle'));
        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2');
        const avatarImg = this.uiManager.createElement('img', 'w-16 h-16 rounded-full border-2 border-[#ff1493] cursor-pointer');
        if (!this.user || !this.user.avatar) {
            avatarImg.src = 'public/avatars/default.png';
        }
        else if (this.user.avatar.startsWith('http')) {
            avatarImg.src = this.user.avatar;
        }
        else {
            avatarImg.src = `public/avatars/${this.user.avatar}.png`;
        }
        avatarImg.alt = this.t('avatarAlt');
        avatarImg.title = this.t('avatarTitle');
        avatarImg.addEventListener('click', () => {
            console.log('Change avatar clicked');
            this.renderAvatarSelector();
        });
        const avatarLabel = this.uiManager.createElement('p', 'retro-subtitle text-sm opacity-70', this.t('clickToChangeAvatar'));
        card.appendChild(title);
        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(avatarLabel);
        const createField = (labelText, inputType, placeholder, changeHandler, withConfirm = false, currentValue) => {
            const fieldContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 w-full');
            const label = this.uiManager.createElement('label', 'retro-text text-sm text-[#00ffff]', labelText);
            fieldContainer.appendChild(label);
            if (currentValue) {
                const currentValueText = this.uiManager.createElement('p', 'text-[#ff1493] text-sm italic mb-1', `${this.t('current')}: ${currentValue}`);
                fieldContainer.appendChild(currentValueText);
            }
            const inputWrapper = this.uiManager.createElement('div', 'relative w-full');
            const input = this.uiManager.createElement('input', 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text' +
                (inputType === 'password' ? ' pr-10' : ''));
            input.type = inputType;
            input.placeholder = placeholder;
            inputWrapper.appendChild(input);
            if (inputType === 'password') {
                const toggleBtn = this.uiManager.createElement('button', `
                absolute right-2 text-[#ff1493] bg-black rounded
                hover:text-black hover:bg-[#ff1493]
                focus:outline-none transition-all duration-150
                p-1
              `);
                toggleBtn.type = 'button';
                toggleBtn.innerHTML = '👁️';
                toggleBtn.addEventListener('click', () => {
                    input.type = input.type === 'password' ? 'text' : 'password';
                });
                inputWrapper.appendChild(toggleBtn);
            }
            fieldContainer.appendChild(inputWrapper);
            let confirmInput;
            if (withConfirm) {
                const confirmWrapper = this.uiManager.createElement('div', 'relative w-full');
                confirmInput = this.uiManager.createElement('input', 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text pr-10');
                confirmInput.type = inputType;
                confirmInput.placeholder = `${this.t('confirm')} ${placeholder.toLowerCase()}`;
                confirmWrapper.appendChild(confirmInput);
                const confirmToggle = this.uiManager.createElement('button', `
                absolute right-2 text-[#ff1493] bg-black rounded
                hover:text-black hover:bg-[#ff1493]
                focus:outline-none transition-all duration-150
                p-1
              `);
                confirmToggle.type = 'button';
                confirmToggle.innerHTML = '👁️';
                confirmToggle.addEventListener('click', () => {
                    confirmInput.type = confirmInput.type === 'password' ? 'text' : 'password';
                });
                confirmWrapper.appendChild(confirmToggle);
                fieldContainer.appendChild(confirmWrapper);
            }
            const errorDiv = this.uiManager.createElement('div', 'text-red-500 text-sm mt-1');
            fieldContainer.appendChild(errorDiv);
            const button = this.uiManager.createButton(this.t('change'), 'retro-button bg-transparent text-[#ff1493] px-4 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200 self-end', async () => {
                console.log(`${labelText} changed to:`, input.value, withConfirm ? confirmInput?.value : '');
                errorDiv.innerHTML = '';
                try {
                    await changeHandler(input.value, confirmInput?.value);
                }
                catch (err) {
                    errorDiv.textContent = err.message || 'Error updating field';
                }
            });
            fieldContainer.appendChild(button);
            return { fieldContainer, errorDiv };
        };
        // let errorDiv: HTMLElement | undefined;
        // Username Field
        const { fieldContainer: usernameField, errorDiv: usernameErrorDiv } = createField(this.t('username'), 'text', this.t('usernamePlaceholder'), async (value) => {
            const usernameErrors = this.checkManager.checkUsername(value);
            if (usernameErrors.length > 0) {
                if (usernameErrorDiv)
                    usernameErrorDiv.innerHTML = '';
                usernameErrors.forEach((error) => {
                    const errorMessage = this.uiManager.createElement('p', '', error);
                    usernameErrorDiv?.appendChild(errorMessage);
                });
                console.log("usernameErrors:", usernameErrors);
                console.log(usernameErrorDiv);
                return;
            }
            const res = await fetch(this.routerManager.getUrl('auth/update-username'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ username: value })
            });
            if (!res.ok) {
                // const text = await res.text();
                const message3 = await res.json();
                throw new Error(message3.message || this.t('failedUpdateUsername'));
            }
            if (this.user)
                this.user.username = value;
            this.render();
        }, false, this.user?.username);
        // Email Field
        const { fieldContainer: emailField, errorDiv: emailErrorDiv } = createField(this.t('email'), 'email', this.t('emailPlaceholder'), async (value) => {
            if (!value)
                throw new Error(this.t('noEmailEntered'));
            const emailErrors = this.checkManager.checkEmail(value);
            if (emailErrors.length > 0) {
                if (emailErrorDiv)
                    emailErrorDiv.innerHTML = '';
                emailErrors.forEach((error) => {
                    const errorMessage = this.uiManager.createElement('p', '', error);
                    emailErrorDiv?.appendChild(errorMessage);
                });
                console.log("emailErrors:", emailErrors);
                console.log(emailErrorDiv);
                return;
            }
            try {
                const res = await fetch(this.routerManager.getUrl('/auth/verify-email-valid'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ email: value })
                });
                if (!res.ok) {
                    const message = await res.json();
                    throw new Error(message.message || this.t('failedRequestOTP'));
                }
                const data1 = await res.json();
                console.log("OTP sent:", data1);
                if (!data1.success)
                    throw new Error(data1.message || this.t('failedUpdateEmail'));
                const res3 = await fetch(this.routerManager.getUrl('/auth/verify-email'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ email: value })
                });
                if (!res3.ok) {
                    const message = await res3.json();
                    throw new Error(message.message || this.t('failedRequestOTP'));
                }
                const data = await res3.json();
                this.routerManager.navigateTo('check-otp', data.otp_id);
                this.authManager.otpData = {
                    otp_id: data.otp_id,
                    context: "verify-email",
                    handler: async () => {
                        try {
                            const res2 = await fetch(this.routerManager.getUrl('/auth/update-email'), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ email: value })
                            });
                            if (!res2.ok) {
                                // const text = await res2.text();
                                const message2 = await res2.json();
                                if (this.authManager.otpData)
                                    this.authManager.otpData.context = "update-profile";
                                throw new Error(message2.message || this.t('failedUpdateEmail'));
                            }
                            if (this.user)
                                this.user.email = value;
                            if (this.authManager.otpData)
                                this.authManager.otpData.context = "update-profile";
                            this.render();
                        }
                        catch (error) {
                            if (error instanceof Error) {
                                if (this.authManager.otpData)
                                    this.authManager.otpData.context = "update-profile";
                                throw new Error(error.message || this.t('failedUpdateEmail'));
                            }
                            else {
                                if (this.authManager.otpData)
                                    this.authManager.otpData.context = "update-profile";
                                throw new Error(this.t('failedUpdateEmail'));
                            }
                        }
                    }
                };
            }
            catch (error) {
                if (error instanceof Error)
                    throw new Error(error.message || this.t('failedRequestOTP'));
                else
                    throw new Error(this.t('failedRequestOTP'));
            }
        }, false, this.user?.email);
        // Password Fields (with confirm)
        const { fieldContainer: passwordField, errorDiv: passwordErrorDiv } = createField(this.t('password'), 'password', this.t('enter_password'), async (value, confirmValue) => {
            // TODO: checks to add
            if (value !== confirmValue)
                throw new Error("Passwords don't match");
            const passwordErrors = this.checkManager.checkPassword(value);
            if (passwordErrors.length > 0) {
                if (passwordErrorDiv)
                    passwordErrorDiv.innerHTML = '';
                passwordErrors.forEach((error) => {
                    const errorMessage = this.uiManager.createElement('p', '', error);
                    passwordErrorDiv?.appendChild(errorMessage);
                });
                console.log("passwordErrors:", passwordErrors);
                console.log(passwordErrorDiv);
                return;
            }
            const res = await fetch(this.routerManager.getUrl('auth/update-password'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ password: value })
            });
            if (!res.ok) {
                // const text = await res.text();
                const message = await res.json();
                throw new Error(message.message || this.t('failedUpdatePassword'));
            }
            this.render();
        }, true);
        card.appendChild(avatarSection);
        card.appendChild(usernameField);
        card.appendChild(emailField);
        card.appendChild(passwordField);
        // delete account
        const deleteButton = this.uiManager.createButton(this.t('deleteAccount'), 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', () => {
            console.log('DELETE ACCOUNT clicked');
            this.handlerDeleteAccount();
        });
        // Back button (optional)
        const backButton = this.uiManager.createButton(this.t('backToSettings'), 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4', () => {
            console.log('Back to settings clicked');
            this.onBack();
        });
        card.appendChild(deleteButton);
        card.appendChild(backButton);
        container.appendChild(card);
        return container;
    }
    renderAvatarSelector() {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full max-w-md flex flex-col items-center gap-8');
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-6', this.t('chooseYourAvatar'));
        const avatarContainer = this.uiManager.createAvatarSelector(async (avatarId) => {
            try {
                const res = await fetch(this.routerManager.getUrl('/auth/update-avatar'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ avatar: avatarId }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || this.t('failedUpdateAvatar'));
                }
                if (this.user)
                    this.user.avatar = avatarId;
                this.render();
            }
            catch (err) {
                console.error('Error updating avatar:', err);
            }
        }, this.user?.avatar);
        const backButton = this.uiManager.createButton(this.t('back'), 'retro-button bg-transparent text-[#00ffff] px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', () => this.render());
        card.appendChild(title);
        card.appendChild(avatarContainer);
        card.appendChild(backButton);
        container.appendChild(card);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
    handlerDeleteAccount() {
        console.log("Opening delete confirmation screen");
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col items-center justify-center p-8');
        const card = this.uiManager.createElement('div', 'bg-black/40 backdrop-blur-sm border-2 border-[#ff0000] rounded-lg p-8 shadow-[0_0_30px_#ff0000] w-full max-w-md flex flex-col items-center gap-6 text-center');
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl text-[#ff0000]', this.t('areYouSure'));
        const warningText = this.uiManager.createElement('p', 'text-[#ff6666] text-sm' + ' mb-4', this.t('permanentActionWarning'));
        const passwordWrapper = this.uiManager.createElement('div', 'relative w-full');
        const passwordInput = this.uiManager.createElement('input', 'w-full px-6 py-4 pr-10 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        passwordInput.type = 'password';
        passwordInput.placeholder = this.t('enterYourPassword');
        passwordWrapper.appendChild(passwordInput);
        const toggleButton = this.uiManager.createElement('button', `
                absolute top-1/2 right-2 transform -translate-y-1/2 z-10
                text-[#ff1493] bg-black rounded
                focus:outline-none transition-all duration-150
                p-1
              `);
        toggleButton.type = 'button';
        toggleButton.innerHTML = '👁️';
        toggleButton.addEventListener('click', () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        });
        passwordWrapper.appendChild(toggleButton);
        const deleteButton = this.uiManager.createButton(this.t('deleteAccount'), 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', async () => {
            const password = passwordInput.value.trim();
            if (!password) {
                alert(this.t('enterPasswordAlert'));
                return;
            }
            try {
                if (!this.user) {
                    alert(this.t('userNotFoundAlert'));
                    return;
                }
                const res = await fetch(this.routerManager.getUrl('auth/delete-account'), {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        email: this.user.email,
                        password: password,
                    }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || this.t('failedDeleteAccount'));
                }
                alert(this.t('accountDeleteSuccess'));
                window.location.href = '/';
            }
            catch (err) {
                console.error('Error deleting account:', err);
                alert(this.t('errorDeletingAccount'));
            }
        });
        const backButton = this.uiManager.createButton(this.t('cancel'), 'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', () => this.render());
        card.appendChild(title);
        card.appendChild(warningText);
        card.appendChild(passwordWrapper);
        card.appendChild(deleteButton);
        card.appendChild(backButton);
        container.appendChild(card);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
}
