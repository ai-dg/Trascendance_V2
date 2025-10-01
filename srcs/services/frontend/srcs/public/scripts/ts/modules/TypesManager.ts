
// Language Manager interface
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
  errInvalidChars: string;
  errTooShort: string;
  errTooLong: string;

  verifyTitle: string;
  verifyInstruction: string;
  verify: string;

  changePass: string;
  changeBtn: string;
}


export interface OTParams{
	otp_id: string,
	context: string,
	handler: ()=>void;
}

// Final Frontend

// Interfaces from Retro Pong Website 2


// Game Interface

export interface GameState {
  player1Score: number;
  player2Score: number;
  gameRunning: boolean;
  winner: string | null;
}

export interface PaddleState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  speed: number;
}

export interface GameSettings {
  ballSpeed: number;
  paddleSpeed: number;
  winningScore: number;
}


// Auth Manager Interface
export interface User {
  username: string;
  email?: string;
  id?: string;
  avatar?: string;
  isGuest?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}
