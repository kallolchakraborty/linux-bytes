import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
const errors = [];

page.on('console', msg => {
  if (msg.type() === 'error') errors.push('[CONSOLE_ERROR] ' + msg.text().substring(0, 200));
});
page.on('pageerror', err => errors.push('[PAGE_ERROR] ' + err.message.substring(0, 200)));

console.log('Testing homepage...');
await page.goto('http://localhost:3456/', { waitUntil: 'networkidle0', timeout: 30000 });
console.log('  Title:', await page.title());
console.log('  Errors:', errors.length || 'none');
errors.length = 0;

const routes = ['#linux-filesystem', '#linux-processes', '#linux-memory', '#linux-docker'];

for (const hash of routes) {
  console.log('\n' + hash + '...');
  await page.goto('http://localhost:3456/' + hash, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('.content-area', { timeout: 10000 }).catch(() => {});
  
  const info = await page.evaluate(() => {
    const main = document.querySelector('.content-area');
    return {
      rendered: main ? main.textContent.length > 100 : false,
      sections: [...document.querySelectorAll('.analogy-box, .quiz-section, .lab-box, .mistakes-box, .troubleshooting-box, .interview-box, .production-box, .enterprise-box, .objectives-list')].map(e => e.className.split(' ')[0]),
    };
  });
  
  console.log('  Content:', info.rendered);
  console.log('  LCM sections:', info.sections.length ? info.sections.slice(0, 8).join(', ') : 'NONE FOUND');
  console.log('  Errors:', errors.length || 'none');
  
  if (errors.length) {
    errors.forEach(e => console.log('    ' + e));
    errors.length = 0;
  }
}

await browser.close();
process.exit(0);
