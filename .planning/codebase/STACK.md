# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- JavaScript (ES6+) - application logic in `index.html`, `js/exercises.js`, `js/i18n.js`, `sw.js`, `serve.js`
- HTML5 - UI shell and most app structure in `index.html`, onboarding in `INSTALL_GUIDE.html`

**Secondary:**
- CSS3 - full styling system in `css/main.css`
- JSON - PWA manifest and local app config in `manifest.json`, `.claude/settings.local.json`

## Runtime

**Environment:**
- Browser runtime (PWA) for production app in `index.html`
- Node.js runtime for local dev server in `serve.js`

**Package Manager:**
- Not detected (no `package.json`)
- Lockfile: missing

## Frameworks

**Core:**
- Vanilla JavaScript DOM app (no React/Vue/Svelte) in `index.html`
- Service Worker API for offline cache in `sw.js`

**Testing:**
- Not detected

**Build/Dev:**
- No bundler/build pipeline detected (direct static files served from root)
- Lightweight custom dev server in `serve.js` (port 8765)

## Key Dependencies

**Critical:**
- Chart.js 4.4.0 via CDN for analytics charts in `index.html` (script tag in head)
- Google Fonts CDN for typography in `index.html`

**Infrastructure:**
- Browser `localStorage` as primary persistence in `index.html`
- Browser IndexedDB write-through backup layer `_idb` in `index.html`

## Configuration

**Environment:**
- Runtime settings persisted in `localStorage` keys like `forge_settings`, `forge_theme`, `forge_profile` in `index.html`
- PWA metadata and icons configured in `manifest.json`

**Build:**
- No transpiler config detected (`tsconfig`, bundler config, lint config absent)
- Service worker cache version controlled by `CACHE_NAME` in `sw.js`

## Platform Requirements

**Development:**
- Any modern browser + optional local Node.js for `serve.js`
- Local files can run, but SW registration is best via `http://localhost:8765` from `serve.js`

**Production:**
- Static hosting (GitHub Pages/Netlify/Vercel/static server) with HTTPS for full PWA installability

---

*Stack analysis: 2026-03-09*
