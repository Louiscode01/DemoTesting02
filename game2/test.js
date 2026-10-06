// Headless solve test: node game2/test.js  (needs playwright)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + __dirname + '/index.html');
  const D = { U:[0,-1], D:[0,1], L:[-1,0], R:[1,0] };
  const run = async seq => { for (const c of seq) await p.keyboard.press({U:'ArrowUp',D:'ArrowDown',L:'ArrowLeft',R:'ArrowRight'}[c]); };
  const echo = () => p.keyboard.press('Enter');
  const won = () => p.evaluate(() => window.__echo.state.won);
  const res = {};
  // L1: ghost holds plate, then walk through door
  await run('RR'); await echo(); await run('DRRRRU'); res.l1 = await won();
  // L1 negative: without echo the door stays shut
  await p.keyboard.press('r'); await run('DRRRRU'); res.l1_noEcho_blocked = !(await won());
  await p.keyboard.press('r'); await run('RR'); await echo(); await run('DRRRRU');
  await p.keyboard.press('n');
  res.level2 = await p.evaluate(() => window.__echo.state.index);
  await run('RR'); await echo(); await run('DRRRRRU'); await echo(); await run('DRRRRRRDD'); res.l2 = await won();
  console.log(JSON.stringify(res), 'errors:', errs);
  await b.close();
  process.exit(res.l1 && res.l1_noEcho_blocked && res.level2 === 1 && res.l2 && !errs.length ? 0 : 1);
})();
