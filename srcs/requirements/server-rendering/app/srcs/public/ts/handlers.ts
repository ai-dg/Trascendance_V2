import { params } from "./types.js";
import { getUrl } from "./urls.js";

export async function log_handler(){
	window.location.href ="/";
}

export async function signupSuccessHandler(){
	// TODO: remplacer l'alerte par un vrai message !
	alert("sign up success !!!!!!! Have to display front message")
	window.location.href="/";	
}

export async function OTPValidationHandler(params:params, inputs: NodeListOf<HTMLInputElement>)  {
	  const  context = params.context;
	  const code = Array.from(inputs).map(i => i.value).join('');
	  console.log("verifyBtn called : code ", code)
	try{
		const res = await fetch(getUrl(`auth/${context}/otp-validation`),{
			method:"POST",
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({otp: code, otp_id: params.otp_id})
		});

		if (!res)
		throw new Error("Can't reach the server");
		const result = await res.json();
		if (result.success)
		{
			params.handler();
		}
		else{
			console.log('failure : ', result.message)
		}
	}
	catch (err)
	{
		console.log(err);
		
	}
	

	
	

  }