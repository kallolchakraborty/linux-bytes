import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCodeBlock(code, language) {
  if (!code || !code.trim()) return '';
  const lines = code.split('\n').map(l => {
    if (l.length > 88) {
      const indent = l.match(/^\s*/)[0];
      let remaining = l.trim();
      const wrapped = [];
      while (remaining.length > 88) {
        let breakAt = remaining.lastIndexOf(' ', 88);
        if (breakAt < 10) breakAt = 88;
        wrapped.push(remaining.slice(0, breakAt));
        remaining = indent + remaining.slice(breakAt).trim();
      }
      wrapped.push(remaining);
      return wrapped.join('\n');
    }
    return l;
  }).join('\n');
  const langLabel = language ? '<span class="code-lang">' + escapeHtml(language) + '</span>' : '';
  return '<div class="code-block">' + langLabel + '<pre><code>' + escapeHtml(lines) + '</code></pre></div>';
}

function renderSectionContent(desc) {
  if (!desc) return '';
  let html = desc;
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  html = html.replace(svgRegex, (match) => {
    return '<div class="figure">' + match + '</div>';
  });
  return html;
}

function loadContent(filePath) {
  const fullPath = resolve(ROOT, filePath);
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

function generateBookHTML() {
  const parts = [];
  let chapterNum = 0;

  for (const phase of PHASES) {
    const chapters = [];
    for (const file of phase.files) {
      chapterNum++;
      const data = loadContent(phase.dir + '/' + file);
      const sections = data.sections || [];

      let sectionsHtml = '';
      for (const sec of sections) {
        const secTitle = sec.title ? '<h3 id="' + escapeHtml(data.id) + '-' + escapeHtml(sec.title.toLowerCase().replace(/\s+/g, '-')) + '">' + escapeHtml(sec.title) + '</h3>' : '';
        const secDesc = sec.description ? '<div class="section-body">' + renderSectionContent(sec.description) + '</div>' : '';
        const secCode = renderCodeBlock(sec.codeBlock, sec.language || data.language);
        if (secTitle || secDesc || secCode) {
          sectionsHtml += '<section class="subsection">' + secTitle + secDesc + secCode + '</section>';
        }
      }

      // LCM sections
      const objectivesHtml = data.learningObjectives && data.learningObjectives.length > 0
        ? '<div class="callout objectives"><h4>Learning Objectives</h4><ul>' + data.learningObjectives.map(o => '<li>' + escapeHtml(o) + '</li>').join('') + '</ul></div>'
        : '';

      const prereqsHtml = data.prerequisites && data.prerequisites.length > 0
        ? '<div class="lcm-section"><h4>Prerequisites</h4><p>It is recommended to read: ' + data.prerequisites.map(p => '<span class="preref">' + escapeHtml(p.replace(/-/g, ' ')) + '</span>').join(', ') + '</p></div>'
        : '';

      const analogyHtml = data.analogy && data.analogy.title
        ? '<div class="callout analogy"><h4>Real-Life Analogy: ' + escapeHtml(data.analogy.title) + '</h4><p>' + escapeHtml(data.analogy.description) + '</p></div>'
        : '';

      const mistakesHtml = data.commonMistakes && data.commonMistakes.length > 0
        ? '<div class="lcm-section"><h4>Common Mistakes</h4>' + data.commonMistakes.map(m =>
          '<div class="mistake-item"><strong>Mistake:</strong> ' + escapeHtml(m.mistake) + '<br><strong>Solution:</strong> ' + escapeHtml(m.solution) + '</div>'
        ).join('') + '</div>'
        : '';

      const labsHtml = data.practiceLabs && data.practiceLabs.length > 0
        ? '<div class="lcm-section"><h4>Practice Labs</h4>' + data.practiceLabs.map(lab =>
          '<div class="lab-box"><strong>' + escapeHtml(lab.title) + '</strong><p>' + escapeHtml(lab.task) + '</p></div>'
        ).join('') + '</div>'
        : '';

      const quickrefHtml = data.quickReference && data.quickReference.content
        ? '<div class="lcm-section"><h4>' + escapeHtml(data.quickReference.title || 'Quick Reference') + '</h4><div class="qr-content">' + renderSectionContent(data.quickReference.content) + '</div></div>'
        : '';

      const tsHtml = data.troubleshooting && data.troubleshooting.length > 0
        ? '<div class="lcm-section"><h4>Troubleshooting</h4>' + data.troubleshooting.map(t =>
          '<div class="ts-item"><strong>Symptom:</strong> ' + escapeHtml(t.symptom) + '<br><strong>Cause:</strong> ' + escapeHtml(t.cause) + '<br><strong>Solution:</strong> ' + escapeHtml(t.solution) + '</div>'
        ).join('') + '</div>'
        : '';

      const quizHtml = data.quiz && data.quiz.length > 0
        ? '<div class="lcm-section"><h4>Quick Quiz</h4>' + data.quiz.map((q, idx) =>
          '<div class="quiz-item"><p><strong>Q' + (idx + 1) + ':</strong> ' + escapeHtml(q.question) + '</p><p class="quiz-answer"><strong>A:</strong> ' + escapeHtml(q.answer) + '</p></div>'
        ).join('') + '</div>'
        : '';

      const interviewHtml = data.interviewTips && data.interviewTips.length > 0
        ? '<div class="callout interview"><h4>FAANG Insight</h4><ul>' + data.interviewTips.map(t => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul></div>'
        : '';

      const prodHtml = data.productionTips && data.productionTips.length > 0
        ? '<div class="callout production"><h4>Production Tips</h4><ul>' + data.productionTips.map(t => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul></div>'
        : '';

      const practicesHtml = data.bestPractices && data.bestPractices.length > 0
        ? '<div class="lcm-section"><h4>Best Practices</h4><ul>' + data.bestPractices.map(p => '<li>' + escapeHtml(p) + '</li>').join('') + '</ul></div>'
        : '';

      const enterpriseHtml = data.enterprisePerspective
        ? '<div class="callout enterprise"><h4>Enterprise Perspective</h4><p>' + escapeHtml(data.enterprisePerspective) + '</p></div>'
        : '';

      chapters.push({
        num: chapterNum,
        id: data.id,
        title: data.title,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        tags: data.tags || [],
        difficulty: data.difficulty || 'beginner',
        readingTime: data.readingTime || 10,
        practiceTime: data.practiceTime || 10,
        sectionsHtml,
        objectivesHtml,
        prereqsHtml,
        analogyHtml,
        mistakesHtml,
        labsHtml,
        quickrefHtml,
        tsHtml,
        quizHtml,
        interviewHtml,
        prodHtml,
        practicesHtml,
        enterpriseHtml
      });
    }
    parts.push({ label: phase.label, chapters });
  }

  // ── Build HTML ──
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Linux Bytes — The Complete Guide</title>\n<style>\n';
  html += `@import url('https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

@page {
  size: 7.5in 9.25in;
  margin: 0.8in 0.75in 0.9in 0.75in;
  @top-left {
    content: '';
    font-family: 'Ubuntu', sans-serif;
    font-size: 7pt;
    color: #94a3b8;
  }
  @top-right {
    content: counter(page);
    font-family: 'Ubuntu', sans-serif;
    font-size: 7pt;
    color: #94a3b8;
  }
  @bottom-center {
    content: counter(page);
    font-family: 'Ubuntu', sans-serif;
    font-size: 7pt;
    color: #64748b;
  }
}

@page:first { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page part-page { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page front-matter { @bottom-center { content: none; } @top-left { content: none; } @top-right { content: none; } }

body {
  font-family: 'Ubuntu', sans-serif;
  font-size: 10.5pt;
  line-height: 1.6;
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
.cover-page .accent-line { width: 60pt; height: 2pt; background: #E95420; margin: 20pt auto; }
.cover-page h1 { font-size: 32pt; font-weight: 700; color: #E95420; letter-spacing: -0.03em; margin-bottom: 4pt; }
.cover-page .subtitle { font-size: 14pt; font-weight: 300; color: #475569; margin-bottom: 24pt; }
.cover-page .byline { font-size: 10pt; color: #94a3b8; margin-top: 16pt; }
.cover-page .edition { font-size: 9pt; color: #94a3b8; margin-top: 24pt; }
.cover-page .tagline { font-size: 8pt; color: #cbd5e1; margin-top: 36pt; max-width: 300pt; }

/* ── Title Page ── */
.title-page { break-after: page; text-align: center; padding-top: 120pt; }
.title-page h1 { font-size: 28pt; font-weight: 700; color: #E95420; letter-spacing: -0.03em; margin-bottom: 8pt; }
.title-page .divider { width: 40pt; height: 1.5pt; background: #E95420; margin: 16pt auto; }
.title-page .author { font-size: 11pt; color: #475569; margin-bottom: 4pt; }

/* ── Copyright ── */
.copyright-page { break-after: page; font-size: 8.5pt; color: #64748b; line-height: 1.6; padding-top: 60pt; }
.copyright-page p { margin-bottom: 8pt; }

/* ── Front Matter ── */
.front-page { page: front-matter; break-after: page; }
.front-page h2 { font-size: 18pt; font-weight: 500; color: #E95420; margin-bottom: 16pt; }
.front-page p, .front-page li { font-size: 10pt; color: #475569; line-height: 1.7; margin-bottom: 6pt; }
.front-page ul, .front-page ol { padding-left: 20pt; margin: 8pt 0; }

/* ── Table of Contents ── */
.toc-page { break-after: page; }
.toc-page h2 { font-size: 18pt; font-weight: 500; color: #E95420; margin-bottom: 20pt; letter-spacing: 0.02em; }
.toc-part { font-size: 11pt; font-weight: 600; color: #1e293b; margin-top: 14pt; margin-bottom: 6pt; padding-bottom: 4pt; border-bottom: 1px solid #e2e8f0; }
.toc-part span { color: #E95420; margin-right: 6pt; }
.toc-chapter { font-size: 9.5pt; color: #475569; padding-left: 16pt; margin-bottom: 3pt; display: flex; justify-content: space-between; align-items: baseline; }
.toc-chapter .num { color: #94a3b8; width: 24pt; display: inline-block; }
.toc-chapter .title { flex: 0 1 auto; max-width: 70%; }
.toc-chapter .dots { flex: 1; margin: 0 6pt; border-bottom: 1px dotted #cbd5e1; height: 1em; }
.toc-chapter .page { color: #94a3b8; font-family: 'Ubuntu Mono', monospace; font-size: 8.5pt; }

/* ── Part Page ── */
.part-page { page: part-page; break-after: page; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 80vh; text-align: center; }
.part-page .part-num { font-size: 10pt; font-weight: 600; color: #E95420; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12pt; }
.part-page .part-title { font-size: 22pt; font-weight: 300; color: #1e293b; }
.part-page .part-divider { width: 40pt; height: 1.5pt; background: #E95420; margin: 16pt auto; }
.part-page .part-desc { font-size: 9pt; color: #94a3b8; max-width: 280pt; }

/* ── Chapter ── */
.chapter { break-before: page; margin-top: 0; }
.chapter-header { margin-bottom: 14pt; padding-bottom: 10pt; border-bottom: 2px solid #E95420; }
.chapter-number { font-size: 9pt; font-weight: 600; color: #E95420; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4pt; }
.chapter-header h2 { font-size: 18pt; font-weight: 600; color: #1e293b; letter-spacing: -0.02em; line-height: 1.2; }
.chapter-meta { font-size: 8pt; color: #94a3b8; margin-top: 4pt; }
.chapter-desc { font-size: 10pt; color: #475569; line-height: 1.6; margin-bottom: 10pt; }

/* ── Difficulty badge ── */
.diff-badge { display: inline-block; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 1pt 6pt; border-radius: 3pt; margin-right: 4pt; }
.diff-beginner { background: #d1fae5; color: #065f46; }
.diff-intermediate { background: #fef3c7; color: #92400e; }
.diff-advanced { background: #e9d5ff; color: #5b21b6; }

/* ── Subsections ── */
.subsection { margin-bottom: 12pt; }
.subsection h3 { font-size: 13pt; font-weight: 600; color: #1e293b; margin-bottom: 6pt; margin-top: 12pt; padding-top: 6pt; }
.subsection .section-body { font-size: 10pt; color: #334155; line-height: 1.65; }
.subsection .section-body p { margin-bottom: 6pt; }
.subsection .section-body strong { color: #E95420; }
.subsection .section-body code { font-family: 'JetBrains Mono', monospace; font-size: 8pt; background: #f1f5f9; padding: 1pt 4pt; border-radius: 3pt; color: #E95420; }

/* ── Code Blocks ── */
.code-block { margin: 8pt 0; position: relative; }
.code-lang { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 7pt; color: #E95420; background: #f1f5f9; padding: 1pt 6pt; border-radius: 3pt 3pt 0 0; margin-bottom: 0; }
pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5pt;
  line-height: 1.4;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #E95420;
  border-radius: 0 4pt 4pt 4pt;
  padding: 8pt 10pt;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1e293b;
}
pre code { font-family: inherit; font-size: inherit; background: none !important; color: inherit !important; padding: 0 !important; }

/* ── LCM Sections ── */
.lcm-section { margin: 10pt 0; padding: 8pt 0; border-top: 1px solid #e2e8f0; }
.lcm-section h4 { font-size: 11pt; font-weight: 600; color: #1e293b; margin-bottom: 6pt; }
.lcm-section p, .lcm-section li { font-size: 10pt; color: #475569; line-height: 1.6; }
.lcm-section ul, .lcm-section ol { padding-left: 18pt; margin: 4pt 0; }

/* ── Callout Boxes ── */
.callout { margin: 10pt 0; padding: 10pt 14pt; border-radius: 4pt; break-inside: avoid; }
.callout h4 { font-size: 10pt; font-weight: 600; margin-bottom: 4pt; }
.callout p, .callout li { font-size: 9.5pt; line-height: 1.55; }
.callout ul, .callout ol { padding-left: 16pt; }
.objectives { background: #eef2ff; border-left: 3pt solid #6366f1; }
.objectives h4 { color: #4338ca; }
.analogy { background: #fffbeb; border-left: 3pt solid #f59e0b; }
.analogy h4 { color: #b45309; }
.interview { background: #fdf2f8; border-left: 3pt solid #ec4899; }
.interview h4 { color: #be185d; }
.production { background: #ecfeff; border-left: 3pt solid #0ea5e9; }
.production h4 { color: #0369a1; }
.enterprise { background: #f5f3ff; border-left: 3pt solid #8b5cf6; }
.enterprise h4 { color: #6d28d9; }

/* ── Mistake box ── */
.mistake-item { font-size: 9.5pt; color: #475569; padding: 4pt 0; border-bottom: 1px solid #f1f5f9; }
.mistake-item strong { color: #dc2626; }

/* ── Lab box ── */
.lab-box { background: #ecfdf5; border-left: 3pt solid #10b981; padding: 8pt 12pt; margin: 6pt 0; border-radius: 4pt; }
.lab-box strong { color: #047857; font-size: 9.5pt; }
.lab-box p { font-size: 9pt; color: #475569; margin-top: 2pt; }

/* ── Quiz item ── */
.quiz-item { margin: 6pt 0; padding: 6pt 0; border-bottom: 1px solid #f1f5f9; }
.quiz-item p { font-size: 9.5pt; color: #475569; }
.quiz-answer { color: #059669; font-weight: 500; }

/* ── Troubleshooting ── */
.ts-item { font-size: 9.5pt; color: #475569; padding: 4pt 0; border-bottom: 1px solid #f1f5f9; }
.ts-item strong { color: #ea580c; }

/* ── Preref ── */
.preref { font-style: italic; color: #E95420; text-transform: capitalize; }

/* ── QR content table ── */
.qr-content table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 6pt 0; }
.qr-content th, .qr-content td { border: 1px solid #e2e8f0; padding: 3pt 6pt; text-align: left; }
.qr-content th { background: #f8fafc; font-weight: 600; color: #1e293b; }

/* ── Detail boxes ── */
.detail-box { background: rgba(233, 84, 32, 0.04); border-left: 3pt solid #E95420; border-radius: 4pt; padding: 10pt 14pt; margin: 14pt 0; font-size: 9.5pt; color: #475569; line-height: 1.55; break-inside: avoid; }

/* ── Figures ── */
.figure { margin: 12pt auto; text-align: center; break-inside: avoid; max-width: 100%; }
.figure svg { max-width: 100%; height: auto; border-radius: 4pt; border: 1px solid #e2e8f0; background: #0f172a; }
svg text { font-family: 'Ubuntu', sans-serif !important; }

/* ── Appendix ── */
.appendix-chapter { break-before: page; }
.appendix-chapter h2 { font-size: 16pt; font-weight: 600; color: #E95420; margin-bottom: 12pt; padding-bottom: 6pt; border-bottom: 2px solid #E95420; }
.appendix-chapter .cmd-group { margin-bottom: 10pt; }
.appendix-chapter .cmd-group h3 { font-size: 11pt; font-weight: 600; color: #1e293b; margin-bottom: 4pt; }
.appendix-chapter p { font-size: 9.5pt; color: #475569; margin-bottom: 4pt; }

/* ── Links ── */
.subsection a { color: #E95420; text-decoration: none; }

/* ── Tags ── */
.tag-row { display: flex; flex-wrap: wrap; gap: 3pt; margin: 6pt 0; }
.tag { font-size: 7pt; font-weight: 600; color: #E95420; background: rgba(233, 84, 32, 0.08); padding: 1pt 5pt; border-radius: 3pt; letter-spacing: 0.03em; }

/* ── Index ── */
.index-page { break-before: page; }
.index-page h2 { font-size: 18pt; font-weight: 500; color: #E95420; margin-bottom: 16pt; }
</style>
</head>
<body>
`;

  // ═══ COVER PAGE ═══
  html += '<div class="cover-page">\n  <div class="accent-line"></div>\n  <h1>linux bytes</h1>\n  <p class="subtitle">The Complete Guide to Linux System Administration,<br>DevOps, SRE &amp; Interview Preparation</p>\n  <div class="accent-line"></div>\n  <p class="byline">By Kallol Chakraborty</p>\n  <p class="edition">First Edition — July 2026</p>\n  <p class="tagline">30 Topics Across 4 Parts · 200+ Code Examples · 5 Animated Diagrams</p>\n</div>\n';

  // ═══ TITLE PAGE ═══
  html += '<div class="title-page">\n  <h1>linux bytes</h1>\n  <div class="divider"></div>\n  <p class="author">Kallol Chakraborty</p>\n  <p style="font-size:9pt;color:#94a3b8;margin-top:24pt;">Linux System Administration · DevOps · SRE · Cloud Infrastructure</p>\n  <p style="font-size:8pt;color:#cbd5e1;margin-top:60pt;">Staff+ Architect\'s Perspective · Interview Preparation</p>\n</div>\n';

  // ═══ COPYRIGHT ═══
  html += '<div class="copyright-page">\n  <p><strong>Linux Bytes — The Complete Guide</strong></p>\n  <p>First Edition: July 2026</p>\n  <p>&copy; 2026 Kallol Chakraborty. All rights reserved.</p>\n  <p style="margin-top:16pt;">No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.</p>\n  <p style="margin-top:16pt;">Linux&reg; is the registered trademark of Linus Torvalds in the U.S. and other countries. All other trademarks are the property of their respective owners.</p>\n  <p style="margin-top:16pt;">The information in this book is distributed on an "as is" basis, without warranty. While every precaution has been taken in the preparation of this work, the author assumes no responsibility for errors or omissions.</p>\n</div>\n';

  // ═══ HOW TO USE THIS BOOK ═══
  html += '<div class="front-page">\n  <h2>How to Use This Book</h2>\n  <p><strong>Linux Bytes</strong> is designed as both a structured learning path and a practical reference for engineers working with Linux in production environments.</p>\n  <h3 style="font-size:12pt;font-weight:600;color:#1e293b;margin-top:14pt;">Structure</h3>\n  <ul>\n    <li><strong>Part I — Foundations:</strong> Start here if you are new to Linux or need a refresher on the essentials.</li>\n    <li><strong>Part II — Systems &amp; Operations:</strong> Day-to-day administration and production operations.</li>\n    <li><strong>Part III — Advanced Topics:</strong> Deep dives for senior engineers working on performance, kernel internals, and observability.</li>\n    <li><strong>Part IV — Containers &amp; SRE:</strong> Container internals, Kubernetes, troubleshooting, security, and interview preparation.</li>\n  </ul>\n  <h3 style="font-size:12pt;font-weight:600;color:#1e293b;margin-top:14pt;">Chapter Format</h3>\n  <p>Each chapter follows a consistent structure:</p>\n  <ol>\n    <li><strong>Learning Objectives</strong> — What you will gain from this chapter</li>\n    <li><strong>Why This Matters</strong> — Real-world relevance</li>\n    <li><strong>Real-Life Analogy</strong> — A relatable mental model</li>\n    <li><strong>Concept &amp; Explanation</strong> — Core knowledge with examples</li>\n    <li><strong>Commands &amp; Code</strong> — Practical, runnable examples</li>\n    <li><strong>Common Mistakes</strong> — Pitfalls to avoid</li>\n    <li><strong>Practice Labs</strong> — Hands-on exercises</li>\n    <li><strong>Quick Reference</strong> — Cheat sheet for daily use</li>\n    <li><strong>Troubleshooting</strong> — Diagnostic guidance</li>\n    <li><strong>Quick Quiz</strong> — Test your understanding</li>\n    <li><strong>FAANG Insight</strong> — Interview and career tips</li>\n  </ol>\n  <p style="margin-top:12pt;"><strong>Difficulty levels:</strong> Chapters are marked <em>Beginner</em>, <em>Intermediate</em>, or <em>Advanced</em>. Follow the recommended prerequisites for best results.</p>\n</div>\n';

  // ═══ TOC ═══
  html += '<div class="toc-page">\n  <h2>Contents</h2>\n';

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
      html += '  <div class="toc-part"><span>Part ' + item.num + '</span>' + item.label + '</div>\n';
    } else {
      html += '  <div class="toc-chapter">\n    <span class="num">' + item.num + '.</span>\n    <span class="title">' + item.title + '</span>\n    <span class="dots"></span>\n    <span class="page"></span>\n  </div>\n';
    }
  }

  html += '  <div class="toc-part" style="margin-top:20pt;">Appendices</div>\n';
  html += '  <div class="toc-chapter"><span class="num">A.</span><span class="title">Top 200 Linux Commands</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">B.</span><span class="title">Filesystem Hierarchy Standard</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">C.</span><span class="title">Permission &amp; ACL Reference</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">D.</span><span class="title">Signal Table</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">E.</span><span class="title">Systemd Quick Reference</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">F.</span><span class="title">Networking Commands</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">G.</span><span class="title">Docker Command Reference</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '  <div class="toc-chapter"><span class="num">H.</span><span class="title">Kubernetes Quick Reference</span><span class="dots"></span><span class="page"></span></div>\n';
  html += '</div>\n';

  // ═══ CONTENT ═══
  partCounter = 0;
  for (const phase of PHASES) {
    partCounter++;
    const phaseData = parts[partCounter - 1];
    html += '<!-- PART ' + partCounter + ' -->\n<div class="part-page">\n  <p class="part-num">Part ' + partCounter + '</p>\n  <div class="part-divider"></div>\n  <p class="part-title">' + phase.label.replace(/^Part [IV]+: /, '') + '</p>\n  <p class="part-desc">' + phase.desc + '</p>\n</div>\n';

    for (const ch of phaseData.chapters) {
      const tagsHtml = ch.tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('');
      const diffBadge = '<span class="diff-badge diff-' + ch.difficulty + '">' + ch.difficulty + '</span>';

      html += '<!-- Chapter ' + ch.num + ' -->\n<div class="chapter">\n  <div class="chapter-header">\n    <p class="chapter-number">Chapter ' + ch.num + '</p>\n    <h2>' + escapeHtml(ch.title) + '</h2>\n    <p class="chapter-meta">' + diffBadge + ch.subcategory + ' &middot; ' + ch.readingTime + ' min read &middot; ' + ch.practiceTime + ' min practice</p>\n  </div>\n';

      // Why This Matters
      html += '  <div class="chapter-desc"><p>' + renderSectionContent(ch.description) + '</p></div>\n';

      // Tags
      html += '  <div class="tag-row">' + tagsHtml + '</div>\n';

      // Prerequisites
      html += ch.prereqsHtml;

      // Learning Objectives
      html += ch.objectivesHtml;

      // Analogy
      html += ch.analogyHtml;

      // Main content sections
      html += ch.sectionsHtml;

      // Common Mistakes
      html += ch.mistakesHtml;

      // Practice Labs
      html += ch.labsHtml;

      // Quick Reference
      html += ch.quickrefHtml;

      // Troubleshooting
      html += ch.tsHtml;

      // Quiz
      html += ch.quizHtml;

      // Interview Tips (FAANG Insight)
      html += ch.interviewHtml;

      // Production Tips
      html += ch.prodHtml;

      // Best Practices
      html += ch.practicesHtml;

      // Enterprise Perspective
      html += ch.enterpriseHtml;

      html += '</div>\n';
    }
  }

  // ═══ APPENDIX ═══
  const appendixCheatsheets = [
    { letter: 'A', title: 'Top 200 Linux Commands', content:
      '<div class="cmd-group"><h3>File Operations</h3><p>ls, cd, pwd, cp, mv, rm, mkdir, rmdir, touch, cat, less, more, head, tail, nano, vim, find, locate, chmod, chown, ln, stat, file, du, df</p></div>' +
      '<div class="cmd-group"><h3>Process Management</h3><p>ps, top, htop, kill, pkill, killall, nice, renice, nohup, bg, fg, jobs, strace, ltrace, lsof, fuser, pidof, pgrep</p></div>' +
      '<div class="cmd-group"><h3>System Information</h3><p>uname, hostname, uptime, dmesg, lscpu, lsmem, lsblk, lspci, lsusb, lshw, dmidecode, arch, free, vmstat, iostat, mpstat, sar</p></div>' +
      '<div class="cmd-group"><h3>Network</h3><p>ip, ifconfig, ss, netstat, ping, traceroute, mtr, curl, wget, nc, nmap, tcpdump, iptables, nft, dig, nslookup, host, whois</p></div>' +
      '<div class="cmd-group"><h3>Packaging</h3><p>apt, apt-get, dpkg, snap, yum, dnf, rpm, pacman, flatpak, pip, npm</p></div>' +
      '<div class="cmd-group"><h3>Container &amp; Cloud</h3><p>docker, podman, kubectl, crictl, ctr, systemd-nspawn, vagrant, terraform, ansible</p></div>' +
      '<div class="cmd-group"><h3>Text Processing</h3><p>grep, sed, awk, cut, sort, uniq, wc, tr, fold, paste, join, diff, patch, comm, cmp, tee, xargs, parallel</p></div>' +
      '<div class="cmd-group"><h3>Shell &amp; Scripting</h3><p>echo, printf, read, export, alias, source, type, command, eval, exec, set, shopt, ulimit, umask, test, bc, time</p></div>' +
      '<div class="cmd-group"><h3>Security</h3><p>ssh, scp, rsync, sftp, sudo, su, passwd, chage, usermod, groupadd, useradd, openssl, gpg, auditctl, ausearch, aa-status, getenforce, setenforce</p></div>' +
      '<div class="cmd-group"><h3>Systemd &amp; Boot</h3><p>systemctl, journalctl, systemd-analyze, systemd-cgls, timedatectl, loginctl, localectl, hostnamectl, kernel-install, grub-install, grub-mkconfig, update-grub</p></div>'
    },
    { letter: 'B', title: 'Filesystem Hierarchy Standard', content:
      '<div class="cmd-group"><h3>Essential Directories</h3><p><strong>/bin</strong> — Essential command binaries (boot-critical)<br><strong>/sbin</strong> — System administration binaries<br><strong>/etc</strong> — Host-specific configuration<br><strong>/var</strong> — Variable data (logs, databases, spool)<br><strong>/tmp</strong> — Temporary files (cleared on boot)<br><strong>/usr</strong> — Secondary hierarchy (read-only user data)<br><strong>/opt</strong> — Add-on application packages<br><strong>/proc</strong> — Virtual filesystem: process &amp; kernel info<br><strong>/sys</strong> — Virtual filesystem: kernel objects &amp; devices<br><strong>/dev</strong> — Device files<br><strong>/run</strong> — Runtime variable data (tmpfs)<br><strong>/home</strong> — User home directories<br><strong>/root</strong> — Root user home</p></div>' +
      '<div class="cmd-group"><h3>Configuration Files</h3><p><strong>/etc/passwd</strong> — User accounts<br><strong>/etc/shadow</strong> — Password hashes<br><strong>/etc/group</strong> — Group definitions<br><strong>/etc/sudoers</strong> — Sudo privileges<br><strong>/etc/fstab</strong> — Mount table<br><strong>/etc/hosts</strong> — Hostname resolution<br><strong>/etc/resolv.conf</strong> — DNS config<br><strong>/etc/ssh/sshd_config</strong> — SSH server config</p></div>'
    },
    { letter: 'C', title: 'Permission & ACL Reference', content:
      '<div class="cmd-group"><h3>File Permissions</h3><p><strong>r</strong> (4) — Read<br><strong>w</strong> (2) — Write<br><strong>x</strong> (1) — Execute<br><strong>-</strong> (0) — No permission</p><p><strong>Owner (u)</strong> | <strong>Group (g)</strong> | <strong>Others (o)</strong></p><p>Common: 755 (rwxr-xr-x), 644 (rw-r--r--), 700 (rwx------), 600 (rw-------)</p></div>' +
      '<div class="cmd-group"><h3>Special Bits</h3><p><strong>SUID (4)</strong> — Run as file owner (chmod u+s)<br><strong>SGID (2)</strong> — Run as group / inherit group (chmod g+s)<br><strong>Sticky (1)</strong> — Only owner can delete (chmod +t, /tmp)</p></div>' +
      '<div class="cmd-group"><h3>ACL Commands</h3><p><strong>getfacl</strong> — Show ACL entries<br><strong>setfacl</strong> — Set ACL entries (setfacl -m u:user:rwx file, setfacl -m g:group:rx file)</p><p><strong>Default ACL:</strong> setfacl -d -m u:user:rwx dir/</p></div>' +
      '<div class="cmd-group"><h3>Umask</h3><p><strong>umask 022</strong> — Files: 644, Dirs: 755 (default)<br><strong>umask 077</strong> — Files: 600, Dirs: 700 (secure)<br><strong>umask 002</strong> — Files: 664, Dirs: 775 (collaborative)</p></div>'
    },
    { letter: 'D', title: 'Signal Table', content:
      '<div class="cmd-group"><h3>Common Signals</h3><table class="qr-content"><tr><th>Signal</th><th>Number</th><th>Action</th><th>Description</th></tr>' +
      '<tr><td>SIGHUP</td><td>1</td><td>Term</td><td>Hangup (reload config)</td></tr>' +
      '<tr><td>SIGINT</td><td>2</td><td>Term</td><td>Interrupt (Ctrl+C)</td></tr>' +
      '<tr><td>SIGQUIT</td><td>3</td><td>Core</td><td>Quit (Ctrl+\\)</td></tr>' +
      '<tr><td>SIGKILL</td><td>9</td><td>Term</td><td>Kill (cannot be caught/blocked)</td></tr>' +
      '<tr><td>SIGTERM</td><td>15</td><td>Term</td><td>Terminate (graceful shutdown)</td></tr>' +
      '<tr><td>SIGSTOP</td><td>19</td><td>Stop</td><td>Stop process (cannot be caught)</td></tr>' +
      '<tr><td>SIGTSTP</td><td>20</td><td>Stop</td><td>Terminal stop (Ctrl+Z)</td></tr>' +
      '<tr><td>SIGCONT</td><td>18</td><td>Cont</td><td>Continue if stopped</td></tr>' +
      '<tr><td>SIGUSR1</td><td>10</td><td>Term</td><td>User-defined 1</td></tr>' +
      '<tr><td>SIGUSR2</td><td>12</td><td>Term</td><td>User-defined 2</td></tr>' +
      '<tr><td>SIGCHLD</td><td>17</td><td>Ign</td><td>Child stopped or terminated</td></tr>' +
      '<tr><td>SIGPIPE</td><td>13</td><td>Term</td><td>Broken pipe (write to closed pipe)</td></tr></table></div>'
    },
    { letter: 'E', title: 'Systemd Quick Reference', content:
      '<div class="cmd-group"><h3>Service Management</h3><p><strong>systemctl start</strong> service — Start<br><strong>systemctl stop</strong> service — Stop<br><strong>systemctl restart</strong> service — Restart<br><strong>systemctl reload</strong> service — Reload config<br><strong>systemctl status</strong> service — Show status<br><strong>systemctl enable</strong> service — Start on boot<br><strong>systemctl disable</strong> service — Disable on boot</p></div>' +
      '<div class="cmd-group"><h3>Journal</h3><p><strong>journalctl</strong> — View all logs<br><strong>journalctl -u</strong> service — Filter by unit<br><strong>journalctl -f</strong> — Follow (tail)<br><strong>journalctl -x</strong> — Add explanatory text<br><strong>journalctl -n 50</strong> — Last 50 lines<br><strong>journalctl -p err</strong> — Filter by priority</p></div>' +
      '<div class="cmd-group"><h3>Unit Types</h3><p><strong>.service</strong> — System services<br><strong>.timer</strong> — Timed events (cron replacement)<br><strong>.socket</strong> — Socket activation<br><strong>.path</strong> — Path activation<br><strong>.mount</strong> — Mount points<br><strong>.target</strong> — Group of units (runlevel equivalent)<br><strong>.slice</strong> — Resource management (cgroups)</p></div>'
    },
    { letter: 'F', title: 'Networking Commands', content:
      '<div class="cmd-group"><h3>Interface &amp; Address</h3><p><strong>ip addr</strong> — Show addresses<br><strong>ip link</strong> — Show interfaces<br><strong>ip route</strong> — Show routing table<br><strong>ss -tlnp</strong> — Listening TCP ports with process<br><strong>ss -uanp</strong> — UDP sockets with process<br><strong>ip neigh</strong> — ARP cache</p></div>' +
      '<div class="cmd-group"><h3>Connectivity</h3><p><strong>ping -c 5</strong> host — ICMP test<br><strong>mtr</strong> host — Path + latency<br><strong>traceroute</strong> host — Route path<br><strong>curl -v</strong> url — HTTP debug<br><strong>nc -vz</strong> host port — TCP port check<br><strong>dig</strong> domain — DNS lookup<br><strong>nslookup</strong> domain — Legacy DNS</p></div>' +
      '<div class="cmd-group"><h3>Packet inspection</h3><p><strong>tcpdump -i eth0 -nn</strong> — Capture packets<br><strong>tcpdump port 80</strong> — Filter by port<br><strong>tcpdump -w capture.pcap</strong> — Save to file</p></div>' +
      '<div class="cmd-group"><h3>Firewall</h3><p><strong>iptables -L -n -v</strong> — List rules<br><strong>iptables -A INPUT -p tcp --dport 22 -j ACCEPT</strong> — Allow SSH<br><strong>nft list ruleset</strong> — nftables rules<br><strong>ufw status verbose</strong> — Uncomplicated firewall</p></div>'
    },
    { letter: 'G', title: 'Docker Command Reference', content:
      '<div class="cmd-group"><h3>Container Lifecycle</h3><p><strong>docker run -d --name app nginx</strong> — Run detached<br><strong>docker stop</strong> container — Stop gracefully<br><strong>docker start</strong> container — Start stopped<br><strong>docker restart</strong> container — Restart<br><strong>docker rm</strong> container — Remove<br><strong>docker ps -a</strong> — List all containers</p></div>' +
      '<div class="cmd-group"><h3>Images</h3><p><strong>docker images</strong> — List images<br><strong>docker pull</strong> image — Download image<br><strong>docker build -t name .</strong> — Build image<br><strong>docker rmi</strong> image — Remove image<br><strong>docker system prune -a</strong> — Clean unused</p></div>' +
      '<div class="cmd-group"><h3>Inspection &amp; Debug</h3><p><strong>docker logs -f</strong> container — Follow logs<br><strong>docker exec -it container bash</strong> — Shell inside<br><strong>docker inspect</strong> container — Detailed config<br><strong>docker stats</strong> — Resource usage<br><strong>docker top</strong> container — Processes inside</p></div>' +
      '<div class="cmd-group"><h3>Networking &amp; Storage</h3><p><strong>docker network ls</strong> — List networks<br><strong>docker network create</strong> net — Create network<br><strong>docker volume ls</strong> — List volumes<br><strong>docker volume create</strong> vol — Create volume</p></div>'
    },
    { letter: 'H', title: 'Kubernetes Quick Reference', content:
      '<div class="cmd-group"><h3>Cluster &amp; Node Info</h3><p><strong>kubectl cluster-info</strong> — Cluster info<br><strong>kubectl get nodes</strong> — List nodes<br><strong>kubectl describe node</strong> node — Node details<br><strong>kubectl top node</strong> — Node resource usage</p></div>' +
      '<div class="cmd-group"><h3>Workloads</h3><p><strong>kubectl get pods -A</strong> — All pods<br><strong>kubectl describe pod</strong> pod — Pod details<br><strong>kubectl logs -f</strong> pod — Follow logs<br><strong>kubectl exec -it pod -- bash</strong> — Shell inside<br><strong>kubectl get deployments</strong> — Deployments<br><strong>kubectl get services</strong> — Services<br><strong>kubectl get configmaps</strong> — ConfigMaps<br><strong>kubectl get secrets</strong> — Secrets</p></div>' +
      '<div class="cmd-group"><h3>Debugging</h3><p><strong>kubectl describe pod</strong> — Events &amp; status<br><strong>kubectl port-forward pod 8080:80</strong> — Port forward<br><strong>kubectl get events --sort-by=.lastTimestamp</strong> — Events<br><strong>kubectl top pod</strong> — Pod resource usage<br><strong>kubectl rollout status deployment</strong> — Deploy status</p></div>' +
      '<div class="cmd-group"><h3>Imperative Commands</h3><p><strong>kubectl run nginx --image=nginx</strong> — Run pod<br><strong>kubectl expose deployment nginx --port=80</strong> — Expose<br><strong>kubectl scale deployment nginx --replicas=3</strong> — Scale<br><strong>kubectl set image deployment/nginx nginx=nginx:1.25</strong> — Update image<br><strong>kubectl delete pod</strong> pod — Delete pod</p></div>'
    }
  ];

  for (const app of appendixCheatsheets) {
    html += '<div class="appendix-chapter">\n  <h2>Appendix ' + app.letter + ': ' + app.title + '</h2>\n  ' + app.content + '\n</div>\n';
  }

  // ═══ INDEX ═══
  html += '<div class="index-page">\n  <h2>Index</h2>\n  <p style="font-size:9pt;color:#64748b;line-height:1.6;">This book covers the following topics and commands for quick reference.</p>\n  <div style="margin-top:12pt;column-count:2;column-gap:24pt;font-size:8.5pt;color:#475569;">\n';

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
      if (currentLetter) html += '</div>\n';
      currentLetter = firstLetter;
      html += '<p style="font-weight:600;color:#E95420;margin-top:8pt;margin-bottom:4pt;">' + firstLetter + '</p>\n<div style="margin-left:8pt;">\n';
    }
    html += '<p style="margin-bottom:1pt;">' + escapeHtml(kw) + '</p>\n';
  }
  html += '</div>\n</div>\n';

  html += '</body>\n</html>';
  return html;
}

// ─── Main ───
async function main() {
  console.log('Generating book HTML...');
  const html = generateBookHTML();
  const htmlPath = resolve(OUT_DIR, 'linux-bytes-book.html');
  writeFileSync(htmlPath, html);
  console.log('HTML written to ' + htmlPath);

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Generating PDF (7.5 x 9.25 KDP)...');
  const pdfPath = resolve(OUT_DIR, 'linux-bytes-book.pdf');
  await page.pdf({
    path: pdfPath,
    width: '7.5in',
    height: '9.25in',
    margin: {
      top: '0.8in',
      bottom: '0.9in',
      left: '0.75in',
      right: '0.75in'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;text-align:center;font-family:Ubuntu,sans-serif;font-size:7pt;color:#94a3b8;padding-top:0.3in;"><span style="padding:0 0.5in;">linux bytes</span></div>',
    footerTemplate: '<div style="width:100%;text-align:center;font-family:Ubuntu,sans-serif;font-size:7pt;color:#94a3b8;padding-bottom:0.3in;"><span class="pageNumber" style="margin:0 0.5in;"></span></div>',
    preferCSSPageSize: true,
    timeout: 120000
  });

  await browser.close();

  const stats = readFileSync(pdfPath);
  const kb = (stats.length / 1024).toFixed(0);
  const pages = (stats.length / 14000).toFixed(0);
  console.log('PDF generated: ' + pdfPath + ' (' + kb + ' KB, ~' + pages + ' pages)');
}

main().catch(err => { console.error(err); process.exit(1); });
