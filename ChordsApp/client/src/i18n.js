import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import he from './locales/he/translation.json';

// Configure i18n
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            he: { translation: he }
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'he'],
        detection: {
            // Order of lookup - localStorage first, then others
            order: ['localStorage', 'navigator', 'htmlTag'],
            // Cache user language in localStorage
            caches: ['localStorage'],
            // Key name in localStorage
            lookupLocalStorage: 'i18nextLng'
        },
        interpolation: {
            escapeValue: false // React already does escaping
        }
    });

// Handle RTL direction change
i18n.on('languageChanged', (lng) => {
    document.documentElement.setAttribute('dir', lng === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
});

// Set initial direction based on detected/stored language
i18n.on('initialized', () => {
    const lng = i18n.language;
    document.documentElement.setAttribute('dir', lng === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
});

// Also set immediately after init completes
const setInitialDirection = () => {
    const lng = i18n.language || 'en';
    document.documentElement.setAttribute('dir', lng === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
};

// Run after a short delay to ensure init is complete
setTimeout(setInitialDirection, 0);

export default i18n;
