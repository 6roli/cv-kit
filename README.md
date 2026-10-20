# CV Kit

Write your CV once as structured data and get a polished web and PDF CV from several templates. CV Kit is free and
open, and it runs entirely in your browser: no server, no accounts, no external services.

| | |
|---|---|
| Live app | https://cv-kit.gabriel-olius.workers.dev *(address confirmed after the first deployment)* |
| Data format | [JSON Resume](https://jsonresume.org/schema) v1.0.0 (open standard, MIT licence) |
| Hosting | Cloudflare (Workers static assets), Free plan |
| Monthly cost | €0 |

## Privacy: everything stays on your computer

- There is no CV Kit server. Cloudflare only serves the app's static files.
- What you type is autosaved **only in this browser's local storage** on this device. "Clear data from this
  browser" removes it (with an undo, in case you click it by mistake).
- Photos are cropped and compressed in the browser (canvas) and stored inside your JSON file as a small data URL.
- The app makes no requests to other sites. The Content-Security-Policy in `public/_headers` enforces this:
  scripts, styles, fonts and network requests are limited to the app's own files, and there are no inline scripts.
- To keep a copy or move to another computer, use **Export JSON**; open it elsewhere with **Import JSON**.

## How to use it

1. Open the app. A clearly fictional sample CV (Alex Example) is loaded the first time; edit it, click
   **Start from empty**, or **Import JSON** (file picker, or drop a `.json` file anywhere on the page).
2. Fill in the **Form**: every JSON Resume section has its own group, with add, remove and move up/down for entries.
   Dates are `YYYY`, `YYYY-MM` or `YYYY-MM-DD`; leave the end date empty for an ongoing role ("Present").
   Power users can edit the raw data in the **JSON** tab (validated before it is applied; unknown fields are kept).
3. Pick a **template**, an **accent colour** and the **CV language** (English or Spanish headings and dates).
4. **Download PDF** opens the print dialog: choose **Save as PDF**, paper **A4**, and turn off headers and footers.
   Only the CV is printed, never the editor.
5. **Export JSON** to keep your data file (named like `alex-example.resume.json`).

On phones the editor and the preview are two views; switch with the **Edit / Preview** buttons at the top.

## Templates

| Template | Look | Print |
|---|---|---|
| **Classic** | Single column, serif headings (Source Serif 4), contact line under the name | Same as screen |
| **Modern** | Sidebar with photo, contact, skills, languages and interests; gradient rule under the name | Same as screen (light tinted sidebar) |
| **Dark** | Near-black background, white text and an accent gradient, like Gabriel Olius's portfolio | Switches to a light background to save ink |

All templates are A4 (`@page { size: A4 }`), use selectable text, keep each entry together across page breaks and
escape everything you type (no HTML injection). The accent colour drives headings, bullets and gradients; a second
gradient colour is derived from it automatically.

## Data format

CV Kit reads and writes [JSON Resume v1.0.0](https://jsonresume.org/schema): `basics` (name, label, image, email,
phone, url, summary, location, profiles), `work`, `volunteer`, `education`, `awards`, `certificates`,
`publications`, `skills`, `languages`, `interests`, `references` and `projects`. Every field is optional, and fields
CV Kit does not know are preserved, so files from other JSON Resume tools work.

App settings live in a small extension under `meta`, which other JSON Resume tools ignore:

```json
"meta": {
  "cvkit": {
    "template": "modern",
    "accent": "#7c9cff",
    "language": "en",
    "hideOnWeb": ["phone"]
  }
}
```

| Setting | Values |
|---|---|
| `template` | `classic`, `modern` or `dark` |
| `accent` | colour as `#rrggbb` |
| `language` | `en` or `es`: language of headings, month names and "Present" / "Actualidad" (your own text is never translated) |
| `hideOnWeb` | fields removed from the **web version** but kept in the PDF: `"phone"` (short for `basics.phone`), `"email"`, `"image"`, `"location.address"`, a whole section such as `"references"`, or a field in every entry such as `"work.location"` |

### Web version and `publicView()`

The PDF always contains everything. The web version (toggle **Web version** above the preview) is produced by
`publicView(resume)` in `src/resume/public-view.ts`, which returns a copy without the fields listed in `hideOnWeb`.
A personal website can reuse the same function so, for example, a phone number appears in the PDF but never on the
site. The function is pure TypeScript with no dependencies; copy `src/resume/public-view.ts` and
`src/resume/types.ts`, then:

```ts
import resume from './data/gabriel-olius.resume.json';
import { publicView } from './lib/public-view';

const web = publicView(resume); // safe to render on the website
```

## Technologies: what, where, why

| Technology | Runs where | Why it is needed |
|---|---|---|
| **HTML + CSS** | Browser | Editor, templates and print layout. No CSS framework. |
| **TypeScript** (strict) | Compiled at build time; runs in the browser as JavaScript | Typed JSON Resume model, validator and templates. No UI framework: plain DOM. |
| **Vite** | Your computer and Cloudflare's build server | Development server; bundles the app into static files. |
| **Vitest** | Your computer and Cloudflare's build server | Unit tests: validator, dates, templates (including HTML escaping), `publicView`, editor helpers. |
| **Inter** and **Source Serif 4** (Fontsource, OFL-1.1) | Browser | Self-hosted fonts, so no request goes to Google Fonts. |
| **Cloudflare** (Workers static assets) | Cloudflare | Builds on every push and serves the static files over HTTPS. |

### Code layout

```
index.html               Page structure (editor, toolbar, preview)
src/main.ts              Wires state, autosave, toolbar, import/export, print
src/resume/              Data layer (no DOM)
  types.ts                 JSON Resume v1.0.0 types + meta.cvkit settings
  validate.ts              Validator with path-specific messages
  dates.ts                 Date formatting (en/es), ranges, "Present"
  public-view.ts           publicView(): removes hideOnWeb fields
  sample.ts                Fictional sample CV and empty CV
src/templates/           Classic, Modern, Dark: HTML strings + cv.css (screen and print)
src/app/                 Editor: form builder, field specs, storage, photo resizing, helpers
src/styles/app.css       Editor look and print rules
tests/                   Vitest unit tests
public/_headers          Security headers (strict CSP, no-referrer)
wrangler.jsonc           Cloudflare static assets settings
```

## Develop locally (VS Code)

Requirements: **Node.js 24 LTS**, **Git** and **VS Code**.

```bash
git clone https://github.com/6roli/cv-kit.git
cd cv-kit
npm ci            # installs exact versions from package-lock.json
npm run dev       # http://localhost:5173 — reloads on save
```

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check (app and tests) |
| `npm run build` | Type check + tests + production build into `dist/` |
| `npm run preview` | Serve `dist/` locally (http://localhost:4173) |
| `npm run verify` | Type check + tests + build — same as `npm run build` |

Handy for screenshots and links: `?template=dark` opens a template, `?pane=preview` shows the preview first on phones.

No secrets or `.env` file are needed. Personal data files named `*.resume.json` or `resume.json` are ignored by Git,
so an exported CV is not committed by accident.

## Publish

Cloudflare (Workers static assets, Free plan) is connected to the GitHub repository through its Git integration:

- push to `main` → Cloudflare runs `npm run build` (all checks + build); if every check passes, the new version goes live;
- push to another branch or open a pull request → a preview URL, shown in GitHub next to the commit;
- if a check fails, nothing is deployed and the previous version stays online.

First-time setup: *Workers & Pages → Create → Import a repository →* `6roli/cv-kit`, then:

| Setting | Value |
|---|---|
| Project name | `cv-kit` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run build` (runs every check before building) |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` (preview URLs) |
| Production branch | `main` |

`wrangler.jsonc` tells Cloudflare the site is **only static files** in `dist/`: no Worker code and no server.
Static requests are free and unlimited.

## Costs

| Item | Cost | Notes |
|---|---|---|
| Hosting | €0 | Cloudflare Free (Workers static assets); no payment method needed |
| Builds | €0 | Cloudflare Workers Builds free quota; ~1 build minute per push |
| Fonts and libraries | €0 | Open licences; no paid services or APIs |

## Limitations

- "Download PDF" uses the browser's print dialog. Chrome and Edge give the closest result to the preview; set paper
  to A4 and disable headers and footers. Firefox and Safari should work but were not tested; page breaks may differ.
- Data lives in one browser on one device. Clearing site data or using a private window loses it: export your JSON.
- Photos are stored inside the JSON file (typically 10–40 kB after compression).
- Interface in English; CV headings and dates in English or Spanish.

## Licence

Not chosen yet. MIT is recommended for an open tool like this (it matches the JSON Resume schema's licence); until a
`LICENSE` file is added, the code is all rights reserved. Bundled fonts are under the SIL Open Font License 1.1.
