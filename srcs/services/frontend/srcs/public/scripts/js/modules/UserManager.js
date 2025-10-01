"use strict";
// import { getErrorMessage } from "./error.js";
// import { Translations } from "./types.js";
// import { getUrl } from "./urls.js";
// import { setupChangePassForm, showVerificationCode } from "./validator.js";
// import { getConnectedHome } from "./interface.js";
// import { log_handler, signupSuccessHandler } from "./handlers.js";
// import { setupBackButton, navigateTo } from "./navigation.js";
// import { getElement } from "./script.js";
// async function changeAvatar(newAvatarPath: string) {
//     const res = await fetch("auth/update-avatar", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ avatar: newAvatarPath })
//     });
//     const result = await res.json();
//     if(result.success){
//         console.log("Avatar updated:", result.avatar);
//         return { success: true, avatar: newAvatarPath };
//     } else {
//         console.error("Error to change avatar:", result.message);
//         return { success: false, mes: "Error to change avatar" };
//     }
// }
// export function getChangeAvatar(text: Translations) {
// 	return `
// 	    <h2 class="text-xl font-bold mb-6 text-white">Change Avatar</h2>
// 	    <form class="flex flex-col space-y-4">
// 	      <label class="text-white text-left">${text.chooseAvatar}</label>
// 	      <div class="flex justify-center space-x-4 pt-2">
// 	        <img src="/public/avatars/avatar1.png" alt="Avatar 1"
// 	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
// 	        <img src="/public/avatars/avatar2.png" alt="Avatar 2"
// 	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
// 	        <img src="/public/avatars/avatar3.png" alt="Avatar 3"
// 	          class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
// 	      </div>
// 		    <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
// 	      <button id="changeBtn" type="submit" class="bg-green-500 hover:bg-green-600 text-white py-2 rounded">Change</button>
// 	    </form>
// 	    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
// 	  `;
// }
// export async function showChangeAvatar(text: Translations) {
//   const contentDiv = getElement<HTMLDivElement>('content');
//   contentDiv.innerHTML = getChangeAvatar(text);
//   let selectedAvatar: string | null = null;
//   const form = contentDiv.querySelector('form') as HTMLFormElement;
//   if (!form) {
//     console.error("Failed to find form element");
//     return;
//   }
//   // avatar choices
//   document.querySelectorAll('.avatar-option').forEach(img => {
//     img.addEventListener('click', () => {
//       document.querySelectorAll<HTMLImageElement>('.avatar-option').forEach(i => {
//         i.classList.remove('border-blue-500', 'border-blue-400'); 
//         i.classList.add('border-transparent')
//     });
//       img.classList.remove('border-transparent');
//       img.classList.add('border-blue-400');
//       selectedAvatar = (img as HTMLImageElement).getAttribute('src');
//       console.log(selectedAvatar);
//     });
//   });
//   const errorDiv = getElement<HTMLDivElement>("formErrors");
//   errorDiv.innerHTML = '';
//   form.addEventListener("submit", async (e: Event) => {
//     e.preventDefault();
//     if (!selectedAvatar) {
//     errorDiv.textContent = "No avatar selected";
//     console.error("Failed to find input element");
//     return;
//   }
//   const result = await changeAvatar(selectedAvatar);
//   if (result.success) {
//     console.log("Avatar updated:", result.avatar);
//     const headerAvatar = document.getElementById('avatar-option') as HTMLImageElement | null;
//     if (headerAvatar && result.avatar) {
//       headerAvatar.src = result.avatar;
//     }
//     errorDiv.textContent = "Avatar updated!";
//     navigateTo(text, "");
//   } else {
//     errorDiv.textContent = result.mes ?? "Avatar updated!";
//   }
//   });
//   // back button
//   setupBackButton(text, "");
// }
// export async function changeUsername(newUsername: string) {
//     try {
//         const res = await fetch("/auth/update-username", {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             credentials: "include",
//             body: JSON.stringify({ username: newUsername }),
//         });
//         const result = await res.json();
//         if (result.success) {
//             console.log("Username updated:", result.username);
//             return { success: true, username: result.username };
//         } else {
//             console.error("Error changing username:", result.message);
//             return { success: false, message: result.message };
//         }
//     } catch (err) {
//         console.error("Request failed:", err);
//         return { success: false, message: "Network error" };
//     }
// }
// export async function changeEmail(text: Translations, newEmail: string) {
//   const errorDiv = getElement<HTMLDivElement>('formErrors');
//   try {
//     const res = await fetch(getUrl('auth/verify-email'), {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email: newEmail })
//     });
//     const result = await res.json();
//     if (!result.success) {
//       return { success:false, message: result.message || "Error sending OTP"};
//     }
//     const is_valid = await showVerificationCode(text, "", {
//       otp_id: result.otp_id,
//       context: "verify-email",
//       handler: async () => {}
//     });
//     if (!is_valid) {
//       errorDiv.innerHTML = "OTP validation failed";
//       return { success: false, message: "OTP validation failed" };
//     }
//     navigateTo(text, "updateProfile");
//     const updateEmail = await fetch(getUrl('auth/update-email'), {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email: newEmail })
//     });
//     const updateRes = await updateEmail.json()
//     if (updateRes.success) {
//       alert("✅ Email updated to: " + updateRes.email);
//       return { success: true, email: updateRes.email };
//     } else {
//       errorDiv.innerHTML = updateRes.message || "Error updating email";
//       return { success: false, message: updateRes.message || "Error updating email" };
//     }
//   } catch (err) {
//     console.log(err);
//     errorDiv.innerHTML = "Internal Error";
//     return { success: false, message: "Internal Error" };
//   }
// }
// export async function changePassword(text: Translations) {
//     const errorDiv = getElement<HTMLDivElement>('formErrors');
//     try {
//       const form = document.querySelector("form") as HTMLFormElement;
//       if (!form) {
//         console.error("Failed to find form element");
//         return { success: false, message: "Form not found" };
//       }
//       const passwd = await setupChangePassForm(form, text);
//         const res = await fetch("/auth/update-password", {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             credentials: "include",
//             body: JSON.stringify({ password: passwd }),
//         });
//         const result = await res.json();
//         if (result.success) {
//             console.log("password updated:", result.password);
//             return { success: true, password: result.password };
//         } else {
//             console.error("Error changing password:", result.message);
//             return { success: false, message: result.message };
//         }
//     } catch (err) {
//         console.error("Request failed:", err);
//         return { success: false, message: "Network error" };
//     }
// }
