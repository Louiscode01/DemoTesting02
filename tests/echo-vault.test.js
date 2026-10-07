// Run: NODE_PATH=<dir containing playwright> node tests/echo-vault.test.js
const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '../game/echo-vault/index.html');
const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log(ok ? 'PASS' : 'FAIL', name, info ?? ''); };

async function walk(page, targets) {
  for (const t of targets) {
    for (let i = 0; i < 400; i++) {
      const p = await page.evaluate(() => ({ x: __echoVault.player.x, y: __echoVault.player.y, s: __echoVault.state }));
      if (p.s !== 'playing') return;
      const dx = t.x - p.x, dy = t.y - p.y;
      if (Math.hypot(dx, dy) < 4) break;
      const want = [];
      if (dx > 3) want.push('KeyD'); if (dx < -3) want.push('KeyA');
      if (dy > 3) want.push('KeyS'); if (dy < -3) want.push('KeyW');
      for (const k of ['KeyA','KeyD','KeyW','KeyS']) want.includes(k) ? await page.keyboard.down(k) : await page.keyboard.up(k);
      await page.waitForTimeout(30);
    }
  }
  for (const k of ['KeyA','KeyD','KeyW','KeyS']) await page.keyboard.up(k);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const errors = [];
  const open = async q => { const pg = await browser.newPage(); pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => m.type() === 'error' && errors.push(m.text())); await pg.goto(url + q); await pg.waitForTimeout(200); return pg; };

  // 1: load, dark at start, ping reveals walls
  let pg = await open('?seed=42&guards=0');
  const px = async () => pg.evaluate(() => { const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i+1] + d[i+2] > 60) n++; return n; });
  const before = await px();
  await pg.keyboard.press('Space'); await pg.waitForTimeout(500);
  const after = await px();
  check('ping reveals walls (pixels lit)', after > before + 200, `${before} -> ${after}`);
  const pl = await pg.evaluate(() => __echoVault.pingsLeft); check('ping decrements counter', pl === 9, String(pl));
  await pg.waitForTimeout(3500);
  check('reveal fades back to dark', await px() < after / 3, `${await px()}`);

  // 2: end-to-end level clear via BFS solution
  await pg.evaluate(() => {});
  const path1 = await pg.evaluate(() => __echoVault.solvePath());
  await walk(pg, path1);
  check('reaches exit -> levelDone', await pg.evaluate(() => __echoVault.state) === 'levelDone');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(100);
  check('Enter advances to level 2 (bigger maze)', await pg.evaluate(() => [__echoVault.level, __echoVault.W]).then(a => a[0] === 2 && a[1] === 9), JSON.stringify(await pg.evaluate(() => [__echoVault.level, __echoVault.W])));

  // 3: wall collision — can't walk through the wall into top boundary
  await pg.keyboard.down('KeyW'); await pg.waitForTimeout(600); await pg.keyboard.up('KeyW');
  check('player blocked by boundary wall', await pg.evaluate(() => __echoVault.player.y) > 4);
  await pg.close();

  // 4: guard investigates ping, and catches idle player -> restart
  pg = await open('?seed=7&guards=1&level=2');
  await pg.evaluate(() => { const g = __echoVault.guards[0], p = __echoVault.player; g.x = p.x + 100; g.y = p.y; });
  await pg.keyboard.press('Space'); await pg.waitForTimeout(100);
  check('guard enters investigate mode on ping', await pg.evaluate(() => __echoVault.guards[0].mode) === 'investigate');
  await pg.waitForTimeout(6000);
  const st = await pg.evaluate(() => __echoVault.state);
  check('guard can catch player (state caught) or still hunting', st === 'caught' || st === 'playing', st);
  if (st === 'caught') { await pg.keyboard.press('KeyR'); await pg.waitForTimeout(100); check('R restarts attempt', await pg.evaluate(() => __echoVault.state) === 'playing'); }
  await pg.close();

  check('no console/page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  process.exit(results.every(r => r.ok) ? 0 : 1);
})();
