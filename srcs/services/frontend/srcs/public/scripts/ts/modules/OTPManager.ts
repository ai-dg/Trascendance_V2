import { RouterManager } from "./RouterManager.js";
import type { OTParams } from "./TypesManager.js";
import { Logger } from './Logger.js';

export class OTPManagers {
    private router: RouterManager;

    constructor() {
        this.router = new RouterManager();
    }

    public async log_handler(){
	    window.location.href ="/";
    }

    public async signupSuccessHandler(){
	    // TODO: replace alert with proper UI message
	    // alert("sign up success !!!!!!! Have to display front message")
	    window.location.href="/";	
    }

	// public async changePasswordSuccessHandler(){
	//     // TODO: replace alert with proper UI message
	//     // alert("forgot password success !!!!!!! Have to display front message")
	// 	// ??????????
	//     window.location.href="/";	
    // }

    public async OTPValidationHandler(params: OTParams, inputs: NodeListOf<HTMLInputElement>): Promise<{ success: boolean; error?: string }>  {
	      const  context = params.context;
	      const code = Array.from(inputs).map(i => i.value).join('');
	      Logger.log("verifyBtn called : code ", code)
	    try{

	    	Logger.log("OTP sent:", code);
	    	Logger.log("OTP id:", params.otp_id);
	    	Logger.log(context);

	    	const res = await fetch(this.router.getUrl(`auth/${context}/otp-validation`),{
	    		method:"POST",
	    		headers: {
	    			'content-type': 'application/json',
	    		},
				credentials: 'include',
	    		body: JSON.stringify({otp: code, otp_id: params.otp_id})
	    	});

	    	if (!res) {
	    		console.info('[OTP]', 'Server unreachable');
	    		return { success: false, error: 'Server unreachable. Please try again.' };
	    	}
	    	const result = await res.json();
	    	console.log(result);
			console.log(result);
	    	if (result.success)
	    	{
	    		params.handler();
                Logger.log("PARAMS: ", params); 
	    		return { success: true };
	    	}
	    	else{
	    		const errorMessage = result.error?.message || result.error || result.message || 'Unknown error';
	    		console.log('failure : ', errorMessage);
				console.log('failure : ', errorMessage);
	    		return { success: false, error: errorMessage };
	    	}
	    }
	    catch (err)
	    {
	    	Logger.log(err);
	    	return { success: false, error: 'Network error. Please try again.' };
	    }
    }

}
