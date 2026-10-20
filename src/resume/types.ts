/**
 * JSON Resume v1.0.0 (https://jsonresume.org/schema, MIT licence).
 *
 * Every field is optional, as in the standard. Unknown extra fields are allowed
 * and preserved: the index signatures keep them through import, edit and export.
 */

/** ISO 8601 partial date: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. */
export type IsoDate = string;

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
  [extra: string]: unknown;
}

export interface Profile {
  network?: string;
  username?: string;
  url?: string;
  [extra: string]: unknown;
}

export interface Basics {
  name?: string;
  label?: string;
  /** URL or data URL of a photo. CV Kit stores local photos as small JPEG data URLs. */
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
  [extra: string]: unknown;
}

export interface Work {
  name?: string;
  location?: string;
  description?: string;
  position?: string;
  url?: string;
  startDate?: IsoDate;
  endDate?: IsoDate;
  summary?: string;
  highlights?: string[];
  [extra: string]: unknown;
}

export interface Volunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: IsoDate;
  endDate?: IsoDate;
  summary?: string;
  highlights?: string[];
  [extra: string]: unknown;
}

export interface Education {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: IsoDate;
  endDate?: IsoDate;
  score?: string;
  courses?: string[];
  [extra: string]: unknown;
}

export interface Award {
  title?: string;
  date?: IsoDate;
  awarder?: string;
  summary?: string;
  [extra: string]: unknown;
}

export interface Certificate {
  name?: string;
  date?: IsoDate;
  url?: string;
  issuer?: string;
  [extra: string]: unknown;
}

export interface Publication {
  name?: string;
  publisher?: string;
  releaseDate?: IsoDate;
  url?: string;
  summary?: string;
  [extra: string]: unknown;
}

export interface Skill {
  name?: string;
  level?: string;
  keywords?: string[];
  [extra: string]: unknown;
}

export interface Language {
  language?: string;
  fluency?: string;
  [extra: string]: unknown;
}

export interface Interest {
  name?: string;
  keywords?: string[];
  [extra: string]: unknown;
}

export interface Reference {
  name?: string;
  reference?: string;
  [extra: string]: unknown;
}

export interface Project {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: IsoDate;
  endDate?: IsoDate;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
  [extra: string]: unknown;
}

export const TEMPLATE_IDS = ['classic', 'modern', 'dark'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const CV_LANGUAGES = ['en', 'es'] as const;
/** Language of the CV's own labels (headings, "Present", month names). */
export type CvLanguage = (typeof CV_LANGUAGES)[number];

/** CV Kit settings, stored under `meta.cvkit` so the file stays valid JSON Resume. */
export interface CvKitSettings {
  template?: TemplateId;
  /** Accent colour as `#rrggbb`. */
  accent?: string;
  language?: CvLanguage;
  /**
   * Fields removed by `publicView()` (web version). Paths are relative to the resume:
   * `"phone"` is short for `"basics.phone"`; `"references"` hides a whole section;
   * `"basics.location.address"` hides a nested field.
   */
  hideOnWeb?: string[];
  [extra: string]: unknown;
}

export interface Meta {
  canonical?: string;
  version?: string;
  lastModified?: string;
  cvkit?: CvKitSettings;
  [extra: string]: unknown;
}

export interface Resume {
  $schema?: string;
  basics?: Basics;
  work?: Work[];
  volunteer?: Volunteer[];
  education?: Education[];
  awards?: Award[];
  certificates?: Certificate[];
  publications?: Publication[];
  skills?: Skill[];
  languages?: Language[];
  interests?: Interest[];
  references?: Reference[];
  projects?: Project[];
  meta?: Meta;
  [extra: string]: unknown;
}

/** Sections that are arrays of entries, in the standard's order. */
export const LIST_SECTIONS = [
  'work',
  'volunteer',
  'education',
  'awards',
  'certificates',
  'publications',
  'skills',
  'languages',
  'interests',
  'references',
  'projects',
] as const;
export type ListSection = (typeof LIST_SECTIONS)[number];

export const DEFAULT_ACCENT = '#7c9cff';
export const DEFAULT_TEMPLATE: TemplateId = 'modern';
