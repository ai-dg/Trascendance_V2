import { getErrorMessage } from "./error.js";
import { Translations } from "./types.js";
import { getUrl } from "./urls.js";
import { showVerificationCode } from "./validator.js";
import { getConnectedHome } from "./interface.js";
import { log_handler, signupSuccessHandler } from "./handlers.js";




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
			showVerificationCode(text, view, {otp_id: result.otp_id, context:"signup", handler: signupSuccessHandler})
			errorDiv.textContent =  result.message
			console.log("a confirmation mail has been sended")
		}

		// http://auth/signup


	}catch(err){
		errorDiv.textContent = getErrorMessage(err);

	}

}


export async function initCSRFToken(){

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



export async function logoutHandler(e:Event) {
	const url = getUrl("auth/logout");
	try{
		const res = await fetch(url, {
			method: "POST",
			headers:{
				"x-csrf-token": getCSRFToken()
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




export function getCSRFToken() : string {

    let csrf_token : string | null = document.querySelector("meta[name='csrf-token']")!.getAttribute('content');
	if (!csrf_token)
		return ""
    return csrf_token
}





export async function isConnectedUser() {
	const url = getUrl('auth/is-connected')
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
	const texttext = await res.text();
	console.log("DEBUG RESPONSE:", texttext);
		const result = JSON.parse(texttext);
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
			console.log("DEBUG otp_id recebido:", result.otp_id);
			showVerificationCode(text, view, {otp_id: result.otp_id, context:"login", handler: log_handler});
			errorDiv.textContent =  result.message
			console.log("a confirmation mail has been sended")
		}

		// http://auth/signup


	}catch(err){
		errorDiv.textContent = getErrorMessage(err);

	}
}