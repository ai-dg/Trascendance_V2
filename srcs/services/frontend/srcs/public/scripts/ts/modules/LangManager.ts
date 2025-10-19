import type { RouterManager } from "./RouterManager";

export class LanguageManager {
    private currentLang: string = 'en';
    private translations: Record<string, string> = {};

    constructor (private routerManager: RouterManager) {}

    async init(): Promise<void> {
        try {
            const res = await fetch(this.routerManager.getUrl('language-manager/get-lang'), {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                this.currentLang = data.lang || 'en';
            }
        } catch {
            this.currentLang = 'en';
        }
        await this.loadTranslations();
    }

    async loadTranslations(): Promise<void> {
        try {
            const url = "../../../locales/" + this.currentLang + ".json";
            const res = await fetch(url);
            this.translations = res.ok ? await res.json() : {};
        } catch {
            this.translations = {};
        }
    }

    async setLang(langCode: string): Promise<void> {
      this.currentLang = langCode;
      await fetch(this.routerManager.getUrl('language-manager/set-lang'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lang: langCode })
      });
      await this.loadTranslations();
    }

    t(key: string): string {
      return this.translations[key] || key;
    }

    getCurrentLang(): string {
      return this.currentLang;
    }
}
