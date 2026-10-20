import type { ListSection } from '../resume/types.ts';

/**
 * Editor field definitions. `lines` = one item per line (highlights);
 * `tags` = comma-separated (keywords).
 */
export type FieldKind = 'text' | 'textarea' | 'date' | 'url' | 'email' | 'tel' | 'lines' | 'tags';

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  /** Spans the full width of the two-column field grid. */
  wide?: boolean;
  autocomplete?: string;
}

export interface SectionSpec {
  key: ListSection;
  title: string;
  /** Singular noun for buttons: "Add job". */
  noun: string;
  intro?: string;
  fields: FieldSpec[];
  /** Keys used, in order, to label an entry in its collapsed header. */
  labelKeys: string[];
}

const START: FieldSpec = { key: 'startDate', label: 'Start date', kind: 'date', placeholder: '2021-03' };
const END: FieldSpec = {
  key: 'endDate',
  label: 'End date',
  kind: 'date',
  placeholder: '2023-06',
  hint: 'Leave empty if ongoing (shows “Present”).',
};

export const BASICS_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Full name', kind: 'text', autocomplete: 'name', placeholder: 'Alex Example' },
  { key: 'label', label: 'Headline', kind: 'text', placeholder: 'Data Engineer', autocomplete: 'organization-title' },
  { key: 'email', label: 'Email', kind: 'email', autocomplete: 'email' },
  { key: 'phone', label: 'Phone', kind: 'tel', autocomplete: 'tel' },
  { key: 'url', label: 'Website', kind: 'url', placeholder: 'https://…', autocomplete: 'url', wide: true },
  {
    key: 'summary',
    label: 'Profile summary',
    kind: 'textarea',
    wide: true,
    hint: 'Two to four sentences. A blank line starts a new paragraph.',
  },
];

export const LOCATION_FIELDS: FieldSpec[] = [
  { key: 'city', label: 'City', kind: 'text', autocomplete: 'address-level2' },
  { key: 'region', label: 'Region', kind: 'text', autocomplete: 'address-level1' },
  { key: 'countryCode', label: 'Country code', kind: 'text', placeholder: 'ES', autocomplete: 'country' },
  { key: 'address', label: 'Address', kind: 'text', hint: 'Rarely needed on a CV.', autocomplete: 'street-address' },
];

export const PROFILE_FIELDS: FieldSpec[] = [
  { key: 'network', label: 'Network', kind: 'text', placeholder: 'GitHub' },
  { key: 'username', label: 'Username', kind: 'text' },
  { key: 'url', label: 'Profile URL', kind: 'url', placeholder: 'https://…', wide: true },
];

export const SECTION_SPECS: SectionSpec[] = [
  {
    key: 'work',
    title: 'Work experience',
    noun: 'job',
    labelKeys: ['position', 'name'],
    fields: [
      { key: 'position', label: 'Position', kind: 'text' },
      { key: 'name', label: 'Company', kind: 'text' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'url', label: 'Company website', kind: 'url', placeholder: 'https://…' },
      START,
      END,
      { key: 'summary', label: 'Summary', kind: 'textarea', wide: true },
      { key: 'highlights', label: 'Highlights', kind: 'lines', wide: true, hint: 'One achievement per line.' },
    ],
  },
  {
    key: 'projects',
    title: 'Projects',
    noun: 'project',
    labelKeys: ['name'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'url', label: 'Link', kind: 'url', placeholder: 'https://…' },
      { key: 'entity', label: 'Organisation', kind: 'text' },
      { key: 'roles', label: 'Roles', kind: 'tags', hint: 'Separate with commas.' },
      START,
      END,
      { key: 'description', label: 'Description', kind: 'textarea', wide: true },
      { key: 'highlights', label: 'Highlights', kind: 'lines', wide: true, hint: 'One per line.' },
      { key: 'keywords', label: 'Keywords', kind: 'tags', wide: true, hint: 'Separate with commas.' },
    ],
  },
  {
    key: 'education',
    title: 'Education',
    noun: 'education',
    labelKeys: ['studyType', 'area', 'institution'],
    fields: [
      { key: 'institution', label: 'Institution', kind: 'text', wide: true },
      { key: 'studyType', label: 'Degree type', kind: 'text', placeholder: 'BSc, Máster…' },
      { key: 'area', label: 'Field of study', kind: 'text' },
      START,
      { ...END, hint: 'Leave empty if you are still studying.' },
      { key: 'score', label: 'Grade', kind: 'text' },
      { key: 'url', label: 'Website', kind: 'url', placeholder: 'https://…' },
      { key: 'courses', label: 'Courses', kind: 'tags', wide: true, hint: 'Separate with commas.' },
    ],
  },
  {
    key: 'skills',
    title: 'Skills',
    noun: 'skill group',
    labelKeys: ['name'],
    fields: [
      { key: 'name', label: 'Skill or group', kind: 'text', placeholder: 'Data engineering' },
      { key: 'level', label: 'Level', kind: 'text', placeholder: 'Advanced' },
      { key: 'keywords', label: 'Keywords', kind: 'tags', wide: true, hint: 'Separate with commas.' },
    ],
  },
  {
    key: 'languages',
    title: 'Languages',
    noun: 'language',
    labelKeys: ['language'],
    fields: [
      { key: 'language', label: 'Language', kind: 'text', placeholder: 'Español' },
      { key: 'fluency', label: 'Fluency', kind: 'text', placeholder: 'Native, C1…' },
    ],
  },
  {
    key: 'certificates',
    title: 'Certificates',
    noun: 'certificate',
    labelKeys: ['name'],
    fields: [
      { key: 'name', label: 'Name', kind: 'text', wide: true },
      { key: 'issuer', label: 'Issuer', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date', placeholder: '2024-06' },
      { key: 'url', label: 'Link', kind: 'url', placeholder: 'https://…', wide: true },
    ],
  },
  {
    key: 'awards',
    title: 'Awards',
    noun: 'award',
    labelKeys: ['title'],
    fields: [
      { key: 'title', label: 'Title', kind: 'text', wide: true },
      { key: 'awarder', label: 'Awarded by', kind: 'text' },
      { key: 'date', label: 'Date', kind: 'date', placeholder: '2021-11' },
      { key: 'summary', label: 'Summary', kind: 'textarea', wide: true },
    ],
  },
  {
    key: 'publications',
    title: 'Publications',
    noun: 'publication',
    labelKeys: ['name'],
    fields: [
      { key: 'name', label: 'Title', kind: 'text', wide: true },
      { key: 'publisher', label: 'Publisher', kind: 'text' },
      { key: 'releaseDate', label: 'Date', kind: 'date', placeholder: '2022-09' },
      { key: 'url', label: 'Link', kind: 'url', placeholder: 'https://…', wide: true },
      { key: 'summary', label: 'Summary', kind: 'textarea', wide: true },
    ],
  },
  {
    key: 'volunteer',
    title: 'Volunteering',
    noun: 'role',
    labelKeys: ['position', 'organization'],
    fields: [
      { key: 'position', label: 'Role', kind: 'text' },
      { key: 'organization', label: 'Organisation', kind: 'text' },
      START,
      END,
      { key: 'url', label: 'Website', kind: 'url', placeholder: 'https://…', wide: true },
      { key: 'summary', label: 'Summary', kind: 'textarea', wide: true },
      { key: 'highlights', label: 'Highlights', kind: 'lines', wide: true, hint: 'One per line.' },
    ],
  },
  {
    key: 'interests',
    title: 'Interests',
    noun: 'interest',
    labelKeys: ['name'],
    fields: [
      { key: 'name', label: 'Interest', kind: 'text' },
      { key: 'keywords', label: 'Keywords', kind: 'tags', hint: 'Separate with commas.' },
    ],
  },
  {
    key: 'references',
    title: 'References',
    noun: 'reference',
    labelKeys: ['name'],
    intro: 'Only add references people agreed to share. You can hide this section on the web version below.',
    fields: [
      { key: 'name', label: 'Name and role', kind: 'text', wide: true },
      { key: 'reference', label: 'Reference', kind: 'textarea', wide: true },
    ],
  },
];

/** Fields offered as "hide on the web version" switches (paths understood by publicView). */
export const HIDEABLE: { path: string; label: string }[] = [
  { path: 'phone', label: 'Phone' },
  { path: 'email', label: 'Email' },
  { path: 'location.address', label: 'Street address' },
  { path: 'image', label: 'Photo' },
  { path: 'references', label: 'References section' },
];
