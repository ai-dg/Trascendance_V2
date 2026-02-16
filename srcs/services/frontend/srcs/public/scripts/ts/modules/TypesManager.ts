
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


  social: string;
  send: string;
  pleaseEnterUsername: string;
  friends: string;
  friendsListPlaceholder: string;

  notifications: string;
  userIdNotFound: string;
  cannotAddSelf: string;
  requestFailedTryAgain: string;
  friendRequestSent: string;
  failedSendRequestTryAgain: string;
  blockedOrUnfriended: string;
  youBlockedThisUser: string;

  accept: string;
  reject: string;
  invitedYouToPlay: string;
  invitedToGame: string;
  decline: string;
  inviteAcceptedWaiting: string;
  inviteDeclined: string;
  noFriendsYet: string;
  user: string;
  online: string;

  liveChat: string;
  invite: string;
  delete: string;
  block: string;
  messages: string;
  selectFriendToChat: string;
  typing: string;
  invitedBy: string;
  someone: string;
  backToMenu: string;

  ai: string;
  local: string;
  onlineGame: string;
  welcomeRetroPong: string;
  player: string;
  gameModes: string;
  onlineUsersPlaceholder: string;
  notificationsPlaceholder: string;
  madeBy: string;
  privacyPolicy: string;
  termsOfService: string;

  gameplay: string;
  ballSpeed: string;
  paddleSpeed: string;
  loading: string;
  failedToLoadList: string;
  unblock: string;

  player1: string;
  vs: string;
  aiBot: string;
  chooseDifficulty: string;
  easy: string;
  medium: string;
  hard: string;
  paused: string;
  gameOver: string;
  playAgain: string;
  commands: string;
  wUp: string;
  sDown: string;
  pauseResume: string;
  restart: string;

  player2: string;
  readyToPlay: string;
  ready: string;
  arrowUp: string;
  arrowDown: string;

  chooseOpponent: string;
  playAgainstRandom: string;
  joiningGame: string;
  ongoingGameFound: string;
  scoreLabel: string;
  reconnectPrompt: string;
  reconnect: string;
  startNewGame: string;
  reconnected: string;
  clickReadyToResume: string;
  reconnectionFailed: string;
  couldNotReconnect: string;
  backToLobby: string;
  waitingForOpponent: string;
  waitingForAccept: string;
  waitingForUserAccept: string;
  inviteDeclinedTitle: string;
  inviteDeclinedMsg: string;
  opponentFound: string;
  playingAgainst: string;
  opponentDisconnected: string;
  opponentLeft: string;
  waitForReconnectMsg: string;
  leaveGame: string;
  waitingReconnectTimeout: string;
  reconnectionTimeout: string;
  opponentTimeoutMsg: string;
  opponentAbandoned: string;
  opponentStartedNewGameMsg: string;
  matchmakingError: string;
  matchmakingProblemMsg: string;
  youWin: string;
  youLose: string;
  returnToLobby: string;
  waitingForRandomOpponent: string;
  inviteAFriend: string;
  selectAFriend: string;
  selectedFriend: string;
  selectFriendFirst: string;
  unknownPlayer: string;


  enter_username: string;

  tosTitle: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
  tosSec1Title: string;
  tosSec1Text: string;
  tosSec2Title: string;
  tosSec2Text: string;
  tosSec3Title: string;
  tosSec3Text: string;
  tosSec4Title: string;
  tosSec4Text: string;
  tosSec5Title: string;
  tosSec5Text: string;
  tosSec6Title: string;
  tosSec6Text: string;
  tosSec7Title: string;
  tosSec7Text: string;
  tosSec8Title: string;
  tosSec8Text: string;
  tosSec9Title: string;
  tosSec9Text: string;
  tosSec10Title: string;
  tosSec10Text: string;
  tosSec11Title: string;
  tosSec11Text: string;
  tosSec12Title: string;
  tosSec12Text: string;
  tosSec13Title: string;
  tosSec13Text: string;
  tosSec14Title: string;
  tosSec14Text: string;
  tosSec15Title: string;
  tosSec15Text: string;
  tosSec16Title: string;
  tosSec16Text: string;
  tosSec17Title: string;
  tosSec17Text: string;
  tosSec18Title: string;
  tosSec18Text: string;
  tosSec19Title: string;
  tosSec19Text: string;
  tosSec20Title: string;
  tosSec20Text: string;

  
  privacyTitle: string;
  privacySec1Title: string;
  privacySec1Text: string;
  privacySec2Title: string;
  privacySec2Text: string;
  privacySec2_1Title: string;
  privacySec2_1Text: string;
  privacySec2_2Title: string;
  privacySec2_2Text: string;
  privacySec2_3Title: string;
  privacySec2_3Text: string;
  privacySec2_4Title: string;
  privacySec2_4Text: string;
  privacySec3Title: string;
  privacySec3Text: string;
  privacySec4Title: string;
  privacySec4Text: string;
  privacySec4_1Title: string;
  privacySec4_1Text: string;
  privacySec4_2Title: string;
  privacySec4_2Text: string;
  privacySec4_3Title: string;
  privacySec4_3Text: string;
  privacySec5Title: string;
  privacySec5Text: string;
  privacySec5_1Title: string;
  privacySec5_1Text: string;
  privacySec5_2Title: string;
  privacySec5_2Text: string;
  privacySec6Title: string;
  privacySec6Text: string;
  privacySec7Title: string;
  privacySec7Text: string;
  privacySec8Title: string;
  privacySec8Text: string;
  privacySec9Title: string;
  privacySec9Text: string;
  privacySec10Title: string;
  privacySec10Text: string;
  privacySec11Title: string;
  privacySec11Text: string;
  privacySec12Title: string;
  privacySec12Text: string;
  privacySec13Title: string;
  privacySec13Text: string;

  guestSocialDisabled: string;

}


export interface OTParams{
	otp_id: string,
	context: string,
	handler: ()=>void;
}

// settings page

export interface Settings {
  ballSpeed: number;
  paddleSpeed: number;
}

export interface ColorTheme {
  id: string;
  name: string;
  colors: string[];
}

// Game Interface

export interface GameState {
  player1Score: number;
  player2Score: number;
  paddle1: any, 
  paddle2: any,
  ball?: any,
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
  //winningScore: number;
}


// Auth Manager Interface
export interface User {
  username: string;
  email?: string;
  id?: string;
  avatar?: string;
  isGuest?: boolean;
  nbrId?: number;
  online?: boolean;
  /** '42' when logged in via 42 OAuth, 'local' or undefined otherwise */
  provider?: 'local' | '42';
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
