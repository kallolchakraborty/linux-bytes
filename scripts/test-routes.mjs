import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const routes = [
  '#linux-processes', '#linux-memory', '#linux-docker',
  '#linux-faang-scale', '#linux-networking', '#linux-git',
  '#linux-history', '#linux-bpf', '#linux-kernel'
];

for (const hash of routes) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('http://localhost:3456/docs.html' + hash, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const info = await page.evaluate(() => {
    const dc = document.getElementById('docs-dynamic-content');
    if (!dc) return { ok: false };
    const sections = ['difficulty-badge', 'prereq-list', 'objectives-list', 'analogy-box', 'mistakes-box', 'lab-box', 'quickref-table', 'troubleshooting-box', 'quiz-section', 'interview-box', 'production-box', 'enterprise-box'];
    return {
      ok: true,
      len: dc.textContent.length,
      found: sections.filter(s => dc.querySelector('.' + s)).length,
    };
  });
  
  const status = info.ok ? `✅ ${hash} (${info.len} chars, ${info.found}/12 sections)` : `❌ ${hash} (no content)`;
  if (errors.length) status += ' errors:' + errors.join(',');
  console.log(status);
  
  await page.close();
}

await browser.close();
process.exit(0);
