import { UIManager } from '../modules/UIManager';

export class AuthPage {
  private uiManager: UIManager;
  private onLogin: (username: string) => void;
  private onRegister: (username: string, email: string, password: string) => void;
  private isLogin: boolean = true;
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

  constructor(
    uiManager: UIManager,
    onLogin: (username: string) => void,
    onRegister: (username: string, email: string, password: string) => void
  ) {
    this.uiManager = uiManager;
    this.onLogin = onLogin;
    this.onRegister = onRegister;
  }

  public render(): void {
    const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
    
    const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
    
    const card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
    
    // Header
    const header = this.uiManager.createElement('div', 'text-center mb-8');
    const title = this.uiManager.createElement('h1', 'retro-title text-3x2 mb-2', this.isLogin ? 'LOGIN' : 'REGISTER');
    const subtitle = this.uiManager.createElement('p', 'retro-subtitle text-sm', this.isLogin ? 'ACCESS THE ARCADE' : 'JOIN THE ARCADE');
    
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
    
    // Toggle button
    const toggleContainer = this.uiManager.createElement('div', 'text-center mt-6');
    const toggleButton = this.uiManager.createElement('button', 'toggle-link') as HTMLButtonElement;
    toggleButton.textContent = this.isLogin ? "Don't have an account? REGISTER" : "Already have an account? LOGIN";
    toggleButton.type = 'button';
    toggleButton.addEventListener('click', this.toggleMode.bind(this));
    toggleContainer.appendChild(toggleButton);
    
    // Demo info
    const demoInfo = this.uiManager.createElement('div', 'mt-6 p-4 bg-[#9d4edd]/20 border border-[#9d4edd] rounded-lg');
    const demoText = this.uiManager.createElement('div', 'retro-text text-xs text-[#9d4edd] text-center', 'TRANSCENDANCE PROJECT');
    demoInfo.appendChild(demoText);
    
    card.appendChild(header);
    card.appendChild(form);
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
    
    const input = this.uiManager.createInput(type, placeholder, 'bg-black/60 border-[#00ffff] text-[#00ffff] placeholder:text-[#00ffff]/50 focus:border-[#ff1493] focus:ring-[#ff1493] retro-text') as HTMLInputElement;
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

    if (this.isLogin) {
      if (!this.formData.username || !this.formData.password) {
        this.errors.push('Please fill in all fields');
        this.render();
        return;
      }
      this.onLogin(this.formData.username);
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

      this.onRegister(this.formData.username, this.formData.email, this.formData.password);
    }
  }

  private toggleMode(): void {
    this.isLogin = !this.isLogin;
    this.formData = { username: '', email: '', password: '', confirmPassword: '' };
    this.errors = [];
    this.render();
  }
}