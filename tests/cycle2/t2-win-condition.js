// T2 — Win condition end-to-end (TOP PRIORITY — closes Cycle 1's test gap)
// Run: NODE_PATH=$(npm root -g) node tests/cycle2/t2-win-condition.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const FILE_URL = 'file://' + path.resolve(__dirname, '../../game/cycle2/index.html');

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
}

async function runOneMode(page, digit, mode, winnerId) {
  await page.reload();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.waitForFunction(() => !!window.__orbitDuel);
  let state = await page.evaluate(() => ({ phase: window.__orbitDuel.phase }));
  assert(state.phase === 'menu', `expected menu phase on load, got ${state.phase}`);

  await page.keyboard.press(digit);
  state = await page.evaluate(() => ({
    phase: window.__orbitDuel.phase,
    mode: window.__orbitDuel.mode,
    p2controller: window.__orbitDuel.players[1].controller
  }));
  assert(state.phase === 'playing', `expected playing after ${digit}, got ${state.phase}`);
  assert(state.mode === mode, `expected mode ${mode}, got ${state.mode}`);
  const expectedP2 = mode === '1p' ? 'ai' : 'human';
  assert(state.p2controller === expectedP2, `expected P2 controller ${expectedP2}, got ${state.p2controller}`);

  await page.evaluate(() => window.__orbitDuel.test.setPaused(true));

  const winScore = await page.evaluate(() => window.__orbitDuel.constants.WIN_SCORE);
  const respawnDelay = await page.evaluate(() => window.__orbitDuel.constants.RESPAWN_DELAY);

  const shooterId = winnerId;
  const victimId = winnerId === 'P1' ? 'P2' : 'P1';

  function meanLumaScript() {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      n++;
    }
    return sum / n;
  }

  let t = 1000;
  let lumaBeforeFinalHit = null;
  for (let i = 1; i <= winScore; i++) {
    if (i === winScore) {
      lumaBeforeFinalHit = await page.evaluate(meanLumaScript);
    }

    await page.evaluate(({ shooterId, victimId, t }) => {
      window.__orbitDuel.test.registerHit(shooterId, victimId, t);
    }, { shooterId, victimId, t });

    const afterHit = await page.evaluate((shooterId) => {
      const p = window.__orbitDuel.players.find(p => p.id === shooterId);
      return { score: p.score, phase: window.__orbitDuel.phase };
    }, shooterId);
    assert(afterHit.score === i, `expected ${shooterId} score ${i}, got ${afterHit.score}`);
    if (i < winScore) {
      assert(afterHit.phase === 'playing', `expected phase 'playing' after hit ${i}/${winScore}, got ${afterHit.phase} (ended early)`);
    }

    // advance past respawn delay and step so the victim actually respawns through the normal path,
    // except after the final (winning) hit: phase is now 'gameover' and step() is a no-op there,
    // so stepping would only re-render the frozen (correct) end-of-match state.
    t += respawnDelay + 0.1;
    await page.evaluate(({ dt, t }) => window.__orbitDuel.test.step(dt, t), { dt: 1 / 60, t });
  }

  const finalState = await page.evaluate((shooterId) => ({
    phase: window.__orbitDuel.phase,
    winner: window.__orbitDuel.winner,
    score: window.__orbitDuel.players.find(p => p.id === shooterId).score
  }), shooterId);
  assert(finalState.phase === 'gameover', `expected gameover, got ${finalState.phase}`);
  assert(finalState.winner === winnerId, `expected winner ${winnerId}, got ${finalState.winner}`);
  assert(finalState.score === winScore, `expected final score ${winScore}, got ${finalState.score}`);

  // overlay actually drawn: luminance drops (dark 0.55-alpha overlay over the scene) versus
  // immediately before the winning hit, plus winner-color pixel presence in the label band below.
  const lumaAfterFinalHit = await page.evaluate(meanLumaScript);
  assert(
    lumaAfterFinalHit < lumaBeforeFinalHit - 1,
    `expected overlay to darken the scene (before=${lumaBeforeFinalHit}, after=${lumaAfterFinalHit})`
  );

  const labelBand = await page.evaluate(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const d = ctx.getImageData(0, H / 2 - 30, W, 40).data;
    let nonBg = 0;
    for (let i = 0; i < d.length; i += 4) {
      // background is #05060a-ish or the semi-transparent black overlay; count clearly bright pixels
      if (d[i] + d[i + 1] + d[i + 2] > 200) nonBg++;
    }
    return nonBg;
  });
  assert(labelBand > 20, `expected the win-label band to contain bright (label) pixels, got ${labelBand}`);

  // restart via R -- exercises the real restart path
  await page.keyboard.press('KeyR');
  const afterRestart = await page.evaluate(() => {
    const w = window.__orbitDuel;
    return {
      phase: w.phase,
      mode: w.mode,
      winner: w.winner,
      scores: w.players.map(p => p.score),
      bullets: w.bullets.length,
      particles: w.particles.length,
      alive: w.players.map(p => p.alive),
      vel: w.players.map(p => Math.hypot(p.vel.x, p.vel.y))
    };
  });
  assert(afterRestart.phase === 'playing', `expected playing after restart, got ${afterRestart.phase}`);
  assert(afterRestart.mode === mode, `expected mode preserved (${mode}) after restart, got ${afterRestart.mode}`);
  assert(afterRestart.winner === null, `expected winner cleared after restart, got ${afterRestart.winner}`);
  assert(afterRestart.scores[0] === 0 && afterRestart.scores[1] === 0, `expected both scores 0 after restart, got ${afterRestart.scores}`);
  assert(afterRestart.bullets === 0, `expected 0 bullets after restart, got ${afterRestart.bullets}`);
  assert(afterRestart.particles === 0, `expected 0 particles after restart, got ${afterRestart.particles}`);
  assert(afterRestart.alive[0] && afterRestart.alive[1], `expected both ships alive after restart, got ${afterRestart.alive}`);
  assert(afterRestart.vel[0] < 0.001 && afterRestart.vel[1] < 0.001, `expected zero velocity after restart, got ${afterRestart.vel}`);

  await page.evaluate(() => window.__orbitDuel.test.setPaused(false));

  assert(errors.length === 0, `expected zero console/page errors, got: ${JSON.stringify(errors)}`);

  return { errors };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(FILE_URL);
    const r1 = await runOneMode(page, 'Digit1', '1p', 'P1');
    console.log('T2a (1P vs AI, P1 wins) PASS — errors:', r1.errors);
    const r2 = await runOneMode(page, 'Digit2', '2p', 'P2');
    console.log('T2b (2P local, P2 wins) PASS — errors:', r2.errors);
    console.log('T2 OVERALL: PASS');
  } catch (e) {
    console.error('T2 OVERALL: FAIL —', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
