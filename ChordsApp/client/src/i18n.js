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
        interpolation: {
            escapeValue: false // React already does escaping
        }
    });

// Handle RTL direction change
i18n.on('languageChanged', (lng) => {
    document.documentElement.setAttribute('dir', lng === 'he' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
});

export default i18n;
