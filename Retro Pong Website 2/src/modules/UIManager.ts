export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

export class UIManager {
  public container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public clear(): void {
    this.container.innerHTML = '';
  }

  public createElement(tag: string, className?: string, textContent?: string): HTMLElement {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }

  public createButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }

  public createInput(type: string, placeholder: string, className: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.className = className;
    return input;
  }

  public createCanvas(width: number, height: number, className: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = className;
    return canvas;
  }

  public showErrors(errors: string[], container: HTMLElement): void {
    // Remove existing error container
    const existingErrors = container.querySelector('.error-container');
    if (existingErrors) {
      existingErrors.remove();
    }

    if (errors.length === 0) return;

    const errorContainer = this.createElement('div', 'error-container mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg');
    
    errors.forEach(error => {
      const errorDiv = this.createElement('div', 'retro-text text-sm text-red-400', error);
      errorContainer.appendChild(errorDiv);
    });

    container.insertBefore(errorContainer, container.firstChild);
  }

  public validateForm(formData: { [key: string]: string }, rules: { [key: string]: (value: string) => string | null }): FormValidationResult {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = formData[field] || '';
      const error = rule(value);
      if (error) {
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public createIcon(iconName: string, className: string = 'w-5 h-5'): HTMLElement {
    const iconMap: { [key: string]: string } = {
      'user': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
      'gamepad': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>`,
      'trophy': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15l-2 5L7 18l5-2 5 2-3 2-2-5zM12 15l2-5 5 2-3 2-2 5-2-5z"></path></svg>`,
      'settings': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
      'arrow-left': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>`,
      'logout': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>`,
      'zap': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
      'volume': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343a1 1 0 000 1.414L8.586 10 6.343 12.243a1 1 0 101.414 1.414L10 11.414l2.243 2.243a1 1 0 001.414-1.414L11.414 10l2.243-2.243a1 1 0 00-1.414-1.414L10 8.586 7.757 6.343a1 1 0 00-1.414 0z"></path></svg>`,
      'monitor': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
      'palette': `<svg class="${className}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3z"></path></svg>`
    };

    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = iconMap[iconName] || '';
    return iconDiv.firstElementChild as HTMLElement || iconDiv;
  }

  public addLoadingState(element: HTMLButtonElement, text: string = 'LOADING...'): () => void {
    const originalText = element.textContent;
    const originalDisabled = element.disabled;
    
    element.textContent = text;
    element.disabled = true;
    element.classList.add('opacity-50');

    return () => {
      element.textContent = originalText;
      element.disabled = originalDisabled;
      element.classList.remove('opacity-50');
    };
  }

  public animate(element: HTMLElement, className: string, duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      element.classList.add(className);
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, duration);
    });
  }
}