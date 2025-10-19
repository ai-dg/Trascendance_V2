export class LanguageManager {
    constructor(routerManager) {
        this.routerManager = routerManager;
        this.currentLang = 'en';
        this.translations = {};
    }
    async init() {
        try {
            const res = await fetch(this.routerManager.getUrl('language-manager/get-lang'), {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                this.currentLang = data.lang || 'en';
            }
        }
        catch {
            this.currentLang = 'en';
        }
        await this.loadTranslations();
    }
    async loadTranslations() {
        try {
            const url = "/public/locales/" + this.currentLang + ".json";
            const res = await fetch(url);
            this.translations = res.ok ? await res.json() : {};
        }
        catch {
            this.translations = {};
        }
    }
    async setLang(langCode) {
        this.currentLang = langCode;
        await fetch(this.routerManager.getUrl('language-manager/set-lang'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lang: langCode })
        });
        await this.loadTranslations();
    }
    t(key) {
        return this.translations[key] || key;
    }
    getCurrentLang() {
        return this.currentLang;
    }
}
