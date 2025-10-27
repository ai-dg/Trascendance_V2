import { getErrorMessage } from './ErrorManager.js';
import { RouterManager } from './RouterManager.js';
import { OTPManagers } from './OTPManager.js';
export class AuthManager {
    constructor(onBackToCheckOtp) {
        this.onBackToCheckOtp = onBackToCheckOtp;
        this.currentUser = null;
        this.listeners = [];
        this.otpData = null;
        this.router = new RouterManager();
        this.loadUserFromStorage();
        this.onBackToCheckOtp = onBackToCheckOtp;
        this.otpManager = new OTPManagers();
    }
    setHandlers(handlers) {
        this.onChangePasswordRequest = handlers.onChangePasswordRequest;
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
    async isConnectedUser() {
        const url = this.router.getUrl('auth/is-connected');
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({})
            });
            if (!res.ok) {
                console.log("failed");
                return false;
            }
            const result = await res.json();
            if (result.success)
                return true;
            else
                return false;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    }
    async getConnectedUser() {
        try {
            const res = await fetch(this.router.getUrl('auth/me'), {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    return result.data.user;
                }
            }
            if (res.status === 401) {
            }
            else {
                console.warn(`getConnectedUser: unexpected response (${res.status})`);
            }
        }
        catch (err) {
            if (err instanceof TypeError && err.message.includes("NetworkError")) {
                console.debug("getConnectedUser: server internal error");
            }
            else {
                console.error("getConnectedUser: unexpected error →", err);
            }
        }
        return null;
    }
    getCurrentUser() {
        console.log("current user:", this.currentUser);
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
            const res = await fetch(this.router.getUrl('auth/login'), {
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
                const errorMessage = result.error?.message || result.error
                    || result.message || 'Unknown error';
                return { success: false, error: errorMessage };
            }
            else {
                // Store OTP data for the CheckOtp page
                this.otpData = {
                    otp_id: result.otp_id,
                    context: "login",
                    handler: this.otpManager.signupSuccessHandler
                };
                console.log("OTP data stored:", this.otpData);
                this.onBackToCheckOtp();
                // Return success with verification data
                return {
                    success: true,
                    needsVerification: true,
                    verificationData: {
                        otp_id: result.otp_id || 'temp_otp_id',
                        context: "login",
                        handler: "signupSuccessHandler"
                    }
                };
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
            const result = await this.registerUser(login, passwd, email, 'signup');
            return result;
        }
        catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    }
    async registerUser(pseudo, password, email, view) {
        const errorDiv = document.getElementById('formErrors');
        const avatar = "default.png";
        const form = {
            email,
            pseudo,
            password,
            avatar
        };
        try {
            const res = await fetch(this.router.getUrl('auth/signup'), {
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
                this.otpData = {
                    otp_id: result.otp_id,
                    context: "signup",
                    handler: this.otpManager.signupSuccessHandler
                };
                console.log("OTP data stored:", this.otpData);
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
    async initCSRFToken() {
        try {
            const res = await fetch(this.router.getUrl('auth/csrf-token'), {
                method: "GET",
                credentials: 'include'
            });
            if (!res)
                console.error("can't connect to server, please try again later");
            const result = await res.json();
            if (result.success) {
                const token = result.data.csrfToken;
                const el = document.createElement("meta");
                el.setAttribute('name', 'csrf-token');
                el.setAttribute('content', token);
                document.head.appendChild(el);
            }
            else {
                console.error("Not authenticated...");
            }
        }
        catch (err) {
            console.error(getErrorMessage(err));
        }
    }
    ;
    getCSRFToken() {
        const meta = document.querySelector("meta[name='csrf-token']");
        if (!meta)
            return "";
        const csrf_token = meta.getAttribute('content');
        if (!csrf_token)
            return "";
        return "";
    }
    async logoutHandler() {
        try {
            const url = this.router.getUrl("auth/logout");
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "x-csrf-token": this.getCSRFToken()
                },
                credentials: 'include'
            });
            if (!res.ok)
                console.log("Somethig went wrong here");
            const result = await res.json();
            localStorage.removeItem("guestNickname");
            localStorage.removeItem("guestAvatar");
            this.currentUser = null;
            this.saveUserToStorage();
            this.notifyListeners();
            window.location.href = '/';
        }
        catch (err) {
            console.log(err);
            window.location.href = '/';
        }
    }
    async forgotPassword(email) {
        try {
            console.log("in authmanager: otpdata: ", this.otpData);
            const res = await fetch(this.router.getUrl('auth/reset-password'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            if (!res.ok)
                return { success: false, error: "Failed to request password reset" };
            const result = await res.json();
            if (!result.success)
                return { success: false, error: result.message || "Unknown error" };
            this.otpData = {
                otp_id: result.otp_id,
                context: "verify",
                handler: () => {
                    console.log("OTP verified, triggering Change Password UI first");
                    this.onChangePasswordRequest?.();
                }
            };
            console.log("OTP data stored HERE:", this.otpData); // TODO: remove this line
            this.onBackToCheckOtp();
            console.log("AQUI DPS DE onbacktocheckotp"); // TODO: remove this line
            // Return success with verification data
            return {
                success: true,
                needsVerification: true,
                verificationData: {
                    otp_id: result.otp_id || 'temp_otp_id',
                    context: "verify",
                    handler: () => {
                        console.log("OTP verified, triggering Change Password UI");
                        // this.onChangePasswordRequest?.();
                    }
                }
            };
        }
        catch (err) {
            console.error("forgotPassword error:", err);
            return { success: false, error: "Network error" };
        }
    }
    async changePassword(email, password, otpId) {
        try {
            const res = await fetch(this.router.getUrl('auth/reset-password/otp-validation'), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp_id: otpId, password })
            });
            if (!res.ok)
                return { success: false, error: "Failed to change password" };
            const result = await res.json();
            if (!result.success)
                return { success: false, error: result.message || "Unknown error" };
            return { success: true };
        }
        catch (err) {
            console.error("changePassword error:", err);
            return { success: false, error: "Network error" };
        }
    }
    logout() {
        this.logoutHandler();
        this.currentUser = null;
        // this.saveUserToStorage();
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
