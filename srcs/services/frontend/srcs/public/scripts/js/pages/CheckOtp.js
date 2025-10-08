import { CheckManager } from '../modules/CheckManager.js';
import { OTPManagers } from '../modules/OTPManager.js';
export class CheckOtp {
    constructor(uiManager, onVerificationComplete, onChangePassword, onBack) {
        this.uiManager = uiManager;
        this.otpManager = new OTPManagers();
        this.onVerificationComplete = onVerificationComplete;
        this.onChangePassword = onChangePassword;
        this.onBack = onBack;
        this.check = new CheckManager();
    }
    render(text, params) {
        const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
        const card = this.uiManager.createElement('div', 'auth-card bg-black/40 backdrop-blur-sm border-2 border-[#ff1493] rounded-lg p-8 shadow-[0_0_30px_#ff1493]');
        // Header
        const header = this.uiManager.createElement('div', 'text-center mb-8');
        const title = this.uiManager.createElement('h1', 'retro-text text-3xl font-bold text-[#00ffff] mb-2');
        title.textContent = text.verifyTitle || 'Verify Your Account';
        const subtitle = this.uiManager.createElement('p', 'text-white/80 text-sm');
        subtitle.textContent = text.verifyInstruction || 'Please enter the verification code sent to your email';
        header.appendChild(title);
        header.appendChild(subtitle);
        // OTP Container
        const otpContainer = this.uiManager.createElement('div', 'space-y-6');
        const codeContainer = this.uiManager.createElement('div', 'flex justify-center space-x-2');
        codeContainer.id = 'codeContainer';
        // Create 6 input fields for the verification code
        for (let i = 0; i < 6; i++) {
            const input = this.uiManager.createElement('input', 'w-12 h-12 text-center rounded bg-black/60 border-2 border-[#00ffff] text-[#00ffff] focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493] retro-text text-xl');
            input.id = `code-${i}`;
            input.type = 'text';
            input.maxLength = 1;
            codeContainer.appendChild(input);
        }
        // Error Display
        const errorDiv = this.uiManager.createElement('div', 'text-red-400 text-center text-sm hidden');
        errorDiv.id = 'otpError';
        // Buttons
        const buttonContainer = this.uiManager.createElement('div', 'space-y-3');
        const verifyBtn = this.uiManager.createButton(text.verify || 'Verify', 'w-full retro-button bg-[#00ffff] text-black hover:bg-[#00ffff]/80 hover:text-black border-2 border-[#00ffff] py-3', () => { });
        verifyBtn.id = 'verifyBtn';
        const backBtn = this.uiManager.createButton(text.back || 'Back', 'w-full retro-button bg-transparent text-[#00ffff] hover:bg-[#00ffff]/10 border-2 border-[#00ffff] py-3', () => { });
        backBtn.id = 'backBtn';
        buttonContainer.appendChild(verifyBtn);
        buttonContainer.appendChild(backBtn);
        otpContainer.appendChild(codeContainer);
        otpContainer.appendChild(errorDiv);
        otpContainer.appendChild(buttonContainer);
        // Assemble the card
        card.appendChild(header);
        card.appendChild(otpContainer);
        content.appendChild(card);
        container.appendChild(content);
        // Clear existing content and add new content
        this.uiManager.container.innerHTML = '';
        this.uiManager.container.appendChild(container);
        // Set up event listeners
        this.setupEventListeners(params, text);
    }
    setupEventListeners(params, text) {
        const inputs = document.querySelectorAll('#codeContainer input');
        if (!inputs) {
            console.error("Failed to find inputs element");
            return;
        }
        // Auto-focus and move to next input
        inputs.forEach((input, idx) => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '');
                if (input.value.length === 1 && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });
        });
        // Verify button
        const verifyBtn = this.check.getElement('verifyBtn');
        verifyBtn.addEventListener('click', async () => {
            const result = await this.otpManager.OTPValidationHandler(params, inputs);
            if (!result.success) {
                this.showError(result.error || 'Invalid verification code. Please try again.');
            }
            console.log("Params context: ", params.context);
            if (params.context === 'verify') {
                // this.onChangePassword(result.success);
                console.log("Skipping params.handler()");
                return;
            }
            this.onVerificationComplete(result.success);
        });
        // Back button
        const backBtn = this.check.getElement('backBtn');
        backBtn.addEventListener('click', () => {
            this.onBack();
        });
    }
    showError(message) {
        // Create or update error display
        let errorDiv = document.getElementById('otpError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'otpError';
            errorDiv.className = 'text-red-400 text-center mt-4';
            const verifyBtn = document.getElementById('verifyBtn');
            if (verifyBtn && verifyBtn.parentNode) {
                verifyBtn.parentNode.insertBefore(errorDiv, verifyBtn.nextSibling);
            }
        }
        errorDiv.textContent = message;
    }
    hideError() {
        const errorDiv = document.getElementById('otpError');
        if (errorDiv) {
            errorDiv.textContent = '';
        }
    }
}
