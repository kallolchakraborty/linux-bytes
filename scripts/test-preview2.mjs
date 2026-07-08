import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const logs = [];

page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text().substring(0, 500)));
page.on('pageerror', err => logs.push('[PAGE_ERROR] ' + err.message));

// Load directly with hash
await page.goto('http://localhost:3456/#linux-filesystem', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 5000));

// Check what's in the body
const info = await page.evaluate(() => {
  const body = document.body;
  return {
    bodyHTML: body ? body.innerHTML.substring(0, 3000) : 'no body',
    bodyClass: body ? body.className : 'none',
    scripts: [...document.querySelectorAll('script[src]')].map(s => s.src).join(', '),
    mainSelectors: ['#docs-content-area', '.content-area', '#main-content', 'main', 'article', '.page-content'].reduce((acc, sel) => {
      const el = document.querySelector(sel);
      if (el) acc[sel] = el.textContent.trim().substring(0, 200);
      return acc;
    }, {}),
    hash: window.location.hash,
    generatedCheck: typeof generateRoutes !== 'undefined',
    loaderCheck: typeof loadContent !== 'undefined',
  };
});

console.log('Body class:', info.bodyClass);
console.log('Hash:', info.hash);
console.log('Scripts:', info.scripts);
console.log('Has generateRoutes:', info.generatedCheck);
console.log('Has loadContent:', info.loaderCheck);
console.log('\nMain selectors found:', Object.keys(info.mainSelectors).length);
for (const [sel, content] of Object.entries(info.mainSelectors)) {
  console.log('  ' + sel + ':', content.substring(0, 200) || '(empty)');
}

if (Object.keys(info.mainSelectors).length === 0) {
  console.log('\nBody HTML preview:', info.bodyHTML.substring(0, 2000));
}

console.log('\n=== Console logs ===');
logs.forEach(l => console.log(l));

await browser.close();
process.exit(0);
