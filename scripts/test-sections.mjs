import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];

page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:3456/docs.html#linux-filesystem', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));

const info = await page.evaluate(() => {
  const dc = document.getElementById('docs-dynamic-content');
  if (!dc) return { exists: false, path: window.location.pathname };
  return {
    exists: true,
    htmlLen: dc.textContent.length,
    sections: {
      badge: !!dc.querySelector('.difficulty-badge'),
      prereqs: !!dc.querySelector('.prereq-list'),
      objectives: !!dc.querySelector('.objectives-list'),
      analogy: !!dc.querySelector('.analogy-box'),
      mistakes: !!dc.querySelector('.mistakes-box'),
      labs: !!dc.querySelector('.lab-box'),
      quickref: !!dc.querySelector('.quickref-table'),
      troubleshooting: !!dc.querySelector('.troubleshooting-box'),
      quiz: !!dc.querySelector('.quiz-section'),
      interview: !!dc.querySelector('.interview-box'),
      production: !!dc.querySelector('.production-box'),
      enterprise: !!dc.querySelector('.enterprise-box'),
    },
  };
});

if (!info.exists) {
  console.log('Path:', info.path);
  console.log('ERROR: docs-dynamic-content not found!');
} else {
  console.log('Content:', info.htmlLen, 'chars');
  const found = Object.entries(info.sections).filter(([,v]) => v).map(([k]) => k);
  console.log('LCM sections:', found.length + '/12');
  found.forEach(s => console.log('  ✅', s));
}

if (errors.length) {
  console.log('\nErrors:');
  errors.forEach(e => console.log('  ' + e));
}

await browser.close();
process.exit(0);
