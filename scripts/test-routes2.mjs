import puppeteer from 'puppeteer';

const routes = ['#linux-networking', '#linux-git', '#linux-history', '#linux-bpf', '#linux-kernel', '#linux-ssh'];
const browser = await puppeteer.launch({ headless: 'new' });

for (const hash of routes) {
  const p = await browser.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message.substring(0, 80)));
  await p.goto('http://localhost:3456/docs.html' + hash, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  const info = await p.evaluate(() => {
    const dc = document.getElementById('docs-dynamic-content');
    if (!dc) return null;
    const s = ['difficulty-badge','prereq-list','objectives-list','analogy-box','mistakes-box','lab-box','quickref-table','troubleshooting-box','quiz-section','interview-box','production-box','enterprise-box'];
    return { len: dc.textContent.length, found: s.filter(c => dc.querySelector('.' + c)).length };
  });
  console.log((info ? '✅' : '❌') + ' ' + hash + ' ' + (info ? info.len + ' chars, ' + info.found + '/12' : 'empty'));
  if (errors.length) console.log('   ⚠', errors.join('; '));
  await p.close();
}

await browser.close();
process.exit(0);
