/** Path into the resume, e.g. `['work', 0, 'highlights']`. */
export type Path = readonly (string | number)[];

type Container = Record<string, unknown> | unknown[];

function isContainer(value: unknown): value is Container {
  return typeof value === 'object' && value !== null;
}

export function getAt(root: unknown, path: Path): unknown {
  let node: unknown = root;
  for (const key of path) {
    if (!isContainer(node)) return undefined;
    node = (node as Record<string | number, unknown>)[key];
  }
  return node;
}

/**
 * Sets a value, creating missing objects/arrays on the way. `undefined`, an empty
 * string or an empty list removes the key, so exported JSON stays tidy.
 */
export function setAt(root: Record<string, unknown>, path: Path, value: unknown): void {
  if (path.length === 0) return;
  let node: Container = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const nextIsIndex = typeof path[i + 1] === 'number';
    let child = (node as Record<string | number, unknown>)[key];
    if (!isContainer(child)) {
      child = nextIsIndex ? [] : {};
      (node as Record<string | number, unknown>)[key] = child;
    }
    node = child as Container;
  }
  const last = path[path.length - 1]!;
  const remove = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
  if (remove && !Array.isArray(node)) delete (node as Record<string | number, unknown>)[last];
  else (node as Record<string | number, unknown>)[last] = remove ? '' : value;
}

/** Moves an item within a list; returns false when the move is impossible. */
export function moveItem(list: unknown[], from: number, to: number): boolean {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return false;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return true;
}

/** Text area with one item per line → list (blank lines dropped). */
export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Comma-separated text → list. */
export function tagsToList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
