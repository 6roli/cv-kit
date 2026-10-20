import type { CvLanguage, Resume, TemplateId } from '../resume/types.ts';
import {
  LABELS,
  contactItems,
  entrySection,
  esc,
  interestsList,
  languagesList,
  nameBlock,
  photo,
  section,
  skillsList,
  summarySection,
} from './shared.ts';

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: readonly TemplateInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Single column, serif headings' },
  { id: 'modern', name: 'Modern', description: 'Two columns with a sidebar' },
  { id: 'dark', name: 'Dark', description: 'Dark on screen, light when printed' },
];

function contactList(resume: Resume): string {
  const items = contactItems(resume);
  return items.length ? `<ul class="cv-contact">${items.join('')}</ul>` : '';
}

/** Classic: one column, serif headings, contact line under the name. */
function classic(resume: Resume, lang: CvLanguage): string {
  const header = `<header class="cv-header">${photo(resume, lang)}<div class="cv-header__text">${nameBlock(resume)}${contactList(resume)}</div></header>`;
  const body = [
    summarySection(resume, lang),
    entrySection(resume, 'work', lang),
    entrySection(resume, 'projects', lang),
    entrySection(resume, 'education', lang),
    section('skills', lang, skillsList(resume)),
    section('languages', lang, languagesList(resume)),
    entrySection(resume, 'certificates', lang),
    entrySection(resume, 'awards', lang),
    entrySection(resume, 'publications', lang),
    entrySection(resume, 'volunteer', lang),
    section('interests', lang, interestsList(resume)),
    entrySection(resume, 'references', lang),
  ].join('');
  return `${header}<div class="cv-body">${body}</div>`;
}

/** Modern: sidebar with photo, contact, skills, languages and interests; main column for the rest. */
function modern(resume: Resume, lang: CvLanguage): string {
  const sidebar = [
    photo(resume, lang),
    section('contact', lang, contactList(resume)),
    section('skills', lang, skillsList(resume)),
    section('languages', lang, languagesList(resume)),
    section('interests', lang, interestsList(resume)),
  ].join('');
  const main = [
    `<header class="cv-header">${nameBlock(resume)}</header>`,
    summarySection(resume, lang),
    entrySection(resume, 'work', lang),
    entrySection(resume, 'projects', lang),
    entrySection(resume, 'education', lang),
    entrySection(resume, 'certificates', lang),
    entrySection(resume, 'awards', lang),
    entrySection(resume, 'publications', lang),
    entrySection(resume, 'volunteer', lang),
    entrySection(resume, 'references', lang),
  ].join('');
  return `<aside class="cv-sidebar" aria-label="${esc(LABELS[lang].contact)}">${sidebar}</aside><div class="cv-main">${main}</div>`;
}

/** Dark: portfolio look on screen (near-black, gradient accent); print CSS switches it to light. */
function dark(resume: Resume, lang: CvLanguage): string {
  const header =
    `<header class="cv-header">${photo(resume, lang)}<div class="cv-header__text">${nameBlock(resume)}</div>` +
    `${contactList(resume)}</header>`;
  const main = [
    summarySection(resume, lang),
    entrySection(resume, 'work', lang),
    entrySection(resume, 'projects', lang),
    entrySection(resume, 'education', lang),
    entrySection(resume, 'volunteer', lang),
    entrySection(resume, 'publications', lang),
    entrySection(resume, 'references', lang),
  ].join('');
  const side = [
    section('skills', lang, skillsList(resume)),
    section('languages', lang, languagesList(resume)),
    entrySection(resume, 'certificates', lang),
    entrySection(resume, 'awards', lang),
    section('interests', lang, interestsList(resume)),
  ].join('');
  return `${header}<div class="cv-columns"><div class="cv-main">${main}</div><div class="cv-side">${side}</div></div>`;
}

const RENDERERS: Record<TemplateId, (resume: Resume, lang: CvLanguage) => string> = { classic, modern, dark };

/**
 * Renders a resume as an HTML string: `<div class="cv cv--{template}" lang="…">…</div>`.
 * The accent colour is applied by the caller as CSS variables (see `accentVariables`),
 * so the markup contains no inline styles and works under a strict CSP.
 */
export function renderResume(resume: Resume, template: TemplateId, lang: CvLanguage = 'en'): string {
  const render = RENDERERS[template] ?? RENDERERS.modern;
  return `<div class="cv cv--${template}" lang="${lang}">${render(resume, lang)}</div>`;
}

function hexToHsl(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * CSS variables for an accent colour. The second gradient stop is the accent
 * rotated 35° in hue, like the portfolio's blue → violet pairs.
 */
export function accentVariables(accent: string): Record<string, string> {
  const valid = /^#[0-9a-f]{6}$/i.test(accent) ? accent.toLowerCase() : '#7c9cff';
  const [h, s, l] = hexToHsl(valid);
  return { '--cv-accent': valid, '--cv-accent-2': hslToHex((h + 35) % 360, s, l) };
}
