// Automated tests for game/index.html (Orbit Duel + Cycle 2's Rival AI).
// Loads the game directly over a file:// URL -- no server, no build step,
// matching how a player actually runs it (double-click / open in a browser).
//
// Tests 1 & 2 port Cycle 1's ad-hoc smoke checks into the suite. Test 3 closes
// the Cycle 1 gap: a real end-to-end win-condition + restart flow. Test 4 is a
// smoke test proving the AI opponent actually takes actions.

const path = require('path');
const { test, expect } = require('@playwright/test');

const GAME_URL = 'file://' + path.join(__dirname, '..', 'game', 'index.html');

async function loadGame(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => !!window.__orbitDuel);
  return errors;
}

function countNonBackgroundPixels(imageData) {
  // Background is #05060a (5, 6, 10). Count pixels that differ meaningfully.
  const { data } = imageData;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.abs(r - 5) > 8 || Math.abs(g - 6) > 8 || Math.abs(b - 10) > 8) count++;
  }
  return count;
}

// Counts near-white pixels (used for win-overlay text detection) in a
// horizontal band, excluding the star's warm glow (#ffdc8c / orange gradient,
// which has a low blue channel) by requiring a high blue channel too.
async function countNearWhiteInBand(page, yStart, yEnd) {
  return page.evaluate(({ yStart, yEnd }) => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = Math.max(1, yEnd - yStart);
    const { data } = ctx.getImageData(0, yStart, w, h);
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], b = data[i + 2];
      if (r > 180 && b > 200) count++;
    }
    return count;
  }, { yStart, yEnd });
}

test.describe('Orbit Duel', () => {
  test('Test 1: load & basic interaction smoke test', async ({ page }) => {
    const errors = await loadGame(page);

    await page.evaluate(() => window.__orbitDuel.startGame('local'));

    // Let a couple of frames render so the canvas has non-trivial content.
    await page.waitForTimeout(100);
    const canvas = page.locator('#game');
    const imageData = await page.evaluate(() => {
      const c = document.getElementById('game');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height);
      return { data: Array.from(d.data) };
    });
    const nonBackgroundPixels = countNonBackgroundPixels(imageData);
    expect(nonBackgroundPixels).toBeGreaterThan(500);

    // Hold P1 thrust (W) for ~0.5s and confirm the ship actually moves.
    const before = await page.evaluate(() => ({ ...window.__orbitDuel.players[0].pos }));
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    const after = await page.evaluate(() => ({ ...window.__orbitDuel.players[0].pos }));
    const dist = Math.hypot(after.x - before.x, after.y - before.y);
    expect(dist).toBeGreaterThan(5);

    // Firing increases the bullet count. Hold-then-release rather than a bare
    // press(): a zero-delay down+up can land between two requestAnimationFrame
    // callbacks and never be observed by the game loop at all.
    const bulletsBefore = await page.evaluate(() => window.__orbitDuel.bullets.length);
    await page.keyboard.down('Space');
    await page.waitForTimeout(80);
    await page.keyboard.up('Space');
    const bulletsAfter = await page.evaluate(() => window.__orbitDuel.bullets.length);
    expect(bulletsAfter).toBeGreaterThan(bulletsBefore);

    expect(errors).toEqual([]);
    void canvas; // referenced for readability; assertions are on captured pixel data above
  });

  test('Test 2: extended mixed-input session (~6s)', async ({ page }) => {
    const errors = await loadGame(page);
    await page.evaluate(() => window.__orbitDuel.startGame('local'));

    // Mix thrust, rotation, and continuous firing for both players.
    await page.keyboard.down('KeyW');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(1500);
    await page.keyboard.down('KeyD');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(1500);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Space', { delay: 30 });
      await page.keyboard.press('Enter', { delay: 30 });
      await page.waitForTimeout(500);
    }

    await page.keyboard.up('KeyW');
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('KeyD');
    await page.keyboard.up('ArrowLeft');

    const state = await page.evaluate(() => {
      const s = window.__orbitDuel;
      return {
        p1: { alive: s.players[0].alive, pos: { ...s.players[0].pos } },
        p2: { alive: s.players[1].alive, pos: { ...s.players[1].pos } },
        bulletCount: s.bullets.length,
        gameOver: s.gameOver
      };
    });

    const W = 900, H = 600;
    for (const p of [state.p1, state.p2]) {
      if (p.alive) {
        expect(p.pos.x).toBeGreaterThanOrEqual(0);
        expect(p.pos.x).toBeLessThanOrEqual(W);
        expect(p.pos.y).toBeGreaterThanOrEqual(0);
        expect(p.pos.y).toBeLessThanOrEqual(H);
      }
    }
    expect(state.bulletCount).toBeLessThan(50); // not runaway-accumulating
    expect(errors).toEqual([]);
  });

  test('Test 3: win condition + restart flow (end-to-end)', async ({ page }) => {
    const errors = await loadGame(page);

    await page.evaluate(() => window.__orbitDuel.startGame('local'));
    // Let a frame render past startGame() -- otherwise the canvas can still show
    // the last-painted menu frame (whose "2 -- vs Rival AI" line falls in the
    // same band we check below) even though `phase` has already flipped in JS.
    await page.waitForTimeout(50);
    let phase = await page.evaluate(() => window.__orbitDuel.phase);
    expect(phase).toBe('playing');

    // Pre-win baseline: the "Press R to restart" band should be empty.
    const H = 600;
    const bandBefore = await countNearWhiteInBand(page, H / 2 + 10, H / 2 + 40);
    expect(bandBefore).toBeLessThan(20);

    // Drive the real win path: award WIN_SCORE kills to P1 via the same
    // registerKill() the bullet-collision code calls.
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.__orbitDuel.awardKill('P1'));
    }

    const stateAfterWin = await page.evaluate(() => {
      const s = window.__orbitDuel;
      return {
        score: s.players[0].score,
        winner: s.winner,
        phase: s.phase,
        gameOver: s.gameOver
      };
    });
    expect(stateAfterWin.score).toBe(5);
    expect(stateAfterWin.winner).toBe('P1');
    expect(stateAfterWin.phase).toBe('gameover');
    expect(stateAfterWin.gameOver).toBe(true);

    // The overlay must actually be rendered, not merely flagged in state.
    await page.waitForTimeout(50); // let at least one rAF paint the overlay
    const bandAfter = await countNearWhiteInBand(page, H / 2 + 10, H / 2 + 40);
    expect(bandAfter).toBeGreaterThan(bandBefore);
    expect(bandAfter).toBeGreaterThan(50);

    // Restart via the R key (same path a player uses).
    await page.keyboard.press('r');
    await page.waitForTimeout(50);
    const stateAfterRestart = await page.evaluate(() => {
      const s = window.__orbitDuel;
      return {
        phase: s.phase,
        p1Score: s.players[0].score,
        p2Score: s.players[1].score,
        winner: s.winner,
        bulletCount: s.bullets.length,
        p1Alive: s.players[0].alive,
        p2Alive: s.players[1].alive
      };
    });
    expect(stateAfterRestart.phase).toBe('playing');
    expect(stateAfterRestart.p1Score).toBe(0);
    expect(stateAfterRestart.p2Score).toBe(0);
    expect(stateAfterRestart.winner).toBe(null);
    expect(stateAfterRestart.bulletCount).toBe(0);
    expect(stateAfterRestart.p1Alive).toBe(true);
    expect(stateAfterRestart.p2Alive).toBe(true);

    const bandAfterRestart = await countNearWhiteInBand(page, H / 2 + 10, H / 2 + 40);
    expect(bandAfterRestart).toBeLessThan(20);

    expect(errors).toEqual([]);
  });

  test('Test 4: AI opponent smoke test (agency, not drift)', async ({ page }) => {
    const errors = await loadGame(page);

    await page.evaluate(() => window.__orbitDuel.setAimJitter(0));
    await page.evaluate(() => window.__orbitDuel.startGame('ai'));

    const initial = await page.evaluate(() => {
      const s = window.__orbitDuel;
      return { isAI: s.players[1].isAI, mode: s.mode, angle: s.players[1].angle };
    });
    expect(initial.isAI).toBe(true);
    expect(initial.mode).toBe('ai');

    // No player input -- P1 sits at spawn as a static target (easiest case,
    // appropriate for a smoke test). Poll for a P2-owned bullet since bullets
    // expire and a single end-of-window check could miss one.
    let sawP2Bullet = false;
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      const hasBullet = await page.evaluate(
        () => window.__orbitDuel.bullets.some((b) => b.owner === 'P2')
      );
      if (hasBullet) { sawP2Bullet = true; break; }
      await page.waitForTimeout(100);
    }

    const final = await page.evaluate(() => {
      const s = window.__orbitDuel;
      return {
        angle: s.players[1].angle,
        pos: { ...s.players[1].pos },
        vel: { ...s.players[1].vel },
        aiDebug: { ...s.aiDebug }
      };
    });

    // Gravity never rotates a ship -- angle only changes via rotate input, so
    // this is exact proof the AI issued rotation commands.
    expect(final.angle).not.toBeCloseTo(initial.angle, 3);

    expect(final.aiDebug.ticks).toBeGreaterThan(60);
    expect(final.aiDebug.thrustTicks).toBeGreaterThan(0);
    expect(final.aiDebug.fires).toBeGreaterThan(0);
    expect(sawP2Bullet).toBe(true);

    // No NaN propagation (would indicate a divide-by-zero in the trajectory search).
    for (const val of [final.angle, final.pos.x, final.pos.y, final.vel.x, final.vel.y]) {
      expect(Number.isFinite(val)).toBe(true);
    }

    expect(errors).toEqual([]);
  });
});
