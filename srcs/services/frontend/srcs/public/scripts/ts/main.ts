import { App } from './app.js';
import logger from '../js/utils/logger.js';

// Initialize app without showing it until ready
function initializeApp() {
    const appContainer = document.getElementById('app');

    if (appContainer) {
        // Clear all SSR content but keep hidden
        appContainer.innerHTML = '';
        // App will handle showing itself and hiding loading screen
        new App(appContainer);
    } else {
        logger.error('App container not found');
    }
}

// Initialize as soon as DOM is ready, don't wait for all resources
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // If DOMContentLoaded has already fired, initialize immediately
    initializeApp();
}

