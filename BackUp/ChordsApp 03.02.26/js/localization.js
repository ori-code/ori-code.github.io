/**
 * Localization Logic for ChordsApp
 * Handles language switching, text updates, and LTR/RTL direction logic.
 */

class LocalizationManager {
    constructor() {
        this.currentLang = localStorage.getItem('achordim_lang') || 'en'; // Default to English initially
        this.translations = window.translations || {};

        // Bind methods
        this.setLanguage = this.setLanguage.bind(this);
        this.toggleLanguage = this.toggleLanguage.bind(this);
        this.updateUI = this.updateUI.bind(this);

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        // Create toggle button in navbar if it doesn't exist
        this.injectToggle();

        // Apply initial language
        this.setLanguage(this.currentLang);
    }

    injectToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle && !document.getElementById('langToggle')) {
            const btn = document.createElement('button');
            btn.id = 'langToggle';
            btn.className = 'ghost-button';
            btn.type = 'button';
            btn.title = 'Switch Language / החלף שפה';
            btn.innerHTML = `<span style="font-size: 1.1rem; font-weight: 600;">${this.currentLang === 'en' ? 'HE' : 'EN'}</span>`;
            btn.onclick = this.toggleLanguage;

            // Insert before theme toggle
            themeToggle.parentNode.insertBefore(btn, themeToggle);
        }
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'he' : 'en';
        this.setLanguage(newLang);
    }

    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language '${lang}' not found in translations.`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('achordim_lang', lang);

        // Update language attribute but FORCE LTR direction for layout stability
        document.documentElement.lang = lang;
        document.documentElement.dir = 'ltr'; // User requested UI layout refers LTR even in Hebrew

        // Apply RTL specifically to Hero, Workflow, and Features Modal
        const rtlSections = document.querySelectorAll('.hero, .workflow, #featuresModal');
        rtlSections.forEach(section => {
            if (section) section.dir = lang === 'he' ? 'rtl' : 'ltr';
        });

        // Update Toggle Button Text
        const toggleBtn = document.getElementById('langToggle');
        if (toggleBtn) {
            // If current is HE, show option to switch to EN
            toggleBtn.innerHTML = `<span style="font-size: 1.1rem; font-weight: 600;">${lang === 'en' ? 'HE' : 'EN'}</span>`;
        }

        // Apply translations
        this.updateUI();

        // Dispatch event for other components to react (e.g., Editor layout)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    updateUI() {
        const dictionary = this.translations[this.currentLang];

        // Update elements with data-i18n-html (For HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (dictionary[key]) {
                el.innerHTML = dictionary[key];
            }
        });

        // Update all elements with data-i18n attribute (For text content)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary[key]) {
                if (el.children.length === 0) {
                    el.textContent = dictionary[key];
                } else {
                    // Only replace text nodes, leave elements (like icons) alone
                    Array.from(el.childNodes).forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                            node.textContent = dictionary[key];
                        }
                    });
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dictionary[key]) {
                el.placeholder = dictionary[key];
            }
        });

        // Update titles (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (dictionary[key]) {
                el.title = dictionary[key];
            }
        });
    }

    /**
     * Helper to get a translation string dynamically
     * @param {string} key 
     * @returns {string} Translated text
     */
    get(key) {
        return this.translations[this.currentLang][key] || key;
    }
}

// Global Instance
window.localization = new LocalizationManager();

// Helper globally accessible function
window.t = (key) => window.localization.get(key);
