console.log("Script working properly");
document.addEventListener("DOMContentLoaded", () => {
    loadLanguage(languages[currentLangIndex].code, 'home');
});
function showSignIn(text) {
    console.log(">> showSignIn() called");
    const contentDiv = document.getElementById('content');
    if (!contentDiv)
        console.error("Failed to find content element");
    contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.signinTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <input type="password" placeholder="${text.passwd}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signin}</button>
    </form>
    <br>
    <h3 class="text-xl font-bold mb-6 text-white">${text.other}</h3>
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">GOOGLE SIGN IN</button>
    <br><br>
    <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">42AUTH</button>
    <br>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;
    // back button
    const backBtn = document.getElementById("backBtn");
    if (!backBtn)
        console.error("Failed to find backBtn element");
    backBtn.addEventListener("click", () => showHome(text));
}
function showGuestPlay(text) {
    console.log(">> showGuestPlay() called");
    const contentDiv = document.getElementById('content');
    if (!contentDiv)
        console.error("Failed to find content element");
    contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.guestTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" placeholder="${text.nickname}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none" required>

      <label class="text-white text-left">${text.chooseAvatar}</label>
      <div class="flex justify-center space-x-4 pt-2">
        <img src="/public/avatars/avatar1.png" alt="Avatar 1"
         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
        <img src="/public/avatars/avatar2.png" alt="Avatar 2"
         class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
        <img src="/public/avatars/avatar3.png" alt="Avatar 3"
          class="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-transparent hover:border-blue-400 avatar-option">
      </div>

      <button type="submit" class="bg-green-500 hover:bg-green-600 text-white py-2 rounded">${text.play}</button>
    </form>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;
    let selectedAvatar = null;
    // avatar choices
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(i => i.classList.remove('border-blue-500'));
            img.classList.add('border-blue-400');
            selectedAvatar = img.getAttribute('src');
        });
    });
    // nickname form
    const form = document.querySelector("form");
    if (!form)
        console.error("Failed to find form element");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const nicknameInput = form.querySelector('input[type="text"]');
        if (!nicknameInput)
            console.error("Failed to find input element");
        const nickname = nicknameInput.value;
    });
    // back button
    const backBtn = document.getElementById("backBtn");
    if (!backBtn)
        console.error("Failed to find backBtn element");
    backBtn.addEventListener("click", () => showHome(text));
}
function showOptions(text) {
    console.log(">> showOptions() called");
    const contentDiv = document.getElementById('content');
    if (!contentDiv)
        console.error("Failed to find content element");
    contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-4 text-white">${text.options}</h2>
    <p class="text-white">${text.optionsMessage}</p>
    <div class="mt-6">
      <p class="text-white">${text.lang}
      <button id="langToggleBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
       ${text.language}
      </button></p>
    </div>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;
    // change language button
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (!langToggleBtn)
        console.error("Failed to find langToggleBtn element");
    langToggleBtn.addEventListener('click', toggleLanguage);
    // back button
    const backBtn = document.getElementById("backBtn");
    if (!backBtn)
        console.error("Failed to find backBtn element");
    backBtn.addEventListener("click", () => showHome(text));
}
function showHome(text) {
    if (!text)
        return;
    const contentDiv = document.getElementById('content');
    if (!contentDiv)
        console.error("Failed to find content element");
    contentDiv.innerHTML = `
    <h1 id="title" class="text-2xl font-bold text-white mb-6">${text.title}</h1>
    <div class="flex flex-col space-y-4" id="buttonsContainer">
      <button id="signinBtn" class="bg-transparent text-white border-none hover:underline">${text.signin}</button>
      <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
      <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
      <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
    </div>
  `;
    // sign in button
    const signinBtn = document.getElementById("signinBtn");
    if (!signinBtn)
        console.error("Failed to find signinBtn element");
    signinBtn.addEventListener("click", () => showSignIn(text));
    // play as guest button
    const playAsGuestBtn = document.getElementById("playAsGuestBtn");
    if (!playAsGuestBtn)
        console.error("Failed to find playAsGuestBtn element");
    playAsGuestBtn.addEventListener("click", () => showGuestPlay(text));
    // options button
    const optionsBtn = document.getElementById("optionsBtn");
    if (!optionsBtn)
        console.error("Failed to find optionsBtn element");
    optionsBtn.addEventListener("click", () => showOptions(text));
}
const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' }
];
let currentLangIndex = 0;
let currentTexts = null;
async function loadLanguage(langCode, view = 'home') {
    try {
        const res = await fetch(`/api/translations?lang=${langCode}`);
        if (!res.ok)
            throw new Error('Failed to load translations');
        const data = await res.json();
        currentTexts = data.text;
        currentLangIndex = languages.findIndex(l => l.code === langCode);
        if (currentLangIndex === -1)
            currentLangIndex = 0;
        if (view === 'options')
            showOptions(currentTexts);
        else
            showHome(currentTexts);
    }
    catch (err) {
        console.error(err);
    }
}
function toggleLanguage() {
    currentLangIndex = (currentLangIndex + 1) % languages.length;
    const nextLang = languages[currentLangIndex].code;
    loadLanguage(nextLang, 'options');
}
export {};
// loadLanguage(languages[currentLangIndex].code);
//# sourceMappingURL=script.js.map