import '@fontsource-variable/inter';
import '@fontsource-variable/source-serif-4';
import './styles/app.css';
import './templates/cv.css';

import { $, h } from './app/dom.ts';
import { FormEditor } from './app/form.ts';
import { clearSaved, getPref, loadSaved, save, setPref } from './app/storage.ts';
import { publicView } from './resume/public-view.ts';
import { emptyResume, sampleResume } from './resume/sample.ts';
import {
  CV_LANGUAGES,
  DEFAULT_ACCENT,
  DEFAULT_TEMPLATE,
  TEMPLATE_IDS,
  type CvKitSettings,
  type CvLanguage,
  type Resume,
  type TemplateId,
} from './resume/types.ts';
import { parseResume, type ValidationResult } from './resume/validate.ts';
import { accentVariables, renderResume, TEMPLATES } from './templates/index.ts';

// ---------- State ----------

let resume: Resume;
/** What the "save state" line says; `sample` and `cleared` mean nothing is stored yet. */
type SaveStatus = 'saved' | 'sample' | 'cleared' | 'unavailable';
let saveStatus: SaveStatus = 'saved';
let undoState: { resume: Resume; message: string } | undefined;

const loaded = loadSaved();
if (loaded.status === 'found') {
  resume = loaded.resume;
} else {
  resume = sampleResume();
  saveStatus = loaded.status === 'unavailable' ? 'unavailable' : 'sample';
}

// Optional URL parameters (handy for links and screenshots): ?template=dark&pane=preview
const params = new URLSearchParams(window.location.search);
const templateParam = params.get('template');
if (templateParam && (TEMPLATE_IDS as readonly string[]).includes(templateParam)) {
  settings().template = templateParam as TemplateId;
}

function settings(): CvKitSettings {
  resume.meta ??= {};
  resume.meta.cvkit ??= {};
  return resume.meta.cvkit;
}

function currentTemplate(): TemplateId {
  const t = resume.meta?.cvkit?.template;
  return t && (TEMPLATE_IDS as readonly string[]).includes(t) ? t : DEFAULT_TEMPLATE;
}

function currentLang(): CvLanguage {
  const l = resume.meta?.cvkit?.language;
  return l && (CV_LANGUAGES as readonly string[]).includes(l) ? l : 'en';
}

function currentAccent(): string {
  const a = resume.meta?.cvkit?.accent;
  return a && /^#[0-9a-f]{6}$/i.test(a) ? a.toLowerCase() : DEFAULT_ACCENT;
}

// ---------- Elements ----------

const sheet = $('#cv-sheet');
const frame = $('#sheet-frame');
const stage = $('#stage');
const saveState = $('#save-state');
const accentInput = $('#accent-input') as HTMLInputElement;
const langSelect = $('#lang-select') as HTMLSelectElement;
const webToggle = $('#web-toggle') as HTMLInputElement;
const jsonText = $('#json-text') as HTMLTextAreaElement;
const jsonIssues = $('#json-issues');
const toast = $('#toast');
const toastText = $('#toast-text');
const toastUndo = $('#toast-undo');
const workspace = $('.workspace');

// ---------- Preview ----------

let renderTimer: number | undefined;
function renderPreview(): void {
  window.clearTimeout(renderTimer);
  const template = currentTemplate();
  const data = webToggle.checked ? publicView(resume) : resume;
  sheet.innerHTML = renderResume(data, template, currentLang());
  sheet.dataset.template = template;
  for (const [name, value] of Object.entries(accentVariables(currentAccent()))) sheet.style.setProperty(name, value);
  fitSheet();
}

function schedulePreview(): void {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderPreview, 120);
}

/** Scales the A4 sheet down to fit the preview column (print is unaffected). */
function fitSheet(): void {
  const styles = getComputedStyle(stage);
  const available = stage.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
  const natural = sheet.offsetWidth;
  if (!natural || available <= 0) return;
  const scale = Math.min(1, available / natural);
  sheet.style.setProperty('--sheet-scale', scale.toFixed(4));
  frame.style.width = `${Math.floor(natural * scale)}px`;
  frame.style.height = `${Math.ceil(sheet.offsetHeight * scale)}px`;
}
let fitFrame = 0;
new ResizeObserver(() => {
  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(fitSheet);
}).observe(stage);

// ---------- Saving ----------

let saveTimer: number | undefined;
function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveStatus = save(resume) ? 'saved' : 'unavailable';
    showSaveState();
  }, 300);
}

const SAVE_TEXT: Record<SaveStatus, string> = {
  saved: 'Saved in this browser',
  sample: 'Sample CV — saved once you edit it',
  cleared: 'Cleared — nothing stored',
  unavailable: 'Autosave unavailable here — export your JSON to keep it',
};

function showSaveState(): void {
  saveState.textContent = SAVE_TEXT[saveStatus];
  saveState.dataset.status = saveStatus;
}

function changed(): void {
  scheduleSave();
  schedulePreview();
}

// ---------- Toast with undo ----------

let toastTimer: number | undefined;
function notify(message: string, kind: 'info' | 'error' = 'info', withUndo = false): void {
  toastText.textContent = message;
  toast.classList.toggle('toast--error', kind === 'error');
  toastUndo.hidden = !withUndo;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.hidden = true), withUndo ? 9000 : 4000);
}

/** Replaces the whole resume, keeping the previous one for Undo. */
function replaceResume(next: Resume, message: string, opts: { save?: boolean } = {}): void {
  undoState = { resume: resume, message };
  resume = next;
  refreshAll();
  window.clearTimeout(saveTimer);
  if (opts.save === false) {
    saveStatus = 'cleared';
    showSaveState();
  } else {
    scheduleSave();
  }
  notify(message, 'info', true);
}

toastUndo.addEventListener('click', () => {
  if (!undoState) return;
  resume = undoState.resume;
  undoState = undefined;
  refreshAll();
  scheduleSave();
  notify('Undone.');
});

// ---------- Form, JSON tab and toolbar ----------

const form = new FormEditor($('#form-root'), {
  resume: () => resume,
  changed,
  notify: (m, k) => notify(m, k),
});

function refreshAll(): void {
  form.render();
  syncToolbar();
  if (!$('#panel-json').hidden) loadJsonText();
  renderPreview();
}

const templateOptions = $('#template-options');
for (const t of TEMPLATES) {
  const id = `template-${t.id}`;
  templateOptions.append(
    h('input', { type: 'radio', name: 'template', id, value: t.id, class: 'segmented__input' }),
    h('label', { for: id, class: 'segmented__label', title: t.description }, t.name),
  );
}
templateOptions.addEventListener('change', (e) => {
  const value = (e.target as HTMLInputElement).value as TemplateId;
  settings().template = value;
  changed();
  renderPreview();
});

accentInput.addEventListener('input', () => {
  settings().accent = accentInput.value.toLowerCase();
  changed();
});

langSelect.addEventListener('change', () => {
  settings().language = langSelect.value as CvLanguage;
  changed();
});

webToggle.addEventListener('change', () => {
  setPref('web-view', webToggle.checked ? '1' : '0');
  renderPreview();
});
webToggle.checked = getPref('web-view') === '1';

function syncToolbar(): void {
  const template = currentTemplate();
  for (const input of templateOptions.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === template;
  accentInput.value = currentAccent();
  langSelect.value = currentLang();
}

// JSON tab
function loadJsonText(): void {
  jsonText.value = JSON.stringify(resume, null, 2);
  jsonIssues.replaceChildren();
}

function showIssues(result: ValidationResult, title: string): void {
  jsonIssues.replaceChildren();
  if (result.errors.length) {
    jsonIssues.append(
      h('p', { class: 'issues__title issues__title--error' }, title),
      h('ul', {}, result.errors.map((e) => h('li', {}, e))),
    );
  }
  if (result.warnings.length) {
    jsonIssues.append(
      h('p', { class: 'issues__title' }, 'Worth checking:'),
      h('ul', {}, result.warnings.map((w) => h('li', {}, w))),
    );
  }
}

$('#json-apply').addEventListener('click', () => {
  const result = parseResume(jsonText.value);
  if (!result.ok || !result.resume) {
    showIssues(result, 'Not applied. Please fix:');
    return;
  }
  replaceResume(result.resume, 'JSON changes applied.');
  loadJsonText();
  showIssues(result, '');
});
$('#json-revert').addEventListener('click', () => {
  loadJsonText();
  notify('JSON edits discarded.');
});

// Tabs (arrow keys move between them, as in the ARIA tabs pattern)
const tabs = [$('#tab-form'), $('#tab-json')];
function selectTab(tab: HTMLElement, focus = false): void {
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    $(`#${t.getAttribute('aria-controls')}`).hidden = !selected;
  }
  if (tab.id === 'tab-json') loadJsonText();
  else form.render();
  setPref('tab', tab.id);
  if (focus) tab.focus();
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    selectTab(tabs[(tabs.indexOf(tab) + 1) % tabs.length]!, true);
  });
}

// ---------- Import / export ----------

async function importFile(file: File): Promise<void> {
  if (file.size > 5 * 1024 * 1024) {
    notify('This file is larger than 5 MB; a CV JSON file should be much smaller.', 'error');
    return;
  }
  const result = parseResume(await file.text());
  if (!result.ok || !result.resume) {
    selectTab($('#tab-json'));
    showIssues(result, `“${file.name}” was not imported. Please fix:`);
    notify(`“${file.name}” has errors and was not imported.`, 'error');
    return;
  }
  replaceResume(result.resume, `Imported “${file.name}”.`);
  if (result.warnings.length) {
    selectTab($('#tab-json'));
    showIssues(result, '');
  }
}

const importInput = $('#import-input') as HTMLInputElement;
importInput.addEventListener('change', () => {
  const file = importInput.files?.[0];
  if (file) void importFile(file);
  importInput.value = '';
});

function fileName(): string {
  const name = (resume.basics?.name ?? '').trim();
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'cv'}.resume.json`;
}

$('#export-btn').addEventListener('click', () => {
  const blob = new Blob([`${JSON.stringify(resume, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: fileName() });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(`Downloaded ${fileName()}.`);
});

$('#sample-btn').addEventListener('click', () => replaceResume(sampleResume(), 'Sample CV loaded.'));
$('#empty-btn').addEventListener('click', () => {
  replaceResume(emptyResume(resume.meta), 'Started from an empty CV.');
  const details = document.querySelector<HTMLDetailsElement>('details.group[data-group="basics"]');
  if (details) details.open = true;
  document.querySelector<HTMLElement>('#form-root input[name="name"]')?.focus();
});
$('#clear-btn').addEventListener('click', () => {
  if (!clearSaved()) notify('Local storage could not be cleared in this browser.', 'error');
  replaceResume(emptyResume(), 'Data cleared from this browser.', { save: false });
});

// Drag and drop anywhere on the page
const overlay = $('#drop-overlay');
let dragDepth = 0;
const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes('Files');
window.addEventListener('dragenter', (e) => {
  if (!hasFiles(e)) return;
  dragDepth += 1;
  overlay.hidden = false;
});
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) overlay.hidden = true;
});
window.addEventListener('dragover', (e) => {
  if (hasFiles(e)) e.preventDefault();
});
window.addEventListener('drop', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  dragDepth = 0;
  overlay.hidden = true;
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    notify('Please drop a .json file.', 'error');
    return;
  }
  void importFile(file);
});

// ---------- Print ----------

$('#print-btn').addEventListener('click', () => {
  renderPreview();
  window.print();
});

// ---------- Narrow screens: switch between editor and preview ----------

const paneButtons = [...document.querySelectorAll<HTMLButtonElement>('.pane-switch__btn')];
function showPane(pane: string): void {
  workspace.dataset.pane = pane;
  for (const b of paneButtons) b.setAttribute('aria-pressed', String(b.dataset.pane === pane));
  if (pane === 'preview') requestAnimationFrame(fitSheet);
}
for (const b of paneButtons) b.addEventListener('click', () => showPane(b.dataset.pane!));

// ---------- Start ----------

form.render();
syncToolbar();
if (getPref('tab') === 'tab-json') selectTab($('#tab-json'));
if (params.get('pane') === 'preview') showPane('preview');
renderPreview();
document.fonts?.ready.then(fitSheet).catch(() => undefined);
showSaveState();
if (loaded.status === 'empty') notify('Showing a fictional sample CV. Edit it, import your JSON or start from empty.');
if (loaded.status === 'unavailable') {
  notify('This browser blocks local storage, so nothing will be autosaved. Export your JSON to keep it.', 'error');
}
