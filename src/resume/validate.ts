import { CV_LANGUAGES, LIST_SECTIONS, TEMPLATE_IDS, type ListSection, type Resume } from './types.ts';

/**
 * Validation against JSON Resume v1.0.0, written by hand (no JSON Schema engine)
 * so messages can be specific. Unknown extra fields are always accepted.
 *
 * - errors: the file cannot be used as is (wrong types, bad dates);
 * - warnings: usable, but probably a mistake (e.g. an email without "@").
 */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  /** The input typed as a resume, only when `ok` is true. */
  resume?: Resume;
}

type FieldKind = 'string' | 'date' | 'strings' | 'url' | 'email';

const ISO_DATE = /^([1-2][0-9]{3})(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/;

const ENTRY_FIELDS: Record<ListSection, Record<string, FieldKind>> = {
  work: {
    name: 'string',
    location: 'string',
    description: 'string',
    position: 'string',
    url: 'url',
    startDate: 'date',
    endDate: 'date',
    summary: 'string',
    highlights: 'strings',
  },
  volunteer: {
    organization: 'string',
    position: 'string',
    url: 'url',
    startDate: 'date',
    endDate: 'date',
    summary: 'string',
    highlights: 'strings',
  },
  education: {
    institution: 'string',
    url: 'url',
    area: 'string',
    studyType: 'string',
    startDate: 'date',
    endDate: 'date',
    score: 'string',
    courses: 'strings',
  },
  awards: { title: 'string', date: 'date', awarder: 'string', summary: 'string' },
  certificates: { name: 'string', date: 'date', url: 'url', issuer: 'string' },
  publications: { name: 'string', publisher: 'string', releaseDate: 'date', url: 'url', summary: 'string' },
  skills: { name: 'string', level: 'string', keywords: 'strings' },
  languages: { language: 'string', fluency: 'string' },
  interests: { name: 'string', keywords: 'strings' },
  references: { name: 'string', reference: 'string' },
  projects: {
    name: 'string',
    description: 'string',
    highlights: 'strings',
    keywords: 'strings',
    startDate: 'date',
    endDate: 'date',
    url: 'url',
    roles: 'strings',
    entity: 'string',
    type: 'string',
  },
};

const BASICS_FIELDS: Record<string, FieldKind> = {
  name: 'string',
  label: 'string',
  image: 'string',
  email: 'email',
  phone: 'string',
  url: 'url',
  summary: 'string',
};

const LOCATION_FIELDS: Record<string, FieldKind> = {
  address: 'string',
  postalCode: 'string',
  city: 'string',
  countryCode: 'string',
  region: 'string',
};

const PROFILE_FIELDS: Record<string, FieldKind> = { network: 'string', username: 'string', url: 'url' };

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  if (typeof value === 'string') return `"${value.length > 40 ? `${value.slice(0, 40)}…` : value}"`;
  return typeof value === 'object' ? 'an object' : `${typeof value} ${String(value)}`;
}

export function validateResume(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const checkFields = (obj: Record<string, unknown>, fields: Record<string, FieldKind>, path: string) => {
    for (const [key, kind] of Object.entries(fields)) {
      const value = obj[key];
      if (value === undefined) continue;
      const at = `${path}.${key}`;
      if (kind === 'strings') {
        if (!Array.isArray(value)) {
          errors.push(`${at}: expected a list of texts, got ${describe(value)}.`);
        } else {
          value.forEach((item, i) => {
            if (typeof item !== 'string') errors.push(`${at}[${i}]: expected a text, got ${describe(item)}.`);
          });
        }
        continue;
      }
      if (typeof value !== 'string') {
        errors.push(`${at}: expected a text, got ${describe(value)}.`);
        continue;
      }
      if (kind === 'date' && value !== '' && !isIsoDate(value)) {
        errors.push(`${at}: expected a date like 2024, 2024-03 or 2024-03-15, got ${describe(value)}.`);
      }
      if (kind === 'email' && value !== '' && !/^[^\s@]+@[^\s@]+$/.test(value)) {
        warnings.push(`${at}: ${describe(value)} does not look like an email address.`);
      }
      if (kind === 'url' && value !== '' && !/^(https?:\/\/|mailto:)/i.test(value)) {
        warnings.push(`${at}: ${describe(value)} should start with https:// to become a link.`);
      }
    }
  };

  if (!isPlainObject(input)) {
    return { ok: false, errors: [`The file must contain a JSON object, got ${describe(input)}.`], warnings };
  }

  if (input.$schema !== undefined && typeof input.$schema !== 'string') {
    errors.push(`$schema: expected a text, got ${describe(input.$schema)}.`);
  }

  const basics = input.basics;
  if (basics !== undefined) {
    if (!isPlainObject(basics)) {
      errors.push(`basics: expected an object, got ${describe(basics)}.`);
    } else {
      checkFields(basics, BASICS_FIELDS, 'basics');
      if (basics.location !== undefined) {
        if (!isPlainObject(basics.location)) {
          errors.push(`basics.location: expected an object, got ${describe(basics.location)}.`);
        } else {
          checkFields(basics.location, LOCATION_FIELDS, 'basics.location');
        }
      }
      if (basics.profiles !== undefined) {
        if (!Array.isArray(basics.profiles)) {
          errors.push(`basics.profiles: expected a list, got ${describe(basics.profiles)}.`);
        } else {
          basics.profiles.forEach((p, i) => {
            if (!isPlainObject(p)) errors.push(`basics.profiles[${i}]: expected an object, got ${describe(p)}.`);
            else checkFields(p, PROFILE_FIELDS, `basics.profiles[${i}]`);
          });
        }
      }
    }
  }

  for (const section of LIST_SECTIONS) {
    const list = input[section];
    if (list === undefined) continue;
    if (!Array.isArray(list)) {
      errors.push(`${section}: expected a list of entries, got ${describe(list)}.`);
      continue;
    }
    list.forEach((entry, i) => {
      if (!isPlainObject(entry)) errors.push(`${section}[${i}]: expected an object, got ${describe(entry)}.`);
      else checkFields(entry, ENTRY_FIELDS[section], `${section}[${i}]`);
    });
    for (const [i, entry] of list.entries()) {
      if (!isPlainObject(entry)) continue;
      const { startDate, endDate } = entry;
      if (typeof startDate === 'string' && typeof endDate === 'string' && isIsoDate(startDate) && isIsoDate(endDate)) {
        if (endDate.localeCompare(startDate) < 0 && !endDate.startsWith(startDate.slice(0, endDate.length))) {
          warnings.push(`${section}[${i}]: endDate ${endDate} is before startDate ${startDate}.`);
        }
      }
    }
  }

  const meta = input.meta;
  if (meta !== undefined) {
    if (!isPlainObject(meta)) {
      errors.push(`meta: expected an object, got ${describe(meta)}.`);
    } else {
      checkFields(meta, { canonical: 'url', version: 'string', lastModified: 'string' }, 'meta');
      const cvkit = meta.cvkit;
      if (cvkit !== undefined) {
        if (!isPlainObject(cvkit)) {
          errors.push(`meta.cvkit: expected an object, got ${describe(cvkit)}.`);
        } else {
          if (cvkit.template !== undefined && !(TEMPLATE_IDS as readonly unknown[]).includes(cvkit.template)) {
            errors.push(`meta.cvkit.template: expected one of ${TEMPLATE_IDS.join(', ')}, got ${describe(cvkit.template)}.`);
          }
          if (cvkit.language !== undefined && !(CV_LANGUAGES as readonly unknown[]).includes(cvkit.language)) {
            errors.push(`meta.cvkit.language: expected one of ${CV_LANGUAGES.join(', ')}, got ${describe(cvkit.language)}.`);
          }
          if (cvkit.accent !== undefined && (typeof cvkit.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(cvkit.accent))) {
            errors.push(`meta.cvkit.accent: expected a colour like #7c9cff, got ${describe(cvkit.accent)}.`);
          }
          if (cvkit.hideOnWeb !== undefined) {
            if (!Array.isArray(cvkit.hideOnWeb) || cvkit.hideOnWeb.some((p) => typeof p !== 'string')) {
              errors.push(`meta.cvkit.hideOnWeb: expected a list of field paths such as "phone".`);
            }
          }
        }
      }
    }
  }

  const ok = errors.length === 0;
  return ok ? { ok, errors, warnings, resume: input as Resume } : { ok, errors, warnings };
}

/** Parses JSON text and validates it; JSON syntax errors are reported like validation errors. */
export function parseResume(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [`This is not valid JSON: ${detail}`], warnings: [] };
  }
  return validateResume(data);
}
