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

  // ===== Cycle 5: stars, saved bests, level select, daily puzzle =====
  async function hook(fn) { return page.evaluate(fn); }
  async function play(moves, wait) {
    for (var k = 0; k < moves.length; k++) {
      await page.keyboard.press(KEY_FOR_DIR[moves[k]]);
      await page.waitForTimeout(wait || 300);
    }
  }

  // --- Test 8: star rule ---
  var starRule = await hook(function () {
    var h = window.__driftMaze;
    return [h.starsFor(5, 5, false), h.starsFor(7, 5, false), h.starsFor(8, 5, false), h.starsFor(5, 5, true)];
  });
  assert(JSON.stringify(starRule) === '[3,2,1,1]', 'stars: par 3, par+2 2, beyond 1, hinted 1 (' + JSON.stringify(starRule) + ')');

  // --- Test 9: earlier solves were saved, and survive a reload ---
  var saved = await hook(function () { return window.__driftMaze.store; });
  assert(saved.campaign['First Slide'] && saved.campaign['First Slide'].moves === 3 && saved.campaign['First Slide'].stars === 3,
    'level 1 par solve stored as 3 moves, 3 stars (' + JSON.stringify(saved.campaign) + ')');
  assert(saved.unlocked === 1 && saved.endlessBest === DEPTHS, 'unlocked level 2 and endless best depth ' + DEPTHS + ' stored (' + saved.unlocked + ', ' + saved.endlessBest + ')');

  await page.goto(url);
  await page.waitForTimeout(300);
  var resumed = await hook(function () {
    return { idx: window.__driftMaze.levelIndex, hud: document.getElementById('bestInfo').textContent, score: window.__driftMaze.score };
  });
  assert(resumed.idx === 1, 'reload resumes at the furthest unlocked campaign level (index ' + resumed.idx + ')');
  assert(/Estimated difficulty \d+\.\d/.test(resumed.hud) && /campaign stars 3 \/ 36/.test(resumed.hud),
    'HUD shows estimated difficulty and star total (' + resumed.hud + ')');
  assert(resumed.score === LEVELS[1].score, 'in-game difficulty equals the curated score (' + resumed.score + ')');

  // --- Test 10: level select is bounded by progress ---
  await page.keyboard.press('BracketRight');
  await page.waitForTimeout(100);
  var afterNext = await hook(function () { return window.__driftMaze.levelIndex; });
  await page.keyboard.press('BracketLeft');
  await page.waitForTimeout(100);
  var afterPrev = await hook(function () { return window.__driftMaze.levelIndex; });
  await page.keyboard.press('BracketLeft');
  await page.waitForTimeout(100);
  var afterPrev2 = await hook(function () { return window.__driftMaze.levelIndex; });
  assert(afterNext === 1 && afterPrev === 0 && afterPrev2 === 0,
    'level select: ] blocked past unlocked, [ goes back, [ stops at the first level (' + [afterNext, afterPrev, afterPrev2].join(', ') + ')');

  // --- Test 11: a hinted solve earns 1 star and does not overwrite a better record ---
  await page.keyboard.press('KeyH');
  await page.waitForTimeout(100);
  await play(solution.moves);
  await page.waitForTimeout(500);
  var hinted = await hook(function () {
    var h = window.__driftMaze;
    return { stars: h.lastStars, best: h.store.campaign['First Slide'] };
  });
  assert(hinted.stars === 1 && hinted.best.stars === 3, 'hinted solve gives 1 star, saved best stays at 3 (' + JSON.stringify(hinted) + ')');
  await page.waitForTimeout(1300);

  // --- Test 12: a slow solve earns fewer stars (one wasted move on a level with slack) ---
  await hook(function () { window.__driftMaze.loadLevel(1); });
  await page.waitForTimeout(100);
  var sol2 = DriftMaze.solveLevel(DriftMaze.parseLevel(LEVELS[1]));
  await play(sol2.moves.slice(0, 1));
  await play(['left', 'right']);       // out and back along the top corridor
  await play(sol2.moves.slice(1));
  await page.waitForTimeout(500);
  var slow = await hook(function () { return { stars: window.__driftMaze.lastStars, moves: window.__driftMaze.moves, par: window.__driftMaze.par }; });
  assert(slow.moves === slow.par + 2 && slow.stars === 2, 'two moves over par earns 2 stars (' + JSON.stringify(slow) + ')');

  // --- Test 13: daily puzzle — date-seeded, same as Node, solvable, saved ---
  var DATE = 20261117;
  await page.goto(url + '?mode=daily&date=' + DATE);
  await page.waitForTimeout(300);
  var dailyExpected = Gen.daily(DATE);
  var dailyInfo = await hook(function () {
    var h = window.__driftMaze;
    return { mode: h.mode, date: h.dailyDate, rows: h.def.rows, par: h.par, title: document.getElementById('levelTitle').textContent };
  });
  assert(dailyInfo.mode === 'daily' && dailyInfo.date === DATE && /Daily 2026-11-17/.test(dailyInfo.title), 'URL ?mode=daily&date= opens that day\'s puzzle (' + dailyInfo.title + ')');
  assert(JSON.stringify(dailyInfo.rows) === JSON.stringify(dailyExpected.rows) && dailyInfo.par === dailyExpected.par,
    'browser daily level equals Node daily level (par ' + dailyInfo.par + ')');
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'cycle5-daily-screenshot.png') });
  await play(dailyExpected.solution, 850);
  await page.waitForTimeout(500);
  var dailyDone = await hook(function () {
    var h = window.__driftMaze;
    return { solved: h.solved, stars: h.lastStars, rec: h.store.daily[h.dailyDate], banner: document.getElementById('banner').textContent };
  });
  assert(dailyDone.solved && dailyDone.stars === 3 && dailyDone.rec && dailyDone.rec.moves === dailyExpected.par && /Daily solved/.test(dailyDone.banner),
    'daily solved at par: 3 stars, result saved (' + JSON.stringify(dailyDone.rec) + ')');
  await page.goto(url + '?mode=daily&date=' + DATE);
  await page.waitForTimeout(300);
  var dailyHud = await hook(function () { return document.getElementById('bestInfo').textContent; });
  assert(new RegExp('best ' + dailyExpected.par + ' moves').test(dailyHud), 'daily best shown after reload (' + dailyHud + ')');
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(300);
  var today = await hook(function () { return window.__driftMaze.dailyDate; });
  assert(today === Gen.dateSeed(), 'T opens today\'s UTC date (' + today + ')');

  // --- Test 14: corrupt or missing storage does not break the game ---
  await hook(function () { window.localStorage.setItem('driftMaze.v1', '{not json'); });
  await page.goto(url);
  await page.waitForTimeout(300);
  var afterCorrupt = await hook(function () { return { idx: window.__driftMaze.levelIndex, unlocked: window.__driftMaze.store.unlocked }; });
  assert(afterCorrupt.idx === 0 && afterCorrupt.unlocked === 0, 'corrupt save is ignored and the game starts fresh');
  var blocked = await browser.newContext();
  await blocked.addInitScript(function () {
    Object.defineProperty(window, 'localStorage', { get: function () { throw new Error('blocked'); } });
  });
  var page2 = await blocked.newPage();
  var errors2 = [];
  page2.on('pageerror', function (err) { errors2.push(String(err)); });
  await page2.goto(url);
  await page2.waitForTimeout(300);
  await page2.keyboard.press('ArrowDown');
  await page2.waitForTimeout(300);
  var movedBlocked = await page2.evaluate(function () { return window.__driftMaze.moves; });
  assert(errors2.length === 0 && movedBlocked === 1, 'game loads and plays with storage blocked (errors ' + JSON.stringify(errors2) + ')');
  await blocked.close();

  // --- Test 15: every curated campaign level is winnable in the real page ---
  var wonAll = 0, starSum = 0;
  for (var li = 0; li < LEVELS.length; li++) {
    await page.evaluate(function (n) { window.__driftMaze.loadLevel(n); }, li);
    await page.waitForTimeout(100);
    var solN = DriftMaze.solveLevel(DriftMaze.parseLevel(LEVELS[li]));
    await play(solN.moves, 800);
    await page.waitForTimeout(300);
    var resN = await hook(function () { return { solved: window.__driftMaze.solved, stars: window.__driftMaze.lastStars, moves: window.__driftMaze.moves }; });
    if (resN.solved && resN.stars === 3 && resN.moves === LEVELS[li].par) wonAll++;
    else console.log('  level ' + (li + 1) + ' result: ' + JSON.stringify(resN));
    await page.waitForTimeout(1000);
  }
  var endState = await hook(function () {
    return { cleared: window.__driftMaze.cleared, store: window.__driftMaze.store, banner: document.getElementById('banner').textContent };
  });
  Object.keys(endState.store.campaign).forEach(function (k) { starSum += endState.store.campaign[k].stars; });
  assert(wonAll === LEVELS.length, 'all ' + LEVELS.length + ' campaign levels solved at par in the browser (' + wonAll + ')');
  assert(endState.cleared && starSum === 36 && /Stars 36 \/ 36/.test(endState.banner), 'campaign completes with 36 / 36 stars (' + starSum + ')');
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'cycle5-campaign-end-screenshot.png') });

  assert(consoleErrors.length === 0, 'no console/page errors across the Cycle 5 checks (errors: ' + JSON.stringify(consoleErrors) + ')');

  await browser.close();

  console.log('\n' + (failures.length === 0 ? 'ALL BROWSER TESTS PASSED' : failures.length + ' BROWSER TEST(S) FAILED:\n' + failures.join('\n')));
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(function (err) {
  console.error('Browser test script crashed:', err);
  process.exit(1);
});
