import type { Resume } from '../resume/types.ts';
import { validateResume } from '../resume/validate.ts';

/**
 * Autosave in this browser only (localStorage). Every access is wrapped in
 * try/catch: storage can be disabled, full or blocked in private windows.
 */
const KEY = 'cv-kit:resume:v1';

export type LoadResult = { status: 'found'; resume: Resume } | { status: 'empty' } | { status: 'unavailable' };

export function loadSaved(): LoadResult {
  try {
    const text = window.localStorage.getItem(KEY);
    if (!text) return { status: 'empty' };
    const result = validateResume(JSON.parse(text));
    return result.ok && result.resume ? { status: 'found', resume: result.resume } : { status: 'empty' };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Returns false when the data could not be stored (e.g. quota exceeded). */
export function save(resume: Resume): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(resume));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved(): boolean {
  try {
    window.localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

/** Small per-browser UI preference (e.g. last open tab); failures are ignored. */
export function getPref(name: string): string | null {
  try {
    return window.localStorage.getItem(`cv-kit:pref:${name}`);
  } catch {
    return null;
  }
}

export function setPref(name: string, value: string): void {
  try {
    window.localStorage.setItem(`cv-kit:pref:${name}`, value);
  } catch {
    /* ignore */
  }
}
