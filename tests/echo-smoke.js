const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, '../echo-loop/index.html'));
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const keys = async s => { for (const k of s) await p.keyboard.press(k); };
  const st = () => p.evaluate(() => ({ lvl: __echo.lvl, t: __echo.G.t, won: __echo.G.won, ghosts: __echo.G.ghosts.length }));
  const painted = () => p.evaluate(() => { const c = document.getElementById('c'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 100) n++; return n; });
  ok((await st()).t === 0, 'loads at turn 0');
  ok((await painted()) > 500, 'canvas has non-trivial pixel content');
  await keys('dddd'); ok((await st()).won, 'level 1 cleared via keyboard');
  await keys('n'); ok((await st()).lvl === 1, 'N advances to level 2');
  await keys('ss'); await keys('e'); let s = await st(); ok(s.ghosts === 1 && s.t === 0, 'E records ghost and starts new loop');
  await keys('sdsddwwdddss'.slice(0, 11)); s = await st(); ok(s.won, 'level 2 cleared using ghost-held door');
  await keys('n'); ok((await st()).lvl === 2, 'advance to level 3');
  ok(errs.length === 0, 'no console/page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
})();
