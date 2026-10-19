All eight questions are done — that's everything I need. Here's the complete PRD, ready to save as **`docs/PRD.md`** in the project repo:

````markdown
# PRD — sheibah.ir · Personal Brand Site & Archive

**Owner:** Hosein Sheibah
**Status:** Final draft — approved for build
**Type:** Static, bilingual (EN/FA), personally maintained

---

## 1. Overview

sheibah.ir is the personal brand site and long-term archive of **Hosein Sheibah** (شیبه), covering three fields:

1. **Hawzah studies** — Islamic studies lesson notes and scholarly work
2. **Translation** — Persian→English translation of Islamic texts
3. **Code** — small independent projects (GitHub repo + live demo pattern)

The landing page's job is **"introduce + route"**: a strong hero with identity, then three cards (*Hawzah Studies / Translation / Code*) that let each visitor self-select their path. Behind the landing page, the site acts as the **canonical personal archive for everything he makes**, growing over time via a friendly admin UI.

---

## 2. Goals & Non-Goals

### Goals
- G1. Establish a credible personal brand across all three fields in both English and Persian.
- G2. Route visitors quickly: scholar-readers, potential translation clients, and developers each have an obvious path.
- G3. Serve as the permanent, canonical archive for all output (lesson notes, translations, projects).
- G4. Be publishable-by-owner: new content added via admin UI, no code touches required.
- G5. Fast, mobile-first, and reliable for visitors inside and outside Iran.

### Non-Goals (v1)
- No backend/database, no contact form, no comments.
- No on-site search (future).
- No newsletter, no user accounts, no multi-author CMS.
- No automatic geo-IP language switching (decided against — see §5).

---

## 3. Audiences

| Audience | Typical visitor | Path |
|---|---|---|
| Persian-speaking scholarly community | Hawzah students, teachers | Hawzah card → lesson notes archive |
| Translation clients & publishers | English-speaking editors, institutes | Translation card → samples + publication links → contact via Telegram/Eitaa |
| Developers & tinkerers | Indie web / OSS community | Code card → project cards → GitHub/live demos |
| General / link-in-bio visitors | Social media traffic | Links page + About |

---

## 4. Site Structure

| Route (EN) | Route (FA) | Purpose |
|---|---|---|
| `/` | `/fa/` | Landing: hero, three field cards, about teaser, social strip |
| `/about` | `/fa/about` | Bio, full name, headshot |
| `/notes` | `/fa/notes` | Hawzah lesson-notes archive (list, dated, tagged) |
| `/notes/[slug]` | `/fa/notes/[slug]` | Individual note (long-form, RTL) |
| `/translations` | `/fa/translations` | Translation archive (rich list: description, sample, publication links) |
| `/translations/[slug]` | `/fa/translations/[slug]` | Individual translation entry |
| `/projects` | `/fa/projects` | Code archive: project cards with repo + live-demo buttons (no detail pages in v1) |
| `/links` | `/fa/links` | campsite.bio-style social link pool (shareable) |

Cross-cutting: persistent header (logo + nav + language toggle), footer (small email mention, social icons, © line).

---

## 5. Internationalization & RTL

- **Bilingual EN/FA.** English at root `/`, Persian under `/fa/`.
- **Detection (Option B — browser language):** tiny inline script on root entry: if a saved preference exists (localStorage), honor it; else if `navigator.language` starts with `fa`, redirect `/` → `/fa/`. No geo-IP. (Chosen because VPN usage in Iran breaks IP detection and it keeps hosting pure-static.)
- **Manual toggle** (`EN | فا`) in header on every page. It navigates to the equivalent page in the other language when available (via alternates), else that language's home. Manual choice is saved and always wins over detection.
- Correct `<html lang>` and `dir="rtl"` on Persian pages; full layout mirroring.
- `<link rel="alternate" hreflang>` pairs on every page; both languages in `sitemap.xml`.
- Persian typography: **Vazirmatn** (OFL), self-hosted, `font-display: swap`.

---

## 6. Design Direction

- **Style: hybrid.** Modern minimal layout (generous whitespace, clean grid) with restrained traditional accents: a faint girih/eslimi geometric pattern in the hero background and subtle geometric dividers. Nothing ornate; the logo carries the traditional weight.
- **Logo:** monochrome calligraphic wordmark reading **شیبه**. Header pairs the mark with "Sheibah" in Latin type. Mark doubles as favicon; monochrome means CSS recoloring (incl. any future dark mode).
- **Accent color:** deep green or indigo (final pick in design pass, tested next to the black logo).
- **Typography (Latin):** clean sans (e.g., Inter) for UI; optional literary serif for scholarly headings — decide in design pass.
- **Mobile-first**, responsive; Persian traffic expected to be mostly mobile.
- **Optional (post-v1):** dark mode respecting `prefers-color-scheme`.

---

## 7. Content Model

Three content collections, stored as **markdown + front-matter in the repo**. UI strings (nav, buttons, section titles) live in EN/FA i18n dictionaries. Entries have a primary language; titles may carry per-language variants with fallback to the original.

### `notes` — Hawzah lesson notes
| Field | Notes |
|---|---|
| title / title_en | FA primary; EN optional |
| date | used for archive ordering |
| tags[] | subject areas |
| lang | default `fa` |
| summary | optional, for list cards |
| source_url | original Bear Blog URL (kept during migration) |
| body | long-form markdown, RTL |

### `translations` — Persian→English work
| Field | Notes |
|---|---|
| title_en / title_fa | |
| date | |
| source_work | original text/author (optional) |
| description_en / description_fa | 2–3 sentences |
| excerpt | optional sample (≤ ~300 words; full texts of published pieces stay with publishers — we link out) |
| links[] | `{label, url}` → places it's published |

### `projects` — code
| Field | Notes |
|---|---|
| name | |
| description_en / description_fa | 1–2 sentences |
| repo_url | GitHub |
| demo_url | live page (pattern: `mhsb.github.io/<name>`) |
| tags[] | tech |
| status | `active \| archived` |
| screenshot | optional |

**Card rule:** each landing card shows a 2–3 sentence description + up to three highlights; anything lacking public material gets a one-liner + contact CTA instead of filler.

---

## 8. Admin / Publishing (CMS)

- **Git-backed CMS** — preferred: **Sveltia CMS** (fallback: Decap). Owner gets a form-based web UI; publishes commit markdown to the repo.
- Auth via GitHub OAuth (OAuth app + a small Cloudflare Pages Function/Worker for the token exchange).
- Collections in the CMS mirror §7 (notes, translations, projects) + the bio/content data file.
- Editorial workflow optional; single-author site, direct commits are fine.

---

## 9. Bear Blog Migration

- Bear Blog is **not canonical**; sheibah.ir is. New lesson notes are published here only.
- **One-time import script** (`scripts/import-bear.mjs`, run locally, not part of the site): reads Bear Blog's markdown export, generates front-matter (title, date, tags, `source_url`), writes into `src/content/notes/`, skips already-imported slugs. Run whenever the owner chooses (post-launch is fine).
- After migration, Bear Blog becomes a stub pointing to sheibah.ir (owner's call).

---

## 10. Identity & Contact

- **Identity:** full name **Hosein Sheibah** displayed alongside the شیبه / Sheibah brand; logo in header, **headshot in About**.
- **Contact model: link pool** (campsite.bio-style) at `/links`, plus social icon strip in the footer: **X/Twitter, Eitaa, LinkedIn, GitHub (`mhsb`), Bear Blog (until migration)**.
- **Primary contact CTAs point to Telegram and/or Eitaa** (email is rarely used in Iran; it's demoted to a small footer mention).
- **Eitaa icon:** custom SVG sourced from svgrepo (`svgrepo.com/svg/329592/eitaa`) — ⚠️ verify license/attribution terms before shipping.

---

## 11. Tech Stack & Hosting

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Astro** (static) | Fast, content-collections fit the archive model, first-class i18n/RTL |
| Repo | GitHub, `mhsb` account | Owner already uses GitHub Pages projects |
| Hosting | **Cloudflare Pages** (free) | Auto-build on push, preview deploys, works from Iran (CF dashboard confirmed accessible) |
| CMS | Sveltia/Decap + OAuth function | §8 |
| Analytics | Cloudflare Web Analytics | Cookieless, free, no consent banner, Iran-friendly |
| RSS | `@astrojs/rss` for notes | Low cost, useful for scholars |

**DNS/domain:** domain registered at **iranserver**. Add site to Cloudflare, update nameservers at iranserver, attach custom domains `sheibah.ir` + `www` → Pages project.

**Build:** `npm run build` → `dist/`. Deploys on every push to main; PR previews enabled.

---

## 12. SEO & Metadata

- Title/description templates per page, in both languages.
- Open Graph + Twitter cards; og:image from logo/headshot.
- JSON-LD `Person` schema: name "Hosein Sheibah", alternateName "Sheibah"/"شیبه", `sameAs` → social profiles, GitHub.
- Canonical URLs, hreflang alternates, `sitemap.xml`, `robots.txt`.

## 13. Performance & Accessibility Budgets

- Lighthouse ≥ 95 (performance & accessibility), LCP < 2s on average mobile.
- Minimal JS (language-detection snippet only); self-hosted fonts with `swap`; optimized images via Astro.
- Semantic HTML, landmarks, alt text on logo/headshot/screenshots, visible focus states, contrast ≥ 4.5:1, aria-labels on icon links.

---

## 14. Roadmap

**Phase 1 — v1 launch**
1. Scaffold Astro repo; design tokens; header/footer.
2. Landing + About + Links pages; i18n + detection + toggle.
3. Three archive sections + initial content (see §15).
4. CMS wired with OAuth; owner can publish.
5. SEO, analytics, QA in both languages; DNS cutover → **launch on sheibah.ir**.

**Phase 2 — migration**
- Run Bear import script; review/fix imported notes; stub Bear Blog.

**Later / optional**
- Dark mode · on-site search · RSS→Telegram/Eitaa auto-announce · translation-portfolio expansion.

---

## 15. Assets & Info Needed from Owner (pre-build checklist)

- [ ] Logo as SVG or high-res original (attached file is raster; vector preferred for crisp header/favicon/og-image)
- [ ] Headshot photo
- [ ] Social URLs: X, Eitaa, LinkedIn, Telegram (public link?), Bear Blog URL
- [ ] Bio text EN + FA (draft together during content pass)
- [ ] Initial content: 1–3 sample lesson notes · 2–3 notable translations + publication links · full project list (inarobegir, sunclock, …) with one-line descriptions
- [ ] Accent color decision (deep green vs indigo) during design pass
- [ ] Eitaa SVG license check

---

## Appendix A — Decision Log

| # | Question | Decision |
|---|---|---|
| 1 | Primary goal | Introduce + route (hero + three cards) |
| 2 | Languages | Bilingual EN/FA |
| 3 | Language defaulting | Browser-language detection (Option B), no geo-IP; manual toggle, remembered |
| 4 | Visual direction | Hybrid: modern minimal + subtle Islamic geometric accents |
| 5 | Logo | Monochrome calligraphic شیبه wordmark; paired with "Sheibah" in Latin |
| 6 | Content depth | Honest & light: 2–3 sentence descriptions + up to 3 highlights per card |
| 7 | Archive strategy | Mixed (C): notes + translations + projects on-site; growth over time is a core requirement |
| 8 | Publishing | Git-backed CMS with admin UI (Sveltia/Decap) |
| 9 | Bear Blog | NOT canonical; full on-site archive (Option A); import deferred, script to be provided |
| 10 | Identity | Hosein Sheibah; headshot in About |
| 11 | Contact | Link pool (campsite.bio-style); Telegram/Eitaa primary; email in footer only |
| 12 | Stack | Astro + GitHub + Cloudflare Pages + Sveltia/Decap (owner delegated choice) |
| 13 | Domain | sheibah.ir at iranserver; DNS → Cloudflare |
````

**Before we can start building, the open items are exactly the checklist in §15** — most critically the social URLs, the bio (I'm happy to draft it with you), and initial content for the three archives. whenever you're ready, send those over and we move to the build phase.
