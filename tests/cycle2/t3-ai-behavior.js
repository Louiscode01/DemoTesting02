// T3 — AI behavior (deterministic, hook-driven). All ticks driven manually via
// test.setPaused(true) + test.step(dt, now); no wall-clock timing.
// Run: NODE_PATH=$(npm root -g) node tests/cycle2/t3-ai-behavior.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const FILE_URL = 'file://' + path.resolve(__dirname, '../../game/cycle2/index.html');

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
}

async function freshOnePlayerMatch(page) {
  await page.reload();
  await page.waitForFunction(() => !!window.__orbitDuel);
  await page.keyboard.press('Digit1');
  await page.evaluate(() => window.__orbitDuel.test.setPaused(true));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  try {
    await page.goto(FILE_URL);
    await page.waitForFunction(() => !!window.__orbitDuel);

    // ---- 1. Aim convergence ----
    await freshOnePlayerMatch(page);
    await page.evaluate(() => {
      const w = window.__orbitDuel;
      const ai = w.players[1], human = w.players[0];
      // AI within the orbit standoff band (r=200, in [120,260]) so it picks ENGAGE, not ORBIT;
      // human stationary and far enough away to be a clean bearing.
      ai.pos = { x: 650, y: 300 }; ai.vel = { x: 0, y: 0 }; ai.angle = 0;
      human.pos = { x: 150, y: 450 }; human.vel = { x: 0, y: 0 };
      ai.ai = { mode: 'orbit', timer: 0, desiredAngle: ai.angle, fireTimer: 0 };
    });
    const initialErr = await page.evaluate(() => {
      const w = window.__orbitDuel;
      const ai = w.players[1], human = w.players[0];
      const dx = human.pos.x - ai.pos.x, dy = human.pos.y - ai.pos.y;
      const desired = Math.atan2(dy, dx);
      let e = desired - ai.angle;
      while (e > Math.PI) e -= 2 * Math.PI;
      while (e <= -Math.PI) e += 2 * Math.PI;
      return Math.abs(e);
    });
    for (let i = 0; i < 60; i++) {
      await page.evaluate((t) => window.__orbitDuel.test.step(1 / 60, t), 1 + i / 60);
    }
    const finalErr = await page.evaluate(() => {
      const w = window.__orbitDuel;
      const ai = w.players[1], human = w.players[0];
      const dx = human.pos.x - ai.pos.x, dy = human.pos.y - ai.pos.y;
      const desired = Math.atan2(dy, dx);
      let e = desired - ai.angle;
      while (e > Math.PI) e -= 2 * Math.PI;
      while (e <= -Math.PI) e += 2 * Math.PI;
      return Math.abs(e);
    });
    const aimTol = await page.evaluate(() => window.__orbitDuel.constants.AI_AIM_TOLERANCE);
    assert(finalErr < initialErr, `expected aim error to decrease, ${initialErr} -> ${finalErr}`);
    assert(finalErr <= aimTol + 0.05, `expected AI aimed within tolerance, got err=${finalErr}, tol=${aimTol}`);
    console.log('T3.1 aim convergence: PASS', { initialErr, finalErr });

    // ---- 2. It shoots ----
    await freshOnePlayerMatch(page);
    await page.evaluate(() => {
      const w = window.__orbitDuel;
      const ai = w.players[1], human = w.players[0];
      ai.pos = { x: 700, y: 300 }; ai.vel = { x: 0, y: 0 }; ai.angle = Math.PI;
      human.pos = { x: 650, y: 300 }; human.vel = { x: 0, y: 0 };
    });
    let t = 1;
    for (let i = 0; i < 120; i++) { // 2s
      t += 1 / 60;
      await page.evaluate((t) => window.__orbitDuel.test.step(1 / 60, t), t);
    }
    const aiBullets = await page.evaluate(() => window.__orbitDuel.bullets.filter(b => b.owner === 'P2').length);
    assert(aiBullets >= 1, `expected AI to have fired at least one bullet, got ${aiBullets}`);
    console.log('T3.2 AI shoots: PASS', { aiBullets });

    // ---- 3. Star evasion ----
    await freshOnePlayerMatch(page);
    const dangerR = await page.evaluate(() => window.__orbitDuel.constants.AI_STAR_DANGER_R);
    await page.evaluate((dangerR) => {
      const w = window.__orbitDuel;
      const ai = w.players[1];
      // just inside danger radius, stationary, facing tangentially (not already fleeing,
      // but not the adversarial worst case of facing/moving straight at the star either)
      ai.pos = { x: 450 + (dangerR - 5), y: 300 };
      ai.vel = { x: 0, y: 0 };
      ai.angle = Math.PI / 2;
      ai.ai = { mode: 'orbit', timer: 999, desiredAngle: ai.angle, fireTimer: 0 }; // latch far from expiry
    }, dangerR);
    // one tick is enough to prove the latch bypass sets evade mode immediately
    await page.evaluate((t) => window.__orbitDuel.test.step(1 / 60, t), 1);
    const modeAfterOneTick = await page.evaluate(() => window.__orbitDuel.players[1].ai.mode);
    assert(modeAfterOneTick === 'evade', `expected evade mode on the very next tick, got ${modeAfterOneTick}`);
    const rBefore = await page.evaluate(() => {
      const w = window.__orbitDuel.players[1];
      return Math.hypot(w.pos.x - 450, w.pos.y - 300);
    });
    t = 1;
    // 1s: enough to correct heading and thrust clear of the danger radius, but short of
    // enough travel time to wrap around the arena edge (which would make raw pixel-space
    // distance-to-center misleading -- the ship is still "far" topologically after a wrap,
    // just no longer far in naive hypot(x,y) terms).
    for (let i = 0; i < 60; i++) {
      t += 1 / 60;
      await page.evaluate((t) => window.__orbitDuel.test.step(1 / 60, t), t);
    }
    const after = await page.evaluate((dangerR) => {
      const w = window.__orbitDuel.players[1];
      return { r: Math.hypot(w.pos.x - 450, w.pos.y - 300), alive: w.alive };
    }, dangerR);
    assert(after.r > rBefore, `expected AI to move away from the star, ${rBefore} -> ${after.r}`);
    assert(after.r > dangerR, `expected AI to clear the danger radius (${dangerR}) within 1s, got r=${after.r}`);
    assert(after.alive, `expected AI to survive evasion, alive=${after.alive}`);
    console.log('T3.3 star evasion: PASS', { rBefore, rAfter: after.r });

    // ---- 4. Survivability soak (30s simulated, human stationary and never firing) ----
    await freshOnePlayerMatch(page);
    await page.evaluate(() => {
      const w = window.__orbitDuel;
      w.players[0].pos = { x: 150, y: 150 };
      w.players[0].vel = { x: 0, y: 0 };
    });
    const soak = await page.evaluate((dangerR) => {
      const w = window.__orbitDuel;
      let t = 1;
      let starDeaths = 0;
      let inBandTicks = 0, sampledTicks = 0;
      const arenaDiag = Math.hypot(900, 600);
      for (let i = 0; i < 1800; i++) { // 30s @ 60Hz
        t += 1 / 60;
        // freeze P1 every tick so it never drifts/fires
        w.players[0].pos = { x: 150, y: 150 };
        w.players[0].vel = { x: 0, y: 0 };
        const wasAlive = w.players[1].alive;
        w.test.step(1 / 60, t);
        const nowAlive = w.players[1].alive;
        if (wasAlive && !nowAlive) starDeaths++;
        if (i % 10 === 0) {
          const p = w.players[1];
          const r = Math.hypot(p.pos.x - 450, p.pos.y - 300);
          sampledTicks++;
          if (r >= dangerR && r <= arenaDiag) inBandTicks++;
        }
      }
      return { starDeaths, inBandFrac: inBandTicks / sampledTicks };
    }, dangerR);
    const starDeaths = soak.starDeaths;
    const inBandFrac = soak.inBandFrac;
    assert(starDeaths <= 1, `expected AI star-deaths <= 1 over 30s soak, got ${starDeaths}`);
    assert(inBandFrac >= 0.9, `expected AI to stay outside danger radius >=90% of sampled ticks, got ${(inBandFrac * 100).toFixed(1)}%`);
    console.log('T3.4 survivability soak: PASS', { starDeaths, inBandFrac });

    // ---- 5. It is a real opponent (soft) ----
    const aiScore = await page.evaluate(() => window.__orbitDuel.players[1].score);
    const soft5 = aiScore >= 1;
    console.log(`T3.5 AI scored against stationary target in 30s: ${soft5 ? 'PASS' : 'SOFT-FAIL (tune AI_LEAD_FACTOR/AI_FIRE_RANGE)'} (score=${aiScore})`);

    // ---- 6. It is beatable (structural fairness invariants) ----
    const c = await page.evaluate(() => window.__orbitDuel.constants);
    assert(c.AI_FIRE_COOLDOWN >= c.FIRE_COOLDOWN, `AI_FIRE_COOLDOWN (${c.AI_FIRE_COOLDOWN}) must be >= FIRE_COOLDOWN (${c.FIRE_COOLDOWN})`);
    assert(c.AI_REACTION_DELAY > 0, `AI_REACTION_DELAY must be > 0, got ${c.AI_REACTION_DELAY}`);
    assert(c.AI_STAR_DANGER_R > c.STAR_RADIUS + c.SHIP_RADIUS, `AI_STAR_DANGER_R must clear star+ship radius`);
    assert(c.AI_STAR_DANGER_R < c.AI_ORBIT_MIN, `AI_STAR_DANGER_R must be < AI_ORBIT_MIN`);
    assert(c.AI_AIM_TOLERANCE < c.AI_THRUST_TOLERANCE, `AI_AIM_TOLERANCE must be < AI_THRUST_TOLERANCE`);
    assert(c.AI_ENGAGE_RANGE < c.AI_FIRE_RANGE, `AI_ENGAGE_RANGE must be < AI_FIRE_RANGE`);
    console.log('T3.6 fairness invariants: PASS');

    // ---- 7. Determinism ----
    async function scriptedRun() {
      await freshOnePlayerMatch(page);
      await page.evaluate(() => {
        const w = window.__orbitDuel;
        w.players[0].pos = { x: 300, y: 450 }; w.players[0].vel = { x: 10, y: -5 };
        w.players[1].pos = { x: 600, y: 200 }; w.players[1].vel = { x: -10, y: 5 };
      });
      let tt = 1;
      const trace = [];
      for (let i = 0; i < 180; i++) { // 3s
        tt += 1 / 60;
        await page.evaluate((tt) => window.__orbitDuel.test.step(1 / 60, tt), tt);
        if (i % 20 === 0) {
          const snap = await page.evaluate(() => {
            const p = window.__orbitDuel.players[1];
            return { x: p.pos.x, y: p.pos.y, angle: p.angle, mode: p.ai.mode };
          });
          trace.push(snap);
        }
      }
      return trace;
    }
    const traceA = await scriptedRun();
    const traceB = await scriptedRun();
    assert(traceA.length === traceB.length, 'trace length mismatch');
    for (let i = 0; i < traceA.length; i++) {
      const a = traceA[i], b = traceB[i];
      assert(Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.angle - b.angle) < 1e-6 && a.mode === b.mode,
        `determinism mismatch at sample ${i}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    }
    console.log('T3.7 determinism: PASS');

    assert(errors.length === 0, `expected zero console/page errors, got: ${JSON.stringify(errors)}`);
    console.log('T3 OVERALL: PASS');
  } catch (e) {
    console.error('T3 OVERALL: FAIL —', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
