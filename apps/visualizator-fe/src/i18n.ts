/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en/translation.json';

const resources = {
  en: {
    translation: translationEN
  }
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
