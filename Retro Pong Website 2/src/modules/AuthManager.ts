export interface User {
  username: string;
  email?: string;
  id?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export class AuthManager {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const stored = localStorage.getItem('arcade_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem('arcade_user');
      }
    }
  }

  private saveUserToStorage(): void {
    if (this.currentUser) {
      localStorage.setItem('arcade_user', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('arcade_user');
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Demo mode - accept any credentials
        if (credentials.username.trim() && credentials.password.trim()) {
          this.currentUser = {
            username: credentials.username,
            id: Math.random().toString(36).substr(2, 9)
          };
          this.saveUserToStorage();
          this.notifyListeners();
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Invalid credentials' });
        }
      }, 500);
    });
  }

  public register(credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Validate inputs
      const errors: string[] = [];
      
      if (!credentials.username.trim()) errors.push('Username is required');
      if (!credentials.email.trim()) errors.push('Email is required');
      if (!credentials.password) errors.push('Password is required');
      if (credentials.password !== credentials.confirmPassword) errors.push('Passwords do not match');
      if (credentials.password.length < 6) errors.push('Password must be at least 6 characters');
      if (!/\S+@\S+\.\S+/.test(credentials.email)) errors.push('Please enter a valid email');

      if (errors.length > 0) {
        resolve({ success: false, error: errors.join(', ') });
        return;
      }

      // Simulate API call delay
      setTimeout(() => {
        this.currentUser = {
          username: credentials.username,
          email: credentials.email,
          id: Math.random().toString(36).substr(2, 9)
        };
        this.saveUserToStorage();
        this.notifyListeners();
        resolve({ success: true });
      }, 500);
    });
  }

  public logout(): void {
    this.currentUser = null;
    this.saveUserToStorage();
    this.notifyListeners();
  }

  public addListener(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}