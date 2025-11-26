import type dayjs from 'dayjs';

import i18n from '../i18n';

type DateInput = Date | string | number | dayjs.Dayjs;

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const lang = i18n.resolvedLanguage || i18n.language || 'en';

  let date: Date;
  if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = value.toDate();
  }

  return new Intl.DateTimeFormat(lang, options).format(date);
}
