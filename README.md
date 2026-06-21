# Quick Bytes

A modern, search-first documentation portal for developer study notes, cheat sheets, and interactive visual guides — built as a static site for GitHub Pages.

**Current stats:** 6 HTML pages, 21 JSON content files (6 python/basics, 2 python, 2 programming, 3 interactive, 8 genai), 16 search entries, 16 route map entries, ~1.8K JS lines, ~474 CSS lines.

## Features

- **Search-first** — Ctrl+K (or Cmd+K) opens a fuzzy search modal that indexes every page and guide. Results filter live as you type.
- **Dark/light mode** — Persistent theme toggle with OS preference detection. Dark mode uses Tailwind's `class` strategy with `localStorage` persistence.
- **Interactive animations** — Three visual guides (Compiler, Interpreter, GIL) with scene-based slides, auto-play, keyboard navigation, and fullscreen mode.
- **Dynamic content** — 20+ reference pages (Python, Gen AI, System Internals) with Prism syntax highlighting, animated code blocks, and staggered entrance animations.
- **Collapsible sidebar** — Navigation sections close by default; parent section auto-opens when navigating to a page.
- **Share on every page** — Share button opens a modal with URL copy + Twitter/X, LinkedIn, WhatsApp, and Email share options.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `index.html` | Hero search bar, feature cards linking to docs categories |
| Docs Portal | `docs.html` | Sidebar navigation, dynamic content loader, right-hand outline |
| Compiler | `compiler.html` | 9-scene interactive on how compilers work |
| Interpreter | `interpreter.html` | 10-scene interactive on how interpreters work |
| GIL | `gil.html` | 10-scene interactive on Python's Global Interpreter Lock |
| Concurrency Visualizer | `concurrency.html` | Interactive Python concurrency model comparison |

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Ctrl+K` / `Cmd+K` | Anywhere | Open/close search modal |
| `Escape` | Modal | Close share or search modal |
| `ArrowLeft` | Animation page | Previous scene |
| `ArrowRight` | Animation page | Next scene |
| `Space` | Animation page | Play/pause auto-advance |
| `F` | Animation page | Toggle fullscreen |

## Theme

`js/theme.js` runs synchronously in the `<head>` to prevent a flash of wrong theme.

1. Checks `localStorage` for a saved `theme` value (`"dark"` / `"light"`).
2. If no saved value, checks `prefers-color-scheme` media query.
3. Applies or removes `class="dark"` on `<html>`.
4. All `localStorage` access is wrapped in try-catch for private browsing compatibility.

Both `css/main.css` (custom styles) and `css/tailwind.css` (pre-built Tailwind) use `.dark` ancestor selectors for dark mode variants.

## Interactive Animations

Each animation page (`compiler.html`, `interpreter.html`, `gil.html`) uses `js/animation-core.js` as a shared module.

- Scene data (titles, subtitles, labels) is fetched from `content/interactive/*.json`.
- Scene tags are `<button type="button" role="tab" aria-selected="...">` inside a `role="tablist"` group.
- `animation-core.js` manages scene transitions, progress bar, auto-play timer, keyboard nav, and `aria-selected` state.
- Each page provides an `onSceneAnimation` callback for scene-specific DOM manipulation.

### Fullscreen

Pressing `F` or clicking the fullscreen button requests fullscreen on the `#fullscreen-canvas` element. In fullscreen mode:

- The canvas fills the viewport (`100vw × 100vh`).
- Content scales via a `.fullscreen-stage` wrapper that letterboxes the 16:9 aspect ratio.
- `#fullscreen-canvas:fullscreen` removes padding, border, and border-radius.

## Tech Stack

- **HTML** — 6 static pages (incl. Concurrency Visualizer), semantic HTML5, ARIA roles
- **CSS** — Tailwind CSS v3 (static build) + custom `css/main.css`
- **JavaScript** — Vanilla JS (no transpilation step)
- **Icons** — Material Symbols Outlined (Google Fonts CDN)
- **Fonts** — Ubuntu (body) + JetBrains Mono (code) via Google Fonts
- **Brand** — Ubuntu Orange (#E95420)

## Architecture Optimizations

The codebase follows several best practices for a static site without a build step:

- **DRY modals** — Share and search modals are injected dynamically by `js/modals.js`, eliminating 5 identical copies of share modal HTML and 2 copies of search modal HTML across pages.
- **Consolidated CSS** — All player-page inline styles (compiler, interpreter, GIL) moved into `css/main.css` with shared rules deduplicated. Only page-specific body colors remain inline.
- **Event delegation** — `modals.js` uses delegated click handlers on `document` instead of binding to individual elements, reducing memory usage and ensuring dynamically added elements work.
- **CSS variables for theming** — GIL page uses CSS custom properties (`--gil-*`) for light/dark mode, avoiding class-based overrides.
- **10% global scale** — `html { font-size: 14.4px }` scales all rem-based Tailwind values proportionally with a single CSS line.
- **Reduced motion respected** — `@media (prefers-reduced-motion: reduce)` disables all animations/transitions.
- **Prism syntax highlighting** — CDN-loaded with custom token color overrides in main.css to match the brand palette.

## Project Structure

```
├── index.html              Landing page
├── docs.html               Documentation portal with dynamic loader
├── compiler.html           Compiler animation page
├── interpreter.html        Interpreter animation page
├── gil.html                GIL animation page
├── css/
│   ├── main.css            All custom styles (player animations, timeline, Prism overrides, GIL vars)
│   ├── tailwind.css        Pre-built Tailwind CSS (43 KB, minified)
│   └── input.css           Tailwind source with @tailwind directives
├── js/
│   ├── theme.js            Dark/light mode toggle with localStorage
│   ├── modals.js           Share + search modals (HTML injection and event handling)
│   ├── loader.js           Dynamic content loader for docs.html
│   └── animation-core.js   Shared animation player (scenes, fullscreen, keyboard)
├── content/
│   ├── python/             Python content (history + 6 basics pages)
│   ├── programming/        Programming concept content
│   ├── genai/              Gen AI study guides (8 pages: LLM, KV Cache, RAG, fine-tuning, prompt/context/harness/loop engineering)
│   └── interactive/        Animation scene data (JSON)
├── assets/
│   └── logo.svg            Minified Circle of Knowledge logo (557 B)
├── tailwind.config.js      Unified Tailwind configuration
├── package.json            npm scripts (build:css, watch:css)
└── package-lock.json       Dependency lockfile
```

## Building CSS Locally

```bash
# Install dependencies
npm install

# Build Tailwind CSS
npm run build:css

# Watch for changes during development
npm run watch:css
```

The `tailwind.config.js` merges all custom colors (brand orange, accent palette, ink/charcoal, GIL-specific colors) and font families from across the project into a single config.

## Content Format

Content pages are JSON files loaded dynamically by `js/loader.js`. Each file has:

```json
{
  "id": "python-history",
  "title": "History of Python",
  "category": "Python",
  "subcategory": "History",
  "description": "A brief overview...",
  "codeBlock": "A code snippet...",
  "details": "Deep dive explanation...",
  "language": "python",
  "timeline": [
    { "year": "1989", "event": "Work on Python begins" },
    { "year": "1991", "event": "Python 0.9.0 released" }
  ]
}
```

- `codeBlock` is rendered in a syntax block with a copy button.
- `language` drives the Prism.js syntax highlighting class (e.g., `language-python`).
- `timeline` (optional) renders an animated alternating timeline instead of a code block.
- `details` is rendered in a "Deep Dive" info box with a left accent bar.

Routes map hash anchors to JSON paths in `js/loader.js`. The default route (when no hash is present) falls back to `#python-history`.

## Search

The search modal (`Ctrl+K` / `Cmd+K`) performs live fuzzy filtering across a static JSON index defined in `js/modals.js`.

- Every result is an `<a>` element with `role="option"` inside a `role="listbox"` container.
- The empty state uses `role="status"` with `aria-live="polite"` for screen-reader announcements.
- Results show the category label + title with a hover arrow animation.
- Clicking a result navigates to `docs.html#<anchor>` and closes the modal.

The search index contains:
- **Python** — History of Python
- **Python Basics** — Data Types, Loops, I/O, Data Structures, File Handling, API Handling, Time & Space Complexity, Algorithms & Patterns, OOP & Design Patterns
- **System Internals** — GIL, Compiler, Interpreter
- **Gen AI** — What is an LLM?, KV Cache, RAG, Fine-Tuning & PEFT, Prompt Engineering, Context Engineering, Harness Engineering, Loop Engineering

## Accessibility

- **Skip-to-content** link is the first focusable element on every page (visually hidden until focused via Tab).
- **`main`** elements have `id="main-content"` as skip targets.
- **Scene tags** use `<button role="tab" aria-selected="">` with a parent `role="tablist"`.
- **Modals** use `role="dialog"`, `aria-modal="true"`, `aria-label`.
- **Search results** use `role="listbox"` / `role="option"`.
- **Empty search** uses `role="status"` with `aria-live="polite"`.
- **Iframe** embeds have descriptive `title` attributes.
- **Reduced motion** is respected via `prefers-reduced-motion` media query.

## SEO

Every page includes Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`) meta tags. The shared image is `/assets/logo.svg`.

## Adding a New Guide

1. Create a JSON file in `content/<category>/<guide-name>.json`.
2. Add the hash route to `js/loader.js` (`routeMap`).
3. Add a search entry to `js/modals.js` (`searchIndex` array).
4. Add a sidebar link in `docs.html`.
5. Optionally add a feature card in `index.html`.
6. Rebuild CSS if new Tailwind utility classes are used: `npm run build:css`.

## License

MIT
