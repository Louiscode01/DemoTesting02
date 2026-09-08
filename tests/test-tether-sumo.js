// Automated smoke/e2e/mechanics tests for game/tether-sumo/index.html
// Run: node tests/test-tether-sumo.js
//
// Environment overrides (all optional -- the defaults are the original cloud
// sandbox paths, so existing CI keeps working unchanged):
//   PLAYWRIGHT_MODULE   path/name of the playwright module to require
//   PW_CHROMIUM         path to the chromium / headless-shell executable
//   PW_EXTRA_ARGS       comma-separated extra chromium args (e.g. --single-process)
//   TETHER_SUMO_GAME    path to the game HTML file under test
const path = require('path');

function loadChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    '/opt/node22/lib/node_modules/playwright',
    'playwright',
    'playwright-core'
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c).chromium; } catch (e) { /* try next */ }
  }
  throw new Error('No playwright module found. Tried: ' + candidates.join(', '));
}
const chromium = loadChromium();

const GAME_PATH = process.env.TETHER_SUMO_GAME ||
  path.resolve(__dirname, '..', 'game', 'tether-sumo', 'index.html');
const CHROMIUM_PATH = process.env.PW_CHROMIUM ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const EXTRA_ARGS = (process.env.PW_EXTRA_ARGS || '').split(',').filter(Boolean);

// One browser per test rather than one shared browser for the whole run. Some
// sandboxes can only run chromium with --single-process, where the browser and
// the renderer are the same process and closing the last page tears the whole
// browser down -- which broke every test after the first. Per-test browsers are
// also better isolation, and cost little at this suite size.
async function withPage(fn) {
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', ...EXTRA_ARGS]
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('file://' + GAME_PATH);
    return await fn(page, errors);
  } finally {
    await browser.close();
  }
}

const results = [];

async function main() {
  // ---------- Test 1: Load + basic interaction smoke test ----------
  results.push(await withPage(async (page, errors) => {
    await page.waitForTimeout(300);

    const hookExists = await page.evaluate(() => !!window.__tetherSumo);
    const pixelInfo = await page.evaluate(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBg = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 5 || data[i + 1] !== 6 || data[i + 2] !== 10) nonBg++;
      }
      return nonBg;
    });

    const p1Before = await page.evaluate(() => ({ ...window.__tetherSumo.players[0].pos }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    const p1After = await page.evaluate(() => ({ ...window.__tetherSumo.players[0].pos }));
    const dist = Math.hypot(p1After.x - p1Before.x, p1After.y - p1Before.y);

    return {
      test: 'Load + basic interaction smoke test',
      pass: errors.length === 0 && hookExists && pixelInfo > 1000 && dist > 5,
      details: { errors, hookExists, nonBackgroundPixels: pixelInfo, p1MovedDistance: dist.toFixed(1) + 'px' }
    };
  }));

  // ---------- Test 2: No-input soak test (anti-stalemate drift resolves a round) ----------
  results.push(await withPage(async (page, errors) => {
    // Wait up to 25s of wall-clock for a round to resolve with zero input.
    let resolved = false;
    let waited = 0;
    while (waited < 25000) {
      await page.waitForTimeout(1000);
      waited += 1000;
      resolved = await page.evaluate(() => window.__tetherSumo.roundOver || window.__tetherSumo.matchOver);
      if (resolved) break;
    }

    return {
      test: 'No-input soak test (anti-stalemate drift)',
      pass: errors.length === 0 && resolved,
      details: { errors, resolvedAfterMs: waited, resolved }
    };
  }));

  // ---------- Test 3: Round/match win-condition + restart end-to-end test ----------
  results.push(await withPage(async (page, errors) => {
    // Drive P2 (arrow keys) hard away from center repeatedly to stretch the tether
    // to max and snap back into P1, forcing eliminations. Alternate outward bursts
    // with brief pauses so the spring snap does the work, across multiple rounds.
    let roundWinsSeen = [];
    let matchOver = false;
    const deadline = Date.now() + 45000;

    while (Date.now() < deadline && !matchOver) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(400);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(700); // let spring snap happen

      const state = await page.evaluate(() => ({
        matchOver: window.__tetherSumo.matchOver,
        p1Wins: window.__tetherSumo.players[0].roundWins,
        p2Wins: window.__tetherSumo.players[1].roundWins
      }));
      roundWinsSeen.push(state.p1Wins + state.p2Wins);
      if (state.matchOver) { matchOver = true; break; }
    }

    const finalState = await page.evaluate(() => ({
      matchOver: window.__tetherSumo.matchOver,
      matchWinner: window.__tetherSumo.matchWinner,
      p1Wins: window.__tetherSumo.players[0].roundWins,
      p2Wins: window.__tetherSumo.players[1].roundWins
    }));

    // Test restart: press R, confirm state resets.
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(200);
    const afterRestart = await page.evaluate(() => ({
      matchOver: window.__tetherSumo.matchOver,
      p1Wins: window.__tetherSumo.players[0].roundWins,
      p2Wins: window.__tetherSumo.players[1].roundWins
    }));

    const roundsProgressed = Math.max(...roundWinsSeen, 0) > 0;

    return {
      test: 'Round/match win-condition + restart end-to-end test',
      pass: errors.length === 0 && roundsProgressed && finalState.matchOver === true &&
            (finalState.p1Wins >= 3 || finalState.p2Wins >= 3) &&
            afterRestart.matchOver === false && afterRestart.p1Wins === 0 && afterRestart.p2Wins === 0,
      details: { errors, finalState, afterRestart, roundWinsSeenSamples: roundWinsSeen.slice(-5) }
    };
  }));

  // ---------- Test 4: Body check transfers momentum (ship-vs-ship collision) ----------
  results.push(await withPage(async (page, errors) => {
    // Park both ships at the arena centre, well inside the tether's rest length so
    // the rope is slack and cannot contaminate the measurement, then ram P1 into a
    // stationary P2 head-on. Equal masses at restitution 0.9 should hand P2 ~95% of
    // P1's speed and leave P1 nearly stopped.
    const before = await page.evaluate(() => {
      const g = window.__tetherSumo;
      const C = g.constants.CENTER;
      const [p1, p2] = g.players;
      p1.pos.x = C.x - 15; p1.pos.y = C.y; p1.vel.x = 220; p1.vel.y = 0;
      p2.pos.x = C.x + 15; p2.pos.y = C.y; p2.vel.x = 0;   p2.vel.y = 0;
      return { bodyChecks: g.bodyCheckCount, separation: 30 };
    });

    await page.waitForTimeout(300);

    const after = await page.evaluate(() => {
      const g = window.__tetherSumo;
      const [p1, p2] = g.players;
      return {
        bodyChecks: g.bodyCheckCount,
        p1VelX: p1.vel.x,
        p2VelX: p2.vel.x,
        separation: Math.hypot(p2.pos.x - p1.pos.x, p2.pos.y - p1.pos.y),
        minSeparation: g.constants.SHIP_RADIUS * 2,
        roundOver: g.roundOver
      };
    });

    const collided = after.bodyChecks > before.bodyChecks;
    const momentumTransferred = after.p2VelX > 150 && after.p2VelX > after.p1VelX;
    const noSinkThrough = after.separation >= after.minSeparation - 0.5;

    return {
      test: 'Body check transfers momentum (ship-vs-ship collision)',
      pass: errors.length === 0 && collided && momentumTransferred && noSinkThrough &&
            Number.isFinite(after.p1VelX) && Number.isFinite(after.p2VelX),
      details: { errors, collided, momentumTransferred, noSinkThrough, before, after }
    };
  }));

  // ---------- Test 5: Overlapping ships separate instead of sinking through ----------
  results.push(await withPage(async (page, errors) => {
    // Force a deep overlap (2px apart, i.e. 18px inside the 20px contact distance)
    // with zero relative velocity: the positional de-overlap alone must push them
    // back out to the contact distance without producing NaN or a permanent stick.
    await page.evaluate(() => {
      const g = window.__tetherSumo;
      const C = g.constants.CENTER;
      const [p1, p2] = g.players;
      p1.pos.x = C.x - 1; p1.pos.y = C.y; p1.vel.x = 0; p1.vel.y = 0;
      p2.pos.x = C.x + 1; p2.pos.y = C.y; p2.vel.x = 0; p2.vel.y = 0;
    });

    await page.waitForTimeout(250);

    const after = await page.evaluate(() => {
      const g = window.__tetherSumo;
      const [p1, p2] = g.players;
      return {
        separation: Math.hypot(p2.pos.x - p1.pos.x, p2.pos.y - p1.pos.y),
        minSeparation: g.constants.SHIP_RADIUS * 2,
        p1Pos: { ...p1.pos },
        p2Pos: { ...p2.pos }
      };
    });

    const finite = [after.p1Pos.x, after.p1Pos.y, after.p2Pos.x, after.p2Pos.y].every(Number.isFinite);

    return {
      test: 'Overlapping ships separate (no sink-through / NaN)',
      pass: errors.length === 0 && finite && after.separation >= after.minSeparation - 0.5,
      details: { errors, finite, after }
    };
  }));

  // ---------- Test 6: Tether is pull-only (a rope never pushes) ----------
  results.push(await withPage(async (page, errors) => {
    // Two things must hold. (1) The tether force is never negative on any frame --
    // a negative pull is a push. (2) The raw spring+damping sum DOES go negative
    // during an ordinary snap-back, which is what makes the pull-only clamp
    // load-bearing rather than dead code.
    //
    // Note on how the pathological state is reached: it needs SMALL stretch with
    // HIGH closing speed, which is the tail of a free recoil. Holding both players
    // on thrust never gets there -- they drive each other outward and hit the wall
    // first -- so this test seeds a stretched-at-rest rope and lets the game's own
    // spring dynamics do the recoil, then also checks emergent burst-and-coast play.

    // Per-frame minimum, sampled inside the page: polling from Node would miss
    // frames, and the negative window is only a handful of frames wide.
    await page.evaluate(() => {
      window.__minTetherForce = Infinity;
      (function tick() {
        window.__minTetherForce = Math.min(window.__minTetherForce, window.__tetherSumo.tetherForce);
        requestAnimationFrame(tick);
      })();
    });

    // (a) Seeded free recoils: stretch the rope to 100px at rest and release.
    const suppressedBefore = await page.evaluate(() => window.__tetherSumo.ropePushSuppressedCount);
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const g = window.__tetherSumo;
        const C = g.constants.CENTER;
        const [p1, p2] = g.players;
        p1.pos.x = C.x - 95; p1.pos.y = C.y; p1.vel.x = 0; p1.vel.y = 0;
        p2.pos.x = C.x + 95; p2.pos.y = C.y; p2.vel.x = 0; p2.vel.y = 0;
      });
      await page.waitForTimeout(700);
    }
    const suppressedAfterRecoil = await page.evaluate(() => window.__tetherSumo.ropePushSuppressedCount);

    // (b) Emergent play: burst one player outward, then coast so the rope recoils.
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(400);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(700);
    }

    const minForce = await page.evaluate(() => window.__minTetherForce);
    const suppressedTotal = await page.evaluate(() => window.__tetherSumo.ropePushSuppressedCount);
    const recoilSuppressed = suppressedAfterRecoil - suppressedBefore;

    return {
      test: 'Tether is pull-only (rope never pushes)',
      pass: errors.length === 0 && Number.isFinite(minForce) && minForce >= 0 &&
            recoilSuppressed > 0 && suppressedTotal > 0,
      details: {
        errors,
        minTetherForceAcrossAllFrames: minForce,
        pushFramesSuppressedDuringSeededRecoils: recoilSuppressed,
        pushFramesSuppressedTotal: suppressedTotal
      }
    };
  }));

  // ---------- Test 7: Simultaneous double-elimination tie-break ----------
  results.push(await withPage(async (page, errors) => {
    // Both ships put outside the ring on the same frame, at different distances.
    // The documented tie-break awards the loss to whichever is further out, so P1
    // (300px from centre) loses to P2 (260px from centre).
    const before = await page.evaluate(() => ({
      p1Wins: window.__tetherSumo.players[0].roundWins,
      p2Wins: window.__tetherSumo.players[1].roundWins
    }));

    await page.evaluate(() => {
      const g = window.__tetherSumo;
      const C = g.constants.CENTER;
      const [p1, p2] = g.players;
      p1.pos.x = C.x + 300; p1.pos.y = C.y;       p1.vel.x = 0; p1.vel.y = 0; // 300 out
      p2.pos.x = C.x;       p2.pos.y = C.y + 260; p2.vel.x = 0; p2.vel.y = 0; // 260 out
    });

    await page.waitForTimeout(200);

    const after = await page.evaluate(() => {
      const g = window.__tetherSumo;
      return {
        roundOver: g.roundOver,
        roundLoser: g.roundLoser,
        p1Alive: g.players[0].alive,
        p2Alive: g.players[1].alive,
        p1Wins: g.players[0].roundWins,
        p2Wins: g.players[1].roundWins,
        matchOver: g.matchOver
      };
    });

    return {
      test: 'Simultaneous double-elimination tie-break',
      pass: errors.length === 0 && after.roundOver === true && after.roundLoser === 'P1' &&
            after.p1Alive === false && after.p2Alive === false &&
            after.p1Wins === before.p1Wins && after.p2Wins === before.p2Wins + 1,
      details: { errors, before, after }
    };
  }));

  console.log(JSON.stringify(results, null, 2));
  const allPass = results.every((r) => r.pass);
  console.log('\n' + results.map((r) => (r.pass ? 'PASS  ' : 'FAIL  ') + r.test).join('\n'));
  console.log(allPass ? '\nALL TESTS PASS' : '\nSOME TESTS FAILED');
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
