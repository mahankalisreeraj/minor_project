import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en/translation.json';
import teTranslation from './locales/te/translation.json';
import hiTranslation from './locales/hi/translation.json';
import bnTranslation from './locales/bn/translation.json';
import mrTranslation from './locales/mr/translation.json';
import taTranslation from './locales/ta/translation.json';
import urTranslation from './locales/ur/translation.json';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      te: {
        translation: teTranslation
      },
      hi: {
        translation: hiTranslation
      },
      bn: {
        translation: bnTranslation
      },
      mr: {
        translation: mrTranslation
      },
      ta: {
        translation: taTranslation
      },
      ur: {
        translation: urTranslation
      }
    },
    lng: 'en', // default language
    fallbackLng: 'en', // fallback language if translation is not found for current language

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
