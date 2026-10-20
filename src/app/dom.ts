/**
 * Tiny element builder. Text is always set as text nodes (never as HTML), so
 * nothing typed into the editor can become markup in the editor itself.
 */
type Attrs = Record<string, string | number | boolean | undefined | null>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'class') el.className = String(value);
    else if (value === true) el.setAttribute(name, '');
    else el.setAttribute(name, String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

let counter = 0;
/** Unique id for label/input pairs. */
export function uid(prefix = 'f'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function $(selector: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}
