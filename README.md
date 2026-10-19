# sheibah.ir — skeleton

Minimal Astro 5 skeleton for the personal site & archive of Hosein Sheibah (شیبه).

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview
```

## Structure

- `src/pages/` — EN pages (default locale, no prefix); `src/pages/fa/` — Persian mirror (`/fa/...`)
- `src/layouts/Base.astro` — base layout (title / lang / dir)
- `src/styles/tokens.css` — design tokens (colors, fonts)
- `src/styles/global.css` — reset + font setup (Vazirmatn / Inter)
- `src/content/` — content collections: `notes/`, `translations/`, `projects/`, `site/` (placeholders)
- `public/uploads/` — CMS media target

See `docs/PRD.md` and `docs/TECH.md` for the full specification.
