import { App } from './app.js';
import { Logger } from './modules/Logger.js';

// Initialize app without showing it until ready
function initializeApp() {
    const appContainer = document.getElementById('app');

    if (appContainer) {
        // Clear all SSR content but keep hidden
        appContainer.innerHTML = '';
        // App will handle showing itself and hiding loading screen
        new App(appContainer);
    } else {
        Logger.error('App container not found');
    }
}

// Initialize as soon as DOM is ready, don't wait for all resources
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // If DOMContentLoaded has already fired, initialize immediately
    initializeApp();
}

