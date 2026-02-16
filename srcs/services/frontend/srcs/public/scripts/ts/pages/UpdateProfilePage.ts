import { UIManager } from '../modules/UIManager.js';
import type { User } from '../modules/TypesManager.js';
import type { RouterManager } from '../modules/RouterManager.js';
import { AuthManager } from '../modules/AuthManager.js';
import { CheckManager } from '../modules/CheckManager.js';
import type { LanguageManager } from '../modules/LangManager.js';
import { Logger } from '../modules/Logger.js';

export class UpdateProfilePage {
    private uiManager: UIManager;
    private routerManager: RouterManager;
    private authManager: AuthManager;
    private checkManager: CheckManager;
    private languageManager: LanguageManager;
    private onBack: () => void;
    private onUpdateProfile: (success: boolean) => void;
    private user?: User | null;

    constructor(uiManager: UIManager, routerManager: RouterManager, authManager: AuthManager, languageManager: LanguageManager, onBack: () => void, onUpdateProfile: (success: boolean) => void, user?: User | null) {
      this.uiManager = uiManager;
      this.routerManager = routerManager;
      this.onBack = onBack;
      this.user = user ?? null;
      this.authManager = authManager;
      this.languageManager = languageManager;
      this.checkManager = new CheckManager(this.languageManager);
      this.onUpdateProfile = onUpdateProfile;
    }

    private t(key: string): string {
      return this.languageManager.t(key);
    }

    public render(): void {
        const container = this.buildProfilePage();
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }

    private buildProfilePage(): HTMLElement {
        const container = this.uiManager.createElement(
          'div',
          'retro-container size-full flex flex-col items-center justify-start p-8',
        );
        const card = this.uiManager.createElement(
          'div',
          'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full max-w-md flex flex-col items-center gap-8 mt-16'
        );

        // Avatar Section

        const avatarSection = this.uiManager.createElement('div', 'flex flex-col items-center gap-2');
        const avatarImg = this.uiManager.createElement('img', 'rounded-full border-2 border-[#ff1493] cursor-pointer') as HTMLImageElement;
        avatarImg.style.width = '200px';
        avatarImg.style.height = '200px';
        if (!this.user || !this.user.avatar) {
          avatarImg.src = 'public/avatars/default.png';
        } else if (this.user.avatar.startsWith('http')) {
          avatarImg.src = this.user.avatar;
        } else {
          avatarImg.src = `public/avatars/${this.user.avatar}.png`;
        }
        avatarImg.alt = this.t('avatarAlt');
        avatarImg.title = this.t('avatarTitle');
        avatarImg.addEventListener('click', () => {
          Logger.log('Change avatar clicked');
          this.renderAvatarSelector();
        });

        const avatarLabel = this.uiManager.createElement('p', 'retro-subtitle text-sm opacity-70', this.t('clickToChangeAvatar'));
        avatarSection.appendChild(avatarImg);
        avatarSection.appendChild(avatarLabel);

        const isOAuth42 = this.user?.provider === '42';
        const oauth42Badge = this.uiManager.createElement(
          'p',
          'text-sm text-[#00ffff]/90 font-medium mt-1'
        );
        oauth42Badge.textContent = this.t('signed_in_with_42');

        const createField = (
          labelText: string,
          inputType: string,
          placeholder: string,
          changeHandler: (value: string, confirmValue?: string) => Promise<void> | void,
          withConfirm = false,
          currentValue?: string,
        ) => {
          const fieldContainer = this.uiManager.createElement('div', 'flex flex-col gap-2 w-full');

          const label = this.uiManager.createElement('label', 'retro-text text-sm text-[#00ffff]', labelText);
          fieldContainer.appendChild(label);

          if (currentValue) {
            const currentValueText = this.uiManager.createElement(
              'p',
              'text-[#ff1493] text-sm italic mb-1',
              `${this.t('current')}: ${currentValue}`
            );
            fieldContainer.appendChild(currentValueText);
          }

            const inputWrapper = this.uiManager.createElement('div', 'relative w-full');
            const input = this.uiManager.createElement(
              'input',
              'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text' +
              (inputType === 'password' ? ' pr-10' : '')
            ) as HTMLInputElement;
            input.type = inputType;
            input.placeholder = placeholder;

            // Add autocomplete attributes
            if (inputType === 'password') {
              input.setAttribute('autocomplete', 'new-password');
            } else if (inputType === 'email') {
              input.setAttribute('autocomplete', 'email');
            } else if (labelText.toLowerCase().includes('username')) {
              input.setAttribute('autocomplete', 'username');
            }

            inputWrapper.appendChild(input);

            if (inputType === 'password') {
              const toggleBtn = this.uiManager.createElement('button', `
                absolute right-2 text-[#ff1493] bg-black rounded
                hover:text-black hover:bg-[#ff1493]
                focus:outline-none transition-all duration-150
                p-1
              `) as HTMLButtonElement;
              toggleBtn.type = 'button';
              toggleBtn.innerHTML = '👁️';
              toggleBtn.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
              });
              inputWrapper.appendChild(toggleBtn);
            }

            fieldContainer.appendChild(inputWrapper);

            let confirmInput: HTMLInputElement | undefined;
            if (withConfirm) {
              const confirmWrapper = this.uiManager.createElement('div', 'relative w-full');
              confirmInput = this.uiManager.createElement(
                'input',
                'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text pr-10'
              ) as HTMLInputElement;
              confirmInput.type = inputType;
              confirmInput.placeholder = `${this.t('confirm')} ${placeholder.toLowerCase()}`;

              // Add autocomplete attribute for confirm password
              if (inputType === 'password') {
                confirmInput.setAttribute('autocomplete', 'new-password');
              }

              confirmWrapper.appendChild(confirmInput);

              const confirmToggle = this.uiManager.createElement('button', `
                absolute right-2 text-[#ff1493] bg-black rounded
                hover:text-black hover:bg-[#ff1493]
                focus:outline-none transition-all duration-150
                p-1
              `) as HTMLButtonElement;
              confirmToggle.type = 'button';
              confirmToggle.innerHTML = '👁️';
              confirmToggle.addEventListener('click', () => {
                confirmInput!.type = confirmInput!.type === 'password' ? 'text' : 'password';
              });
              confirmWrapper.appendChild(confirmToggle);

              fieldContainer.appendChild(confirmWrapper);
            }

          const errorDiv = this.uiManager.createElement('div', 'text-red-500 text-sm mt-1');
          fieldContainer.appendChild(errorDiv);

          const button = this.uiManager.createButton(
            this.t('change'),
            'retro-button bg-transparent text-[#ff1493] px-4 py-2 rounded border-2 border-[#ff1493] hover:bg-[#ff1493] hover:text-black transition-all duration-200 self-end',
            async () => {
              Logger.log(`${labelText} changed to:`, input.value, withConfirm ? confirmInput?.value : '');
              errorDiv.innerHTML = '';
              try {
                await changeHandler(input.value, confirmInput?.value);
              } catch (err: any) {
                errorDiv.textContent = err.message || 'Update failed';
              }
            }
          );
          fieldContainer.appendChild(button);

          return { fieldContainer, errorDiv };
        };

        // Username Field (hidden for 42 OAuth users; username is managed by 42)
        let usernameField: HTMLElement | null = null;
        if (!isOAuth42) {
          const usernameResult = createField(
            this.t('username'),
            'text',
            this.t('usernamePlaceholder'),
            async (value) => {
              const usernameErrors = this.checkManager.checkUsername(value);
              if (usernameErrors.length > 0) {
                if (usernameResult.errorDiv)
                  usernameResult.errorDiv.innerHTML = '';
                usernameErrors.forEach((error) => {
                  const errorMessage = this.uiManager.createElement('p', '', error);
                  usernameResult.errorDiv?.appendChild(errorMessage);
                });
                console.log("usernameErrors:", usernameErrors);
                return ;
              }
              const res = await fetch(this.routerManager.getUrl('auth/update-username'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ username: value })
              });
              if (!res.ok) {
                const message3 = await res.json().catch(() => ({}));
                const msg = message3.message || this.t('failedUpdateUsername');
                console.info('[UpdateProfile]', msg);
                if (usernameResult.errorDiv) usernameResult.errorDiv.textContent = msg;
                return;
              }
              if (this.user) this.user.username = value;
              this.render();
            },
            false,
            this.user?.username
          );
          usernameField = usernameResult.fieldContainer;
        }

        // Email Field (hidden for 42 OAuth users; email is managed by 42)
        let emailField: HTMLElement | null = null;
        if (!isOAuth42) {
          const emailResult = createField(
            this.t('email'),
            'email',
            this.t('emailPlaceholder'),
            async (value) => {
              if (!value) {
                console.info('[UpdateProfile]', this.t('noEmailEntered'));
                if (emailResult.errorDiv) emailResult.errorDiv.textContent = this.t('noEmailEntered');
                return;
              }
              const emailErrors = this.checkManager.checkEmail(value);
              if (emailErrors.length > 0) {
                if (emailResult.errorDiv)
                  emailResult.errorDiv.innerHTML = '';
                emailErrors.forEach((error) => {
                  const errorMessage = this.uiManager.createElement('p', '', error);
                  emailResult.errorDiv?.appendChild(errorMessage);
                });
                console.log("emailErrors:", emailErrors);
                return ;
              }
              try {
                const res = await fetch(this.routerManager.getUrl('/auth/verify-email-valid'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ email: value })
                });
                if (!res.ok) {
                    const message = await res.json().catch(() => ({}));
                    const msg = message.message || this.t('failedRequestOTP');
                    console.info('[UpdateProfile]', msg);
                    if (emailResult.errorDiv) emailResult.errorDiv.textContent = msg;
                    return;
                  }
                const data1 = await res.json();
                console.log("OTP sent:", data1);
                if (!data1.success) {
                  console.info('[UpdateProfile]', data1.message || this.t('failedUpdateEmail'));
                  if (emailResult.errorDiv) emailResult.errorDiv.textContent = data1.message || this.t('failedUpdateEmail');
                  return;
                }

                const res3 = await fetch(this.routerManager.getUrl('/auth/verify-email'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ email: value })
                });
                if (!res3.ok) {
                    const message = await res3.json().catch(() => ({}));
                    const msg = message.message || this.t('failedRequestOTP');
                    console.info('[UpdateProfile]', msg);
                    if (emailResult.errorDiv) emailResult.errorDiv.textContent = msg;
                    return;
                  }
                const data = await res3.json();
                console.log("OTP verify response:", data);
                console.log("OTP ID received:", data.otp_id);

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
                        const message2 = await res2.json().catch(() => ({}));
                        if (this.authManager.otpData)
                          this.authManager.otpData.context = "update-profile";
                        const msg2 = message2.message || this.t('failedUpdateEmail');
                        console.info('[UpdateProfile]', msg2);
                        alert(msg2);
                        return;
                      }
                      if (this.user) this.user.email = value;
                      if (this.authManager.otpData)
                        this.authManager.otpData.context = "update-profile";
                      this.routerManager.navigateTo('settings');
                    } catch (error: unknown) {
                      if (this.authManager.otpData)
                        this.authManager.otpData.context = "update-profile";
                      const msg = error instanceof Error ? error.message : this.t('failedUpdateEmail');
                      alert(msg);
                      this.routerManager.navigateTo('settings');
                    }
                  }
                };
                this.routerManager.navigateTo('check-otp', data.otp_id);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : this.t('failedRequestOTP');
                console.info('[UpdateProfile]', msg);
                if (emailResult.errorDiv) emailResult.errorDiv.textContent = msg;
                return;
              }
            },
            false,
            this.user?.email,
          );
          emailField = emailResult.fieldContainer;
        }

        // Password Fields (with confirm)
        const { fieldContainer: passwordField, errorDiv: passwordErrorDiv } = createField(
            this.t('password'),
            'password',
            this.t('enter_password'),
            async (value, confirmValue) => {
                // TODO: checks to add
                if (value !== confirmValue) {
                  console.info('[UpdateProfile]', "Passwords don't match");
                  if (passwordErrorDiv) passwordErrorDiv.textContent = "Passwords don't match";
                  return;
                }
                const passwordErrors = this.checkManager.checkPassword(value);
            if (passwordErrors.length > 0) {
              if (passwordErrorDiv)
                passwordErrorDiv.innerHTML = '';
              passwordErrors.forEach((error) => {
                const errorMessage = this.uiManager.createElement('p', '', error);
                passwordErrorDiv?.appendChild(errorMessage);
              });
              Logger.log("passwordErrors:", passwordErrors);
              Logger.log(passwordErrorDiv);
              return ;
            }
            const res = await fetch(this.routerManager.getUrl('auth/update-password'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ password: value })
                });
                if (!res.ok) {
                    const message = await res.json().catch(() => ({}));
                    const msg = message.message || this.t('failedUpdatePassword');
                    console.info('[UpdateProfile]', msg);
                    if (passwordErrorDiv) passwordErrorDiv.textContent = msg;
                    return;
                }
                this.render();
            },
            true
        );

        card.appendChild(avatarSection);
        if (isOAuth42) card.appendChild(oauth42Badge);
        if (usernameField) card.appendChild(usernameField);
        if (emailField) card.appendChild(emailField);
        card.appendChild(passwordField);

        // delete account
        const deleteButton = this.uiManager.createButton(
          this.t('deleteAccount'),
          'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200',
          () => {
            Logger.log('DELETE ACCOUNT clicked');
            this.handlerDeleteAccount();
        });


        // Back button (optional)
        const backButton = this.uiManager.createButton(
          this.t('backToSettings'),
          'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200',
          () => {
            this.onBack();
          }
        );

        card.appendChild(deleteButton);
        card.appendChild(backButton);
        container.appendChild(card);
        return container;
    }

    private renderAvatarSelector(): void {
      const container = this.uiManager.createElement(
        'div',
        'retro-container size-full flex flex-col items-center justify-center p-8'
      );

      const card = this.uiManager.createElement(
        'div',
        // Wide banner card, content kept narrow and centred
        'bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493] w-full flex flex-col items-center'
      );
      card.style.width = '1300px';
      const inner = this.uiManager.createElement(
        'div',
        'w-full max-w-md flex flex-col items-center gap-8'
      );

      const title = this.uiManager.createElement(
        'h1',
        // inline-flex so title doesn't stretch with banner width
        'retro-title text-sm mb-6 inline-flex text-center',
        this.t('chooseYourAvatar')
      );

      const avatarContainer = this.uiManager.createAvatarSelector(
        async (avatarId) => {
          try {
            const res = await fetch(this.routerManager.getUrl('/auth/update-avatar'), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ avatar: avatarId }),
            });

            if (!res.ok) {
              const text = await res.text();
              console.info('[UpdateProfile]', text || this.t('failedUpdateAvatar'));
              return;
            }

            if (this.user) this.user.avatar = avatarId;

            this.render();
          } catch (err) {
            Logger.info('[UpdateProfile] Avatar update failed:', err);
          }
        },
        this.user?.avatar
      );

      const backButton = this.uiManager.createButton(
        this.t('back'),
        'retro-button bg-transparent text-[#00ffff] px-8 py-3 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200',
        () => this.render()
      );

      const titleWrapper = this.uiManager.createElement('div', 'w-full flex justify-center');
      titleWrapper.style.width = '300%';

      titleWrapper.appendChild(title);
      inner.appendChild(titleWrapper);
      inner.appendChild(avatarContainer);
      inner.appendChild(backButton);
      card.appendChild(inner);

      container.appendChild(card);

      this.uiManager.clear();
      this.uiManager.container.appendChild(container);
    }



  private handlerDeleteAccount() {
      Logger.log("Opening delete confirmation screen");

      const container = this.uiManager.createElement(
        'div',
        'retro-container size-full flex flex-col items-center justify-center p-8'
      );

      const card = this.uiManager.createElement(
        'div',
        'bg-black/40 backdrop-blur-sm border-2 border-[#ff0000] rounded-lg p-8 shadow-[0_0_30px_#ff0000] w-full max-w-md flex flex-col items-center gap-6 text-center'
      );

      const title = this.uiManager.createElement(
      'h1',
      'retro-title text-3xl text-[#ff0000]',
      this.t('areYouSure')
    );

    const warningText = this.uiManager.createElement(
      'p',
      'text-[#ff6666] text-sm' + ' mb-4',
      this.t('permanentActionWarning')
    );

    const passwordWrapper = this.uiManager.createElement(
      'div',
      'relative w-full'
    );

    const passwordInput = this.uiManager.createElement('input',
          'w-full px-6 py-4 pr-10 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text',
        ) as HTMLInputElement;
    passwordInput.type = 'password';
    passwordInput.placeholder = this.t('enterYourPassword');
    passwordWrapper.appendChild(passwordInput);

    const toggleButton = this.uiManager.createElement('button', `
                absolute top-1/2 right-2 transform -translate-y-1/2 z-10
                text-[#ff1493] bg-black rounded
                focus:outline-none transition-all duration-150
                p-1
              `) as HTMLButtonElement;

    toggleButton.type = 'button';
    toggleButton.innerHTML = '👁️';
    toggleButton.addEventListener('click', () => {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    });

    passwordWrapper.appendChild(toggleButton);


    const deleteButton = this.uiManager.createButton(
      this.t('deleteAccount'),
      'retro-button bg-[#ff0000] text-red px-6 py-2 rounded border-2 border-[#ff0000] hover:bg-[#ff3333] hover:text-white shadow-[0_0_10px_#ff0000] hover:shadow-[0_0_20px_#ff0000] transition-all duration-200',
      async () => {
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
              email: this.user.email!,
              password: password,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.info('[UpdateProfile]', text || this.t('failedDeleteAccount'));
            alert(text || this.t('failedDeleteAccount'));
            return;
          }

          alert(this.t('accountDeleteSuccess'));
          window.location.href = '/';
        } catch (err) {
          Logger.info('[UpdateProfile] Delete account failed:', err);
          alert(this.t('errorDeletingAccount'));
        }
      }
    );

    const backButton = this.uiManager.createButton(
      this.t('cancel'),
      'retro-button bg-transparent text-[#00ffff] px-6 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200',
      () => this.render()
    );

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
