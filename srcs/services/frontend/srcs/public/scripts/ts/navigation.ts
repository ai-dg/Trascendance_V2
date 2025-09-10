import { Translations } from "./types.js";
import { getElement, showHome, showForgotPasswd, showGuestPlay, showOptions, showSignIn, showSignUp } from "./script.js";

export function navigateTo(text: Translations, view: string, doPush = true) {
  switch(view) {
    case "home":
      showHome(text);
      break;
    case "signup":
      showSignUp(text);
      break;
    case "signin":
      showSignIn(text);
      break;
    case "options":
      showOptions(text);
      break;
    case "forgotPass":
      showForgotPasswd(text);
      break;
    case "guestPlay":
      showGuestPlay(text);
      break;
    default:
      showHome(text);
      break;
  }
    if (doPush) {
        const current = history.state;
        if (!current || current.view !== view) {
          history.pushState({ view }, "", `#${view}`);
          console.log("pushState ->", view);
        }
    }
}

export function setupBackButton(text: Translations, view: string) {
  const backBtn = getElement<HTMLButtonElement>("backBtn");

  backBtn.addEventListener("click", () => {
    history.back();
  });
}