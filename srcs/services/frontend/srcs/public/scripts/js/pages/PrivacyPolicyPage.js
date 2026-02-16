export class PrivacyPolicyPage {
    constructor(uiManager, languageManager, onBackToMenu) {
        this.uiManager = uiManager;
        this.languageManager = languageManager;
        this.onBackToMenu = onBackToMenu;
    }
    t(key) {
        return this.languageManager.t(key);
    }
    render() {
        const backCallback = this.onBackToMenu;
        const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col p-8 bg-black text-white overflow-y-auto');
        // Header with back button
        const header = this.uiManager.createElement('div', 'flex items-center justify-between mb-8 border-b-2 border-cyan-400 pb-4');
        const backButton = this.uiManager.createButton(this.t('backToMenu') || 'BACK TO MENU', 'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2', () => backCallback());
        const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
        backButton.appendChild(backIcon);
        const title = this.uiManager.createElement('h1', 'text-3xl font-bold text-center flex-1 text-cyan-400 glow-text');
        title.textContent = this.t('privacyTitle') || 'PRIVACY POLICY';
        const placeholder = this.uiManager.createElement('div', 'w-20');
        header.appendChild(backButton);
        header.appendChild(title);
        header.appendChild(placeholder);
        // Content
        const content = this.uiManager.createElement('div', 'max-w-4xl mx-auto space-y-6 text-gray-300');
        // Last Updated
        const lastUpdated = this.uiManager.createElement('p', 'text-sm text-gray-400');
        const labelUpdated = this.t('lastUpdatedLabel') || 'Last Updated:';
        const dateUpdated = this.t('lastUpdatedDate') || 'February 3, 2026';
        lastUpdated.innerHTML = `<strong>${labelUpdated}</strong> ${dateUpdated}`;
        content.appendChild(lastUpdated);
        // Section 1: Introduction
        this.addSection(content, this.t('privacySec1Title') || '1. INTRODUCTION', this.t('privacySec1Text') || 'Welcome to Transcendence, a real-time multiplayer Pong game platform. We are committed to protecting your privacy and ensuring you have a positive experience. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.');
        // Section 2: Information We Collect
        this.addSection(content, this.t('privacySec2Title') || '2. INFORMATION WE COLLECT', this.t('privacySec2Text') || 'We collect information you provide directly to us and information we collect automatically when you use the service.');
        this.addSubsection(content, this.t('privacySec2_1Title') || '2.1 Account Information', this.t('privacySec2_1Text') || 'When you create an account, we collect your username, email address, and password.');
        this.addSubsection(content, this.t('privacySec2_2Title') || '2.2 Game Data', this.t('privacySec2_2Text') || 'We collect gameplay data such as match history, scores, and performance statistics to provide game features and improve the service.');
        this.addSubsection(content, this.t('privacySec2_3Title') || '2.3 Device and Usage Information', this.t('privacySec2_3Text') || 'We collect information about the device you use to access the service, including IP address, browser type, and usage activity.');
        this.addSubsection(content, this.t('privacySec2_4Title') || '2.4 Chat Communications', this.t('privacySec2_4Text') || 'If you use live chat features, we collect the content of your messages to provide the service and enforce community guidelines.');
        // Section 3: Guest Users
        this.addSection(content, this.t('privacySec3Title') || '3. GUEST USERS', this.t('privacySec3Text') || 'Guest users can access certain gameplay features without creating an account. For guest play, we collect minimal data such as session identifiers and gameplay statistics.');
        // Section 4: How We Use Information
        this.addSection(content, this.t('privacySec4Title') || '4. HOW WE USE INFORMATION', this.t('privacySec4Text') || 'We use the information we collect to operate, maintain, and improve the service, including to:');
        this.addSubsection(content, this.t('privacySec4_1Title') || '4.1 Provide and Improve Services', this.t('privacySec4_1Text') || 'To operate game features, track stats, and improve user experience.');
        this.addSubsection(content, this.t('privacySec4_2Title') || '4.2 Authentication and Security', this.t('privacySec4_2Text') || 'To authenticate users and protect the service from abuse or unauthorized access.');
        this.addSubsection(content, this.t('privacySec4_3Title') || '4.3 Communications', this.t('privacySec4_3Text') || 'To send service-related notifications and respond to user inquiries.');
        // Section 5: Sharing of Information
        this.addSection(content, this.t('privacySec5Title') || '5. SHARING OF INFORMATION', this.t('privacySec5Text') || 'We do not sell your personal information. We may share information in the following circumstances:');
        this.addSubsection(content, this.t('privacySec5_1Title') || '5.1 Service Providers', this.t('privacySec5_1Text') || 'With third-party providers who help us operate and maintain the service.');
        this.addSubsection(content, this.t('privacySec5_2Title') || '5.2 Legal Requirements', this.t('privacySec5_2Text') || 'If required by law or to protect the rights and safety of our users and the service.');
        // Section 6: Cookies and Tracking
        this.addSection(content, this.t('privacySec6Title') || '6. COOKIES AND TRACKING', this.t('privacySec6Text') || 'We may use cookies and similar technologies to keep you signed in and to understand how you use the service.');
        // Section 7: Data Security
        this.addSection(content, this.t('privacySec7Title') || '7. DATA SECURITY', this.t('privacySec7Text') || 'We implement reasonable security measures to protect your information. However, no method of transmission or storage is completely secure.');
        // Section 8: Your Choices and Rights
        this.addSection(content, this.t('privacySec8Title') || '8. YOUR CHOICES AND RIGHTS', this.t('privacySec8Text') || 'You may update your account information or request deletion of your account by contacting us.');
        // Section 9: Data Retention
        this.addSection(content, this.t('privacySec9Title') || '9. DATA RETENTION', this.t('privacySec9Text') || 'We retain information as long as necessary to provide the service and comply with legal obligations.');
        // Section 10: Children’s Privacy
        this.addSection(content, this.t('privacySec10Title') || '10. CHILDREN\'S PRIVACY', this.t('privacySec10Text') || 'The service is not intended for children under 13. We do not knowingly collect personal information from children under 13.');
        // Section 11: International Users
        this.addSection(content, this.t('privacySec11Title') || '11. INTERNATIONAL USERS', this.t('privacySec11Text') || 'Your information may be processed in countries other than your own. By using the service, you consent to this processing.');
        // Section 12: Changes to Privacy Policy
        this.addSection(content, this.t('privacySec12Title') || '12. CHANGES TO THIS PRIVACY POLICY', this.t('privacySec12Text') || 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the updated policy on our website and updating the "Last Updated" date. Your continued use of our services indicates acceptance of the updated Privacy Policy.');
        // Section 13: Contact Us
        this.addSection(content, this.t('privacySec13Title') || '13. CONTACT US', this.t('privacySec13Text') || 'If you have any questions about this Privacy Policy or our privacy practices, please contact us at:');
        const contactInfo = this.uiManager.createElement('p', 'text-cyan-400 font-semibold');
        contactInfo.textContent = 'transcendence@example.com';
        content.appendChild(contactInfo);
        container.appendChild(header);
        container.appendChild(content);
        this.uiManager.clear();
        this.uiManager.container.appendChild(container);
    }
    addSection(container, title, text) {
        const section = this.uiManager.createElement('div', 'space-y-2');
        const heading = this.uiManager.createElement('h2', 'text-xl text-cyan-400 font-bold');
        heading.textContent = title;
        const paragraph = this.uiManager.createElement('p', 'text-gray-300 leading-relaxed');
        paragraph.textContent = text;
        section.appendChild(heading);
        section.appendChild(paragraph);
        container.appendChild(section);
    }
    addSubsection(container, title, text) {
        const subsection = this.uiManager.createElement('div', 'pl-4 border-l-2 border-cyan-400/30 space-y-1');
        const heading = this.uiManager.createElement('h3', 'text-lg text-cyan-300 font-semibold');
        heading.textContent = title;
        const paragraph = this.uiManager.createElement('p', 'text-gray-300 leading-relaxed');
        paragraph.textContent = text;
        subsection.appendChild(heading);
        subsection.appendChild(paragraph);
        container.appendChild(subsection);
    }
}
