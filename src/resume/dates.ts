import type { CvLanguage } from './types.ts';

/*
 * Month names are written out (not taken from Intl) so the output is identical
 * in every browser and in the tests.
 */
const MONTHS: Record<CvLanguage, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
};

const PRESENT: Record<CvLanguage, string> = { en: 'Present', es: 'Actualidad' };

const PARTS = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/**
 * Formats a JSON Resume date for display.
 *
 * - `2024` → `2024`
 * - `2024-03` → `Mar 2024` (es: `mar 2024`)
 * - `2024-03-05` → `5 Mar 2024`, or `Mar 2024` with `{ day: false }`
 *
 * Text that is not an ISO date is returned trimmed, unchanged, so nothing the
 * person typed is lost.
 */
export function formatDate(value: string | undefined, lang: CvLanguage = 'en', opts: { day?: boolean } = {}): string {
  const text = (value ?? '').trim();
  const m = PARTS.exec(text);
  if (!m) return text;
  const [, year, month, day] = m;
  const monthIndex = month ? Number(month) - 1 : -1;
  if (!month || monthIndex < 0 || monthIndex > 11) return year!;
  const monthName = MONTHS[lang][monthIndex]!;
  if (day && opts.day !== false) return `${Number(day)} ${monthName} ${year}`;
  return `${monthName} ${year}`;
}

/**
 * Formats a period. A start date without an end date is an ongoing role:
 * `Mar 2021 – Present`. Ranges use month precision; days are dropped.
 */
export function formatRange(start: string | undefined, end: string | undefined, lang: CvLanguage = 'en'): string {
  const from = formatDate(start, lang, { day: false });
  const to = formatDate(end, lang, { day: false });
  if (from && !to) return `${from} – ${PRESENT[lang]}`;
  if (!from) return to;
  if (from === to) return from;
  return `${from} – ${to}`;
}

/** True when an entry has started and has no end date. */
export function isOngoing(start: string | undefined, end: string | undefined): boolean {
  return Boolean(start?.trim()) && !end?.trim();
}
