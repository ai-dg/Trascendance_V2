import { showOptions, showHome } from "./script";

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' }
];

export let currentLangIndex = 0;
let currentTexts = null;

export async function loadLanguage(langCode: string, view = 'home') {
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

export async function getTraductions(){
	const html = document.querySelector("html")
  	const langCode =html?.getAttribute("lang")
	  try {
    const res = await fetch(`/api/translations?lang=${langCode}`);
    if (!res.ok) throw new Error('Failed to load translations');

    const data = await res.json();
    currentTexts = data.text;
    currentLangIndex = languages.findIndex(l => l.code === langCode);
    if (currentLangIndex === -1) currentLangIndex = 0;
	return currentTexts;

  } catch (err) {
    console.error(err);
  }

}

export function toggleLanguage() {
  currentLangIndex = (currentLangIndex + 1) % languages.length;
  const nextLang = languages[currentLangIndex].code;
  const html = document.querySelector("html")
  html?.setAttribute("lang", nextLang)
  loadLanguage(nextLang, 'options');
}

// loadLanguage(languages[currentLangIndex].code);