import './index.css';
import { App } from './app';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    new App(container);
  } else {
    console.error('App container not found');
  }
});