import { describe, expect, it } from 'vitest';
import { formatDate, formatRange, isOngoing } from '../src/resume/dates.ts';

describe('formatDate', () => {
  it('formats years, months and days', () => {
    expect(formatDate('2024')).toBe('2024');
    expect(formatDate('2024-03')).toBe('Mar 2024');
    expect(formatDate('2024-03-05')).toBe('5 Mar 2024');
    expect(formatDate('2024-03-05', 'en', { day: false })).toBe('Mar 2024');
  });

  it('uses Spanish month names', () => {
    expect(formatDate('2024-01', 'es')).toBe('ene 2024');
    expect(formatDate('2024-09-30', 'es')).toBe('30 sept 2024');
  });

  it('keeps text that is not a date and handles empty values', () => {
    expect(formatDate(' Spring 2020 ')).toBe('Spring 2020');
    expect(formatDate('')).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatRange', () => {
  it('shows ongoing roles as Present', () => {
    expect(formatRange('2021-03', undefined)).toBe('Mar 2021 – Present');
    expect(formatRange('2021-03', '')).toBe('Mar 2021 – Present');
    expect(formatRange('2021', undefined, 'es')).toBe('2021 – Actualidad');
  });

  it('formats closed ranges with month precision', () => {
    expect(formatRange('2019-01-15', '2020-07-31')).toBe('Jan 2019 – Jul 2020');
    expect(formatRange('2014', '2018')).toBe('2014 – 2018');
    expect(formatRange('2014-09', '2018-06', 'es')).toBe('sept 2014 – jun 2018');
  });

  it('handles a single date or none', () => {
    expect(formatRange(undefined, '2020')).toBe('2020');
    expect(formatRange('2020-05', '2020-05')).toBe('May 2020');
    expect(formatRange(undefined, undefined)).toBe('');
  });
});

describe('isOngoing', () => {
  it('is true only with a start and no end', () => {
    expect(isOngoing('2020', undefined)).toBe(true);
    expect(isOngoing('2020', ' ')).toBe(true);
    expect(isOngoing('2020', '2021')).toBe(false);
    expect(isOngoing(undefined, undefined)).toBe(false);
  });
});
