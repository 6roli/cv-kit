import { describe, expect, it } from 'vitest';
import { getAt, linesToList, moveItem, setAt, tagsToList } from '../src/app/paths.ts';

describe('getAt / setAt', () => {
  it('reads nested values', () => {
    const data = { work: [{ highlights: ['a', 'b'] }] };
    expect(getAt(data, ['work', 0, 'highlights', 1])).toBe('b');
    expect(getAt(data, ['work', 3, 'name'])).toBeUndefined();
    expect(getAt(data, ['basics', 'name'])).toBeUndefined();
  });

  it('creates missing objects and arrays', () => {
    const data: Record<string, unknown> = {};
    setAt(data, ['basics', 'location', 'city'], 'Cádiz');
    setAt(data, ['basics', 'profiles', 0, 'network'], 'GitHub');
    expect(data).toEqual({ basics: { location: { city: 'Cádiz' }, profiles: [{ network: 'GitHub' }] } });
  });

  it('removes keys set to empty values', () => {
    const data: Record<string, unknown> = { work: [{ name: 'A', endDate: '2020', highlights: ['x'] }] };
    setAt(data, ['work', 0, 'endDate'], '');
    setAt(data, ['work', 0, 'highlights'], []);
    expect(data).toEqual({ work: [{ name: 'A' }] });
  });

  it('keeps unrelated extra fields', () => {
    const data: Record<string, unknown> = { basics: { name: 'A', pronouns: 'she/her' } };
    setAt(data, ['basics', 'name'], 'Ana');
    expect(data).toEqual({ basics: { name: 'Ana', pronouns: 'she/her' } });
  });
});

describe('moveItem', () => {
  it('moves items and rejects impossible moves', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, 1)).toBe(true);
    expect(list).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 2, 3)).toBe(false);
    expect(moveItem(list, -1, 0)).toBe(false);
    expect(list).toEqual(['b', 'a', 'c']);
  });
});

describe('text to lists', () => {
  it('splits lines and commas, dropping blanks', () => {
    expect(linesToList('First\n\n  Second  \n')).toEqual(['First', 'Second']);
    expect(tagsToList('SQL, Python ,, DuckDB')).toEqual(['SQL', 'Python', 'DuckDB']);
  });
});
