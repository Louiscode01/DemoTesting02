// T1 — Regression: Cycle 1 behavior still intact in game/cycle2/index.html (2P local mode).
// Run: NODE_PATH=$(npm root -g) node tests/cycle2/t1-regression.js
'use strict';
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '../..');
const FILE_URL = 'file://' + path.resolve(REPO_ROOT, 'game/cycle2/index.html');

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
}

(async () => {
  // Audit guard: Cycle 1's file must remain byte-for-byte unmodified.
  try {
    execSync('git diff --quiet -- game/index.html', { cwd: REPO_ROOT });
    console.log('Audit guard: game/index.html unmodified — PASS');
  } catch (e) {
    console.error('Audit guard: game/index.html HAS BEEN MODIFIED — FAIL');
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await page.goto(FILE_URL);
    await page.waitForFunction(() => !!window.__orbitDuel);

    // enter 2P local mode
    await page.keyboard.press('Digit2');
    let state = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode,
      p1: window.__orbitDuel.players[0].controller, p2: window.__orbitDuel.players[1].controller
    }));
    assert(state.phase === 'playing', `expected playing, got ${state.phase}`);
    assert(state.mode === '2p', `expected 2p, got ${state.mode}`);
    assert(state.p1 === 'human' && state.p2 === 'human', `expected both human in 2p, got ${state.p1}/${state.p2}`);

    // canvas has non-trivial pixel content
    await page.waitForTimeout(150);
    const nonBackgroundPixels = await page.evaluate(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 10 || d[i + 1] > 12 || d[i + 2] > 20) n++;
      }
      return n;
    });
    assert(nonBackgroundPixels > 500, `expected non-trivial rendered content, got ${nonBackgroundPixels} non-bg pixels`);

    // held P1 thrust measurably moves the ship
    const p1PosBefore = await page.evaluate(() => ({ ...window.__orbitDuel.players[0].pos }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    const p1PosAfter = await page.evaluate(() => ({ ...window.__orbitDuel.players[0].pos }));
    const dist = Math.hypot(p1PosAfter.x - p1PosBefore.x, p1PosAfter.y - p1PosBefore.y);
    assert(dist > 5, `expected P1 to move measurably under thrust, moved ${dist.toFixed(2)}px`);

    // P2 human controls respond too (the intent refactor's most likely regression)
    const p2PosBefore = await page.evaluate(() => ({ ...window.__orbitDuel.players[1].pos }));
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowUp');
    const p2PosAfter = await page.evaluate(() => ({ ...window.__orbitDuel.players[1].pos }));
    const dist2 = Math.hypot(p2PosAfter.x - p2PosBefore.x, p2PosAfter.y - p2PosBefore.y);
    assert(dist2 > 5, `expected P2 to move measurably under thrust, moved ${dist2.toFixed(2)}px`);

    // firing increases bullet count
    const bulletsBefore = await page.evaluate(() => window.__orbitDuel.bullets.length);
    await page.keyboard.down('Space');
    await page.waitForTimeout(80);
    await page.keyboard.up('Space');
    const bulletsAfter = await page.evaluate(() => window.__orbitDuel.bullets.length);
    assert(bulletsAfter > bulletsBefore, `expected bullet count to increase, ${bulletsBefore} -> ${bulletsAfter}`);

    // extended mixed-input session near the star: no errors, ships in-bounds, bullets bounded
    for (let i = 0; i < 60; i++) {
      await page.keyboard.down('KeyD');
      await page.keyboard.down('KeyW');
      if (i % 5 === 0) await page.keyboard.press('Space');
      if (i % 7 === 0) await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
    await page.keyboard.up('KeyD');
    await page.keyboard.up('KeyW');

    const soak = await page.evaluate(() => {
      const w = window.__orbitDuel;
      return {
        bulletCount: w.bullets.length,
        positions: w.players.map(p => p.pos)
      };
    });
    const W = 900, H = 600;
    for (const pos of soak.positions) {
      assert(pos.x >= -1 && pos.x <= W + 1 && pos.y >= -1 && pos.y <= H + 1,
        `expected ship in-bounds after wrap, got ${JSON.stringify(pos)}`);
    }
    assert(soak.bulletCount < 50, `expected bounded bullet count (no runaway accumulation), got ${soak.bulletCount}`);

    assert(errors.length === 0, `expected zero console/page errors, got: ${JSON.stringify(errors)}`);

    console.log('T1 OVERALL: PASS');
  } catch (e) {
    console.error('T1 OVERALL: FAIL —', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
