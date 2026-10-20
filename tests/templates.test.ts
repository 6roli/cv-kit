import { describe, expect, it } from 'vitest';
import { accentVariables, renderResume, TEMPLATES } from '../src/templates/index.ts';
import { displayUrl, esc, safeImage, safeUrl } from '../src/templates/shared.ts';
import { sampleResume } from '../src/resume/sample.ts';
import { publicView } from '../src/resume/public-view.ts';
import { TEMPLATE_IDS, type Resume } from '../src/resume/types.ts';

const ids = TEMPLATE_IDS.map((id) => [id] as const);

function sectionsIn(html: string): string[] {
  return [...html.matchAll(/class="cv-section cv-section--([a-z]+)/g)].map((m) => m[1]!).sort();
}

describe('renderResume', () => {
  it('has one TEMPLATES entry per template id', () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([...TEMPLATE_IDS]);
  });

  it.each(ids)('%s renders every section of the sample', (id) => {
    const html = renderResume(sampleResume(), id);
    expect(html.startsWith(`<div class="cv cv--${id}" lang="en">`)).toBe(true);
    const expected = [
      'awards',
      'certificates',
      'education',
      'interests',
      'languages',
      'projects',
      'references',
      'skills',
      'summary',
      'volunteer',
      'work',
    ];
    if (id === 'modern') expected.push('contact');
    expect(sectionsIn(html)).toEqual(expected.sort());
    expect(html).toContain('<h1 class="cv-name">Alex Example</h1>');
    expect(html).toContain('Senior Data Engineer');
    expect(html).toContain('Apr 2023 – Present');
    expect(html).toContain('href="mailto:alex@example.com"');
    expect(html).toContain('href="tel:+34600000000"');
    expect(html).toContain('Málaga, Andalucía, ES');
  });

  it.each(ids)('%s omits empty sections and blank entries', (id) => {
    const resume: Resume = {
      basics: { name: 'Ana', summary: '   ' },
      work: [{ name: '', position: '', highlights: [] }],
      skills: [],
      education: [{ institution: 'Universidad de Cádiz' }],
    };
    const html = renderResume(resume, id);
    expect(sectionsIn(html)).toEqual(['education']);
  });

  it('uses Spanish labels and dates', () => {
    const html = renderResume(sampleResume(), 'classic', 'es');
    expect(html).toContain('lang="es"');
    expect(html).toContain('>Experiencia</h2>');
    expect(html).toContain('>Formación</h2>');
    expect(html).toContain('abr 2023 – Actualidad');
  });

  it('shows the phone in the full CV but not in the public view', () => {
    expect(renderResume(sampleResume(), 'modern')).toContain('+34 600 000 000');
    expect(renderResume(publicView(sampleResume()), 'modern')).not.toContain('600 000 000');
  });

  describe.each(ids)('%s escapes user text', (id) => {
    const evil = '<img src=x onerror="alert(1)">';
    const resume: Resume = {
      basics: {
        name: `<script>alert('x')</script>`,
        label: evil,
        summary: `Tom & Jerry ${evil}`,
        url: 'javascript:alert(1)',
        email: '"><svg onload=alert(1)>@x.com',
        image: 'javascript:alert(1)',
        profiles: [{ network: 'Web', url: 'data:text/html,<script>alert(1)</script>' }],
      },
      work: [{ name: evil, position: '<b>Boss</b>', url: 'javascript:alert(1)', highlights: [evil] }],
      skills: [{ name: evil, keywords: ['<i>x</i>'] }],
      languages: [{ language: '<u>es</u>', fluency: evil }],
    };
    const html = renderResume(resume, id);

    it('contains no live tags or attributes from user text', () => {
      expect(html).not.toMatch(/<script|<img src=x|<svg|<b>|<i>|<u>/i);
      // Inside a real tag (between < and >) there must be no event handler and no dangerous link.
      const tags = html.match(/<[^>]*>/g) ?? [];
      expect(tags.filter((t) => /\son\w+=/i.test(t))).toEqual([]);
      expect(tags.filter((t) => /(href|src)="(?!https?:|mailto:|tel:|data:image\/)/i.test(t))).toEqual([]);
      expect(html).not.toMatch(/href="javascript:|href="data:/i);
    });

    it('keeps the text, escaped', () => {
      expect(html).toContain('&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
      expect(html).toContain('Tom &amp; Jerry');
      expect(html).toContain('&lt;b&gt;Boss&lt;/b&gt;');
    });
  });

  it('renders an embedded photo with alt text', () => {
    const resume: Resume = { basics: { name: 'Ana', image: 'data:image/jpeg;base64,/9j/AAA=' } };
    expect(renderResume(resume, 'classic')).toContain('<img class="cv-photo" src="data:image/jpeg;base64,/9j/AAA=" alt="Photo of Ana" />');
  });
});

describe('helpers', () => {
  it('esc escapes the five HTML characters', () => {
    expect(esc(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    expect(esc(undefined)).toBe('');
  });

  it('safeUrl allows only http(s), mailto and tel', () => {
    expect(safeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeUrl(' mailto:a@b.c ')).toBe('mailto:a@b.c');
    expect(safeUrl('tel:+34 600')).toBe('tel:+34 600');
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBeUndefined();
    expect(safeUrl('example.com')).toBeUndefined();
    expect(safeUrl(42)).toBeUndefined();
  });

  it('safeImage allows only embedded raster images', () => {
    expect(safeImage('data:image/png;base64,iVBORw0KGgo=')).toBeDefined();
    expect(safeImage('data:image/svg+xml;base64,PHN2Zz4=')).toBeUndefined();
    expect(safeImage('https://example.com/me.jpg')).toBeUndefined();
  });

  it('displayUrl strips the protocol, www and trailing slash', () => {
    expect(displayUrl('https://www.example.com/me/')).toBe('example.com/me');
  });

  it('accentVariables derives a second gradient colour', () => {
    const vars = accentVariables('#7C9CFF');
    expect(vars['--cv-accent']).toBe('#7c9cff');
    expect(vars['--cv-accent-2']).toMatch(/^#[0-9a-f]{6}$/);
    expect(vars['--cv-accent-2']).not.toBe('#7c9cff');
    expect(accentVariables('red')['--cv-accent']).toBe('#7c9cff');
  });
});
