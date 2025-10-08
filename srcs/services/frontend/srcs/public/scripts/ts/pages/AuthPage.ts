import { UIManager } from '../modules/UIManager.js';
import type { Translations } from '../modules/TypesManager.js';
import type { AuthManager } from '../modules/AuthManager.js';

export class AuthPage {
  private uiManager: UIManager;
  private authManager: AuthManager;
  private onLogin: (username: string, password: string) => void;
  private onRegister: (username: string, email: string, password: string, confirmPassword: string) => void;
  private onForgotPassword: (email: string) => void;
  private onChangePassword: (email:string, password: string, confirmPassword: string) => void;
  private onPlayAsGuest: () => void;
  private onError?: (error: string) => void;
  private isLogin: boolean = true;
  private showForgotPassword: boolean = false;
  private showChangePassword: boolean = false;
  private formData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  } = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  private errors: string[] = [];
  private text: Translations = {} as Translations;
 

  constructor(
    uiManager: UIManager,
    authManager: AuthManager,
    onLogin: (username: string, password: string) => void,
    onRegister: (username: string, email: string, password: string, confirmPassword: string) => void,
    onForgotPassword: (email: string) => void,
    onChangePassword: (email:string, password: string, confirmPassword: string) => void,
    onPlayAsGuest: () => void,
    onError?: (error: string) => void
  ) {
    this.uiManager = uiManager;
    this.authManager = authManager;
    this.onLogin = onLogin;
    this.onRegister = onRegister;
    this.onForgotPassword = onForgotPassword;
    this.onChangePassword = onChangePassword;
    this.onPlayAsGuest = onPlayAsGuest;
    this.onError = onError;

    this.authManager.setHandlers({
      onChangePasswordRequest: this.handleChangePassword.bind(this),
    });
  }

  public render(): void {
    console.log("render: ", this.showChangePassword);
    const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
    
    const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
    
    const card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
    
    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-8');
    const title = this.uiManager.createElement('h1', 'retro-title text-3x2 mb-2', 
      this.showForgotPassword ? 'RESET PASSWORD' : this.showChangePassword ? 'CHANGE PASS' : (this.isLogin ? 'LOGIN' : 'REGISTER'));
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-sm', 
      this.showForgotPassword ? 'ENTER YOUR EMAIL TO RESET' : this.showChangePassword ? 'ENTER YOUR NEW PASSWORD' : (this.isLogin ? 'ACCESS THE ARCADE' : 'JOIN THE ARCADE'));
    
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
      const submitButton = this.uiManager.createButton(
        'RESET PASSWORD',
        'w-full retro-button bg-[#ff1493] text-black hover:bg-transparent hover:text-[#ff1493] border-2 border-[#ff1493] py-3',
        () => this.onForgotPassword(this.formData.email)
      ) as HTMLButtonElement;
      submitButton.type = 'submit';
      form.appendChild(submitButton);
    } else if (this.showChangePassword) {
      // Change Password Form - only email field
      const passwordField = this.createField('PASSWORD', 'password', 'password', 'Enter your new password');
      const passwordConfirmField = this.createField('PASSWORD CONFIRM', 'password', 'confirmPassword', 'Enter again your new password');
      form.appendChild(passwordField);
      form.appendChild(passwordConfirmField);
      
      // Submit button for Change password
      const submitButton = this.uiManager.createButton(
        'CHANGE PASSWORD',
        'w-full retro-button bg-[#ff1493] text-black hover:bg-transparent hover:text-[#ff1493] border-2 border-[#ff1493] py-3',
        () => this.onChangePassword(this.formData.email, this.formData.password, this.formData.confirmPassword)
      ) as HTMLButtonElement;
      submitButton.type = 'submit';
      form.appendChild(submitButton);
    } else {
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
      const submitButton = this.uiManager.createButton(
        this.isLogin ? 'LOGIN' : 'CREATE ACCOUNT',
        'w-full retro-button bg-[#ff1493] text-black hover:bg-transparent hover:text-[#ff1493] border-2 border-[#ff1493] py-3',
        () => {}
      ) as HTMLButtonElement;
      submitButton.type = 'submit';
      form.appendChild(submitButton);
    }
    
    // Toggle button
    const toggleContainer = this.uiManager.createElement('div', 'text-center mt-6');
    
    if (this.showForgotPassword) {
      // Show "Back to Login" when in forgot password mode
      const backToLoginButton = this.uiManager.createElement('button', 'toggle-link') as HTMLButtonElement;
      backToLoginButton.textContent = "Back to LOGIN";
      backToLoginButton.type = 'button';
      backToLoginButton.addEventListener('click', this.handleBackToLogin.bind(this));
      toggleContainer.appendChild(backToLoginButton);
    } else if (this.showChangePassword) {
      // Show "Back to Login" when in forgot password mode
      const backToLoginButton = this.uiManager.createElement('button', 'toggle-link') as HTMLButtonElement;
      backToLoginButton.textContent = "Wrong email?";
      backToLoginButton.type = 'button';
      backToLoginButton.addEventListener('click', this.handleBackToForgotPassword.bind(this));
      toggleContainer.appendChild(backToLoginButton);
    } else {
      // Show normal toggle buttons
      const toggleButton = this.uiManager.createElement('button', 'toggle-link') as HTMLButtonElement;
      toggleButton.textContent = this.isLogin ? "Don't have an account? REGISTER" : "Already have an account? LOGIN";
      toggleButton.type = 'button';
      toggleButton.addEventListener('click', this.toggleMode.bind(this));
      toggleContainer.appendChild(toggleButton);
      
      // Forgot password button (only show on login mode)
      if (this.isLogin) {
        const forgotPasswordContainer = this.uiManager.createElement('div', 'text-center mt-3');
        const forgotPasswordButton = this.uiManager.createElement('button', 'toggle-link') as HTMLButtonElement;
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
    if (!this.showForgotPassword || !this.showChangePassword) {
      const oauthContainer = this.uiManager.createElement('div', 'mt-6 space-y-3');
      
      // Divider
      const divider = this.uiManager.createElement('div', 'flex items-center my-4');
      const dividerLine = this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent');
      const dividerText = this.uiManager.createElement('span', 'px-4 retro-text text-sm text-[#ff1493]', 'OR');
      divider.appendChild(dividerLine);
      divider.appendChild(dividerText);
      divider.appendChild(this.uiManager.createElement('div', 'flex-1 h-px bg-gradient-to-r from-transparent via-[#ff1493] to-transparent'));
      
      // Google Sign In Button
      const googleBtn = this.uiManager.createButton(
        'SIGN IN WITH GOOGLE',
        'w-full retro-button bg-white text-black hover:bg-gray-100 border-2 border-white py-3 flex items-center justify-center gap-3',
        () => this.handleGoogleSignIn()
      );
      
      // 42Auth Button
      const auth42Btn = this.uiManager.createButton(
        'SIGN IN WITH 42',
        'w-full retro-button bg-[#00babc] text-white hover:bg-[#00a0a2] border-2 border-[#00babc] py-3 flex items-center justify-center gap-3',
        () => this.handle42SignIn()
      );
      
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

  private createField(label: string, type: string, name: keyof typeof this.formData, placeholder: string): HTMLElement {
    const fieldContainer = this.uiManager.createElement('div');
    
    const labelElement = this.uiManager.createElement('label', 'retro-text text-sm block mb-2', label);
    fieldContainer.appendChild(labelElement);
    
    const input = this.uiManager.createInput(type, placeholder, 'w-full px-6 py-4 bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text') as HTMLInputElement;
    input.value = this.formData[name];
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.formData[name] = target.value;
      if (this.errors.length > 0) {
        this.errors = [];
        this.render();
      }
    });
    
    fieldContainer.appendChild(input);
    return fieldContainer;
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();
    this.errors = [];

    if (this.showForgotPassword) {
      if (!this.formData.email) {
        this.errors.push('Please fill in all fields');
        this.render();
        return;
      }
      this.onForgotPassword(this.formData.email);
      return ;
    } else if (this.showChangePassword) {
      if (!this.formData.password || !this.formData.confirmPassword) {
        this.errors.push('Please fill in all fields');
        this.render();
        return;
      }
      if (this.formData.password === this.formData.confirmPassword) {
        this.onChangePassword(this.formData.email, this.formData.password, this.formData.confirmPassword);
        return ;
      }
      else {
        const newErrors: string[] = [];
        newErrors.push('Password do not match');
        this.errors = newErrors;
      }
    } else if (this.isLogin) {
      if (!this.formData.username || !this.formData.password) {
        this.errors.push('Please fill in all fields');
        this.render();
        return;
      }
      this.onLogin(this.formData.username, this.formData.password);
      return ;
    } else {
      const newErrors: string[] = [];
      
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
      return ;
    }
  }

  private toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.formData = { username: '', email: '', password: '', confirmPassword: '' };
    this.errors = [];
    this.render();
  }

  private handleGoogleSignIn(): void {
    // TODO: Implement Google OAuth
    console.log('Google Sign In clicked');
    // This would typically redirect to Google OAuth or open a popup
  }

  private handle42SignIn(): void {
    // TODO: Implement 42 OAuth
    console.log('42 Sign In clicked');
    // This would typically redirect to 42 OAuth or open a popup
  }

  private handleForgotPassword(): void {
    this.showForgotPassword = true;
    this.errors = [];
    this.render();
  }

  public handleChangePassword(): void {
    this.showForgotPassword = false;
    this.showChangePassword = true;
    this.errors = [];
    this.render();
  }

  private handleBackToLogin(): void {
    this.showForgotPassword = false;
    this.errors = [];
    this.render();
  }

  private handleBackToForgotPassword(): void {
    this.showChangePassword = false;
    this.showForgotPassword = true;
    this.errors = [];
    this.render();
  }

  public showError(error: string): void {
    this.errors = [error];
    this.render();
  }

  public showLogin(): void {
  this.showForgotPassword = false;
  this.showChangePassword = false;
  this.isLogin = true;
  this.errors = [];
  this.render();
}

}