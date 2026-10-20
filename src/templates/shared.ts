import { formatDate, formatRange } from '../resume/dates.ts';
import type { CvLanguage, Resume } from '../resume/types.ts';

/**
 * Building blocks shared by the templates. Templates produce HTML strings; every
 * piece of user text goes through `esc()` and every link through `safeUrl()`,
 * so a CV can never inject markup or scripts into the page.
 */

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

/** Only web, email and phone links are allowed; anything else (javascript:, data:, …) is dropped. */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s]+$/i.test(trimmed) || /^mailto:[^\s]+$/i.test(trimmed) || /^tel:[+\d\s()-]+$/i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

/** Only small embedded raster images are shown (CV Kit stores photos as data URLs). */
export function safeImage(src: unknown): string | undefined {
  if (typeof src !== 'string') return undefined;
  return /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(src) ? src : undefined;
}

/** `https://www.example.com/me/` → `example.com/me` */
export function displayUrl(url: string): string {
  return url
    .replace(/^(https?:\/\/|mailto:|tel:)/i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

export function link(url: unknown, text: string): string {
  const href = safeUrl(url);
  return href ? `<a href="${esc(href)}">${text}</a>` : text;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : [];
}

/** Splits text on line breaks into escaped paragraphs. */
export function paragraphs(text: unknown, className = ''): string {
  const cls = className ? ` class="${className}"` : '';
  return str(text)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${cls}>${esc(p)}</p>`)
    .join('');
}

export const LABELS = {
  en: {
    summary: 'Profile',
    contact: 'Contact',
    work: 'Experience',
    volunteer: 'Volunteering',
    education: 'Education',
    awards: 'Awards',
    certificates: 'Certificates',
    publications: 'Publications',
    skills: 'Skills',
    languages: 'Languages',
    interests: 'Interests',
    references: 'References',
    projects: 'Projects',
    score: 'Score',
    courses: 'Courses',
    photo: 'Photo of',
  },
  es: {
    summary: 'Perfil',
    contact: 'Contacto',
    work: 'Experiencia',
    volunteer: 'Voluntariado',
    education: 'Formación',
    awards: 'Premios',
    certificates: 'Certificaciones',
    publications: 'Publicaciones',
    skills: 'Habilidades',
    languages: 'Idiomas',
    interests: 'Intereses',
    references: 'Referencias',
    projects: 'Proyectos',
    score: 'Nota',
    courses: 'Asignaturas',
    photo: 'Foto de',
  },
} as const satisfies Record<CvLanguage, Record<string, string>>;

export type SectionKey = Exclude<keyof (typeof LABELS)['en'], 'score' | 'courses' | 'photo'>;

/** A normalised entry: every list section is shown with the same parts. */
export interface EntryView {
  title: string;
  subtitle: string;
  url?: string;
  date: string;
  place: string;
  body: string;
  highlights: string[];
  tags: string[];
}

type Entry = Record<string, unknown>;

function entries(resume: Resume, key: string): Entry[] {
  const list = resume[key];
  return Array.isArray(list) ? list.filter((e): e is Entry => typeof e === 'object' && e !== null) : [];
}

function isEmpty(view: EntryView): boolean {
  return !view.title && !view.subtitle && !view.body && view.highlights.length === 0 && view.tags.length === 0;
}

/** Builds the entries of a section, skipping blank ones. */
export function entryViews(resume: Resume, section: SectionKey, lang: CvLanguage): EntryView[] {
  const L = LABELS[lang];
  const views = entries(resume, section).map((e): EntryView => {
    const range = formatRange(str(e.startDate), str(e.endDate), lang);
    const base = { url: safeUrl(e.url), place: '', body: '', highlights: [], tags: [], date: range };
    switch (section) {
      case 'work': {
        const position = str(e.position);
        const name = str(e.name);
        return {
          ...base,
          title: position || name,
          subtitle: position ? name : '',
          place: str(e.location),
          body: [str(e.description), str(e.summary)].filter(Boolean).join('\n'),
          highlights: strings(e.highlights),
        };
      }
      case 'volunteer': {
        const position = str(e.position);
        const org = str(e.organization);
        return {
          ...base,
          title: position || org,
          subtitle: position ? org : '',
          body: str(e.summary),
          highlights: strings(e.highlights),
        };
      }
      case 'education': {
        const degree = [str(e.studyType), str(e.area)].filter(Boolean).join(' · ');
        const institution = str(e.institution);
        const score = str(e.score);
        return {
          ...base,
          title: degree || institution,
          subtitle: degree ? institution : '',
          body: score ? `${L.score}: ${score}` : '',
          tags: strings(e.courses),
        };
      }
      case 'awards':
        return { ...base, title: str(e.title), subtitle: str(e.awarder), date: formatDate(str(e.date), lang), body: str(e.summary) };
      case 'certificates':
        return { ...base, title: str(e.name), subtitle: str(e.issuer), date: formatDate(str(e.date), lang) };
      case 'publications':
        return {
          ...base,
          title: str(e.name),
          subtitle: str(e.publisher),
          date: formatDate(str(e.releaseDate), lang),
          body: str(e.summary),
        };
      case 'projects':
        return {
          ...base,
          title: str(e.name),
          subtitle: [str(e.entity), strings(e.roles).join(', ')].filter(Boolean).join(' · '),
          body: str(e.description),
          highlights: strings(e.highlights),
          tags: strings(e.keywords),
        };
      case 'references':
        return { ...base, title: str(e.name), subtitle: '', date: '', body: str(e.reference) };
      default:
        return { ...base, title: str(e.name), subtitle: '', date: '' };
    }
  });
  return views.filter((v) => !isEmpty(v));
}

/** Renders one entry. `variant` adds a modifier class for template-specific layout. */
export function renderEntry(view: EntryView): string {
  const title = view.title ? `<h3 class="cv-entry__title">${link(view.url, esc(view.title))}</h3>` : '';
  const sub = [view.subtitle, view.place].filter(Boolean).map(esc).join(' · ');
  const subtitle = sub ? `<p class="cv-entry__subtitle">${view.title ? sub : link(view.url, sub)}</p>` : '';
  const date = view.date ? `<p class="cv-entry__date">${esc(view.date)}</p>` : '';
  const highlights = view.highlights.length
    ? `<ul class="cv-entry__highlights">${view.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`
    : '';
  const tags = view.tags.length ? `<ul class="cv-tags">${view.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  return (
    `<article class="cv-entry"><div class="cv-entry__head"><div>${title}${subtitle}</div>${date}</div>` +
    `${paragraphs(view.body, 'cv-entry__body')}${highlights}${tags}</article>`
  );
}

export function section(key: SectionKey, lang: CvLanguage, inner: string, extraClass = ''): string {
  if (!inner) return '';
  const cls = extraClass ? ` ${extraClass}` : '';
  return (
    `<section class="cv-section cv-section--${key}${cls}" aria-labelledby="cv-h-${key}">` +
    `<h2 class="cv-section__title" id="cv-h-${key}">${esc(LABELS[lang][key])}</h2>${inner}</section>`
  );
}

export function entrySection(resume: Resume, key: SectionKey, lang: CvLanguage): string {
  const views = entryViews(resume, key, lang);
  return section(key, lang, views.map(renderEntry).join(''));
}

export function summarySection(resume: Resume, lang: CvLanguage): string {
  return section('summary', lang, paragraphs(resume.basics?.summary, 'cv-summary'));
}

export function skillsList(resume: Resume): string {
  const items = entries(resume, 'skills')
    .map((s) => {
      const name = str(s.name);
      const level = str(s.level);
      const keywords = strings(s.keywords);
      if (!name && keywords.length === 0) return '';
      const head = name
        ? `<p class="cv-skill__name">${esc(name)}${level ? ` <span class="cv-skill__level">${esc(level)}</span>` : ''}</p>`
        : '';
      const tags = keywords.length ? `<ul class="cv-tags">${keywords.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : '';
      return `<li class="cv-skill">${head}${tags}</li>`;
    })
    .join('');
  return items ? `<ul class="cv-skills">${items}</ul>` : '';
}

export function languagesList(resume: Resume): string {
  const items = entries(resume, 'languages')
    .map((l) => {
      const language = str(l.language);
      const fluency = str(l.fluency);
      if (!language) return '';
      return `<li><span class="cv-lang__name">${esc(language)}</span>${fluency ? ` <span class="cv-lang__level">${esc(fluency)}</span>` : ''}</li>`;
    })
    .join('');
  return items ? `<ul class="cv-langs">${items}</ul>` : '';
}

export function interestsList(resume: Resume): string {
  const items = entries(resume, 'interests')
    .map((i) => {
      const name = str(i.name);
      const keywords = strings(i.keywords);
      if (!name && keywords.length === 0) return '';
      return `<li>${name ? `<span class="cv-interest__name">${esc(name)}</span>` : ''}${keywords.length ? ` <span class="cv-interest__keywords">${esc(keywords.join(', '))}</span>` : ''}</li>`;
    })
    .join('');
  return items ? `<ul class="cv-interests">${items}</ul>` : '';
}

export function contactItems(resume: Resume): string[] {
  const b = resume.basics ?? {};
  const items: string[] = [];
  const email = str(b.email);
  if (email) items.push(`<li class="cv-contact__email">${link(`mailto:${email}`, esc(email))}</li>`);
  const phone = str(b.phone);
  if (phone) items.push(`<li class="cv-contact__phone">${link(`tel:${phone.replace(/[^\d+]/g, '')}`, esc(phone))}</li>`);
  const url = str(b.url);
  if (url) items.push(`<li class="cv-contact__url">${link(url, esc(displayUrl(url)))}</li>`);
  const loc = b.location ?? {};
  const place = [str(loc.city), str(loc.region), str(loc.countryCode)].filter(Boolean).join(', ');
  if (place) items.push(`<li class="cv-contact__location">${esc(place)}</li>`);
  for (const p of Array.isArray(b.profiles) ? b.profiles : []) {
    if (typeof p !== 'object' || p === null) continue;
    const network = str(p.network);
    const username = str(p.username);
    const purl = str(p.url);
    const text = [network, username || (purl ? displayUrl(purl) : '')].filter(Boolean).join(': ');
    if (text) items.push(`<li class="cv-contact__profile">${link(purl, esc(text))}</li>`);
  }
  return items;
}

export function photo(resume: Resume, lang: CvLanguage): string {
  const src = safeImage(resume.basics?.image);
  if (!src) return '';
  const name = str(resume.basics?.name);
  return `<img class="cv-photo" src="${esc(src)}" alt="${esc(name ? `${LABELS[lang].photo} ${name}` : '')}" />`;
}

export function nameBlock(resume: Resume): string {
  const name = str(resume.basics?.name);
  const label = str(resume.basics?.label);
  return (
    (name ? `<h1 class="cv-name">${esc(name)}</h1>` : '') + (label ? `<p class="cv-label">${esc(label)}</p>` : '')
  );
}
