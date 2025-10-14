import { CheckManager } from '../modules/CheckManager.js';
export class UpdateProfilePage {
    constructor(uiManager, routerManager, authManager, onBack, user) {
        this.uiManager = uiManager;
        this.routerManager = routerManager;
        this.onBack = onBack;
        this.user = user ?? null;
        this.authManager = authManager;
        this.checkManager = new CheckManager();
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
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-4', 'USER SETTINGS');
        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2');
        const avatarImg = this.uiManager.createElement('img', 'w-16 h-16 rounded-full border-2 border-[#ff1493] cursor-pointer');
        avatarImg.src = this.user?.avatar ? `public/avatars/${this.user.avatar}.png` : 'public/avatars/default.png';
        avatarImg.alt = 'User Avatar';
        avatarImg.title = 'Click to change avatar';
        avatarImg.addEventListener('click', () => {
            console.log('Change avatar clicked');
            this.renderAvatarSelector();
        });
        const avatarLabel = this.uiManager.createElement('p', 'retro-subtitle text-sm opacity-70', 'CLICK TO CHANGE AVATAR');
        card.appendChild(title);
        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(avatarLabel);
        const createField = (labelText, inputType, placeholder, changeHandler, withConfirm = false, currentValue) => {
            const fieldContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 w-full');
            const label = this.uiManager.createElement('label', 'retro-text text-sm text-[#00ffff]', labelText);
            fieldContainer.appendChild(label);
            if (currentValue) {
                const currentValueText = this.uiManager.createElement('p', 'text-[#ff1493] text-sm italic mb-1', `Current: ${currentValue}`);
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
                confirmInput.placeholder = `Confirm ${placeholder.toLowerCase()}`;
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
            const button = this.uiManager.createButton('CHANGE', 'retro-button bg-transparent text-[#ff1493] px-4 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200 self-end', async () => {
                console.log(`${labelText} changed to:`, input.value, withConfirm ? confirmInput?.value : '');
                errorDiv.textContent = '';
                try {
                    await changeHandler(input.value, confirmInput?.value);
                }
                catch (err) {
                    errorDiv.textContent = err.message || 'Error updating field';
                }
            });
            fieldContainer.appendChild(button);
            fieldContainer.appendChild(errorDiv);
            return fieldContainer;
        };
        // Username Field
        const usernameField = createField('USERNAME', 'text', 'Enter new username', async (value) => {
            const res = await fetch(this.routerManager.getUrl('auth/update-username'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ username: value })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to update username');
            }
            if (this.user)
                this.user.username = value;
            this.render();
        }, false, this.user?.username);
        // Email Field
        const emailField = createField('EMAIL', 'email', 'Enter new email', async (value) => {
            // TODO: checks to add
            const res = await fetch(this.routerManager.getUrl('/auth/verify-email'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ email: value })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to request OTP');
            }
            const data = await res.json();
            console.log("OTP sent:", data);
            this.authManager.otpData = {
                otp_id: data.otp_id,
                context: "verify-email",
                handler: async () => {
                    const res2 = await fetch(this.routerManager.getUrl('/auth/update-email'), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email: value })
                    });
                    if (!res2.ok) {
                        const text = await res2.text();
                        throw new Error(text || 'Failed to update email');
                    }
                    if (this.user)
                        this.user.email = value;
                    this.render();
                }
            },
                this.routerManager.navigateTo('check-otp', data.otp_id);
        }, false, this.user?.email);
        // Password Fields (with confirm)
        const passwordField = createField('PASSWORD', 'password', 'Enter new password', async (value, confirmValue) => {
            // TODO: checks to add
            if (value !== confirmValue)
                throw new Error("Passwords don't match");
            const res = await fetch(this.routerManager.getUrl('auth/update-password'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ password: value })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to update password');
            }
            this.render();
        }, true);
        card.appendChild(avatarSection);
        card.appendChild(usernameField);
        card.appendChild(emailField);
        card.appendChild(passwordField);
        // delete account
        const deleteButton = this.uiManager.createButton('DELETE ACCOUNT', 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', () => {
            console.log('DELETE ACCOUNT clicked');
            this.handlerDeleteAccount();
        });
        // Back button (optional)
        const backButton = this.uiManager.createButton('BACK TO SETTINGS', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 mt-4', () => {
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
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl mb-6', 'CHOOSE YOUR AVATAR');
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
                    throw new Error(text || 'Failed to update avatar');
                }
                if (this.user)
                    this.user.avatar = avatarId;
                this.render();
            }
            catch (err) {
                console.error('Error updating avatar:', err);
            }
        }, this.user?.avatar);
        const backButton = this.uiManager.createButton('BACK', 'retro-button bg-transparent text-[#00ffff] px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', () => this.render());
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
        const title = this.uiManager.createElement('h1', 'retro-title text-3xl text-[#ff0000]', 'ARE YOU SURE?');
        const warningText = this.uiManager.createElement('p', 'text-[#ff6666] text-sm' + ' mb-4', 'This action is permanent and cannot be undone.');
        const passwordWrapper = this.uiManager.createElement('div', 'relative w-full');
        const passwordInput = this.uiManager.createElement('input', 'w-full px-6 py-4 pr-10 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Enter your password';
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
        const deleteButton = this.uiManager.createButton('DELETE ACCOUNT', 'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200', async () => {
            const password = passwordInput.value.trim();
            if (!password) {
                alert('Please enter your password');
                return;
            }
            try {
                if (!this.user) {
                    alert('User not found.');
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
                    throw new Error(text || 'Failed to delete account');
                }
                alert('Your account has been deleted successfully.');
                window.location.href = '/';
            }
            catch (err) {
                console.error('Error deleting account:', err);
                alert('An error occurred while deleting your account.');
            }
        });
        const backButton = this.uiManager.createButton('CANCEL', 'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200', () => this.render());
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
