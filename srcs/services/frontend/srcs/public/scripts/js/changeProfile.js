import { setupBackButton, navigateTo } from "./navigation.js";
import { getElement } from "./script.js";
async function changeAvatar(newAvatarPath) {
    const res = await fetch("auth/update-avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar: newAvatarPath })
    });
    const result = await res.json();
    if (result.success) {
        console.log("Avatar updated:", result.avatar);
        return { success: true, avatar: newAvatarPath };
    }
    else {
        console.error("Error to change avatar:", result.message);
        return { success: false, mes: "Error to change avatar" };
    }
}
export function getChangeAvatar(text) {
    return `
	    <h2 class="text-xl font-bold mb-6 text-white">Change Avatar</h2>
	    <form class="flex flex-col space-y-4">
	      <label class="text-white text-left">${text.chooseAvatar}</label>
	      <div class="flex justify-center space-x-4 pt-2">
	        <img src="/public/avatars/avatar1.png" alt="Avatar 1"
	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	        <img src="/public/avatars/avatar2.png" alt="Avatar 2"
	         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	        <img src="/public/avatars/avatar3.png" alt="Avatar 3"
	          class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
	      </div>
		  <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
	      <button id="changeBtn" type="submit" class="bg-green-500 hover:bg-green-600 text-white py-2 rounded">Change</button>
	    </form>
	    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
	  `;
}
export async function showChangeAvatar(text) {
    const contentDiv = getElement('content');
    contentDiv.innerHTML = getChangeAvatar(text);
    let selectedAvatar = null;
    const form = contentDiv.querySelector('form');
    if (!form) {
        console.error("Failed to find form element");
        return;
    }
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
    const errorDiv = getElement("formErrors");
    errorDiv.innerHTML = '';
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!selectedAvatar) {
            errorDiv.textContent = "No avatar selected";
            console.error("Failed to find input element");
            return;
        }
        const result = await changeAvatar(selectedAvatar);
        if (result.success) {
            console.log("Avatar updated:", result.avatar);
            const headerAvatar = document.getElementById('avatar-option');
            if (headerAvatar && result.avatar) {
                headerAvatar.src = result.avatar;
            }
            errorDiv.textContent = "Avatar updated!";
            navigateTo(text, "");
        }
        else {
            errorDiv.textContent = result.mes ?? "Avatar updated!";
        }
    });
    // back button
    setupBackButton(text, "");
}
