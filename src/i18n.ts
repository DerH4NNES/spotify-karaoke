import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: ['de', 'en'],
      resources: {
        en: { translation: en },
        de: { translation: de },
      },
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      detection: {
        order: ['querystring', 'navigator', 'htmlTag', 'path', 'subdomain'],
        caches: [],
      },
    });
}

export default i18n;
