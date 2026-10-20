import { isIsoDate } from '../resume/validate.ts';
import type { Resume } from '../resume/types.ts';
import { safeImage } from '../templates/shared.ts';
import { h, uid } from './dom.ts';
import { getAt, linesToList, moveItem, setAt, tagsToList, type Path } from './paths.ts';
import { photoToDataUrl } from './photo.ts';
import {
  BASICS_FIELDS,
  HIDEABLE,
  LOCATION_FIELDS,
  PROFILE_FIELDS,
  SECTION_SPECS,
  type FieldSpec,
} from './specs.ts';

export interface FormHost {
  /** The resume being edited (mutated in place by the form). */
  resume(): Resume;
  /** Called after every change. */
  changed(): void;
  notify(message: string, kind?: 'info' | 'error'): void;
}

interface ListDef {
  path: Path;
  fields: FieldSpec[];
  noun: string;
  labelKeys: string[];
}

const DATE_HINT = 'Use YYYY, YYYY-MM or YYYY-MM-DD.';

/**
 * Builds the structured editor: one collapsible group per section, entries with
 * add / remove / move up / move down, and keyboard-accessible disclosure buttons.
 * Text inputs update the resume in place; only structural changes re-render a list.
 */
export class FormEditor {
  private readonly lists = new Map<string, { def: ListDef; ol: HTMLOListElement; open: Set<number> }>();
  private readonly root: HTMLElement;
  private readonly host: FormHost;

  constructor(root: HTMLElement, host: FormHost) {
    this.root = root;
    this.host = host;
    root.addEventListener('input', (e) => this.onInput(e));
    root.addEventListener('change', (e) => this.onChange(e));
    root.addEventListener('click', (e) => this.onClick(e));
  }

  /** Rebuilds the whole form from the current resume (after import, reset, JSON edits). */
  render(): void {
    const openGroups = new Set(
      [...this.root.querySelectorAll<HTMLDetailsElement>('details.group[open]')].map((d) => d.dataset.group ?? ''),
    );
    const first = this.root.childElementCount === 0;
    this.lists.clear();
    this.root.replaceChildren(
      this.group('basics', 'Personal details', first || openGroups.has('basics'), this.basics()),
      ...SECTION_SPECS.map((spec) =>
        this.group(
          spec.key,
          spec.title,
          openGroups.has(spec.key),
          spec.intro ? h('p', { class: 'group__intro' }, spec.intro) : null,
          this.list({ path: [spec.key], fields: spec.fields, noun: spec.noun, labelKeys: spec.labelKeys }),
        ),
      ),
      this.group('web', 'Web version', openGroups.has('web'), this.webSettings()),
    );
    this.updateCounts();
  }

  private group(key: string, title: string, open: boolean, ...content: (Node | null)[]): HTMLDetailsElement {
    const details = h(
      'details',
      { class: 'group', 'data-group': key, open },
      h('summary', { class: 'group__summary' }, h('span', { class: 'group__title' }, title), h('span', { class: 'group__count', 'data-count': key })),
      h('div', { class: 'group__body' }, ...content),
    );
    return details;
  }

  private updateCounts(): void {
    for (const el of this.root.querySelectorAll<HTMLElement>('[data-count]')) {
      const key = el.dataset.count!;
      const value = getAt(this.host.resume(), [key]);
      el.textContent = Array.isArray(value) && value.length > 0 ? String(value.length) : '';
      el.setAttribute('aria-label', Array.isArray(value) ? `${value.length} entries` : '');
      if (!Array.isArray(value) || value.length === 0) el.removeAttribute('aria-label');
    }
  }

  // ---------- Fields ----------

  private field(path: Path, spec: FieldSpec): HTMLElement {
    const id = uid();
    const hintId = spec.hint || spec.kind === 'date' ? `${id}-hint` : undefined;
    const errId = `${id}-err`;
    const raw = getAt(this.host.resume(), path);
    const common = {
      id,
      name: String(path[path.length - 1]),
      'data-path': JSON.stringify(path),
      'data-kind': spec.kind,
      placeholder: spec.placeholder,
      autocomplete: spec.autocomplete ?? 'off',
      'aria-describedby': [hintId, errId].filter(Boolean).join(' '),
      spellcheck: spec.kind === 'textarea' || spec.kind === 'lines' ? 'true' : 'false',
    };
    let control: HTMLInputElement | HTMLTextAreaElement;
    if (spec.kind === 'textarea' || spec.kind === 'lines') {
      control = h('textarea', { ...common, rows: spec.kind === 'lines' ? 4 : 3 });
      control.value = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string').join('\n') : typeof raw === 'string' ? raw : '';
    } else {
      const type = spec.kind === 'date' || spec.kind === 'tags' ? 'text' : spec.kind;
      control = h('input', {
        ...common,
        type,
        inputmode: spec.kind === 'date' ? 'numeric' : undefined,
      });
      control.value = Array.isArray(raw) ? raw.filter((x) => typeof x === 'string').join(', ') : typeof raw === 'string' ? raw : '';
    }
    const hint = spec.kind === 'date' ? [DATE_HINT, spec.hint].filter(Boolean).join(' ') : spec.hint;
    const wrapper = h(
      'div',
      { class: `field${spec.wide ? ' field--wide' : ''}` },
      h('label', { for: id }, spec.label),
      control,
      hint ? h('p', { class: 'field__hint', id: hintId }, hint) : null,
      h('p', { class: 'field__error', id: errId, 'aria-live': 'polite' }),
    );
    if (spec.kind === 'date') this.checkDate(control as HTMLInputElement);
    return wrapper;
  }

  private fields(base: Path, specs: FieldSpec[]): HTMLElement {
    return h('div', { class: 'fields' }, specs.map((s) => this.field([...base, s.key], s)));
  }

  private checkDate(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    const ok = value === '' || isIsoDate(value);
    input.toggleAttribute('aria-invalid', !ok);
    if (!ok) input.setAttribute('aria-invalid', 'true');
    const err = input.parentElement?.querySelector('.field__error');
    if (err) err.textContent = ok ? '' : `“${value}” is not a date in the format YYYY, YYYY-MM or YYYY-MM-DD.`;
    return ok;
  }

  // ---------- Basics ----------

  private basics(): DocumentFragment {
    const frag = document.createDocumentFragment();
    frag.append(
      this.photoControl(),
      this.fields(['basics'], BASICS_FIELDS),
      h('fieldset', { class: 'subgroup' }, h('legend', {}, 'Location'), this.fields(['basics', 'location'], LOCATION_FIELDS)),
      h(
        'fieldset',
        { class: 'subgroup' },
        h('legend', {}, 'Online profiles'),
        this.list({ path: ['basics', 'profiles'], fields: PROFILE_FIELDS, noun: 'profile', labelKeys: ['network', 'username'] }),
      ),
    );
    return frag;
  }

  private photoControl(): HTMLElement {
    const src = safeImage(getAt(this.host.resume(), ['basics', 'image']));
    const inputId = uid('photo');
    const img = h('img', { class: 'photo__img', alt: '', width: 72, height: 72 });
    if (src) img.src = src;
    const input = h('input', { type: 'file', id: inputId, accept: 'image/*', class: 'visually-hidden', 'data-photo': true });
    return h(
      'div',
      { class: 'photo' },
      h('div', { class: `photo__frame${src ? '' : ' photo__frame--empty'}`, 'aria-hidden': 'true' }, src ? img : '?'),
      h(
        'div',
        { class: 'photo__body' },
        h('p', { class: 'photo__title' }, 'Photo (optional)'),
        h('p', { class: 'field__hint' }, 'Cropped to a square and compressed in your browser. It never leaves your computer.'),
        h(
          'div',
          { class: 'photo__actions' },
          input,
          h('label', { for: inputId, class: 'btn btn--small' }, src ? 'Change photo' : 'Add photo'),
          src ? h('button', { type: 'button', class: 'btn btn--small btn--ghost', 'data-action': 'remove-photo' }, 'Remove photo') : null,
        ),
      ),
    );
  }

  // ---------- Lists ----------

  private list(def: ListDef): HTMLElement {
    const key = JSON.stringify(def.path);
    const ol = h('ol', { class: 'entries', 'data-list': key });
    const prev = this.lists.get(key);
    this.lists.set(key, { def, ol, open: prev?.open ?? new Set() });
    this.fillList(key);
    const add = h(
      'button',
      { type: 'button', class: 'btn btn--small btn--add', 'data-action': 'add', 'data-list': key },
      `+ Add ${def.noun}`,
    );
    return h('div', { class: 'list' }, ol, add);
  }

  private fillList(key: string): void {
    const entry = this.lists.get(key)!;
    const { def, ol, open } = entry;
    const items = getAt(this.host.resume(), def.path);
    const list = Array.isArray(items) ? items : [];
    ol.replaceChildren(
      ...list.map((_, i) => {
        const bodyId = uid('entry');
        const isOpen = open.has(i);
        const label = this.entryLabel(def, i);
        const toggle = h(
          'button',
          { type: 'button', class: 'entry__toggle', 'aria-expanded': String(isOpen), 'aria-controls': bodyId, 'data-action': 'toggle', 'data-list': key, 'data-index': i },
          h('span', { class: 'entry__chevron', 'aria-hidden': 'true' }),
          h('span', { class: 'entry__label' }, label),
        );
        const posLabel = `${def.noun} ${i + 1} (${label})`;
        const actions = h(
          'div',
          { class: 'entry__actions' },
          h('button', { type: 'button', class: 'icon-btn', 'data-action': 'up', 'data-list': key, 'data-index': i, 'aria-label': `Move ${posLabel} up`, title: 'Move up', disabled: i === 0 }, '↑'),
          h('button', { type: 'button', class: 'icon-btn', 'data-action': 'down', 'data-list': key, 'data-index': i, 'aria-label': `Move ${posLabel} down`, title: 'Move down', disabled: i === list.length - 1 }, '↓'),
          h('button', { type: 'button', class: 'icon-btn icon-btn--danger', 'data-action': 'remove', 'data-list': key, 'data-index': i, 'aria-label': `Remove ${posLabel}`, title: 'Remove' }, '✕'),
        );
        const body = h('div', { class: 'entry__body', id: bodyId, hidden: !isOpen }, this.fields([...def.path, i], def.fields));
        return h('li', { class: 'entry', 'data-list': key, 'data-index': i }, h('div', { class: 'entry__bar' }, toggle, actions), body);
      }),
    );
    if (list.length === 0) ol.append(h('li', { class: 'entries__empty' }, `No ${def.noun} entries yet.`));
  }

  private entryLabel(def: ListDef, index: number): string {
    const item = getAt(this.host.resume(), [...def.path, index]);
    const parts = def.labelKeys
      .map((k) => getAt(item, [k]))
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .map((v) => v.trim());
    return parts.length ? parts.slice(0, 2).join(' · ') : `New ${def.noun}`;
  }

  // ---------- Events ----------

  private onInput(e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const pathAttr = target.dataset.path;
    if (!pathAttr) return;
    const path = JSON.parse(pathAttr) as Path;
    const kind = target.dataset.kind;
    let value: unknown = target.value;
    if (kind === 'lines') value = linesToList(target.value);
    else if (kind === 'tags') value = tagsToList(target.value);
    else if (kind === 'date') {
      value = target.value.trim();
      this.checkDate(target as HTMLInputElement);
    }
    setAt(this.host.resume() as Record<string, unknown>, path, value);

    const li = target.closest<HTMLElement>('li.entry');
    if (li) {
      const key = li.dataset.list!;
      const def = this.lists.get(key)?.def;
      const label = li.querySelector('.entry__label');
      if (def && label) label.textContent = this.entryLabel(def, Number(li.dataset.index));
    }
    this.host.changed();
  }

  private async onChange(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    if (target.dataset.photo !== undefined && target.files?.[0]) {
      try {
        const dataUrl = await photoToDataUrl(target.files[0]);
        setAt(this.host.resume() as Record<string, unknown>, ['basics', 'image'], dataUrl);
        this.replacePhoto();
        this.host.changed();
        this.host.notify(`Photo added (${Math.round((dataUrl.length * 3) / 4 / 1024)} kB).`);
      } catch (err) {
        this.host.notify(err instanceof Error ? err.message : 'The photo could not be added.', 'error');
      }
      target.value = '';
      return;
    }
    if (target.dataset.hide) {
      const resume = this.host.resume();
      resume.meta ??= {};
      resume.meta.cvkit ??= {};
      const current = new Set(resume.meta.cvkit.hideOnWeb ?? []);
      if (target.checked) current.add(target.dataset.hide);
      else current.delete(target.dataset.hide);
      resume.meta.cvkit.hideOnWeb = [...current];
      this.host.changed();
    }
  }

  private replacePhoto(): void {
    const old = this.root.querySelector('.photo');
    const fresh = this.photoControl();
    old?.replaceWith(fresh);
    fresh.querySelector<HTMLElement>('label.btn')?.focus();
  }

  private onClick(e: Event): void {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || !this.root.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'remove-photo') {
      setAt(this.host.resume() as Record<string, unknown>, ['basics', 'image'], undefined);
      this.replacePhoto();
      this.host.changed();
      this.host.notify('Photo removed.');
      return;
    }
    const key = button.dataset.list;
    const entry = key ? this.lists.get(key) : undefined;
    if (!key || !entry) return;
    const index = Number(button.dataset.index);
    const resume = this.host.resume() as Record<string, unknown>;
    let list = getAt(resume, entry.def.path);
    if (!Array.isArray(list)) {
      list = [];
      setAt(resume, entry.def.path, list);
    }
    const items = list as unknown[];

    switch (action) {
      case 'toggle': {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        const body = document.getElementById(button.getAttribute('aria-controls') ?? '');
        if (body) body.hidden = expanded;
        if (expanded) entry.open.delete(index);
        else entry.open.add(index);
        return;
      }
      case 'add': {
        items.push({});
        // setAt removed the empty list earlier; make sure it is attached.
        if (getAt(resume, entry.def.path) !== items) setAt(resume, entry.def.path, items);
        entry.open.add(items.length - 1);
        this.fillList(key);
        this.afterStructural();
        entry.ol.querySelector<HTMLElement>(`li.entry[data-index="${items.length - 1}"] .entry__body input, li.entry[data-index="${items.length - 1}"] .entry__body textarea`)?.focus();
        return;
      }
      case 'remove': {
        const label = this.entryLabel(entry.def, index);
        items.splice(index, 1);
        entry.open = new Set([...entry.open].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
        if (items.length === 0) setAt(resume, entry.def.path, undefined);
        this.fillList(key);
        this.afterStructural();
        const next = entry.ol.querySelector<HTMLElement>(`li.entry[data-index="${Math.min(index, items.length - 1)}"] .entry__toggle`);
        (next ?? entry.ol.parentElement?.querySelector<HTMLElement>('.btn--add'))?.focus();
        this.host.notify(`Removed “${label}”.`);
        return;
      }
      case 'up':
      case 'down': {
        const to = action === 'up' ? index - 1 : index + 1;
        if (!moveItem(items, index, to)) return;
        const wasOpen = entry.open.has(index);
        const otherOpen = entry.open.has(to);
        entry.open.delete(index);
        entry.open.delete(to);
        if (wasOpen) entry.open.add(to);
        if (otherOpen) entry.open.add(index);
        this.fillList(key);
        this.afterStructural();
        const sel = `li.entry[data-index="${to}"] [data-action="${action}"]`;
        const again = entry.ol.querySelector<HTMLButtonElement>(sel);
        (again && !again.disabled ? again : entry.ol.querySelector<HTMLElement>(`li.entry[data-index="${to}"] .entry__toggle`))?.focus();
        this.host.notify(`Moved to position ${to + 1}.`);
        return;
      }
    }
  }

  private afterStructural(): void {
    this.updateCounts();
    this.host.changed();
  }

  // ---------- Web version ----------

  private webSettings(): DocumentFragment {
    const hidden = new Set(this.host.resume().meta?.cvkit?.hideOnWeb ?? []);
    const frag = document.createDocumentFragment();
    frag.append(
      h(
        'p',
        { class: 'group__intro' },
        'The PDF always includes everything. Fields ticked here are removed from the web version (preview it with “Web version” above the CV). They are saved as ',
        h('code', {}, 'meta.cvkit.hideOnWeb'),
        ' in your JSON file.',
      ),
      h(
        'fieldset',
        { class: 'checks' },
        h('legend', { class: 'visually-hidden' }, 'Hide on the web version'),
        HIDEABLE.map(({ path, label }) => {
          const id = uid('hide');
          return h('div', { class: 'check' }, h('input', { type: 'checkbox', id, 'data-hide': path, checked: hidden.has(path) }), h('label', { for: id }, label));
        }),
      ),
    );
    return frag;
  }
}
