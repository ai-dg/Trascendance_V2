export class LanguageManager {
    constructor(routerManager) {
        this.routerManager = routerManager;
        this.currentLang = 'en';
        this.translations = {};
    }
    async init() {
        try {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const langCookie = cookies.find(c => c.startsWith('lang='));
            this.currentLang = langCookie?.split('=')[1] || 'en';
        }
        catch {
            this.currentLang = 'en';
        }
        await this.loadTranslations();
    }
    async loadTranslations() {
        try {
            const url = "/locales/" + this.currentLang + ".json";
            const res = await fetch(url);
            this.translations = res.ok ? await res.json() : {};
        }
        catch {
            this.translations = {};
        }
    }
    async setLang(langCode, userId) {
        this.currentLang = langCode;
        if (userId) {
            await fetch(this.routerManager.getUrl('language-manager/set-lang'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId, lang: langCode })
            });
        }
        else {
            localStorage.setItem('guest-lang', langCode);
            document.cookie = `lang=${langCode}; path=/; max-age=31536000`;
        }
        await this.loadTranslations();
    }
    t(key) {
        return this.translations[key] || key;
    }
    getCurrentLang() {
        return this.currentLang;
    }
}
