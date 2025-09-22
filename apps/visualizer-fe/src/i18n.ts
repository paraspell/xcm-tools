import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const persistHtmlLangDir = (lng: string) => {
  const dir = i18n.dir(lng);
  const html = document.documentElement;
  html.setAttribute('lang', lng);
  html.setAttribute('dir', dir);
  try {
    localStorage.setItem('i18nextLng', lng);
    localStorage.setItem('i18n_dir', dir);
  } catch {
    /* empty */
  }
};

void i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'fr', 'es', 'pt', 'cn', 'ar', 'ja', 'ru', 'sk'],
    nonExplicitSupportedLngs: true, // map en-US -> en
    lowerCaseLng: true,
    debug: false,
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}.json' },
    detection: {
      order: ['localStorage', 'querystring', 'cookie', 'htmlTag', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

// Keep <html lang/dir> correct on first init and on every change
i18n.on('initialized', () => {
  persistHtmlLangDir(i18n.resolvedLanguage || i18n.language);
});
i18n.on('languageChanged', lng => {
  persistHtmlLangDir(lng);
});

export default i18n;
