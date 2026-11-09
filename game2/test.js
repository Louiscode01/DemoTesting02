// Run: node game2/test.js  (uses Playwright headless Chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  const R = (s) => s.split('').map(c => ({R:'ArrowRight',L:'ArrowLeft',U:'ArrowUp',D:'ArrowDown',W:' ',F:'Enter'}[c]));
  const solutions = [
    ['RRF', 'RRRRRR'],                       // L1
    ['RRF', 'RRRRRRF', 'RRRRRRRRRR'],            // L2: ghost a, ghost b (A open via ghost a), then through both
    ['DRF', 'DDRRRRRRRUU'],                  // L3: ghost to plate, then around through door
  ];
  const results = [];
  for (let i = 0; i < solutions.length; i++) {
    await p.evaluate(i => Echo.load(i), i);
    for (const seg of solutions[i]) for (const k of R(seg)) await p.keyboard.press(k);
    const won = await p.evaluate(() => Echo.won);
    results.push([i + 1, won]);
  }
  // negative: door blocks without ghost
  await p.evaluate(() => Echo.load(0));
  for (const k of R('RRRRRR')) await p.keyboard.press(k);
  const blocked = await p.evaluate(() => !Echo.won && Echo.player.x === 4);
  console.log('level results', JSON.stringify(results), 'doorBlocksWithoutGhost', blocked, 'errors', errs);
  await b.close();
  process.exit(results.every(r => r[1]) && blocked && !errs.length ? 0 : 1);
})();
