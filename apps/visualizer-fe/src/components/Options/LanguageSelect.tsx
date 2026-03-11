import { Select } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LANGS = new Set(['ar', 'fa', 'he', 'ur']);

const NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  cn: '中文',
  ar: 'العربية',
  ja: '日本語',
  ru: 'Русский',
  sk: 'Slovenčina'
};

export const LanguageSelect = () => {
  const { i18n, t } = useTranslation();

  const supported = useMemo(
    () => (i18n.options.supportedLngs || []).filter(l => l && l !== 'cimode'),
    [i18n.options.supportedLngs]
  );

  const data = useMemo(
    () => supported.map(code => ({ value: code, label: NAMES[code] ?? code })),
    [supported]
  );

  return (
    <Select
      label={t('settings.localisation.language')}
      placeholder={t('settings.localisation.selectLanguage')}
      data={data}
      value={i18n.resolvedLanguage || i18n.language}
      onChange={val => {
        if (!val) return;
        void i18n.changeLanguage(val).then(() => {
          const html = document.documentElement;
          html.setAttribute('lang', val);
          html.setAttribute('dir', RTL_LANGS.has(val) ? 'rtl' : 'ltr');
          try {
            localStorage.setItem('i18nextLng', val);
          } catch {
            /* empty */
          }
        });
      }}
      searchable
      aria-label={t('settings.localisation.language')}
    />
  );
};
