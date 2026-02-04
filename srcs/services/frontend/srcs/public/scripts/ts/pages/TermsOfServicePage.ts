import { UIManager } from '../modules/UIManager.js';

export class TermsOfServicePage {
  private uiManager: UIManager;
  private onBackToMenu: () => void;

  constructor(uiManager: UIManager, onBackToMenu: () => void) {
    this.uiManager = uiManager;
    this.onBackToMenu = onBackToMenu;
  }

  render(): void {
    const backCallback = this.onBackToMenu;
    const container = this.uiManager.createElement('div', 'retro-container size-full flex flex-col p-8 bg-black text-white overflow-y-auto');

    // Header with back button
    const header = this.uiManager.createElement('div', 'flex items-center justify-between mb-8 border-b-2 border-cyan-400 pb-4');

    const backButton = this.uiManager.createButton(
      'BACK TO MENU',
      'retro-button bg-transparent text-[#00ffff] px-4 py-2 rounded border-2 border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-all duration-200 flex items-center gap-2',
      () => backCallback()
    );
    const backIcon = this.uiManager.createIcon('arrow-left', 'w-4 h-4');
    backButton.appendChild(backIcon);

    const title = this.uiManager.createElement('h1', 'text-3xl font-bold text-center flex-1 text-cyan-400 glow-text');
    title.textContent = 'TERMS OF SERVICE';

    const placeholder = this.uiManager.createElement('div', 'w-20');

    header.appendChild(backButton);
    header.appendChild(title);
    header.appendChild(placeholder);

    // Content
    const content = this.uiManager.createElement('div', 'max-w-4xl mx-auto space-y-6 text-gray-300');

    // Last Updated
    const lastUpdated = this.uiManager.createElement('p', 'text-sm text-gray-400');
    lastUpdated.innerHTML = '<strong>Last Updated:</strong> February 3, 2026';
    content.appendChild(lastUpdated);

    // Section 1: Acceptance of Terms
    this.addSection(content, '1. ACCEPTANCE OF TERMS',
      'By accessing and using Transcendence, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. These Terms of Service apply to all users, including but not limited to users who are browsers, vendors, customers, merchants, and/ or contributors of content.'
    );

    // Section 2: License
    this.addSection(content, '2. LICENSE',
      'Permission is granted to temporarily download one copy of the materials on Transcendence for personal, non-commercial viewing only. This is the grant of a license, not a transfer of title.'
    );

    // Section 3: Disclaimer
    this.addSection(content, '3. DISCLAIMER',
      'The materials on Transcendence are provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.'
    );

    // Section 4: Limitations
    this.addSection(content, '4. LIMITATIONS',
      'In no event shall Transcendence or its suppliers be liable for any damages arising out of the use or inability to use the materials on the service.'
    );

    // Section 5: Accuracy of Materials
    this.addSection(content, '5. ACCURACY OF MATERIALS',
      'The materials appearing on Transcendence could include technical, typographical, or photographic errors. We do not warrant that any of the materials are accurate, complete, or current.'
    );

    // Section 6: Modifications
    this.addSection(content, '6. MODIFICATIONS',
      'We may revise these Terms of Service at any time without notice. By using the service, you agree to be bound by the then-current version.'
    );

    // Section 7: Governing Law
    this.addSection(content, '7. GOVERNING LAW',
      'These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the service is operated.'
    );

    // Section 8: Accounts
    this.addSection(content, '8. ACCOUNTS',
      'You are responsible for safeguarding your account and for all activities that occur under your account. You agree to provide accurate and complete information.'
    );

    // Section 9: User Conduct
    this.addSection(content, '9. USER CONDUCT',
      'You agree not to use the service for any unlawful purpose or to violate any applicable laws. Harassment, cheating, or abusive behavior is prohibited.'
    );

    // Section 10: Gameplay Rules
    this.addSection(content, '10. GAMEPLAY RULES',
      'You agree to play fairly and not exploit bugs or cheats. We reserve the right to suspend or terminate accounts that violate gameplay rules.'
    );

    // Section 11: Intellectual Property
    this.addSection(content, '11. INTELLECTUAL PROPERTY',
      'The service and its original content, features, and functionality are owned by Transcendence and are protected by intellectual property laws.'
    );

    // Section 12: Termination
    this.addSection(content, '12. TERMINATION',
      'We may terminate or suspend access to the service immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms.'
    );

    // Section 13: Warranty Disclaimer
    this.addSection(content, '13. WARRANTY DISCLAIMER',
      'Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis.'
    );

    // Section 14: Limitation of Liability
    this.addSection(content, '14. LIMITATION OF LIABILITY',
      'In no event shall Transcendence, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential or punitive damages.'
    );

    // Section 15: Third-Party Services
    this.addSection(content, '15. THIRD-PARTY SERVICES',
      'The service may contain links or access to third-party services that are not owned or controlled by Transcendence. We assume no responsibility for the content or practices of any third-party services.'
    );

    // Section 16: Chat Communications
    this.addSection(content, '16. CHAT COMMUNICATIONS',
      'You are responsible for all content you post in chat. We may remove content that violates these Terms or community guidelines.'
    );

    // Section 17: Dispute Resolution
    this.addSection(content, '17. DISPUTE RESOLUTION',
      'Any disputes arising out of or relating to these Terms will be resolved through binding arbitration or courts of competent jurisdiction.'
    );

    // Section 18: Entire Agreement
    this.addSection(content, '18. ENTIRE AGREEMENT',
      'These Terms of Service, together with the Privacy Policy, constitute the entire agreement between you and Transcendence regarding your use of the service and supersede all prior agreements and understandings.'
    );

    // Section 19: Changes to Terms
    this.addSection(content, '19. CHANGES TO TERMS',
      'We may update these Terms from time to time. We will notify you of any significant changes by posting the updated terms on our website and updating the "Last Updated" date.'
    );

    // Section 20: Contact Us
    this.addSection(content, '20. CONTACT US',
      'If you have any questions about these Terms of Service, please contact us at:'
    );

    const contactInfo = this.uiManager.createElement('p', 'text-cyan-400 font-semibold');
    contactInfo.textContent = 'transcendence@example.com';
    content.appendChild(contactInfo);

    container.appendChild(header);
    container.appendChild(content);

    this.uiManager.clear();
    this.uiManager.container.appendChild(container);
  }

  private addSection(container: HTMLElement, title: string, text: string): void {
    const section = this.uiManager.createElement('div', 'space-y-2');
    const heading = this.uiManager.createElement('h2', 'text-xl text-cyan-400 font-bold');
    heading.textContent = title;
    const paragraph = this.uiManager.createElement('p', 'text-gray-300 leading-relaxed');
    paragraph.textContent = text;
    section.appendChild(heading);
    section.appendChild(paragraph);
    container.appendChild(section);
  }

  private addSubsection(container: HTMLElement, title: string, text: string): void {
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
