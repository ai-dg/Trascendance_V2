import { User, LoginCredentials, RegisterCredentials, ForgotPasswordCredentials } from './TypesManager.js';
import type { Translations } from './TypesManager.js';
import { getErrorMessage } from './ErrorManager.js';
import { RouterManager } from './RouterManager.js';
import { OTPManagers } from './OTPManager.js';


export class AuthManager {
  private otpManager: OTPManagers;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  private router = new RouterManager();

  constructor(private onBackToCheckOtp: () => void) {
    this.loadUserFromStorage();
    this.onBackToCheckOtp = onBackToCheckOtp;
    this.otpManager = new OTPManagers();
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

  public async isConnectedUser() {
    const url = this.router.getUrl('auth/is-connected')
    try {
      const res = await fetch(url,
        {
          method:"POST",
          headers:  {
            "content-type": "application/json"		
          },
          credentials: "include",
          body: JSON.stringify({})
      })
      if (!res.ok)
      {
        console.log("failed")
        return false;
      }
      const result =  await res.json()
      if (result.success)
        return true;
      else
        return false;

    }
    catch(err)
    {
      console.log(err);
      return false;
    }
  }

  public async getConnectedUser() {
    try {
        const res = await fetch(this.router.getUrl('auth/me'), {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to get user');
        const result = await res.json();
        if (result.success) {
            return result.data.user;
        }
    } catch (err) {
        console.error(err);
    }
    return null;
  }

 // TODO: this is the good getCurrentUser / to fix that later

  // public async getCurrentUser() {
  //   try {
  //       const res = await fetch(this.router.getUrl('auth/me'), {
  //           method: "GET",
  //           credentials: "include",
  //       });

  //       if (!res.ok) {
  //           return null;
  //       }

  //       const result = await res.json();
  //       if (result.success) {
  //           return result.user;
  //       }
  //       return null;
  //   } catch (err) {
  //       console.error("getCurrentUser error:", err);
  //       return null;
  //   }
  // }

  public getCurrentUser(): User | null {
    console.log("current user:", this.currentUser);
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public async login(credentials: LoginCredentials, text: Translations): 
      Promise<{ success: boolean; error?: string; needsVerification?: boolean; 
      verificationData?: any }> {
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
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  public async logUser(pseudo: string, password: string, text: Translations, 
      view: string): Promise<{ success: boolean; error?: string; 
      needsVerification?: boolean; verificationData?: any }> {
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
      } else {

        // const res = await this.
        // OTP verification disabled for login - direct login success
        // this.currentUser = {
        //   username: pseudo,
        //   email: result.email || '',
        //   avatar: result.avatar || 'default.png',
        //   isGuest: false
        // };
        
        // return { success: true };
        
        // OTP verification code (commented out for login)
        // Store OTP data for the CheckOtp page
        (window as any).otpData = {
          otp_id: result.otp_id,
          context: "login",
          handler: this.otpManager.signupSuccessHandler
        };
        
        console.log("OTP data stored:", (window as any).otpData);
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
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  public async register(form: { username: string, email: string, 
      password: string, confirmPassword: string }, text: Translations): 
      Promise<{ success: boolean; error?: string; needsVerification?: boolean; 
      verificationData?: any }> {
    const errors: string[] = [];

    const login = form.username;
    const email = form.email;
    const passwd = form.password;
    const passwdConfirm = form.confirmPassword;

    if (!login.trim()) errors.push('Username is required');
    if (!email.trim()) errors.push('Email is required');
    if (!passwd) errors.push('Password is required');
    if (passwd !== passwdConfirm) errors.push('Passwords do not match');
    if (passwd.length < 6) errors.push('Password must be at least 6 characters');
    if (!/\S+@\S+\.\S+/.test(email)) errors.push('Please enter a valid email');

    if (errors.length > 0) {
      return { success: false, error: errors.join(', ') };
    }
    
    try {
      // Use the existing registerUser function which handles verification internally
      const result = await this.registerUser(login, passwd, email, text, 'signup');
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }

  public async registerUser(pseudo: string, password: string, 
      email: string, text:Translations, view:string): 
      Promise<{ success: boolean; error?: string; needsVerification?: 
      boolean; verificationData?: any }>{
    const errorDiv = document.getElementById('formErrors') as HTMLElement;
    const avatar = "/public/avatars/default.png";
    const form =
    {
      email,
      pseudo,
      password,
      avatar
    }
  
    try{
      const res = await fetch(this.router.getUrl('auth/signup'),{
        method:'POST',
        headers : {
          'content-type' : 'application/json'
        },
        body: JSON.stringify(form)
  
      })
      const result = await res.json();
      if (! result)
      {
        if (errorDiv) {
          errorDiv.textContent = "Server error";
        }
        return { success: false, error: "Server error" };
      }
      if (!result.success)
      {
        const errorMessage = result.error?.message || result.error || result.message || 'Unknown error';
        if (errorDiv) {
          errorDiv.textContent = errorMessage;
        }
        return { success: false, error: errorMessage };
      }
      else
      {
        //window.location.href ="/";
        // checkVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler})
        
        // Store OTP data for the CheckOtp page
        (window as any).otpData = {
          otp_id: result.otp_id,
          context: "signup",
          handler: this.otpManager.signupSuccessHandler
        };
        
        console.log("OTP data stored:", (window as any).otpData);
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
  
    }catch(err){
      const errorMessage = getErrorMessage(err);
      if (errorDiv) {
        errorDiv.textContent = errorMessage;
      }
      return { success: false, error: errorMessage };
    }
  }

  public async initCSRFToken(){

    try{
      const res = await fetch(this.router.getUrl('auth/csrf-token'),
      {
        method:"GET",
        credentials:'include'
      })
      if(!res)
        console.error("can't connect to server, please try again later")
      const result = await res.json();
      if (result.success)
      {
        const token = result.data.csrfToken
        const el = document.createElement("meta")
        el.setAttribute('name', 'csrf-token')
        el.setAttribute('content', token)
        document.head.appendChild(el);
      }
      else
      {
        console.error("Not authenticated...")
      }
    }
    catch(err)
    {
      console.error(getErrorMessage(err));
    }
  };

  public getCSRFToken() : string {
    const meta = document.querySelector("meta[name='csrf-token']");
    if (!meta) return "";
      const csrf_token = meta.getAttribute('content');
    if (!csrf_token) return "";
    return "";
  }

  private async logoutHandler() {
    const url = this.router.getUrl("auth/logout");
    try{
      const res = await fetch(url, {
        method: "POST",
        headers:{
          "x-csrf-token": this.getCSRFToken()
        },
        credentials: 'include'
      });
      if (!res.ok)
        console.log("Somethig went wrong here");
      const result = await res.json()
      window.location.href = '/';
    }
    catch(err)
    {
      console.log(err)
      window.location.href = '/';
    }
  }
  

  public forgotPassword(credentials: ForgotPasswordCredentials): void {
    console.log('Forgot password requested for:', credentials.email);
  }

  public logout(): void { // TODO: Implement logout
    this.logoutHandler();
    this.currentUser = null;
    // this.saveUserToStorage();
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

// import { getErrorMessage } from "./error.js";
// import { type Translations } from "./types.js";
// import { getUrl } from "./urls.js";
// import { showVerificationCode } from "./validator.js";
// import { getConnectedHome } from "./interface.js";
// import { log_handler, signupSuccessHandler } from "./handlers.js";




// export async function registerUser(pseudo: string, password: string, email: string, text:Translations, view:string): Promise<{ success: boolean; error?: string; needsVerification?: boolean; verificationData?: any }>{
// 	const errorDiv = document.getElementById('formErrors') as HTMLElement;
// 	const avatar = "/public/avatars/default.png";
// 	const form =
// 	{
// 		email,
// 		pseudo,
// 		password,
// 		avatar
// 	}

// 	try{
// 		const res = await fetch(getUrl('auth/signup'),{
// 			method:'POST',
// 			headers : {
// 				'content-type' : 'application/json'
// 			},
// 			body: JSON.stringify(form)

// 		})
// 		const result = await res.json();
// 		if (! result)
// 		{
// 			if (errorDiv) {
// 				errorDiv.textContent = "Server error";
// 			}
// 			return { success: false, error: "Server error" };
// 		}
// 		if (!result.success)
// 		{
// 			if (errorDiv) {
// 				errorDiv.textContent = result.message;
// 			}
// 			return { success: false, error: result.message };
// 		}
// 		else
// 		{
// 			//window.location.href ="/";
// 			showVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler})
// 			if (errorDiv) {
// 				errorDiv.textContent = result.message;
// 			}
// 			console.log("a confirmation mail has been sended");
			
// 			// Return success with verification data
// 			return {
// 				success: true,
// 				needsVerification: true,
// 				verificationData: {
// 					otp_id: result.otp_id || 'temp_otp_id',
// 					context: "signup",
// 					handler: "signupSuccessHandler"
// 				}
// 			};
// 		}
// 		// http://auth/signup

// 	}catch(err){
// 		const errorMessage = getErrorMessage(err);
// 		if (errorDiv) {
// 			errorDiv.textContent = errorMessage;
// 		}
// 		return { success: false, error: errorMessage };
// 	}
// }



// export async function logUser(pseudo: string, password: string, text:Translations, view:string){
// 	const errorDiv = document.getElementById('formErrors') as HTMLElement;
// 	const form =
// 	{
// 		pseudo,
// 		password
// 	}

// 	try{
// 		const res = await fetch(getUrl('auth/login'),{
// 			method:'POST',
// 			headers : {
// 				'content-type' : 'application/json'
// 			},
// 			body: JSON.stringify(form)

// 		})
// 	const texttext = await res.text();
// 	console.log("DEBUG RESPONSE:", texttext);
// 		const result = JSON.parse(texttext);
// 		if (! result)
// 		{
// 			if (errorDiv) {
// 				errorDiv.textContent = "Server error";
// 			}
// 			return { success: false, error: "Server error" };
// 		}
// 		if (!result.success)
// 		{
// 			if (errorDiv) {
// 				errorDiv.textContent = result.message;
// 			}
// 			return { success: false, error: result.message };
// 		}
// 		else
// 		{
// 			//window.location.href ="/";
// 			console.log("DEBUG otp_id recebido:", result.otp_id);
// 			showVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler});
// 			if (errorDiv) {
// 				errorDiv.textContent = result.message;
// 			}
// 			console.log("a confirmation mail has been sended");
			
// 			// Return success with verification data
// 			return {
// 				success: true,
// 				needsVerification: true,
// 				verificationData: {
// 					otp_id: result.otp_id || 'temp_otp_id',
// 					context: "signup",
// 					handler: "signupSuccessHandler"
// 				}
// 			};
// 		}

// 		// http://auth/signup


// 	}catch(err){
// 		const errorMessage = getErrorMessage(err);
// 		if (errorDiv) {
// 			errorDiv.textContent = errorMessage;
// 		}
// 		return { success: false, error: errorMessage };
// 	}
// }