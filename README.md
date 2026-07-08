# linux bytes

Linux study notes, command references, system administration guides, and FAANG interview prep — from a Staff+ Architect's perspective.

**Current stats:** 2 HTML pages, 25 JSON content files, search + progress tracking.

## Features

- **Search-first** — Ctrl+K (or Cmd+K) opens a fuzzy search modal that indexes every guide. Results filter live as you type.
- **Dark/light mode** — Persistent theme toggle with OS preference detection.
- **Study progress** — Track completion of each guide with local persistence.
- **Bookmarks** — Pin your favorite guides for quick access.
- **Reading time & difficulty** — Each guide shows estimated reading time and difficulty level (Foundational → Advanced/Staff+).
- **Related guides** — Smart suggestions based on tag overlap.
- **Print-friendly** — Print button strips dark mode for clean output.
- **Copy-to-clipboard** — One-click code block copying with syntax highlighting via Prism.js.
- **Responsive** — Three-column layout on desktop, collapses to single column on mobile.

## Quick Start

```bash
npm install
npm run build        # Regenerates js/generated.js from content/ JSON files
npm run validate     # Validates all content files, links, and tag taxonomy
```

Open `docs.html` in your browser (no server needed).

## Project Structure

```
├── index.html          # Landing page
├── docs.html           # Documentation portal (three-column layout)
├── css/
│   ├── tailwind.css    # Pre-built Tailwind utility classes
│   └── main.css        # Custom styles
├── js/
│   ├── theme.js        # Dark/light mode
│   ├── loader.js       # Dynamic content loader (fetches JSON, renders HTML)
│   ├── generated.js    # Auto-generated route map + search index
│   └── modals.js       # Search modal, share modal
├── content/
│   └── linux/
│       ├── foundations/ # Phase 1: Linux Fundamentals
│       ├── systems/     # Phase 2: Systems & Operations
│       ├── advanced/    # Phase 3: Advanced Linux
│       └── sre/         # Phase 4: Containers, SRE & Interview Prep
├── scripts/
│   ├── build.mjs       # Scans content/ and generates generated.js + sitemap.xml
│   └── validate.mjs    # Validates JSON, cross-references, and tag taxonomy
└── assets/             # Favicons, logo, OG preview image
```

## Adding Content

1. Create a JSON file in the appropriate `content/linux/*/` subdirectory
2. Run `npm run build` to regenerate the route map and search index
3. Open `docs.html` to verify

See existing JSON files for the schema reference.

## License

MIT License — see [LICENSE](LICENSE).
