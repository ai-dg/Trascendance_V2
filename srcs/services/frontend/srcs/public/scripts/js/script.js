import { getDisconnectedHome, getConnectedHome, initConnectedHome, initDisconnectedHome, getSignupForm, getSigninForm, getGuestPlay, getOptions, getForgotPass, getChangePass } from './interface.js';
import { loadLanguage, toggleLanguage, languages, currentLangIndex, currentTexts } from './languageManager.js';
import { initCSRFToken, isConnectedUser, logUser } from './login.js';
import { getUrl } from './urls.js';
import { setupPasswordToggle, setupSignUpForm, showVerificationCode, setupChangePassForm } from './validator.js';
import { navigateTo, setupBackButton } from './navigation.js';
console.log("Script working properly"); // to remove
document.addEventListener("DOMContentLoaded", async () => {
    await loadLanguage(languages[currentLangIndex].code, 'home');
    const initialView = (location.hash?.replace("#", "") || "home");
    history.replaceState({ view: initialView }, "", `#${initialView}`);
    console.log("initial replaceState ->", initialView);
    window.addEventListener("popstate", (event) => {
        const view = event.state?.view || location.hash.replace("#", "") || "home";
        console.log("popstate ->", view, " event.state=", event.state);
        if (currentTexts) {
            navigateTo(currentTexts, view, false);
        }
        else {
            showHome(currentTexts);
        }
    });
});
export function getElement(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} not found`);
    return el;
}
// show sign up
export function showSignUp(text) {
    const contentDiv = getElement("content");
    contentDiv.innerHTML = getSignupForm(text);
    setupPasswordToggle('togglePasswd', 'passwd');
    setupPasswordToggle('togglePasswdConfirm', 'passwdConfirm');
    const form = getElement("signupForm");
    setupSignUpForm(form, text);
    setupBackButton(text, "");
}
// show sign in
export function showSignIn(text) {
    console.log(">> showSignIn() called"); // to remove
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getSigninForm(text);
    // show password button
    setupPasswordToggle("togglePasswd", "passwd");
    const errorDiv = getElement("formErrors");
    // login form
    const form = contentDiv.querySelector("form");
    if (!form)
        console.error("Failed to find form element");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const loginInput = form.querySelector('input[type="text"]');
        if (!loginInput)
            console.error("Failed to find input element");
        const login = loginInput.value;
        const passwdInput = form.querySelector('input[type="password"]');
        if (!passwdInput)
            console.error("Failed to find input element");
        const passwd = passwdInput.value;
        // To remove after auth working
        const view = 'signin';
        logUser(login, passwd, text, view);
        // showVerificationCode(text, view);
    });
    // forgot password button
    const forgotPasswd = getElement("forgotPasswd");
    forgotPasswd.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(text, "forgotPass");
    });
    // back button
    setupBackButton(text, "");
}
export async function showForgotPasswd(text) {
    console.log(">> showForgotPasswd() called"); // to remove
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getForgotPass(text);
    const form = document.querySelector("form");
    if (!form)
        console.error("Failed to find form element");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        // check email validity
        const errorDiv = getElement("formErrors");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value)) {
            errorDiv.innerHTML = text.errEmail;
            return;
        }
        errorDiv.innerHTML = '';
        const email = form.email.value;
        console.log(email);
        const url = getUrl('auth/reset-password');
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({ email })
            });
            if (!res.ok) {
                // TODO: handle this message
                console.log("KO");
                errorDiv.innerHTML = "Error sending OTP";
                return;
            }
            else {
                const result = await res.json();
                console.log(result.message);
                if (result.success) {
                    // add that at the history later
                    const is_valid = await showVerificationCode(text, "", {
                        otp_id: result.otp_id,
                        context: "verify",
                        handler: () => { console.log("Success OTP!"); }
                    });
                    if (!is_valid) {
                        console.log("KO");
                        errorDiv.innerHTML = "Error sending OTP";
                        return;
                    }
                    const newPasswd = await showChangePass(text);
                    console.log({ email, otp_id: result.otp_id, password: newPasswd });
                    const changeRes = await fetch(getUrl('auth/reset-password/otp-validation'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ otp_id: result.otp_id, password: newPasswd })
                    });
                    const changeResult = await changeRes.json();
                    if (changeResult.success) {
                        console.log("Password changed!");
                        navigateTo(text, "signin");
                    }
                    else {
                        console.log("changeResult invalid");
                        errorDiv.innerHTML = changeResult.message || "Error";
                    }
                }
            }
        }
        catch (err) {
            // TODO: handle this message
            console.log(err);
        }
    });
    // back button
    setupBackButton(text, "signin");
}
export async function showChangePass(text) {
    return new Promise((resolve) => {
        const contentDiv = getElement('content');
        contentDiv.innerHTML = getChangePass(text);
        setupPasswordToggle('togglePasswd', 'passwd');
        setupPasswordToggle('togglePasswdConfirm', 'passwdConfirm');
        const form = document.querySelector("form");
        if (!form) {
            console.error("Failed to find form element");
            return;
        }
        setupChangePassForm(form, text).then((pass) => {
            resolve(pass);
        });
        setupBackButton(text, "signin");
    });
}
export function showGuestPlay(text) {
    console.log(">> showGuestPlay() called"); // to remove
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getGuestPlay(text);
    let selectedAvatar = null;
    // avatar choices
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(i => {
                i.classList.remove('border-blue-500', 'border-blue-400');
                i.classList.add('border-transparent');
            });
            img.classList.remove('border-transparent');
            img.classList.add('border-blue-400');
            selectedAvatar = img.getAttribute('src');
            console.log(selectedAvatar);
        });
    });
    // nickname form
    const form = document.querySelector("form");
    if (!form)
        console.error("Failed to find form element");
    const errorDiv = getElement("formErrors");
    errorDiv.innerHTML = '';
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nicknameInput = form.querySelector('input[type="text"]');
        if (!nicknameInput) {
            errorDiv.innerHTML = "no nickname";
            console.error("Failed to find input element");
            return;
        }
        const nickname = nicknameInput.value.trim();
        if (!selectedAvatar) {
            errorDiv.innerHTML = "no avatar";
            console.error("Failed to find input element");
            return;
        }
        localStorage.setItem("guestNickname", nickname);
        localStorage.setItem("guestAvatar", selectedAvatar);
        navigateTo(text, "game", false);
    });
    // back button
    setupBackButton(text, "");
}
export function showOptions(text) {
    console.log(">> showOptions() called"); // to remove
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getOptions(text);
    // change language button
    const langToggleBtn = getElement("langToggleBtn");
    langToggleBtn.addEventListener('click', toggleLanguage);
    // back button
    setupBackButton(text, "");
}
export async function showHome(text) {
    if (!text)
        return;
    const contentDiv = getElement('content');
    const isConnected = await isConnectedUser();
    console.log("user is connected : ", isConnected);
    if (isConnected) {
        await initCSRFToken();
        contentDiv.innerHTML = await getConnectedHome();
        await initConnectedHome(text);
    }
    else {
        contentDiv.innerHTML = await getDisconnectedHome();
        await initDisconnectedHome(text);
    }
}
