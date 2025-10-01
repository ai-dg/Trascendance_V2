export interface Translations {
  signinTitle: string;
  login: string;
  logout: string;
  passwd: string;
  signin: string;
  forgotPasswd: string;

  guestTitle: string;
  nickname: string;
  chooseAvatar: string;
  play: string;
  back: string;

  signupTitle: string;
  signup: string;
  signupBtn: string;
  email: string;
  otherUp: string;
  passwdConfirm: string;
  resetPasswd: string;

  options: string;
  optionsMessage: string;
  lang: string;
  language: string;
  
  playAsGuest: string;
  about: string;
  title: string;
  other: string;

  errLength: string;
  errUpper: string;
  errLower: string;
  errNbr: string;
  errMatch: string;
  errEmail: string;

  verifyTitle: string;
  verifyInstruction: string;
  verify: string;

  changePass: string;
  changeBtn: string;
}


export interface params{
	otp_id: string,
	context: string,
	handler: ()=>void;
}