import { RouterManager } from "./RouterManager.js";
import type { OTParams } from "./TypesManager.js";

export class OTPManagers {
    private router: RouterManager;

    constructor() {
        this.router = new RouterManager();
    }

    public async log_handler(){
	    window.location.href ="/";
    }

    public async signupSuccessHandler(){
	    // TODO: remplacer l'alerte par un vrai message !
	    // alert("sign up success !!!!!!! Have to display front message")
	    window.location.href="/";	
    }

	// public async changePasswordSuccessHandler(){
	//     // TODO: remplacer l'alerte par un vrai message !
	//     // alert("forgot password success !!!!!!! Have to display front message")
	// 	// ??????????
	//     window.location.href="/";	
    // }

    public async OTPValidationHandler(params: OTParams, inputs: NodeListOf<HTMLInputElement>): Promise<{ success: boolean; error?: string }>  {
	      const  context = params.context;
	      const code = Array.from(inputs).map(i => i.value).join('');
	      console.log("verifyBtn called : code ", code)
	    try{

	    	console.log("OTP sent:", code);
	    	console.log("OTP id:", params.otp_id);
	    	console.log(context);

	    	const res = await fetch(this.router.getUrl(`auth/${context}/otp-validation`),{
	    		method:"POST",
	    		headers: {
	    			'content-type': 'application/json',
	    		},
				credentials: 'include',
	    		body: JSON.stringify({otp: code, otp_id: params.otp_id})
	    	});

	    	if (!res)
	    		throw new Error("Can't reach the server");
	    	const result = await res.json();
	    	console.log(result);
	    	if (result.success)
	    	{
	    		params.handler();
                console.log("PARAMS: ", params); 
	    		return { success: true };
	    	}
	    	else{
	    		const errorMessage = result.error?.message || result.error || result.message || 'Unknown error';
	    		console.log('failure : ', errorMessage);
	    		return { success: false, error: errorMessage };
	    	}
	    }
	    catch (err)
	    {
	    	console.log(err);
	    	return { success: false, error: 'Network error. Please try again.' };
	    }
    }

}
