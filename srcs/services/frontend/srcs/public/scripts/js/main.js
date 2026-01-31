import { App } from './app.js';
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('app');
    if (container) {
        new App(container);
    }
    else {
        console.error('App container not found');
    }
});
