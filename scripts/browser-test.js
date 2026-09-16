#!/usr/bin/env node
// Automated headless-browser smoke test + win-condition end-to-end test for
// game/drift-maze.html, using the pre-installed Playwright/Chromium in this
// environment. No test framework — a plain script consistent with the rest of
// this project's zero-build-step approach. Run with: node scripts/browser-test.js
'use strict';

var path = require('path');
var { chromium } = require('playwright');
var DriftMaze = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));
var LEVELS = require(path.join(__dirname, '..', 'game', 'drift-maze-levels.js'));

var KEY_FOR_DIR = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

async function main() {
  var browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  var page = await browser.newPage();
  var consoleErrors = [];
  page.on('pageerror', function (err) { consoleErrors.push(String(err)); });
  page.on('console', function (msg) { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  var url = 'file://' + path.join(__dirname, '..', 'game', 'drift-maze.html');
  await page.goto(url);
  await page.waitForTimeout(200);

  var failures = [];
  function assert(cond, msg) {
    if (cond) { console.log('PASS: ' + msg); }
    else { failures.push(msg); console.log('FAIL: ' + msg); }
  }

  // --- Test 1: load + render smoke test ---
  assert(consoleErrors.length === 0, 'no console/page errors on load (errors: ' + JSON.stringify(consoleErrors) + ')');

  var nonBg = await page.evaluate(function () {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var bg = 0, count = 0;
    for (var i = 0; i < data.length; i += 4) {
      count++;
      // background is #1a1d29 -ish; just count near-black/near-bg pixels loosely
      if (data[i] < 40 && data[i + 1] < 40 && data[i + 2] < 50) bg++;
    }
    return count - bg;
  });
  assert(nonBg > 500, 'canvas renders non-trivial pixel content (non-background pixels: ' + nonBg + ')');

  var hookExists = await page.evaluate(function () { return !!window.__driftMaze; });
  assert(hookExists, 'test hook window.__driftMaze is exposed');

  // --- Test 2: basic input wiring — one arrow key measurably moves the player ---
  var before = await page.evaluate(function () { return window.__driftMaze.pos; });
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  var afterMoves = await page.evaluate(function () { return window.__driftMaze.moves; });
  var after = await page.evaluate(function () { return window.__driftMaze.pos; });
  assert(afterMoves === 1, 'one keypress registers exactly one move (moves=' + afterMoves + ')');
  assert(after.x !== before.x || after.y !== before.y, 'player position changed after input (before=' + JSON.stringify(before) + ', after=' + JSON.stringify(after) + ')');

  // reset back to a clean level 1 before the win-condition test
  await page.evaluate(function () { window.__driftMaze.loadLevel(0); });
  await page.waitForTimeout(100);

  // --- Test 3: win-condition end-to-end, using the solver's own optimal path ---
  // This directly covers the Cycle 1 follow-up ("automated end-to-end test of the
  // win condition") that Orbit Duel's testing pass could not exercise.
  var level0 = DriftMaze.parseLevel(LEVELS[0]);
  var solution = DriftMaze.solveLevel(level0);
  assert(solution.solvable, 'level 1 solver reports a solution to replay (sanity check)');

  for (var i = 0; i < solution.moves.length; i++) {
    await page.keyboard.press(KEY_FOR_DIR[solution.moves[i]]);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(400);

  var solvedFlag = await page.evaluate(function () { return window.__driftMaze.solved; });
  assert(solvedFlag === true, 'playing the solver\'s optimal move sequence for level 1 triggers solved=true');

  await page.waitForTimeout(1300); // auto-advance delay in drift-maze.html
  var newLevelIndex = await page.evaluate(function () { return window.__driftMaze.levelIndex; });
  assert(newLevelIndex === 1, 'level auto-advances to level 2 after solving level 1 (levelIndex=' + newLevelIndex + ')');

  await browser.close();

  console.log('\n' + (failures.length === 0 ? 'ALL BROWSER TESTS PASSED' : failures.length + ' BROWSER TEST(S) FAILED:\n' + failures.join('\n')));
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(function (err) {
  console.error('Browser test script crashed:', err);
  process.exit(1);
});
