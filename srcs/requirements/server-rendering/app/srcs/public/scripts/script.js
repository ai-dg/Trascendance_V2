console.log("Script working properly");

document.addEventListener("DOMContentLoaded", () => {
  loadLanguage(languages[currentLangIndex].code, 'home');
});

function showSignIN(text) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-6 text-white">${text.signinTitle}</h2>
    <form class="flex flex-col space-y-4">
      <input type="text" placeholder="${text.login}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <input type="password" placeholder="${text.passwd}" class="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none">
      <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">${text.signin}</button>
    </form>
    <button id="backBtn" class="mt-4 text-blue-400 underline">${text.back}</button>
  `;

  document.getElementById("backBtn").addEventListener("click", () => showHome(text));
}

function showOptions(text) {
  const contentDiv = document.getElementById('content');
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

  document.getElementById('langToggleBtn').addEventListener('click', toggleLanguage);
  document.getElementById('backBtn').addEventListener('click', () => showHome(text));
}

function showHome(text) {
  if (!text) return;
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h1 id="title" class="text-2xl font-bold text-white mb-6">${text.title}</h1>
    <div class="flex flex-col space-y-4" id="buttonsContainer">
      <button id="signinBtn" class="bg-transparent text-white border-none hover:underline">${text.signin}</button>
      <button id="playAsGuestBtn" class="bg-transparent text-white border-none hover:underline">${text.playAsGuest}</button>
      <button id="optionsBtn" class="bg-transparent text-white border-none hover:underline">${text.options}</button>
      <button id="aboutBtn" class="bg-transparent text-white border-none hover:underline">${text.about}</button>
    </div>
  `;

  document.getElementById("signinBtn").addEventListener("click", () => showSignIN(text));
  document.getElementById("optionsBtn").addEventListener("click", () => showOptions(text));
  
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
    if (!res.ok) throw new Error('Failed to load translations');

    const data = await res.json();
    currentTexts = data.text;
    currentLangIndex = languages.findIndex(l => l.code === langCode);
    if (currentLangIndex === -1) currentLangIndex = 0;
    if (view === 'options')
      showOptions(currentTexts);
    else
      showHome(currentTexts);
  } catch (err) {
    console.error(err);
  }
}

function toggleLanguage() {
  currentLangIndex = (currentLangIndex + 1) % languages.length;
  const nextLang = languages[currentLangIndex].code;
  loadLanguage(nextLang, 'options');
}

loadLanguage(languages[currentLangIndex].code);