# TECH — sheibah.ir · Technical Design

**Companion to:** `docs/PRD.md` · **Status:** specification only — no implementation yet

This document covers architecture, project structure, data models, libraries, and the
reasoning behind every decision that had a genuine alternative. Where more than one
viable option exists, all options are listed with a recommendation.

---

## 1. Stack Summary

| Layer | Choice | One-line rationale |
|---|---|---|
| Framework | **Astro 5**, fully static output | Content-collections fit the archive model; first-class i18n; near-zero shipped JS |
| Language | TypeScript everywhere | Type-checked content schemas catch CMS input errors at build time |
| UI | Astro components only, **no UI framework** | The site has no client interactivity beyond language detection — islands would be dead weight |
| Styling | Vanilla CSS + design tokens | See D1 |
| Content | Astro Content Collections (markdown/YAML in repo) | Git-versioned archive; CMS writes plain files |
| CMS | **Sveltia CMS** (fallback: Decap) | Form-based publishing UI that commits markdown to GitHub |
| CMS auth | **sveltia-cms-auth** on a Cloudflare Worker | Standard GitHub OAuth bridge; keeps main repo 100% static |
| Hosting | **Cloudflare Pages**, git integration | Auto-build on push, preview deploys, DNS synergy, works from Iran |
| Domain | sheibah.ir (iranserver) → Cloudflare DNS | See §7.2 |
| Analytics | Cloudflare Web Analytics | Cookieless, one tiny beacon, no consent banner |
| Feeds | `@astrojs/rss` (notes + translations) | Cheap; useful for scholars |
| Package manager | npm | Owner's existing habit |

---

## 2. Repository Layout

Repo: `mhsb/sheibah` (name TBD by owner). **Rule: the filename is the slug.**
CMS creates files named after the entry's slug; no separate slug front-matter field.

```
sheibah/
├── astro.config.mjs            # i18n config, sitemap integration
├── package.json
├── tsconfig.json
├── docs/
│   ├── PRD.md
│   └── TECH.md                 # this file
├── scripts/
│   └── import-bear.mjs         # one-time Bear Blog importer (local CLI, not part of the site)
├── public/
│   ├── favicon.svg             # simplified glyph for 16/32px (see note below)
│   ├── apple-touch-icon.png    # full calligraphic mark (large sizes render fine)
│   ├── og.png                  # static 1200×630 OG image (logo + name + three fields)
│   ├── robots.txt
│   ├── uploads/                # CMS media target — unprocessed, served as-is (see D7)
│   └── admin/
│       ├── index.html          # CMS entry (loads Sveltia from CDN)
│       └── config.yml          # CMS collection config — must mirror §3 schemas
└── src/
    ├── content.config.ts       # collection definitions + zod schemas (§3)
    ├── content/
    │   ├── notes/*.md          # Hawzah lesson notes (markdown body = the note)
    │   ├── translations/*.md   # markdown body = optional excerpt/sample
    │   ├── projects/*.yaml     # pure data entries, no body
    │   └── site/profile.yaml   # singleton: identity, bio, social links, contact
    ├── i18n/
    │   ├── ui.ts               # UI string dictionaries, EN + FA (§3.5)
    │   └── utils.ts            # locale URLs, alternates map, locale-aware dates
    ├── layouts/
    │   ├── Base.astro          # <head>, fonts, SEO/OG, detection script (root only)
    │   └── Prose.astro         # article layout for notes/translations, dir-aware
    ├── components/
    │   ├── Header.astro  Footer.astro  LangToggle.astro
    │   ├── Hero.astro  FieldCard.astro
    │   ├── NoteCard.astro  TranslationCard.astro  ProjectCard.astro
    │   ├── SocialPool.astro    # powers /links page AND footer strip
    │   └── ornaments/          # GirihDivider.astro, HeroPattern.astro (subtle accents)
    ├── pages/                  # EN (unprefixed, default locale)
    │   ├── index.astro  about.astro  links.astro  projects.astro
    │   ├── notes/{index,[slug]}.astro
    │   └── translations/{index,[slug]}.astro
    ├── pages/fa/               # FA mirror of the exact same tree → /fa/...
    ├── assets/                 # build-processed images (headshot, og source, logo master)
    └── styles/
        ├── tokens.css          # design tokens: colors, spacing, type scale (single source)
        ├── global.css          # reset, base, logical-property utilities
        └── prose.css           # long-form typography, RTL-aware
```

**Logo asset note:** the attached logo is raster. §15 of the PRD asks for a vector
original. If none exists, we ship a cleaned-up SVG trace for header use and use the
raster only for og/touch icons. The full calligraphic mark smudges at 16px, so the
favicon uses a simplified glyph (e.g., the ش or the mark's distinctive cluster).

---

## 3. Data Models

Schemas are enforced by zod at build time: **a bad CMS edit fails the build** rather
than silently shipping broken pages. The CMS `config.yml` mirrors these 1:1.

### 3.1 `notes` — Hawzah lesson notes (`src/content/notes/<slug>.md`)

```ts
z.object({
  title: z.string(),                      // primary-language title (usually FA)
  titleEn: z.string().optional(),         // EN title for display in EN contexts
  date: z.coerce.date(),                  // ISO; drives archive ordering
  tags: z.array(z.string()).default([]),  // subject areas
  lang: z.enum(['fa', 'en']).default('fa'), // body language
  summary: z.string().optional(),         // one-liner in body language
  summaryEn: z.string().optional(),       // one-liner for EN contexts
  sourceUrl: z.string().url().optional(), // original Bear Blog URL (provenance)
  featured: z.boolean().default(false),   // eligible for landing-card highlight slot
  draft: z.boolean().default(false),      // drafts are filtered out of all queries
})
// body = the note itself (long-form markdown)
```

### 3.2 `translations` — Persian→English work (`<slug>.md`)

```ts
z.object({
  titleEn: z.string(),
  titleFa: z.string().optional(),
  date: z.coerce.date(),
  sourceWork: z.string().optional(),      // original text
  sourceAuthor: z.string().optional(),
  descriptionEn: z.string(),              // required: EN visitors are the main audience
  descriptionFa: z.string().optional(),
  links: z.array(z.object({               // where the piece is published
    label: z.string(),
    url: z.string().url(),
  })).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
})
// body = optional excerpt/sample (≤ ~300 words per PRD); full texts stay with publishers
```

### 3.3 `projects` — code (`<slug>.yaml`, no body)

```ts
z.object({
  name: z.string(),
  descriptionEn: z.string(),
  descriptionFa: z.string().optional(),
  repoUrl: z.string().url().optional(),   // GitHub
  demoUrl: z.string().url().optional(),   // live page (mhsb.github.io/<name> pattern)
  tags: z.array(z.string()).default([]),  // tech tags
  status: z.enum(['active', 'archived']).default('active'),
  screenshot: z.string().optional(),      // path under /uploads/
  featured: z.boolean().default(false),
  order: z.number().default(100),         // manual display order, lower = earlier
})
```

### 3.4 `site` — singleton profile (`src/content/site/profile.yaml`)

```ts
z.object({
  brandFa: z.literal('شیبه'),
  brandEn: z.literal('Sheibah'),
  legalName: z.literal('Hosein Sheibah'),
  legalNameFa: z.string(),                // حسین شیبه — confirm spelling with owner
  tagline: z.object({ en: z.string(), fa: z.string() }),
  bio: z.object({ en: z.array(z.string()), fa: z.array(z.string()) }), // paragraphs
  headshot: z.string().optional(),
  email: z.string().email().optional(),   // footer mention only (per PRD)
  links: z.array(z.object({
    platform: z.enum(['telegram', 'eitaa', 'twitter', 'linkedin', 'github', 'bearblog', 'other']),
    label: z.string(),
    url: z.string().url(),
    primary: z.boolean().default(false),  // primary = contact CTA (Telegram/Eitaa)
  })).min(1),
})
```

CMS-editable, so bio/social updates never touch code. The Eitaa icon lives in code
(`components/icons/EitaaIcon.astro`, traced from the svgrepo asset after a license
check) — it is not part of owner-editable data.

### 3.5 UI strings (`src/i18n/ui.ts`)

Flat keyed dictionaries (`nav.notes`, `hero.tagline`, `cta.contact`, `archive.empty`,
`langNotice` …) for `en` and `fa`. **Deliberately not CMS-managed:** UI strings change
with code changes; keeping them in TS gives compile-time checking of missing keys.

### 3.6 Language availability matrix

Which entries appear under which locale's listings:

| Collection | Under `/` (EN) | Under `/fa/` |
|---|---|---|
| notes | only `lang: en` entries | **all** entries |
| translations | all | all |
| projects | all | all |

Fallback rule: any display field missing its locale variant (e.g., `titleFa` absent)
falls back to the primary variant — never renders an empty string. At launch the EN
notes listing may be empty by design; the EN Hawzah card copy handles this ("lesson
notes are published in Persian") per the PRD's no-filler rule.

Ordering rules: archives sort by `date` desc; landing highlights = `featured && !draft`,
date desc, capped at 3 per card; projects additionally honor `order`.

---

## 4. i18n & Routing Internals

- **Astro built-in i18n:** `locales: ['en', 'fa']`, `defaultLocale: 'en'`,
  `prefixDefaultLocale: false` → EN at `/…`, FA at `/fa/…`. URL helpers from
  `astro:i18n`; a small `getAlternates()` util maps each page to its counterpart.
- **Detection script (per PRD Option B):** tiny inline blocking script in the `<head>`
  of `/` **only** (root entry — deep links are intentional navigation and are never
  redirected, which also kills redirect-loop risk). Behavior:
  1. `localStorage['sheibah:lang']` exists → honor it (do nothing).
  2. Else `navigator.language` starts with `fa` → `location.replace('/fa/')`.
  3. Else stay on EN.
- **Toggle:** visible on every page, both locales. Tapping it saves the choice and
  navigates to the exact counterpart page if it exists (alternates map), otherwise to
  the other locale's nearest section index. Saved choice always beats detection.
- **No-JS:** root is EN by default; `/fa/` is linked in header/footer — detection is
  enhancement, not a gate.
- **hreflang:** every page emits `rel=alternate hreflang=en` / `hreflang=fa` pair +
  `x-default → /` (the detection entry). Sitemap includes both locales
  (`@astrojs/sitemap` picks up the i18n config).
- **Dates:** stored as ISO; displayed per locale. FA uses native
  `Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' })` → Jalali dates
  **with Persian digits, zero dependencies**. EN uses Gregorian long format.
  Build-time Intl requires full-ICU Node — default in Node 18+ and in CF Pages builds.
- **Slugs:** Latin-only filenames for all entries, including FA-only notes (see D4).

---

## 5. Libraries

| Concern | Choice | Alternatives considered → why rejected |
|---|---|---|
| Framework | `astro@^5` | Next.js (SSR/backend we don't need), Hugo (weaker fit with git-CMS + custom i18n) — per PRD |
| Styling | vanilla CSS (`tokens.css` + scoped component styles) | Tailwind v4 (great, but overkill at ~10 components; tokens file gives the same discipline with zero deps) — see D1 |
| Fonts | `@fontsource/vazirmatn` (400/500/700), `@fontsource-variable/inter` | Google Fonts CDN → self-hosting avoids a third-party request from Iran and scores better on perf |
| Icons | `astro-icon` + `@iconify-json/lucide`, custom `EitaaIcon.astro` | Hand-inlining every SVG (fine too, but astro-icon is one dep and tree-shaken) |
| Sitemap | `@astrojs/sitemap` | Hand-rolled XML (needless work) |
| RSS | `@astrojs/rss` | Hand-rolled (needless work) |
| Markdown extras | `rehype-external-links` (external links → new tab) | — |
| Syntax highlighting | Shiki (built into Astro) | — |
| CMS | Sveltia CMS (CDN) | Decap CMS (slower-moving, heavier), Pages CMS/Tina (more moving parts) — see D6 |
| CMS auth | `sveltia-cms-auth` (Cloudflare Worker) | In-repo Pages Function implementing OAuth (more code to own), decapbridge (third-party dependency for something security-sensitive) |
| Date formatting | native `Intl` | jalali-moment etc. → unnecessary; native handles Jalali + Persian digits |
| Bear importer | plain Node + `gray-matter` | No build integration; one-time local script |

---

## 6. Difficult Decisions

**D1 — Styling system.**
Options: (a) vanilla CSS with a tokens file + Astro scoped styles; (b) Tailwind v4.
**Decision: (a).** Why: the UI is small, bespoke, and hand-shaped (hybrid aesthetic);
(a) gives full control over logical properties for RTL, keeps the dependency surface
minimal, and `tokens.css` becomes the single source for the accent-color decision
(green vs indigo) that's still open. Tailwind's velocity advantage matters on large
UIs, not here.

**D2 — How bilingual content works.**
Options: (a) one file per entry, single body in a primary language, optional
translated *metadata* fields (title/summary per locale); (b) per-locale file pairs
(`note.fa.md` / `note.en.md`) sharing an id; (c) fully separate locale collections.
**Decision: (a)** — it's what the PRD specifies. Why: it matches the actual content
reality (notes are FA-only; translations and projects are bilingual *fields* by
nature); (b) doubles CMS ceremony for translated variants that don't exist yet and
creates a sync problem. **Escape hatch documented:** if a note ever warrants a full
English version, we create a second entry and cross-link it — no schema change needed.

**D3 — Language detection: client vs edge.**
Options: (a) inline client script on root page (localStorage → navigator.language);
(b) Cloudflare Pages `_middleware.ts` reading `Accept-Language` at the edge and 302-ing.
**Decision: (a).** Why: (b) is genuinely nicer (no flash, works before HTML) but
hard-binds the redirect logic to Cloudflare, hurting the portability we keep as a
contingency (see D9), and adds a server-side code path to a "no backend" project. The
inline script is ~10 lines, testable, and portable. FOUC risk is negligible (redirect
fires before first paint of meaningful content).

**D4 — Slug policy.**
Options: (a) Latin-only slugs everywhere; (b) Persian slugs for FA content (SEO-natural
but percent-encoded in URLs); (c) transliteration.
**Decision: (a).** Why: Persian slugs render as `%D8%…` noise in shares, analytics,
and the CMS file listing. Persian SEO is carried by `<title>`, h1, and content, not
the slug. Cost: owner types a short Latin slug at creation (CMS field, auto-suggested).

**D5 — Calendar & digits.**
Options: (a) Gregorian everywhere; (b) native `Intl` Jalali formatting on FA pages.
**Decision: (b).** Why: a hawzah archive showing Gregorian dates to a Persian
scholarly audience feels foreign — Jalali is expected. Native `Intl` gives Jalali +
Persian digits with zero libraries and zero code beyond a format helper. Only
requirement: full-ICU Node at build (default on CF Pages).

**D6 — CMS choice & auth architecture.**
Options: Sveltia CMS / Decap CMS / Pages CMS / Tina; auth via dedicated Worker /
in-repo Pages Function / hosted bridge.
**Decision: Sveltia + own `sveltia-cms-auth` Worker.** Why: Sveltia is the lightest
and most modern of the git-backed CMSs, its editor is strong (including RTL content
preview), and since our i18n is "just fields" (D2), we need nothing exotic from it.
Auth is the only sensitive piece, so it gets a tiny dedicated Worker with secrets in
its environment — the main repo stays 100% static and portable. **Graceful
degradation:** if the Worker or CMS ever breaks, the owner publishes via git directly —
the markdown files are the source of truth; the CMS is only a UI over them.

**D7 — Media pipeline.**
Options: (a) CMS uploads to `public/uploads/`, served unprocessed; curated brand
images in `src/assets/` processed at build; (b) everything through Astro's image
pipeline.
**Decision: (a).** Why: CMS-written markdown referencing build-processed assets is the
classic Astro+CMS friction point (path resolution breaks across tooling versions).
Screenshots and headshot get compressed at capture/one-time setup instead. The one
image that really benefits from build processing (hero/og) is hand-placed in
`src/assets/` anyway.

**D8 — i18n routing implementation.**
Options: (a) Astro's built-in i18n config + helpers; (b) hand-rolled path utilities.
**Decision: (a).** Why: built-in gives locale-aware URL helpers, guards against
malformed locale paths, and integrates with the sitemap integration — less custom code
to maintain. Our own code is limited to `getAlternates()` (counterpart-page mapping
for the toggle/hreflang).

**D9 — Deploy pipeline & portability insurance.**
Options: (a) Cloudflare Pages git integration; (b) GitHub Actions building and
direct-uploading to CF; (c) GitHub Pages.
**Decision: (a).** Why: zero CI config, preview deploys per PR, and the domain already
moves to Cloudflare DNS (§7.2). The *insurance* argument: the output is pure static
`dist/` — if Cloudflare access from Iran ever degrades, the site redeploys to GitHub
Pages essentially unchanged; only `/admin` (CMS) and the auth Worker would need a
rethink, and publishing still works via git. This is why D3 chose client-side
detection and D6 kept the repo static.

---

## 7. Build, Deploy & Infrastructure

### 7.1 Pipeline
- Node 20 · `npm ci` · build command `npm run build` · output `dist/`
- Push to `main` → production deploy; PRs → preview deploys (useful for review)
- zod schema violations fail the build → bad CMS input can never ship

### 7.2 Domain (one-time, owner-assisted)
1. Add `sheibah.ir` as a zone in Cloudflare.
2. At iranserver, change nameservers to the Cloudflare-assigned pair.
3. Attach `sheibah.ir` + `www.sheibah.ir` as custom domains on the Pages project;
   redirect `www` → apex; proxy on (orange cloud).

### 7.3 CMS auth (one-time)
1. Register a GitHub OAuth App (callback → the Worker's `/callback`).
2. Deploy `sveltia-cms-auth` to a Cloudflare Worker; set `GITHUB_CLIENT_ID` and
   `GITHUB_CLIENT_SECRET` as Worker secrets.
3. `admin/config.yml` sets `backend.base_url` to the Worker URL.

| Secret | Where | Scope |
|---|---|---|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Worker env | CMS OAuth only |
| No other secrets exist — the site itself is static |

### 7.4 Bear Blog import (contract for `scripts/import-bear.mjs`)
- Input: Bear Blog markdown export (path argument).
- For each file: extract title/date/tags, slugify (Latin), write
  `src/content/notes/<slug>.md` with generated front-matter, `sourceUrl` set to the
  original post URL, **`draft: true`** so everything lands in the CMS review queue.
- Idempotent: skips slugs that already exist. Prints an imported/skipped report.
- Run manually, whenever the owner decides (PRD Phase 2).

---

## 8. Verification Gates (pre-launch)

- [ ] Build passes with schema validation (no zod errors)
- [ ] Lighthouse ≥ 95 perf & accessibility, **both locales**, mobile-throttled
- [ ] RTL visual QA pass on /fa (mirroring, Vazirmatn rendering, Jalali dates, Persian digits)
- [ ] Detection: fa-browser → /fa/ ; en-browser → / ; saved choice beats detection ; toggle fallback works from FA-only note pages
- [ ] hreflang/canonical/sitemap validated on key pages
- [ ] CMS smoke test: create draft → publish → build → live
- [ ] RSS feeds validate (notes, translations)
- [ ] OG image + JSON-LD `Person` verified (rich-results test)
- [ ] From-Iran sanity check over a VPN/proxy exit

---

## 9. Open Items (carried from PRD §15)

- Vector logo (or approval to trace the raster)
- Headshot photo
- Social URLs: X, Eitaa, LinkedIn, Telegram, Bear Blog
- Bio text EN + FA (draft together)
- Initial content: sample notes, notable translations + publication links, project list
  (inarobegir, sunclock, …) with one-liners
- Accent color pick (deep green vs indigo) during design pass
- Eitaa SVG license check
- Confirm Persian spelling of the legal name (حسین شیبه)
