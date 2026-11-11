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
var Gen = require(path.join(__dirname, '..', 'game', 'drift-maze-gen.js'));

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

  // --- Test 4 (Cycle 3): HUD shows a solver-computed par ---
  var hudText = await page.evaluate(function () { return document.getElementById('moveCount').textContent; });
  assert(/par \d+/.test(hudText), 'HUD shows a computed par (' + hudText + ')');

  // --- Test 5 (Cycle 3): undo restores position, move count and shattered walls ---
  await page.evaluate(function () { window.__driftMaze.loadLevel(2); }); // "Brittle Wall"
  await page.waitForTimeout(100);
  var sol3 = DriftMaze.solveLevel(DriftMaze.parseLevel(LEVELS[2]));
  var crackedBefore = await page.evaluate(function () { return JSON.stringify(window.__driftMaze.grid).split('B').length - 1; });
  for (i = 0; i < 3; i++) { // optimal route shatters the wall on its third move
    await page.keyboard.press(KEY_FOR_DIR[sol3.moves[i]]);
    await page.waitForTimeout(300);
  }
  var crackedMid = await page.evaluate(function () { return JSON.stringify(window.__driftMaze.grid).split('B').length - 1; });
  assert(crackedBefore === 1 && crackedMid === 0, 'cracked wall shatters during play (' + crackedBefore + ' -> ' + crackedMid + ')');
  var posMid = await page.evaluate(function () { return window.__driftMaze.pos; });
  await page.keyboard.press('KeyU');
  await page.waitForTimeout(100);
  var afterUndo = await page.evaluate(function () {
    return { moves: window.__driftMaze.moves, cracked: JSON.stringify(window.__driftMaze.grid).split('B').length - 1 };
  });
  assert(afterUndo.moves === 2 && afterUndo.cracked === 1, 'undo restores move count and the shattered wall (' + JSON.stringify(afterUndo) + ')');

  // --- Test 6 (Cycle 3): hint returns the solver's next move from mid-level ---
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(100);
  var hint = await page.evaluate(function () { return window.__driftMaze.hint; });
  assert(hint === sol3.moves[2], 'hint after two optimal moves is the third optimal move (hint=' + hint + ', expected=' + sol3.moves[2] + ')');

  // --- Test 7 (Cycle 3): endless mode — seeded, deterministic, playable end to end ---
  var SEED = 4242;
  await page.goto(url + '?mode=endless&seed=' + SEED);
  await page.waitForTimeout(300);
  var info = await page.evaluate(function () {
    var h = window.__driftMaze;
    return { mode: h.mode, depth: h.depth, seed: h.runSeed, rows: h.def.rows, par: h.par };
  });
  var expected = Gen.levelForRun(SEED, 1);
  assert(info.mode === 'endless' && info.seed === SEED && info.depth === 1, 'URL ?mode=endless&seed= starts a seeded endless run');
  assert(JSON.stringify(info.rows) === JSON.stringify(expected.rows) && info.par === expected.par,
    'browser generates the same level as Node for the same seed (par ' + info.par + ')');

  var DEPTHS = 4; // crosses the first tier boundary (depth 4 is tier 2)
  var totalPar = 0;
  for (var depth = 1; depth <= DEPTHS; depth++) {
    var gen = Gen.levelForRun(SEED, depth);
    totalPar += gen.par;
    for (i = 0; i < gen.solution.length; i++) {
      await page.keyboard.press(KEY_FOR_DIR[gen.solution[i]]);
      await page.waitForTimeout(Math.max(250, 60 * 14));
    }
    await page.waitForTimeout(1500);
    var d = await page.evaluate(function () { return window.__driftMaze.depth; });
    assert(d === depth + 1, 'endless depth ' + depth + ' (' + gen.tierName + ', par ' + gen.par + ') solved by its generated solution, advanced to depth ' + d);
  }
  var run = await page.evaluate(function () { return { m: window.__driftMaze.runMoves, p: window.__driftMaze.runPar }; });
  assert(run.m === totalPar && run.p === totalPar, 'run totals track moves and par (moves ' + run.m + ', par ' + run.p + ', expected ' + totalPar + ')');
  assert(consoleErrors.length === 0, 'no console/page errors across the whole session (errors: ' + JSON.stringify(consoleErrors) + ')');
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'cycle3-endless-screenshot.png') });

  await browser.close();

  console.log('\n' + (failures.length === 0 ? 'ALL BROWSER TESTS PASSED' : failures.length + ' BROWSER TEST(S) FAILED:\n' + failures.join('\n')));
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(function (err) {
  console.error('Browser test script crashed:', err);
  process.exit(1);
});
