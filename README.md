# DigiMarvel website (V3)

The marketing site for [digimarvel.ai](https://www.digimarvel.ai). It has six static pages built with plain HTML, CSS and JavaScript. There is no build step, framework, CDN, analytics or backend. Every page loads only local files, so you can open the folder with any static file server and it runs.

> **Status:** Not yet deployed.

## Recent changes — 8 Oct 2026

- **Positioning.** DigiMarvel is presented as a Business Transformation & Intelligent Systems Studio that helps growing businesses redesign how they operate and implement connected systems that make those operations simpler, more efficient and scalable. Odoo remains a core implementation platform.
- **Homepage story.** A scroll-driven particle story runs in three steps: **"Scattered data tells half the story."** → **"One place. Every answer."** (Odoo) → **"Clean data in. Real intelligence out."** (AI). It is built with `data-story.css` and `data-story.js`.
- **How we work.** A four-step process (Understand, Establish, Stabilize, Evolve) on a track that draws in on scroll. Each step ends with an outcome.
- **Odoo page.** It has its own link in the main nav and footer. The separate Workflow Modernization block on the homepage was removed.

## Quick start

```bash
python3 -m http.server 8763 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8763/index.html>. Use a local server rather than opening files with `file://`, so that paths, fonts and the web manifest behave the same way they will in production.

Safari in particular keeps serving cached CSS from `http.server`. To always see your latest edits, use the no-cache server instead:

```bash
python3 .claude/serve.py 8083
```

## Pages

| File | Page | Notes |
| --- | --- | --- |
| `index.html` | Home | Text hero over a star field, three-step particle story (scattered data → Odoo → AI), the How we work process and the closing call to action |
| `about.html` | Company | Mission and operating principles |
| `contact.html` | Contact | `mailto:` form. No data is sent to a server |
| `odoo.html` | Workflow modernization (Odoo) | Text hero, workflow explorer, FAQ, downloadable project brief and a scroll-driven particle layer. The main nav and footer link to it as "Workflow modernization". Home links to it from the hero and the particle story |
| `privacy.html` | Privacy Policy | Placeholder text that needs legal review |
| `terms.html` | Terms of Use | Placeholder text that needs legal review |

`services.html` (Capabilities) and `solutions.html` (Solutions) no longer exist. No page, nav, footer or `sitemap.xml` links to them.

## Project structure

```
.
├── *.html                 Six pages. Each one contains its own copy of the header and footer
├── assets/
│   ├── tokens.css         Design tokens (colors, type, spacing). Copied unchanged from the oo design system
│   ├── base.css           Fonts, typography, buttons, forms, header, footer
│   ├── site.css           Page layouts, ruled lists, diagrams
│   ├── odoo.css           Odoo page only
│   ├── site.js            Mobile menu, scroll-reveal, copyright year (every page)
│   ├── constellation.js   Old hero ring animation. No page loads it
│   ├── data-story.css     Homepage narrative layout using the existing tokens
│   ├── data-story.js      Scroll-linked records / Odoo / AI particle shapes
│   ├── hero-stars.js      Homepage hero star field that hands its particles to the story
│   ├── journey.js         Scroll-driven particle layer (Odoo only)
│   ├── odoo.js            Workflow tabs and project-brief dialog (Odoo only)
│   ├── inter-*.ttf        Self-hosted Inter, weights 200/400/500/600 (OFL.txt is the license)
│   ├── favicon.svg        Star mark
│   └── og-card.svg        Social sharing image
├── robots.txt, sitemap.xml, site.webmanifest
├── .hallmark/             Design-review log (do not upload)
└── .claude/               Local preview config and no-cache server (do not upload)
```

## Documentation

Detailed project documentation (editing recipes, architecture, deployment steps, content guidelines) and QA screenshots are kept in local `docs/` and `verification/` folders. They are not part of this repository.

When you change a file in `assets/`, give its `?v=` query a new value on every page that loads it. Hostinger caches assets for seven days, so upload `assets/` before the HTML.

## Contact address

All enquiries go to **support@digimarvel.ai**. The address is hard-coded in every page footer, the Contact form, the JSON-LD block on five of the pages (every page except Odoo), and the brief text in `assets/odoo.js`. If it changes, search the whole project for it and replace every occurrence.
