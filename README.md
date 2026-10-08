# DigiMarvel website (V3)

The marketing site for [digimarvel.ai](https://www.digimarvel.ai). It has six static pages built with plain HTML, CSS and JavaScript. There is no build step, framework, CDN or analytics. Every page loads only local files, so you can open the folder with any static file server and it runs. The one piece of server code is `api/contact.php`, a PHP script that sends Talk to us enquiries through [Resend](https://resend.com).

> **Status:** Not yet deployed.

## Recent changes — 8 Oct 2026

- **Positioning.** Copy follows the Positioning Foundation (8 Oct 2026). DigiMarvel is a Business Transformation & Intelligent Systems Studio that turns important processes into connected, agent-enabled workflows. The business platform (often Odoo) is the system of record, and AI agents are the system of action. The working product name Muse AI is deliberately kept off the public site until it is approved.
- **Homepage sequence.** Hero (**"Your ERP should not just record your business. It should help run it."**) → particle story in three steps: operational problem → **"One place. Every answer."** (system of record, Odoo) → **"Clean data in. Approved action out."** (system of action) → Staying in control (permissions, approval, exceptions, audit trail) → How we work → first offer (**"Start with one workflow."**). The story is built with `data-story.css` and `data-story.js`.
- **How we work.** Six stages (Discover, Establish, Stabilize, Enable, Prove, Evolve), shown 3×2 on desktop on a track that draws in on scroll. Each stage ends with an outcome.
- **Calls to action.** The hero, the homepage close and the Company page close say **"Discuss a workflow"**. The nav button still says "Talk to us", the name of the contact page.
- **Talk to us.** The contact page is now one focused form with the contact details alongside it. Messages are sent through Resend by `api/contact.php` (see `docs/deployment.md` for setup). Every nav and call-to-action button that said "Discuss a project" now says "Talk to us".
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
| `index.html` | Home | Text hero over a star field, three-step particle story (problem → system of record → system of action), Staying in control, the six-stage How we work process and the first-offer close |
| `about.html` | Company | Mission and operating principles |
| `contact.html` | Talk to us | Labelled form (name, organization, email, interest, subject, message). Interest options must match `TOPICS` in `api/contact.php` beside the contact details. It posts to `api/contact.php`, which sends the message through Resend. Nothing is stored on the server |
| `odoo.html` | Workflow modernization (Odoo) | Text hero, workflow explorer, FAQ, downloadable project brief and a scroll-driven particle layer. The main nav and footer link to it as "Workflow modernization". Home links to it from the hero and the particle story |
| `privacy.html` | Privacy Policy | Placeholder text that needs legal review |
| `terms.html` | Terms of Use | Placeholder text that needs legal review |

`services.html` (Capabilities) and `solutions.html` (Solutions) no longer exist. No page, nav, footer or `sitemap.xml` links to them.

## Project structure

```
.
├── *.html                 Six pages. Each one contains its own copy of the header and footer
├── api/contact.php        Talk to us form handler (PHP → Resend). Reads its key from digimarvel-config.php outside the web root
├── digimarvel-config.example.php  Template for that config file (do not upload)
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

All enquiries go to **support@digimarvel.ai**. The address is hard-coded in every page footer, the Talk to us page, `digimarvel-config.php` (the Resend `to` address), the JSON-LD block on five of the pages (every page except Odoo), and the brief text in `assets/odoo.js`. If it changes, search the whole project for it and replace every occurrence.
