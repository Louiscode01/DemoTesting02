// T4 — Mode select and navigation.
// Run: NODE_PATH=$(npm root -g) node tests/cycle2/t4-mode-select.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const FILE_URL = 'file://' + path.resolve(__dirname, '../../game/cycle2/index.html');

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    // Fresh load -> menu, world frozen behind it.
    await page.goto(FILE_URL);
    await page.waitForFunction(() => !!window.__orbitDuel);
    let state = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode,
      pos: window.__orbitDuel.players.map(p => ({ ...p.pos }))
    }));
    assert(state.phase === 'menu', `expected menu on load, got ${state.phase}`);
    assert(state.mode === null, `expected mode null in menu, got ${state.mode}`);
    await page.waitForTimeout(1000);
    const posAfter = await page.evaluate(() => window.__orbitDuel.players.map(p => ({ ...p.pos })));
    for (let i = 0; i < 2; i++) {
      const d = Math.hypot(posAfter[i].x - state.pos[i].x, posAfter[i].y - state.pos[i].y);
      assert(d < 0.01, `expected no ship movement while in menu, ship ${i} moved ${d}`);
    }

    // menu renders non-trivial pixel content
    const menuPixels = await page.evaluate(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 10 || d[i + 1] > 12 || d[i + 2] > 20) n++;
      return n;
    });
    assert(menuPixels > 500, `expected non-blank menu screen, got ${menuPixels} non-bg pixels`);

    // Digit1 -> 1p vs AI
    await page.keyboard.press('Digit1');
    state = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode,
      p2: window.__orbitDuel.players[1].controller
    }));
    assert(state.phase === 'playing' && state.mode === '1p' && state.p2 === 'ai',
      `Digit1 path failed: ${JSON.stringify(state)}`);

    // fresh load, Digit2 -> 2p local
    await page.reload();
    await page.waitForFunction(() => !!window.__orbitDuel);
    await page.keyboard.press('Digit2');
    state = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode,
      p2: window.__orbitDuel.players[1].controller
    }));
    assert(state.phase === 'playing' && state.mode === '2p' && state.p2 === 'human',
      `Digit2 path failed: ${JSON.stringify(state)}`);

    // fresh load, ArrowDown then Enter -> reaches 2p (arrow+Enter path == same startMatch)
    await page.reload();
    await page.waitForFunction(() => !!window.__orbitDuel);
    await page.keyboard.press('ArrowDown'); // highlight flips 1p -> 2p
    await page.keyboard.press('Enter');
    state = await page.evaluate(() => ({ phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode }));
    assert(state.phase === 'playing' && state.mode === '2p',
      `ArrowDown+Enter path failed: ${JSON.stringify(state)}`);
    const scrollY = await page.evaluate(() => window.scrollY);
    assert(scrollY === 0, `expected Enter not to scroll the page, scrollY=${scrollY}`);

    // Escape from playing -> menu; scores/bullets cleared; new match starts clean
    await page.keyboard.down('Space');
    await page.waitForTimeout(80);
    await page.keyboard.up('Space');
    await page.keyboard.press('Escape');
    state = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, mode: window.__orbitDuel.mode,
      bullets: window.__orbitDuel.bullets.length,
      scores: window.__orbitDuel.players.map(p => p.score)
    }));
    assert(state.phase === 'menu', `expected menu after Escape, got ${state.phase}`);
    assert(state.mode === null, `expected mode cleared after Escape, got ${state.mode}`);
    assert(state.bullets === 0, `expected bullets cleared after Escape, got ${state.bullets}`);
    assert(state.scores[0] === 0 && state.scores[1] === 0, `expected scores cleared, got ${state.scores}`);

    await page.keyboard.press('Digit1');
    const freshMatch = await page.evaluate(() => ({
      phase: window.__orbitDuel.phase, bullets: window.__orbitDuel.bullets.length,
      scores: window.__orbitDuel.players.map(p => p.score)
    }));
    assert(freshMatch.phase === 'playing' && freshMatch.bullets === 0 &&
      freshMatch.scores[0] === 0 && freshMatch.scores[1] === 0,
      `expected clean state for new match after menu round-trip, got ${JSON.stringify(freshMatch)}`);

    assert(errors.length === 0, `expected zero console/page errors, got: ${JSON.stringify(errors)}`);
    console.log('T4 OVERALL: PASS');
  } catch (e) {
    console.error('T4 OVERALL: FAIL —', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
