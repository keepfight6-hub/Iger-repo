// pakai: node potret.js <url> <outdir> t1,t2,...  -> potret JPEG skala 0.5 + log konsol
const { chromium } = require('playwright');
(async () => {
  const [url, out, ts] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 540, height: 1000 } });
  p.on('console', m => console.log('[konsol]', m.text()));
  p.on('pageerror', e => console.log('[ERROR]', e.message));
  await p.goto(url);
  await p.evaluate(() => window.__ready);
  const fs = require('fs');
  for (const t of ts.split(',').map(Number)) {
    const t0 = Date.now();
    const d = await p.evaluate(t => window.__jpeg(t, .85), t);
    fs.writeFileSync(`${out}/f_${t.toFixed(2)}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
    console.log('t', t, (Date.now() - t0) + 'ms');
  }
  const err = await p.evaluate(() => document.getElementById('err').textContent);
  if (err) console.log('[ERRBOX]', err);
  await b.close();
})();
