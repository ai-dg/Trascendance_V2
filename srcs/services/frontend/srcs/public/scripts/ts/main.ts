import { App } from './app.js';
import { Logger } from './modules/Logger.js';

// Global guards: log unhandled exceptions and rejections via console.info and prevent red/yellow in console
function installGlobalGuards(): void {
    window.addEventListener('error', (event: ErrorEvent) => {
        console.info('[APP] Unhandled exception:', event.message, event.filename, event.lineno, event.colno, event.error);
        event.preventDefault();
        event.stopPropagation();
        return true;
    });
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        console.info('[APP] Unhandled rejection:', event.reason);
        event.preventDefault();
    });
}

// Initialize app without showing it until ready
function initializeApp() {
    installGlobalGuards();

    const appContainer = document.getElementById('app');

    if (appContainer) {
        // Clear all SSR content but keep hidden
        appContainer.innerHTML = '';
        // App will handle showing itself and hiding loading screen
        new App(appContainer);
    } else {
        Logger.info('[APP] App container #app not found');
    }
}

// Initialize as soon as DOM is ready, don't wait for all resources
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // If DOMContentLoaded has already fired, initialize immediately
    initializeApp();
}

