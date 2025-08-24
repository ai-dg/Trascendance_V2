import { getErrorMessage } from "./error.js";
import { Translations } from "./types.js";
import { getUrl } from "./urls.js";
import { showVerificationCode } from "./script.js";
import { getConnectedHome } from "./interface.js";



export function getSignupForm(text: Translations)
{
	return `
    <h2 class="text-xl font-bold mb-6 text-white">${text.signupTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input id="login" type="text" required placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <input id="email" type="text" required placeholder="${text.email}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <div class="relative">
        <input id="passwd" type="password" required placeholder="${text.passwd}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
        <button type="button" id="togglePasswd" required class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
          👁️
        </button>
      </div>
      <div class="relative">
        <input id="passwdConfirm" type="password" placeholder="${text.passwdConfirm}" class="px-4 py-2 pr-10 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none w-full">
        <button type="button" id="togglePasswdConfirm" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-300 hover:text-white">
          👁️
        </button>
      </div>
      <button type="submit" id="submit-login" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signupBtn}</button>
      <div id="formErrors" class="text-red-500 text-sm italic mt-2"></div>
      </form>
    <br>
    <h3 class="text-xl font-bold mb-6 text-white">${text.otherUp}</h3>
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">GOOGLE SIGN IN</button>
    <br><br>
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">42AUTH</button>
    <br>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;
}


export async function registerUser(pseudo: string, password: string, email: string, text:Translations, view:string){
	const errorDiv = document.getElementById('formErrors') as HTMLElement;
	const form =
	{
		email,
		pseudo,
		password
	}

	try{
		const res = await fetch(getUrl('auth/signup'),{
			method:'POST',
			headers : {
				'content-type' : 'application/json'
			},
			body: JSON.stringify(form)

		})

		const result = await res.json();
		if (! result)
		{
			errorDiv.textContent = "Server error";
			return
		}
		if (!result.success)
		{
			errorDiv.textContent =  result.message
			return
		}
		else
		{
			//window.location.href ="/";
			showVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: ()=>{console.log("signup success")}});
			errorDiv.textContent =  result.message
			console.log("a confirmation mail has been sended")
		}

		// http://auth/signup


	}catch(err){
		errorDiv.textContent = getErrorMessage(err);

	}

}


async function initCSRFToken(){

	try{
		const res = await fetch(getUrl('auth/csrf-token'),
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


export async function log_handler(){
	const menu = document.querySelector('.menu') as HTMLDivElement;
	const otpCheck = document.querySelector(".otp-check") as HTMLDivElement;
	const signupBtn = document.getElementById('signupBtn') as HTMLDivElement;
	const signinBtn = document.getElementById('signinBtn') as HTMLDivElement;
	if (menu)
	{
		menu.removeChild(signupBtn);
		menu.removeChild(signinBtn);
		if (otpCheck)
			otpCheck.style.display = "none"
		let logoutBtn = document.createElement('button');
		logoutBtn.id = "lougoutBn";
		logoutBtn.classList.add("bg-transparent",  "text-red-600", "border-none",  "hover:underline")
		menu.appendChild(logoutBtn);
	}else
	{
		const content = document.getElementById("content") as HTMLElement;
		content.innerHTML = await getConnectedHome();
		console.error("can't find menu")
	}

	await initCSRFToken();
	

}

export async function logUser(pseudo: string, password: string, text:Translations, view:string){
	const errorDiv = document.getElementById('formErrors') as HTMLElement;
	const form =
	{
		pseudo,
		password
	}

	try{
		const res = await fetch(getUrl('auth/login'),{
			method:'POST',
			headers : {
				'content-type' : 'application/json'
			},
			body: JSON.stringify(form)

		})

		const result = await res.json();
		if (! result)
		{
			errorDiv.textContent = "Server error";
			return
		}
		if (!result.success)
		{
			errorDiv.textContent =  result.message
			return
		}
		else
		{
			//window.location.href ="/";
			showVerificationCode(text, view, {otp_id: result.otp_id, context:"login", handler: log_handler});
			errorDiv.textContent =  result.message
			console.log("a confirmation mail has been sended")
		}

		// http://auth/signup


	}catch(err){
		errorDiv.textContent = getErrorMessage(err);

	}
}