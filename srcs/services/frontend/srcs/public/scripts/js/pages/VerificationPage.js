export class VerificationPage {
    constructor(uiManager, onBack, onSuccess, translations, params) {
        this.uiManager = uiManager;
        this.onBack = onBack;
        this.onSuccess = onSuccess;
        this.translations = translations;
        this.params = params;
    }
    render() {
        console.log('VerificationPage.render() called');
        console.log('Translations:', this.translations);
        console.log('Params:', this.params);
        const container = this.uiManager.createElement('div', 'retro-container size-full flex items-center justify-center p-8');
        const content = this.uiManager.createElement('div', 'relative z-10 w-full max-w-md');
        const card = this.uiManager.createElement('div', 'bg-black/60 backdrop-blur-sm border-2 border-[#00ffff] rounded-lg p-8 shadow-2xl');
        // Title
        const title = this.uiManager.createElement('h2', 'retro-text text-2xl font-bold mb-4 text-[#00ffff] text-center');
        title.textContent = this.translations.verifyTitle || 'Verify Your Account';
        // Instruction
        const instruction = this.uiManager.createElement('p', 'text-white mb-6 text-center');
        instruction.textContent = this.translations.verifyInstruction || 'Please enter the verification code sent to your email';
        // Code container
        const codeContainer = this.uiManager.createElement('div', 'flex justify-center space-x-2 mb-6');
        codeContainer.id = 'codeContainer';
        // Create 6 input fields for the verification code
        for (let i = 0; i < 6; i++) {
            const input = this.uiManager.createElement('input', 'w-12 h-12 text-center rounded bg-black/60 border-2 border-[#00ffff] text-[#00ffff] focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493] retro-text text-xl');
            input.id = `code-${i}`;
            input.type = 'text';
            input.maxLength = 1;
            input.setAttribute('data-index', i.toString());
            codeContainer.appendChild(input);
        }
        // Verify button
        const verifyBtn = this.uiManager.createElement('button', 'retro-btn w-full py-3 px-6 bg-[#00ffff] text-black hover:bg-[#00ffff]/80 hover:text-black border-2 border-[#00ffff] font-bold');
        verifyBtn.textContent = this.translations.verify || 'Verify';
        verifyBtn.id = 'verifyBtn';
        // Back button
        const backBtn = this.uiManager.createElement('button', 'retro-btn w-full py-3 px-6 bg-transparent text-[#00ffff] hover:bg-[#00ffff]/10 border-2 border-[#00ffff] font-bold mt-4');
        backBtn.textContent = this.translations.back || 'Back';
        backBtn.id = 'backBtn';
        // Error display
        const errorDiv = this.uiManager.createElement('div', 'text-red-400 text-center mt-4 hidden');
        errorDiv.id = 'verificationError';
        // Assemble the card
        card.appendChild(title);
        card.appendChild(instruction);
        card.appendChild(codeContainer);
        card.appendChild(verifyBtn);
        card.appendChild(backBtn);
        card.appendChild(errorDiv);
        content.appendChild(card);
        container.appendChild(content);
        // Set up event listeners
        this.setupEventListeners();
        // Clear the main container and render
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.innerHTML = '';
            mainContainer.appendChild(container);
        }
    }
    setupEventListeners() {
        const inputs = document.querySelectorAll('#codeContainer input');
        // Auto-focus and move to next input
        inputs.forEach((input, idx) => {
            input.addEventListener('input', () => {
                input.value = input.value.replace(/\D/g, '');
                if (input.value.length === 1 && idx < inputs.length - 1) {
                    inputs[idx + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && input.value === '' && idx > 0) {
                    inputs[idx - 1].focus();
                }
            });
        });
        // Verify button
        const verifyBtn = document.getElementById('verifyBtn');
        verifyBtn?.addEventListener('click', () => this.handleVerify());
        // Back button
        const backBtn = document.getElementById('backBtn');
        backBtn?.addEventListener('click', () => this.onBack());
    }
    async handleVerify() {
        const inputs = document.querySelectorAll('#codeContainer input');
        const code = Array.from(inputs).map(input => input.value).join('');
        if (code.length !== 6) {
            this.showError('Please enter the complete verification code');
            return;
        }
        try {
            const isValid = await this.validateOTP(code);
            if (isValid) {
                this.onSuccess();
            }
            else {
                this.showError('Invalid verification code. Please try again.');
            }
        }
        catch (error) {
            console.error('Verification error:', error);
            this.showError('Verification failed. Please try again.');
        }
    }
    async validateOTP(code) {
        // TODO: Implement actual OTP validation
        // For now, simulate validation
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate API call
                resolve(code === '123456'); // For testing, accept 123456
            }, 1000);
        });
    }
    showError(message) {
        const errorDiv = document.getElementById('verificationError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
}
