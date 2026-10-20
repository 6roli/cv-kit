import { describe, expect, it } from 'vitest';
import { isIsoDate, parseResume, validateResume } from '../src/resume/validate.ts';
import { emptyResume, sampleResume } from '../src/resume/sample.ts';

describe('validateResume', () => {
  it('accepts the sample and the empty resume', () => {
    expect(validateResume(sampleResume())).toMatchObject({ ok: true, errors: [], warnings: [] });
    expect(validateResume(emptyResume()).ok).toBe(true);
  });

  it('accepts an empty object (every field is optional)', () => {
    expect(validateResume({}).ok).toBe(true);
  });

  it('tolerates and keeps unknown extra fields', () => {
    const input = {
      basics: { name: 'Ana Núñez', pronouns: 'she/her', location: { city: 'Cádiz', planet: 'Earth' } },
      work: [{ name: 'Acme', team: 'Data', startDate: '2020' }],
      customSection: [{ anything: true }],
      meta: { theme: 'elegant', cvkit: { template: 'dark', futureOption: 1 } },
    };
    const result = validateResume(input);
    expect(result.ok).toBe(true);
    expect(result.resume).toBe(input);
    expect(result.resume?.basics?.pronouns).toBe('she/her');
  });

  it('rejects non-objects with a clear message', () => {
    expect(validateResume([]).errors[0]).toMatch(/JSON object, got a list/);
    expect(validateResume(null).errors[0]).toMatch(/got null/);
    expect(validateResume('cv').ok).toBe(false);
  });

  it('reports wrong types with their path', () => {
    const result = validateResume({
      basics: { name: 42, location: 'Madrid', profiles: {} },
      work: { name: 'Acme' },
      skills: [{ name: 'SQL', keywords: 'SQL, Python' }, 'Python'],
    });
    expect(result.ok).toBe(false);
    expect(result.resume).toBeUndefined();
    expect(result.errors).toEqual([
      'basics.name: expected a text, got number 42.',
      'basics.location: expected an object, got "Madrid".',
      'basics.profiles: expected a list, got an object.',
      'work: expected a list of entries, got an object.',
      'skills[0].keywords: expected a list of texts, got "SQL, Python".',
      'skills[1]: expected an object, got "Python".',
    ]);
  });

  it('rejects dates that are not ISO 8601', () => {
    const result = validateResume({ work: [{ startDate: 'March 2020', endDate: '2021-13' }] });
    expect(result.errors).toEqual([
      'work[0].startDate: expected a date like 2024, 2024-03 or 2024-03-15, got "March 2020".',
      'work[0].endDate: expected a date like 2024, 2024-03 or 2024-03-15, got "2021-13".',
    ]);
  });

  it('accepts an empty end date (ongoing role)', () => {
    expect(validateResume({ work: [{ startDate: '2020-01', endDate: '' }] }).ok).toBe(true);
  });

  it('warns about probable mistakes without rejecting', () => {
    const result = validateResume({
      basics: { email: 'not-an-email', url: 'example.com' },
      work: [{ startDate: '2022-05', endDate: '2021' }],
    });
    expect(result.ok).toBe(true);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings[2]).toMatch(/endDate 2021 is before startDate 2022-05/);
  });

  it('does not warn when the end date is the start year', () => {
    expect(validateResume({ work: [{ startDate: '2022-05', endDate: '2022' }] }).warnings).toEqual([]);
  });

  it('validates the CV Kit settings', () => {
    const result = validateResume({
      meta: { cvkit: { template: 'fancy', accent: 'blue', language: 'de', hideOnWeb: 'phone' } },
    });
    expect(result.errors).toHaveLength(4);
    expect(result.errors[0]).toMatch(/template: expected one of classic, modern, dark/);
  });
});

describe('parseResume', () => {
  it('reports JSON syntax errors', () => {
    const result = parseResume('{ "basics": ');
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/^This is not valid JSON/);
  });

  it('parses UTF-8 text with accents', () => {
    const result = parseResume('{"basics":{"name":"José Ñúñez","location":{"city":"A Coruña"}}}');
    expect(result.resume?.basics?.name).toBe('José Ñúñez');
  });
});

describe('isIsoDate', () => {
  it.each(['2024', '2024-03', '2024-03-15', '1999-12-31'])('accepts %s', (d) => expect(isIsoDate(d)).toBe(true));
  it.each(['24', '2024-3', '2024-00', '2024-03-32', '2024/03', 'Present', ''])('rejects %s', (d) =>
    expect(isIsoDate(d)).toBe(false),
  );
});
