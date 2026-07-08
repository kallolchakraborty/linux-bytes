import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(__dirname);

// ─── Content ordering ───
const PHASES = [
  {
    label: 'Part I: Foundations',
    dir: 'content/linux/foundations',
    desc: 'The essential Linux foundations every engineer must know: the filesystem hierarchy, permissions, CLI basics, shell scripting, text processing, and version control with Git.',
    files: [
      'linux-history.json', 'linux-filesystem.json', 'linux-permissions.json',
      'linux-cli-basics.json', 'linux-shell-basics.json', 'linux-text-processing.json',
      'linux-git.json'
    ]
  },
  {
    label: 'Part II: Systems & Operations',
    dir: 'content/linux/systems',
    desc: 'Systems operations for production environments: process management, package management, systemd, user administration, SSH, networking, storage, and security hardening.',
    files: [
      'linux-processes.json', 'linux-package-mgmt.json', 'linux-systemd.json',
      'linux-users.json', 'linux-ssh.json', 'linux-networking.json',
      'linux-storage.json'
    ]
  },
  {
    label: 'Part III: Advanced Topics',
    dir: 'content/linux/advanced',
    desc: 'Deep dives into the Linux kernel, memory management, I/O stack, performance tuning, eBPF, observability, GPU computing, and build toolchains.',
    files: [
      'linux-kernel.json', 'linux-memory.json', 'linux-io.json',
      'linux-perf.json', 'linux-bpf.json', 'linux-monitoring.json',
      'linux-gpu-computing.json', 'linux-build-toolchain.json'
    ]
  },
  {
    label: 'Part IV: Containers & SRE',
    dir: 'content/linux/sre',
    desc: 'Container internals (cgroups & namespaces), Docker, Kubernetes for Linux engineers, production troubleshooting, system recovery, security hardening, FAANG-scale operations, and interview preparation.',
    files: [
      'linux-cgroups.json', 'linux-docker.json', 'linux-kubernetes.json',
      'linux-troubleshooting.json', 'linux-system-rescue.json',
      'linux-security.json', 'linux-faang-scale.json', 'linux-interview-qs.json'
    ]
  }
];

const SVG_CACHE = {};

function readSVG(filePath) {
  if (SVG_CACHE[filePath]) return SVG_CACHE[filePath];
  try {
    const content = readFileSync(resolve(ROOT, filePath), 'utf-8');
    SVG_CACHE[filePath] = content;
    return content;
  } catch {
    return '';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCodeBlock(code) {
  if (!code || !code.trim()) return '';
  // Wrap long lines
  const lines = code.split('\n').map(l => {
    if (l.length > 90) {
      const indent = l.match(/^\s*/)[0];
      const wrapped = [];
      let remaining = l.trim();
      while (remaining.length > 90) {
        let breakAt = remaining.lastIndexOf(' ', 90);
        if (breakAt < 0) breakAt = 90;
        wrapped.push(remaining.slice(0, breakAt));
        remaining = indent + remaining.slice(breakAt).trim();
      }
      wrapped.push(remaining);
      return wrapped.join('\n');
    }
    return l;
  }).join('\n');
  return `<pre><code>${escapeHtml(lines)}</code></pre>`;
}

function renderSectionContent(desc) {
  if (!desc) return '';
  // Replace inline SVG references with actual SVGs
  let html = desc;
  // Handle inline SVG objects embedded in the description
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  html = html.replace(svgRegex, (match) => {
    return `<div class="figure">${match}</div>`;
  });
  // Escape HTML tags that aren't SVG or standard HTML
  // (the descriptions contain HTML already, so we allow it through)
  return html;
}

function loadContent(filePath) {
  const fullPath = resolve(ROOT, filePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

// ─── Generate HTML Book ───
function generateBookHTML() {
  const parts = [];
  let chapterNum = 0;

  for (const phase of PHASES) {
    const chapters = [];
    for (const file of phase.files) {
      chapterNum++;
      const data = loadContent(`${phase.dir}/${file}`);
      const sections = data.sections || [];
      
      let sectionsHtml = '';
      for (const sec of sections) {
        const secTitle = sec.title ? `<h3 id="${escapeHtml(data.id)}-${escapeHtml(sec.title.toLowerCase().replace(/\s+/g, '-'))}">${escapeHtml(sec.title)}</h3>` : '';
        const secDesc = sec.description ? `<div class="section-body">${renderSectionContent(sec.description)}</div>` : '';
        const secCode = renderCodeBlock(sec.codeBlock);
        if (secTitle || secDesc || secCode) {
          sectionsHtml += `<section class="subsection">${secTitle}${secDesc}${secCode}</section>`;
        }
      }

      // Details block
      const detailsHtml = data.details ? `<div class="detail-box">${renderSectionContent(data.details)}</div>` : '';

      chapters.push({
        num: chapterNum,
        id: data.id,
        title: data.title,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        tags: data.tags || [],
        sectionsHtml,
        detailsHtml
      });
    }

    parts.push({ label: phase.label, chapters });
  }

  // ── Build HTML ──
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Linux Bytes — The Complete Guide</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

@page {
  size: 6.14in 9.21in;
  margin: 1.2in 1in 1.2in 1in;
  @top-left {
    content: '';
    font-family: 'Ubuntu', sans-serif;
    font-size: 8pt;
    color: #94a3b8;
    margin-bottom: 0.2in;
  }
  @top-right {
    content: counter(page);
    font-family: 'Ubuntu', sans-serif;
    font-size: 8pt;
    color: #94a3b8;
    margin-bottom: 0.2in;
  }
  @bottom-center {
    content: counter(page);
    font-family: 'Ubuntu', sans-serif;
    font-size: 8pt;
    color: #64748b;
  }
}

@page:first {
  @bottom-center { content: none; }
}

@page part-page {
  @bottom-center { content: none; }
  @top-left { content: none; }
  @top-right { content: none; }
}

body {
  font-family: 'Ubuntu', sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #1e293b;
  orphans: 3;
  widows: 3;
}

/* ── Cover Page ── */
.cover-page {
  page: cover;
  break-after: page;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  position: relative;
}
.cover-page::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6pt;
  background: linear-gradient(90deg, #FF8A65, #E95420, #BF360C);
}
.cover-page .accent-line {
  width: 60pt;
  height: 2pt;
  background: #E95420;
  margin: 20pt auto;
}
.cover-page h1 {
  font-size: 32pt;
  font-weight: 700;
  color: #E95420;
  letter-spacing: -0.03em;
  margin-bottom: 4pt;
}
.cover-page .subtitle {
  font-size: 14pt;
  font-weight: 300;
  color: #475569;
  margin-bottom: 24pt;
}
.cover-page .byline {
  font-size: 10pt;
  color: #94a3b8;
  margin-top: 16pt;
}
.cover-page .edition {
  font-size: 9pt;
  color: #94a3b8;
  margin-top: 24pt;
}
.cover-page .tagline {
  font-size: 8pt;
  color: #cbd5e1;
  margin-top: 36pt;
  max-width: 300pt;
}

/* ── Title Page ── */
.title-page {
  break-after: page;
  text-align: center;
  padding-top: 120pt;
}
.title-page h1 {
  font-size: 28pt;
  font-weight: 700;
  color: #E95420;
  letter-spacing: -0.03em;
  margin-bottom: 8pt;
}
.title-page .divider {
  width: 40pt;
  height: 1.5pt;
  background: #E95420;
  margin: 16pt auto;
}
.title-page .author {
  font-size: 11pt;
  color: #475569;
  margin-bottom: 4pt;
}

/* ── Copyright ── */
.copyright-page {
  break-after: page;
  font-size: 8.5pt;
  color: #64748b;
  line-height: 1.6;
  padding-top: 60pt;
}
.copyright-page p { margin-bottom: 8pt; }

/* ── Table of Contents ── */
.toc-page {
  break-after: page;
}
.toc-page h2 {
  font-size: 18pt;
  font-weight: 500;
  color: #E95420;
  margin-bottom: 20pt;
  letter-spacing: 0.02em;
}
.toc-part {
  font-size: 11pt;
  font-weight: 600;
  color: #1e293b;
  margin-top: 14pt;
  margin-bottom: 6pt;
  padding-bottom: 4pt;
  border-bottom: 1px solid #e2e8f0;
}
.toc-part span {
  color: #E95420;
  margin-right: 6pt;
}
.toc-chapter {
  font-size: 9.5pt;
  color: #475569;
  padding-left: 16pt;
  margin-bottom: 3pt;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.toc-chapter .num {
  color: #94a3b8;
  width: 24pt;
  display: inline-block;
}
.toc-chapter .title {
  flex: 0 1 auto;
  max-width: 70%;
}
.toc-chapter .dots {
  flex: 1;
  margin: 0 6pt;
  border-bottom: 1px dotted #cbd5e1;
  height: 1em;
}
.toc-chapter .page {
  color: #94a3b8;
  font-family: 'Ubuntu Mono', monospace;
  font-size: 8.5pt;
}

/* ── Part Page ── */
.part-page {
  page: part-page;
  break-after: page;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80vh;
  text-align: center;
}
.part-page .part-num {
  font-size: 10pt;
  font-weight: 600;
  color: #E95420;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 12pt;
}
.part-page .part-title {
  font-size: 22pt;
  font-weight: 300;
  color: #1e293b;
}
.part-page .part-divider {
  width: 40pt;
  height: 1.5pt;
  background: #E95420;
  margin: 16pt auto;
}
.part-page .part-desc {
  font-size: 9pt;
  color: #94a3b8;
  max-width: 280pt;
}

/* ── Chapter ── */
.chapter {
  break-before: page;
  margin-top: 0;
}
.chapter-header {
  margin-bottom: 18pt;
  padding-bottom: 12pt;
  border-bottom: 2px solid #E95420;
}
.chapter-number {
  font-size: 9pt;
  font-weight: 600;
  color: #E95420;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4pt;
}
.chapter-header h2 {
  font-size: 18pt;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.chapter-meta {
  font-size: 8pt;
  color: #94a3b8;
  margin-top: 6pt;
}
.chapter-desc {
  font-size: 10pt;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 14pt;
}

/* ── Subsections ── */
.subsection {
  margin-bottom: 14pt;
}
.subsection h3 {
  font-size: 13pt;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6pt;
  margin-top: 14pt;
  padding-top: 6pt;
}
.subsection .section-body {
  font-size: 10pt;
  color: #334155;
  line-height: 1.65;
}
.subsection .section-body p {
  margin-bottom: 6pt;
}
.subsection .section-body strong {
  color: #E95420;
}
.subsection .section-body code {
  font-family: 'Ubuntu Mono', monospace;
  font-size: 8.5pt;
  background: #f1f5f9;
  padding: 1pt 4pt;
  border-radius: 3pt;
  color: #E95420;
}

/* ── Code Blocks ── */
pre {
  font-family: 'Ubuntu Mono', monospace;
  font-size: 8pt;
  line-height: 1.45;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #E95420;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin: 8pt 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1e293b;
}
pre code {
  font-family: inherit;
  font-size: inherit;
  background: none !important;
  color: inherit !important;
  padding: 0 !important;
}

/* ── Detail Boxes ── */
.detail-box {
  background: rgba(233, 84, 32, 0.04);
  border-left: 3pt solid #E95420;
  border-radius: 4pt;
  padding: 10pt 14pt;
  margin: 14pt 0;
  font-size: 9.5pt;
  color: #475569;
  line-height: 1.55;
  break-inside: avoid;
}
.detail-box strong {
  color: #E95420;
}
.detail-box p {
  margin-bottom: 4pt;
}
.detail-box p:last-child {
  margin-bottom: 0;
}

/* ── Figures (SVG diagrams) ── */
.figure {
  margin: 12pt auto;
  text-align: center;
  break-inside: avoid;
  max-width: 100%;
}
.figure svg {
  max-width: 100%;
  height: auto;
  border-radius: 4pt;
  border: 1px solid #e2e8f0;
  background: #0f172a;
}

/* ── Lists ── */
.section-body ul, .section-body ol {
  padding-left: 20pt;
  margin: 6pt 0;
}
.section-body li {
  margin-bottom: 3pt;
}

/* ── Links ── */
.subsection a {
  color: #E95420;
  text-decoration: none;
}

/* ── Tags ── */
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4pt;
  margin: 8pt 0;
}
.tag {
  font-size: 7.5pt;
  font-weight: 600;
  color: #E95420;
  background: rgba(233, 84, 32, 0.08);
  padding: 1pt 6pt;
  border-radius: 3pt;
  letter-spacing: 0.03em;
}

/* ── Lists inside section body ── */
.section-body ul li, .section-body ol li {
  margin-bottom: 2pt;
}

/* ── FAANG Q&A styling ── */
.section-body br + br + strong:first-child {
  color: #E95420;
}

/* ── Table styling ── */
.section-body table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin: 8pt 0;
}
.section-body th, .section-body td {
  border: 1px solid #e2e8f0;
  padding: 4pt 8pt;
  text-align: left;
}
.section-body th {
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}

/* ── Index placeholder ── */
.index-page {
  break-before: page;
}
.index-page h2 {
  font-size: 18pt;
  font-weight: 500;
  color: #E95420;
  margin-bottom: 16pt;
}

/* ── Anchor styles for svg text ── */
svg text { font-family: 'Ubuntu', sans-serif !important; }
</style>
</head>
<body>

<!-- ═══ COVER ═══ -->
<div class="cover-page">
  <div class="accent-line"></div>
  <h1>linux bytes</h1>
  <p class="subtitle">The Complete Guide to Linux System Administration,<br>DevOps, SRE &amp; FAANG Interview Preparation</p>
  <div class="accent-line"></div>
  <p class="byline">By Kallol Chakraborty</p>
  <p class="edition">First Edition — July 2026</p>
  <p class="tagline">30 Topics Across 4 Phases · 200+ Code Examples · 5 Animated Diagrams</p>
</div>

<!-- ═══ TITLE PAGE ═══ -->
<div class="title-page">
  <h1>linux bytes</h1>
  <div class="divider"></div>
  <p class="author">Kallol Chakraborty</p>
  <p style="font-size:9pt;color:#94a3b8;margin-top:24pt;">Linux System Administration · DevOps · SRE · Cloud Infrastructure</p>
  <p style="font-size:8pt;color:#cbd5e1;margin-top:60pt;">Staff+ Architect's Perspective · FAANG Interview Preparation</p>
</div>

<!-- ═══ COPYRIGHT ═══ -->
<div class="copyright-page">
  <p><strong>Linux Bytes — The Complete Guide</strong></p>
  <p>First Edition: July 2026</p>
  <p>&copy; 2026 Kallol Chakraborty. All rights reserved.</p>
  <p style="margin-top:16pt;">No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.</p>
  <p style="margin-top:16pt;">Linux&reg; is the registered trademark of Linus Torvalds in the U.S. and other countries. All other trademarks are the property of their respective owners.</p>
  <p style="margin-top:16pt;">The information in this book is distributed on an "as is" basis, without warranty. While every precaution has been taken in the preparation of this work, the author assumes no responsibility for errors or omissions.</p>
</div>

<!-- ═══ TABLE OF CONTENTS ═══ -->
<div class="toc-page">
  <h2>Contents</h2>`;

  let partCounter = 0;
  let tocItems = [];

  for (const phase of PHASES) {
    partCounter++;
    tocItems.push({ type: 'part', label: phase.label, num: partCounter });

    for (const chapter of parts[partCounter - 1].chapters) {
      tocItems.push({ type: 'chapter', num: chapter.num, title: chapter.title, id: chapter.id });
    }
  }

  for (const item of tocItems) {
    if (item.type === 'part') {
      html += `
  <div class="toc-part"><span>Part ${item.num}</span>${item.label}</div>`;
    } else {
      html += `
  <div class="toc-chapter">
    <span class="num">${item.num}.</span>
    <span class="title">${item.title}</span>
    <span class="dots"></span>
    <span class="page"></span>
  </div>`;
    }
  }

  html += `
</div>

<!-- ═══ CONTENT ═══ -->`;

  partCounter = 0;
  for (const phase of PHASES) {
    partCounter++;
    const phaseData = parts[partCounter - 1];
    html += `
<!-- ═══ PART ${partCounter} ═══ -->
<div class="part-page">
  <p class="part-num">Part ${partCounter}</p>
  <div class="part-divider"></div>
  <p class="part-title">${phase.label.replace(/^Part [IV]+: /, '')}</p>
  <p class="part-desc">${phase.desc}</p>
</div>`;

    for (const chapter of phaseData.chapters) {
      const tagsHtml = chapter.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      html += `
<!-- ═══ Chapter ${chapter.num} ═══ -->
<div class="chapter">
  <div class="chapter-header">
    <p class="chapter-number">Chapter ${chapter.num}</p>
    <h2>${escapeHtml(chapter.title)}</h2>
    <p class="chapter-meta">${chapter.subcategory} · ${chapter.tags.length} topics</p>
  </div>
  ${chapter.description ? `<div class="section-body"><p>${renderSectionContent(chapter.description)}</p></div>` : ''}
  <div class="tag-row">${tagsHtml}</div>
  ${chapter.sectionsHtml}
  ${chapter.detailsHtml}
</div>`;
    }
  }

  // ═══ INDEX ═══
  html += `
<div class="index-page">
  <h2>Index</h2>
  <p style="font-size:9pt;color:#64748b;line-height:1.6;">This book covers the following topics and commands for quick reference.</p>
  <div style="margin-top:12pt;column-count:2;column-gap:24pt;font-size:8.5pt;color:#475569;">`;

  // Build a keyword index from all content
  const keywords = new Set();
  for (const phase of parts) {
    for (const ch of phase.chapters) {
      keywords.add(ch.title);
      for (const tag of ch.tags) keywords.add(tag);
    }
  }
  const sortedKeywords = [...keywords].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  let currentLetter = '';
  for (const kw of sortedKeywords) {
    const firstLetter = kw[0].toUpperCase();
    if (firstLetter !== currentLetter) {
      if (currentLetter) html += `</div>`;
      currentLetter = firstLetter;
      html += `<p style="font-weight:600;color:#E95420;margin-top:8pt;margin-bottom:4pt;">${firstLetter}</p><div style="margin-left:8pt;">`;
    }
    html += `<p style="margin-bottom:1pt;">${escapeHtml(kw)}</p>`;
  }
  html += `</div></div>`;

  html += `
</body>
</html>`;

  return html;
}

// ─── Main ───
async function main() {
  console.log('Generating book HTML...');
  const html = generateBookHTML();
  const htmlPath = resolve(OUT_DIR, 'linux-bytes-book.html');
  writeFileSync(htmlPath, html);
  console.log(`HTML written to ${htmlPath}`);

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  const pdfPath = resolve(OUT_DIR, 'linux-bytes-book.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '1.2in',
      bottom: '1.2in',
      left: '1in',
      right: '1in'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;text-align:center;font-family:Ubuntu,sans-serif;font-size:7pt;color:#94a3b8;padding-top:0.3in;"><span style="padding:0 0.5in;">linux bytes</span></div>',
    footerTemplate: '<div style="width:100%;text-align:center;font-family:Ubuntu,sans-serif;font-size:7pt;color:#94a3b8;padding-bottom:0.3in;"><span class="pageNumber" style="margin:0 0.5in;"></span></div>',
    preferCSSPageSize: false,
    timeout: 120000
  });

  await browser.close();

  const stats = readFileSync(pdfPath);
  const kb = (stats.length / 1024).toFixed(0);
  console.log(`PDF generated: ${pdfPath} (${kb} KB)`);
}

main().catch(err => { console.error(err); process.exit(1); });
