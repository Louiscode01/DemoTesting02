const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const FILE_URL = 'file:///home/user/DemoTesting02/game/cycle-2-tether-twins/index.html';

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
  console.log('PASS: ' + msg);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const consoleErrors = [];
  const pageErrors = [];

  // ---- Test 1: load, no errors, canvas renders ----
  {
    const page = await browser.newPage();
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => pageErrors.push(String(err)));
    await page.goto(FILE_URL);
    await page.waitForTimeout(300);

    assert(consoleErrors.length === 0, 'no console errors on load (' + JSON.stringify(consoleErrors) + ')');
    assert(pageErrors.length === 0, 'no page errors on load (' + JSON.stringify(pageErrors) + ')');

    const pixelInfo = await page.evaluate(() => {
      const c = document.getElementById('c');
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let nonBgPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0x18 || data[i + 1] !== 0x1c || data[i + 2] !== 0x26) nonBgPixels++;
      }
      return { nonBgPixels, width: c.width, height: c.height };
    });
    assert(pixelInfo.nonBgPixels > 100, 'canvas renders non-trivial pixel content (' + pixelInfo.nonBgPixels + ' non-bg pixels)');

    const hook = await page.evaluate(() => window.__tetherTwins);
    assert(hook && hook.orbA && hook.orbB, '__tetherTwins test hook exposes orbA/orbB');
    assert(hook.levelIndex === 0, 'starts at levelIndex 0');
    assert(hook.phase === 'playing', 'starts in playing phase');

    await page.close();
  }

  // ---- Test 2: input isolation - orb A moves via WASD, orb B barely ----
  {
    const page = await browser.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => window.__tetherTwins);

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => window.__tetherTwins);
    const dA = Math.hypot(after.orbA.x - before.orbA.x, after.orbA.y - before.orbA.y);
    const dB = Math.hypot(after.orbB.x - before.orbB.x, after.orbB.y - before.orbB.y);
    assert(dA > 20, 'orb A moved a measurable distance under KeyD (' + dA.toFixed(1) + 'px)');
    assert(dA > dB * 1.15, 'orb A moved substantially more than orb B (A=' + dA.toFixed(1) + ', B=' + dB.toFixed(1) + ')');

    await page.close();
  }

  // ---- Test 2b: mirrored check with ArrowLeft driving orb B ----
  {
    const page = await browser.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(200);
    const before = await page.evaluate(() => window.__tetherTwins);

    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => window.__tetherTwins);
    const dA = Math.hypot(after.orbA.x - before.orbA.x, after.orbA.y - before.orbA.y);
    const dB = Math.hypot(after.orbB.x - before.orbB.x, after.orbB.y - before.orbB.y);
    assert(dB > 20, 'orb B moved a measurable distance under ArrowLeft (' + dB.toFixed(1) + 'px)');
    assert(dB > dA * 1.15, 'orb B moved substantially more than orb A (A=' + dA.toFixed(1) + ', B=' + dB.toFixed(1) + ')');

    await page.close();
  }

  // ---- Test 3: tether responds to separation (spring, not rigid rod) ----
  {
    const page = await browser.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(200);
    // Both orbs start at the same y in level 1, so driving A up and B down
    // (or vice versa) is an unambiguous vertical separation/approach axis,
    // independent of their existing horizontal offset.
    const restLen = (await page.evaluate(() => window.__tetherTwins)).tetherLength;

    // Drive orbs apart: A up (WASD), B down (arrows) simultaneously
    await page.keyboard.down('KeyW');
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(50);

    const stretched = (await page.evaluate(() => window.__tetherTwins)).tetherLength;
    assert(stretched > restLen, 'driving orbs apart increases tether length (' + restLen.toFixed(1) + ' -> ' + stretched.toFixed(1) + ')');

    // Now drive them back together: A down, B up
    await page.keyboard.down('KeyS');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyS');
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(50);

    const compressed = (await page.evaluate(() => window.__tetherTwins)).tetherLength;
    assert(compressed < stretched, 'driving orbs together decreases tether length (' + stretched.toFixed(1) + ' -> ' + compressed.toFixed(1) + ')');

    await page.close();
  }

  // ---- Test 4: hazard reset ----
  {
    const page = await browser.newPage();
    await page.goto(FILE_URL);
    await page.waitForTimeout(200);
    // Jump to level 2 (index 1), which has a hazard strip
    await page.evaluate(() => window.__tetherTwinsDebug.gotoLevel(1));
    await page.waitForTimeout(100);
    const before = await page.evaluate(() => window.__tetherTwins);
    assert(before.levelIndex === 1, 'debug hook jumped to level index 1');
    assert(before.resets === 0, 'resets counter starts at 0 after level jump');

    // Level 2's hazard strip spans x:300-500,y:220-240; orb A starts at
    // x:100,y:100 (over the left wall ledge, not the gap), so drive it
    // diagonally right+down to land in the gap above the hazard.
    await page.keyboard.down('KeyD');
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyD');
    await page.keyboard.up('KeyS');
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => window.__tetherTwins);
    assert(after.resets >= 1, 'touching a hazard increments the resets counter (resets=' + after.resets + ')');
    assert(after.levelIndex === 1, 'level reloads to the same level on hazard touch, not advancing');

    await page.close();
  }

  await browser.close();
  console.log('\nALL TESTS PASSED');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
