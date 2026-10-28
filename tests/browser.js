const { chromium } = require('playwright'); const path = require('path');
const sol = require('./solutions.json'), levels = require('../game2/levels.js');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../game2/index.html'));
  let fails = 0;
  for (let i = 0; i < levels.length; i++) {
    const bx = await p.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left, r.top]; });
    for (const m of sol[levels[i].name]) { if (m.s < 0) await p.keyboard.down('Shift'); await p.mouse.click(bx[0] + m.x, bx[1] + m.y); if (m.s < 0) await p.keyboard.up('Shift'); }
    await p.keyboard.press('Space');
    await p.waitForFunction(() => window.__mm.sim && window.__mm.sim.status !== 'running', null, { timeout: 60000 });
    const st = await p.evaluate(() => window.__mm.sim.status);
    console.log(st === 'won' ? 'PASS' : 'FAIL', 'ui level', i + 1, st); if (st !== 'won') fails++;
    await p.keyboard.press('n');
  }
  if (errs.length) { console.log('FAIL page errors', errs); fails++; }
  await b.close(); process.exit(fails ? 1 : 0);
})();
