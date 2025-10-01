import { getErrorMessage } from "../error.js";
import { getUrl } from "../urls.js";
import { signupSuccessHandler } from "../handlers.js";
export class AuthManager {
    constructor(onBackToCheckOtp) {
        this.onBackToCheckOtp = onBackToCheckOtp;
        this.currentUser = null;
        this.listeners = [];
        this.loadUserFromStorage();
        this.onBackToCheckOtp = onBackToCheckOtp;
    }
    loadUserFromStorage() {
        const stored = localStorage.getItem('arcade_user');
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
            }
            catch (error) {
                console.error('Error loading user from storage:', error);
                localStorage.removeItem('arcade_user');
            }
        }
    }
    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem('arcade_user', JSON.stringify(this.currentUser));
        }
        else {
            localStorage.removeItem('arcade_user');
        }
    }
    getCurrentUser() {
        return this.currentUser;
    }
    isAuthenticated() {
        return this.currentUser !== null;
    }
    async login(credentials, text) {
        const loginInput = credentials.username;
        if (!loginInput.trim()) {
            return { success: false, error: 'Username is required' };
        }
        const passwdInput = credentials.password;
        if (!passwdInput.trim()) {
            return { success: false, error: 'Password is required' };
        }
        const view = 'signin';
        try {
            const result = await this.logUser(loginInput, passwdInput, text, view);
            return result;
        }
        catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }
    async logUser(pseudo, password, text, view) {
        const form = {
            pseudo,
            password
        };
        try {
            const res = await fetch(getUrl('auth/login'), {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(form)
            });
            const texttext = await res.text();
            console.log("DEBUG RESPONSE:", texttext);
            const result = JSON.parse(texttext);
            if (!result) {
                return { success: false, error: "Server error" };
            }
            if (!result.success) {
                const errorMessage = result.error?.message || result.error || result.message || 'Unknown error';
                return { success: false, error: errorMessage };
            }
            else {
                // OTP verification disabled for login - direct login success
                this.currentUser = {
                    username: pseudo,
                    email: result.email || '',
                    avatar: result.avatar || 'default.png',
                    isGuest: false
                };
                return { success: true };
                // OTP verification code (commented out for login)
                /*
                // Store OTP data for the CheckOtp page
                (window as any).otpData = {
                  otp_id: result.otp_id,
                  context: "signin",
                  handler: signupSuccessHandler
                };
                
                console.log("OTP data stored:", (window as any).otpData);
                this.onBackToCheckOtp();
                
                // Return success with verification data
                return {
                  success: true,
                  needsVerification: true,
                  verificationData: {
                    otp_id: result.otp_id || 'temp_otp_id',
                    context: "signin",
                    handler: "signupSuccessHandler"
                  }
                };
                */
            }
        }
        catch (error) {
            console.error('Login error:', error);
            return { success: false, error: "Network error. Please try again." };
        }
    }
    async register(form, text) {
        const errors = [];
        const login = form.username;
        const email = form.email;
        const passwd = form.password;
        const passwdConfirm = form.confirmPassword;
        if (!login.trim())
            errors.push('Username is required');
        if (!email.trim())
            errors.push('Email is required');
        if (!passwd)
            errors.push('Password is required');
        if (passwd !== passwdConfirm)
            errors.push('Passwords do not match');
        if (passwd.length < 6)
            errors.push('Password must be at least 6 characters');
        if (!/\S+@\S+\.\S+/.test(email))
            errors.push('Please enter a valid email');
        if (errors.length > 0) {
            return { success: false, error: errors.join(', ') };
        }
        try {
            // Use the existing registerUser function which handles verification internally
            const result = await this.registerUser(login, passwd, email, text, 'signup');
            return result;
        }
        catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    }
    async registerUser(pseudo, password, email, text, view) {
        const errorDiv = document.getElementById('formErrors');
        const avatar = "/public/avatars/default.png";
        const form = {
            email,
            pseudo,
            password,
            avatar
        };
        try {
            const res = await fetch(getUrl('auth/signup'), {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(form)
            });
            const result = await res.json();
            if (!result) {
                if (errorDiv) {
                    errorDiv.textContent = "Server error";
                }
                return { success: false, error: "Server error" };
            }
            if (!result.success) {
                const errorMessage = result.error?.message || result.error || result.message || 'Unknown error';
                if (errorDiv) {
                    errorDiv.textContent = errorMessage;
                }
                return { success: false, error: errorMessage };
            }
            else {
                //window.location.href ="/";
                // checkVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler})
                // Store OTP data for the CheckOtp page
                window.otpData = {
                    otp_id: result.otp_id,
                    context: "signup",
                    handler: signupSuccessHandler
                };
                console.log("OTP data stored:", window.otpData);
                this.onBackToCheckOtp();
                if (errorDiv) {
                    errorDiv.textContent = result.message;
                }
                console.log("a confirmation mail has been sended");
                // Return success with verification data
                return {
                    success: true,
                    needsVerification: true,
                    verificationData: {
                        otp_id: result.otp_id || 'temp_otp_id',
                        context: "signup",
                        handler: "signupSuccessHandler"
                    }
                };
            }
            // http://auth/signup
        }
        catch (err) {
            const errorMessage = getErrorMessage(err);
            if (errorDiv) {
                errorDiv.textContent = errorMessage;
            }
            return { success: false, error: errorMessage };
        }
    }
    forgotPassword(credentials) {
        console.log('Forgot password requested for:', credentials.email);
    }
    logout() {
        this.currentUser = null;
        this.saveUserToStorage();
        this.notifyListeners();
    }
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser));
    }
}
// public register(credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> {
//   return new Promise((resolve) => {
//     // Validate inputs
//     const errors: string[] = [];
//     if (!credentials.username.trim()) errors.push('Username is required');
//     if (!credentials.email.trim()) errors.push('Email is required');
//     if (!credentials.password) errors.push('Password is required');
//     if (credentials.password !== credentials.confirmPassword) errors.push('Passwords do not match');
//     if (credentials.password.length < 6) errors.push('Password must be at least 6 characters');
//     if (!/\S+@\S+\.\S+/.test(credentials.email)) errors.push('Please enter a valid email');
//     if (errors.length > 0) {
//       resolve({ success: false, error: errors.join(', ') });
//       return;
//     }
//     // Simulate API call delay
//     setTimeout(() => {
//       this.currentUser = {
//         username: credentials.username,
//         email: credentials.email,
//         id: Math.random().toString(36).substr(2, 9)
//       };
//       this.saveUserToStorage();
//       this.notifyListeners();
//       resolve({ success: true });
//     }, 500);
//   });
// }
// public login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
//   return new Promise((resolve) => {
//     // Simulate API call delay
//     setTimeout(() => {
//       // Demo mode - accept any credentials
//       if (credentials.username.trim() && credentials.password.trim()) {
//         this.currentUser = {
//           username: credentials.username,
//           id: Math.random().toString(36).substr(2, 9)
//         };
//         this.saveUserToStorage();
//         this.notifyListeners();
//         resolve({ success: true });
//       } else {
//         resolve({ success: false, error: 'Invalid credentials' });
//       }
//     }, 500);
//   });
// }
