console.log("Script working properly");

document.addEventListener("DOMContentLoaded", () => {
  showHome();
});

function showOptions(text) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-4 text-white">${text.options}</h2>
    <p class="text-white">${text.optionsMessage}</p>
    <div class="mt-6">
      <button id="langToggleBtn" class="bg-transparent text-white border border-white px-4 py-2 rounded">
       ${text.language}
      </button>
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

  document.getElementById("optionsBtn").addEventListener("click", () => showOptions(text));
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' }
];

let currentLangIndex = 0;
let currentTexts = null;

async function loadLanguage(langCode) {
  try {
    const res = await fetch(`/api/translations?lang=${langCode}`);
    if (!res.ok) throw new Error('Failed to load translations');

    const data = await res.json();
    currentTexts = data.text;
    currentLangIndex = languages.findIndex(l => l.code === langCode);
    if (currentLangIndex === -1) currentLangIndex = 0;

    showHome(currentTexts);
  } catch (err) {
    console.error(err);
  }
}

function toggleLanguage() {
  currentLangIndex = (currentLangIndex + 1) % languages.length;
  const nextLang = languages[currentLangIndex].code;
  loadLanguage(nextLang);
}

loadLanguage(languages[currentLangIndex].code);