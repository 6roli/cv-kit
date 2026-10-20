import type { Resume } from './types.ts';

/** Fields of `basics` that may be written without the `basics.` prefix in `hideOnWeb`. */
const BASICS_SHORTHAND = new Set(['name', 'label', 'image', 'email', 'phone', 'url', 'summary', 'location', 'profiles']);

/**
 * Normalises a `hideOnWeb` path: `"phone"` → `["basics", "phone"]`,
 * `"location.address"` → `["basics", "location", "address"]`, `"references"` → `["references"]`.
 * Array indexes are not supported: hiding applies to a field in every entry
 * (`"work.location"` removes `location` from every work entry).
 */
export function normalisePath(path: string): string[] {
  const parts = path
    .split('.')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length > 0 && BASICS_SHORTHAND.has(parts[0]!)) return ['basics', ...parts];
  return parts;
}

function removeAt(target: unknown, parts: string[]): void {
  if (parts.length === 0 || target === null || typeof target !== 'object') return;
  if (Array.isArray(target)) {
    for (const item of target) removeAt(item, parts);
    return;
  }
  const obj = target as Record<string, unknown>;
  const [head, ...rest] = parts;
  if (head === undefined || !(head in obj)) return;
  if (rest.length === 0) delete obj[head];
  else removeAt(obj[head], rest);
}

/**
 * Returns a copy of the resume for public web pages: every field listed in
 * `meta.cvkit.hideOnWeb` is removed, and so is the `hideOnWeb` list itself.
 * The input is never modified. The PDF uses the full resume.
 *
 * The portfolio site reuses this function so the website never shows, for
 * example, a phone number that only belongs in the PDF.
 */
export function publicView(resume: Resume): Resume {
  const copy = structuredClone(resume);
  const hidden = resume.meta?.cvkit?.hideOnWeb ?? [];
  for (const path of hidden) {
    if (typeof path !== 'string') continue;
    removeAt(copy, normalisePath(path));
  }
  if (copy.meta?.cvkit) {
    delete copy.meta.cvkit.hideOnWeb;
  }
  return copy;
}
