// Run: NODE_PATH=$(npm root -g) node tests/echo-cavern.test.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../game2/index.html'));
  const results = [];
  const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (info ? ' - ' + info : '')); };

  await page.evaluate(() => __echo.newGame(42));
  // 1. maze solvable for several levels
  const solv = await page.evaluate(() => {
    const out = [];
    for (let lvl = 1; lvl <= 12; lvl++) {
      __echo.state.level = lvl; __echo.startLevel();
      const g = __echo.grid;
      out.push(!!__echo.bfsPath(g[0], __echo.state.exit));
    }
    return out;
  });
  check('mazes solvable (levels 1-12)', solv.every(Boolean));

  await page.evaluate(() => __echo.newGame(42));
  // 2. movement
  const p0 = await page.evaluate(() => ({ ...__echo.state.player }));
  await page.keyboard.down('d'); await page.waitForTimeout(500); await page.keyboard.up('d');
  const p1 = await page.evaluate(() => ({ ...__echo.state.player }));
  check('player moves', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 5, JSON.stringify([p0, p1]));

  // 3. ping reveals walls
  await page.keyboard.press('Space'); await page.waitForTimeout(500);
  const revealed = await page.evaluate(() => __echo.grid.reduce((n, c) => n + c.r.filter(v => v > 0).length, 0));
  check('ping reveals walls', revealed > 0, revealed + ' wall segments');

  // 4. hunter reacts to ping
  const hunterReact = await page.evaluate(() => {
    __echo.newGame(7);
    const s = __echo.state; s.hunters.forEach(h => { const c = __echo.cellCenter(__echo.grid[1]); h.x = c.x; h.y = c.y; h.path = []; });
    __echo.ping();
    return s.hunters.every(h => h.path.length > 0 || h.alert > 0);
  });
  check('hunter alerted by ping', hunterReact);

  // 5. hunter touch costs life
  const life = await page.evaluate(() => {
    __echo.newGame(7);
    const s = __echo.state; s.hunters[0].x = s.player.x; s.hunters[0].y = s.player.y;
    const before = s.lives; __echo.update(0.016); return [before, s.lives];
  });
  check('hunter contact costs a life', life[1] === life[0] - 1, life.join('->'));

  // 6. reaching exit advances level
  const adv = await page.evaluate(() => {
    __echo.newGame(7);
    const s = __echo.state; s.hunters = [];
    const c = __echo.cellCenter(s.exit); s.player.x = c.x; s.player.y = c.y;
    __echo.update(0.016); return [s.level, s.score];
  });
  check('exit advances level and scores', adv[0] === 2 && adv[1] > 0, adv.join(','));

  // 7. game over after 3 lives
  const over = await page.evaluate(() => {
    __echo.newGame(3);
    for (let i = 0; i < 3; i++) { const s = __echo.state; s.hunters[0].x = s.player.x; s.hunters[0].y = s.player.y; __echo.update(0.016); }
    return __echo.state.phase;
  });
  check('game over after 3 lives', over === 'over', over);

  // 8. walls block player
  // use real input: hold left at the start cell, player must stay inside the maze bounds
  await page.evaluate(() => __echo.newGame(11));
  await page.keyboard.down('a'); await page.waitForTimeout(800); await page.keyboard.up('a');
  const inside = await page.evaluate(() => !!__echo.worldToCell(__echo.state.player.x, __echo.state.player.y));
  check('outer wall blocks player', inside);

  check('no console/page errors', errors.length === 0, errors.join('; '));
  await browser.close();
  process.exit(results.every(r => r.ok) ? 0 : 1);
})();
