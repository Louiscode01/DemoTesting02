'use strict';
// Run: node tests/slingshot.e2e.js  (needs `playwright` resolvable; see docs/test-results-cycle2.md)
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('playwright-core')); }

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../game/slingshot/index.html'));
  const results = {};

  // 1. Renders non-trivial content
  results.pixels = await page.evaluate(() => {
    const c = document.getElementById('game'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i+1] + d[i+2] > 60) n++; return n;
  });

  // 2. Play 3 levels using the generator's verified solution through the real fire path
  for (let i = 1; i <= 3; i++) {
    await page.evaluate(() => { const g = window.__slingshot; g.fire(g.level.solution.angle, g.level.solution.power); });
    await page.waitForFunction(() => window.__slingshot.mode === 'result', null, { timeout: 15000 });
    results['level' + i + 'Score'] = await page.evaluate(() => window.__slingshot.state.score);
    await page.evaluate(() => window.__slingshot.advance());
  }
  results.levelAfter = await page.evaluate(() => window.__slingshot.levelNumber);

  // 3. Fail path: 5 shots aimed away -> gameover, then retry via real keyboard R
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction(() => window.__slingshot.mode === 'aim', null, { timeout: 15000 });
    await page.evaluate(() => window.__slingshot.fire(Math.PI, 0.5));
  }
  await page.waitForFunction(() => window.__slingshot.mode === 'gameover', null, { timeout: 15000 });
  await page.keyboard.press('KeyR');
  results.afterRetry = await page.evaluate(() => ({ mode: window.__slingshot.mode, shots: window.__slingshot.state.shotsUsed }));

  // 4. Real mouse drag launches a shot
  const box = await page.locator('#game').boundingBox();
  const start = await page.evaluate(() => window.__slingshot.level.start);
  await page.mouse.move(box.x + start.x - 60, box.y + start.y);
  await page.mouse.down();
  await page.mouse.move(box.x + start.x - 80, box.y + start.y + 5);
  await page.mouse.up();
  results.afterDrag = await page.evaluate(() => ({ mode: window.__slingshot.mode, shots: window.__slingshot.state.shotsUsed }));

  results.errors = errors;
  console.log(JSON.stringify(results, null, 2));
  const ok = errors.length === 0 && results.pixels > 5000 && results.levelAfter === 4 &&
    results.afterRetry.mode === 'aim' && results.afterRetry.shots === 0 && results.afterDrag.shots === 1;
  console.log(ok ? 'E2E PASS' : 'E2E FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
