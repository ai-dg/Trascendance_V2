import { navigateTo } from "./navigation.js";
export const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' }
];
export let currentLangIndex = 0;
export let currentTexts = {};
export async function loadLanguage(langCode, view = 'home') {
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
            navigateTo(currentTexts, "options");
        else
            navigateTo(currentTexts, "");
    }
    catch (err) {
        console.error(err);
    }
}
export async function getTraductions() {
    const html = document.querySelector("html");
    console.log("langCode: ", html?.getAttribute("lang"));
    const langCode = html?.getAttribute("lang");
    try {
        const res = await fetch(`/api/translations?lang=${langCode}`);
        if (!res.ok)
            throw new Error('Failed to load translations');
        const data = await res.json();
        currentTexts = data.text;
        currentLangIndex = languages.findIndex(l => l.code === langCode);
        if (currentLangIndex === -1)
            currentLangIndex = 0;
        return currentTexts;
    }
    catch (err) {
        console.error(err);
        if (currentTexts)
            return currentTexts;
        return {};
    }
}
export function toggleLanguage() {
    currentLangIndex = (currentLangIndex + 1) % languages.length;
    const nextLang = languages[currentLangIndex].code;
    const html = document.querySelector("html");
    html?.setAttribute("lang", nextLang);
    loadLanguage(nextLang, 'options');
}
