// Automated smoke/e2e tests for game/tether-sumo/index.html
// Run: node test-tether-sumo.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const GAME_PATH = '/home/user/DemoTesting02/game/tether-sumo/index.html';

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const results = [];

  // ---------- Test 1: Load + basic interaction smoke test ----------
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('file://' + GAME_PATH);
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

    results.push({
      test: 'Load + basic interaction smoke test',
      pass: errors.length === 0 && hookExists && pixelInfo > 1000 && dist > 5,
      details: { errors, hookExists, nonBackgroundPixels: pixelInfo, p1MovedDistance: dist.toFixed(1) + 'px' }
    });
    await page.close();
  }

  // ---------- Test 2: No-input soak test (anti-stalemate drift resolves a round) ----------
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('file://' + GAME_PATH);

    // Wait up to 25s of wall-clock for a round to resolve with zero input.
    let resolved = false;
    let waited = 0;
    while (waited < 25000) {
      await page.waitForTimeout(1000);
      waited += 1000;
      resolved = await page.evaluate(() => window.__tetherSumo.roundOver || window.__tetherSumo.matchOver);
      if (resolved) break;
    }

    results.push({
      test: 'No-input soak test (anti-stalemate drift)',
      pass: errors.length === 0 && resolved,
      details: { errors, resolvedAfterMs: waited, resolved }
    });
    await page.close();
  }

  // ---------- Test 3: Round/match win-condition + restart end-to-end test ----------
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('file://' + GAME_PATH);

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
        roundOver: window.__tetherSumo.roundOver,
        matchOver: window.__tetherSumo.matchOver,
        matchWinner: window.__tetherSumo.matchWinner,
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

    results.push({
      test: 'Round/match win-condition + restart end-to-end test',
      pass: errors.length === 0 && roundsProgressed && finalState.matchOver === true &&
            (finalState.p1Wins >= 3 || finalState.p2Wins >= 3) &&
            afterRestart.matchOver === false && afterRestart.p1Wins === 0 && afterRestart.p2Wins === 0,
      details: { errors, finalState, afterRestart, roundWinsSeenSamples: roundWinsSeen.slice(-5) }
    });
    await page.close();
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
  const allPass = results.every(r => r.pass);
  console.log(allPass ? '\nALL TESTS PASS' : '\nSOME TESTS FAILED');
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
