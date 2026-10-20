import { describe, expect, it } from 'vitest';
import { normalisePath, publicView } from '../src/resume/public-view.ts';
import { sampleResume } from '../src/resume/sample.ts';
import type { Resume } from '../src/resume/types.ts';

describe('normalisePath', () => {
  it('expands basics shorthands', () => {
    expect(normalisePath('phone')).toEqual(['basics', 'phone']);
    expect(normalisePath('location.address')).toEqual(['basics', 'location', 'address']);
    expect(normalisePath('basics.email')).toEqual(['basics', 'email']);
    expect(normalisePath('references')).toEqual(['references']);
    expect(normalisePath(' work . location ')).toEqual(['work', 'location']);
  });
});

describe('publicView', () => {
  it('removes the phone but keeps it in the original (the PDF)', () => {
    const resume = sampleResume();
    const web = publicView(resume);
    expect(web.basics?.phone).toBeUndefined();
    expect(web.basics?.email).toBe('alex@example.com');
    expect(resume.basics?.phone).toBe('+34 600 000 000');
    expect(resume.meta?.cvkit?.hideOnWeb).toEqual(['phone']);
  });

  it('removes the hideOnWeb list but keeps other settings', () => {
    const web = publicView(sampleResume());
    expect(web.meta?.cvkit).toEqual({ template: 'modern', accent: '#7c9cff', language: 'en' });
  });

  it('hides whole sections, nested fields and a field in every entry', () => {
    const resume: Resume = {
      basics: {
        name: 'Ana',
        location: { address: 'Calle Mayor 1', city: 'Sevilla' },
        image: 'data:image/png;base64,AA',
      },
      work: [
        { name: 'A', location: 'Sevilla' },
        { name: 'B', location: 'Huelva' },
      ],
      references: [{ name: 'Bea' }],
      meta: { cvkit: { hideOnWeb: ['references', 'location.address', 'work.location', 'image', 'missing.path'] } },
    };
    const web = publicView(resume);
    expect(web.references).toBeUndefined();
    expect(web.basics).toEqual({ name: 'Ana', location: { city: 'Sevilla' } });
    expect(web.work).toEqual([{ name: 'A' }, { name: 'B' }]);
  });

  it('returns an equal copy when nothing is hidden', () => {
    const resume: Resume = { basics: { name: 'Ana', phone: '1' } };
    const web = publicView(resume);
    expect(web).toEqual(resume);
    expect(web).not.toBe(resume);
  });
});
