# Linux Bytes — Book Edition

## Contents

| File | Description |
|---|---|
| `linux-bytes-book.pdf` | Complete book (A4, 30 chapters, 126 code examples, 5 diagrams) |
| `linux-bytes-book.html` | Source HTML (for EPUB conversion or custom printing) |
| `generate-book.mjs` | Node.js script that generates the HTML + PDF from content JSON |

## Regenerate

```bash
npm run build:book
```

Requires Node.js 20+ and `puppeteer` (installed automatically with `npm install` from the project root).

## Format

- **Page**: A4 (210 × 297 mm)
- **Font**: Ubuntu (body) + Ubuntu Mono (code)
- **Parts**: 4 parts with 30 chapters total
- **Features**: Cover page, title page, table of contents, part dividers, chapter headers, code blocks with syntax formatting, inline SVG diagrams, callout boxes, index
