#!/usr/bin/env node
// Automated tests + balance report for game/orbit-duel.html (Orbit Duel: Wellwright).
// Plain script using the environment's pre-installed Playwright/Chromium.
// Run with: node scripts/orbit-duel-test.js [matches]   (default 200 seeded matches)
'use strict';

var path = require('path');
var { chromium } = require('playwright');
var N = parseInt(process.argv[2] || '200', 10);

async function main() {
  var browser = await chromium.launch();
  var page = await browser.newPage();
  var errors = [];
  page.on('pageerror', function (e) { errors.push(String(e)); });
  page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'game', 'orbit-duel.html'));
  await page.waitForTimeout(200);

  var failures = [];
  function assert(cond, msg) {
    console.log((cond ? 'PASS: ' : 'FAIL: ') + msg);
    if (!cond) failures.push(msg);
  }

  // ---- 9a. Load + menu + inherited hooks ----
  assert(await page.evaluate(function () { return window.__orbitDuel.phase; }) === 'menu', 'page loads at the menu');
  await page.keyboard.press('Digit2');
  var st = await page.evaluate(function () {
    var o = window.__orbitDuel;
    return { phase: o.phase, mode: o.mode, ai: o.players[1].isAI, stock: o.players[0].wellStock };
  });
  assert(st.phase === 'playing' && st.mode === 'ai' && st.ai, 'key 2 starts a match against the Rival AI');
  assert(st.stock === 2, 'ships start with a full well stock of 2');

  // ---- Sandbox physics (rAF loop paused, ships parked) ----
  var phys = await page.evaluate(function () {
    var o = window.__orbitDuel, c = o.constants, dt = 1 / 60;
    function park() {
      o.startGame('local');
      o.setPaused(true);
      o.players.forEach(function (p) { p.alive = false; p.respawnAt = 1e9; });
    }
    function fly(withWell, armFirst) {
      park();
      // Bullet travels +x along y=120, far from the star; well sits 36px below the path.
      if (withWell) o.addWell(300, 156, 'P1');
      if (armFirst) for (var i = 0; i < 30; i++) o.step(dt);
      var b = o.addBullet(150, 120, 340, 0, 'P1');
      var y0 = b.pos.y, early = null;
      for (var k = 0; k < 60; k++) {
        o.step(dt);
        if (k === 8) early = b.pos.y - y0;
      }
      return { dy: b.pos.y - y0, early: early, bent: b.bent };
    }
    var none = fly(false, false);
    var armed = fly(true, true);

    // Arming delay: pull is exactly the star-only value before arming.
    park();
    var g0 = o.gravityAt(300, 120);
    o.addWell(300, 156, 'P1');
    for (var i = 0; i < 12; i++) o.step(dt);            // 0.2s < 0.35s
    var gUnarmed = o.gravityAt(300, 120);
    for (i = 0; i < 12; i++) o.step(dt);                // 0.4s > 0.35s
    var gArmed = o.gravityAt(300, 120);
    var aliveAt3_9 = null;
    for (i = 0; i < 210; i++) o.step(dt);               // 3.9s
    aliveAt3_9 = o.wells.length;
    for (i = 0; i < 12; i++) o.step(dt);                // 4.1s
    var aliveAt4_1 = o.wells.length;

    // Escape invariant: strongest possible well + star pull vs thrust.
    var maxWell = c.G * c.WELL_MASS / (c.WELL_MIN_R * c.WELL_MIN_R);
    var maxStar = c.G * c.STAR_MASS / (c.GRAV_MIN_R * c.GRAV_MIN_R);
    return { none: none, armed: armed, g0: g0, gUnarmed: gUnarmed, gArmed: gArmed,
             aliveAt3_9: aliveAt3_9, aliveAt4_1: aliveAt4_1,
             maxWell: maxWell, maxStar: maxStar, thrust: c.SHIP_THRUST };
  });
  assert(Math.abs(phys.none.dy) < 3, 'no well: bullet drifts < 3px sideways in 1s (got ' + phys.none.dy.toFixed(2) + ')');
  assert(phys.armed.dy > 15, 'armed well 36px off the path pulls the bullet > 15px toward it (got ' + phys.armed.dy.toFixed(2) + ')');
  assert(phys.armed.bent === true && phys.none.bent === false, 'deflected bullet is flagged bent, undeflected is not');
  assert(phys.gUnarmed.y === phys.g0.y && phys.gUnarmed.x === phys.g0.x, 'well exerts no pull before the 0.35s arming delay');
  assert(phys.gArmed.y - phys.g0.y > 100, 'well pulls after arming (+' + (phys.gArmed.y - phys.g0.y).toFixed(1) + ' px/s^2)');
  assert(phys.aliveAt3_9 === 1 && phys.aliveAt4_1 === 0, 'well is removed after its 4.0s lifetime');
  assert(phys.maxWell + phys.maxStar < phys.thrust,
    'escape invariant: well ' + phys.maxWell.toFixed(1) + ' + star ' + phys.maxStar.toFixed(1) + ' < thrust ' + phys.thrust);

  // ---- Deployment rules ----
  var dep = await page.evaluate(function () {
    var o = window.__orbitDuel, dt = 1 / 60, p = o.players[0], out = {};
    function place(x, y) {
      o.startGame('local'); o.setPaused(true);
      o.players[1].alive = false; o.players[1].respawnAt = 1e9;
      p.pos.x = x; p.pos.y = y; p.vel.x = 0; p.vel.y = 0; p.angle = 0;
    }
    place(450, 120);
    out.first = o.deployWell('P1'); out.stockAfter1 = p.wellStock; out.wellsAfter1 = o.wells.length;
    out.wellPos = { x: o.wells[0].pos.x, y: o.wells[0].pos.y };
    out.second = o.deployWell('P1'); out.stockAfter2 = p.wellStock;   // cooldown + active well
    // Wait out lifetime and cooldown, holding the ship still.
    var maxStock = 0;
    for (var i = 0; i < 60 * 14; i++) {
      p.pos.x = 450; p.pos.y = 120; p.vel.x = 0; p.vel.y = 0;
      o.step(dt); maxStock = Math.max(maxStock, p.wellStock);
    }
    out.maxStock = maxStock; out.rechargedTo = p.wellStock;
    place(200 + 24, 300); out.nearSpawn = o.deployWell('P1'); out.stockSpawn = p.wellStock;
    place(450 + 60, 300); out.nearStar = o.deployWell('P1'); out.stockStar = p.wellStock;
    place(50, 100); out.nearEdge = o.deployWell('P1'); out.stockEdge = p.wellStock;
    // Death removes own wells, keeps the (already spent) stock.
    place(450, 120); o.deployWell('P1');
    var before = p.wellStock;
    o.players[1].alive = true;
    o.awardKill('P2');
    out.wellsAfterDeath = o.wells.length; out.stockAfterDeath = p.wellStock; out.stockBeforeDeath = before;
    for (i = 0; i < 80; i++) o.step(dt);
    out.respawned = p.alive; out.stockAfterRespawn = p.wellStock;
    return out;
  });
  assert(dep.first && dep.stockAfter1 === 1 && dep.wellsAfter1 === 1, 'deploying spends one charge and creates one well');
  assert(Math.abs(dep.wellPos.x - 426) < 0.01 && Math.abs(dep.wellPos.y - 120) < 0.01, 'well spawns 24px behind the ship');
  assert(dep.second === false && dep.stockAfter2 === 1, 'second deploy during cooldown / with a well active is refused, charge kept');
  assert(dep.maxStock === 2 && dep.rechargedTo === 2, 'stock recharges back to 2 and never exceeds it');
  assert(dep.nearSpawn === false && dep.stockSpawn === 2, 'drop near a spawn point is rejected, charge kept');
  assert(dep.nearStar === false && dep.stockStar === 2, 'drop near the star is rejected, charge kept');
  assert(dep.nearEdge === false && dep.stockEdge === 2, 'drop near the arena edge is rejected, charge kept');
  assert(dep.wellsAfterDeath === 0 && dep.stockAfterDeath === dep.stockBeforeDeath, 'death removes the ship\'s wells and does not refill stock');
  assert(dep.respawned && dep.stockAfterRespawn === dep.stockBeforeDeath, 'ship respawns on the game clock without a stock refill');

  // ---- Real keyboard: S drops a well, holding it does not spam; idle never deploys ----
  await page.evaluate(function () { var o = window.__orbitDuel; o.setPaused(false); o.startGame('local'); });
  await page.waitForTimeout(500);
  var idle = await page.evaluate(function () { var o = window.__orbitDuel; return o.stats.wellsDeployed.P1 + o.stats.wellsDeployed.P2; });
  assert(idle === 0, 'idle local match never deploys a well');
  // Move P1 out of the spawn exclusion zone, well clear of the star.
  await page.evaluate(function () { var p = window.__orbitDuel.players[0]; p.pos.x = 450; p.pos.y = 110; p.vel.x = 0; p.vel.y = 0; });
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(2200);         // longer than cooldown: must still be one well
  await page.keyboard.up('KeyS');
  var kb = await page.evaluate(function () { var o = window.__orbitDuel; return { n: o.stats.wellsDeployed.P1, x: o.players[0].pos.x }; });
  assert(kb.n === 1, 'holding S deploys exactly one well (edge-triggered); got ' + kb.n + ' with ship at x=' + kb.x.toFixed(0));

  // ---- Win condition + restart + menu (inherited behaviour) ----
  var win = await page.evaluate(function () {
    var o = window.__orbitDuel; o.startGame('ai');
    for (var i = 0; i < 5; i++) o.awardKill('P1');
    return { phase: o.phase, winner: o.winner, gameOver: o.gameOver };
  });
  assert(win.phase === 'gameover' && win.winner === 'P1' && win.gameOver, '5 kills ends the match with P1 as winner');
  await page.keyboard.press('KeyR');
  var re = await page.evaluate(function () { var o = window.__orbitDuel; return { phase: o.phase, s: o.players[0].score, stock: o.players[0].wellStock }; });
  assert(re.phase === 'playing' && re.s === 0 && re.stock === 2, 'R restarts with scores and well stock reset');

  // ---- Determinism ----
  var det = await page.evaluate(function () {
    var o = window.__orbitDuel;
    var a = o.simulate(42), b = o.simulate(42);
    var keys = {};
    for (var s = 1; s <= 10; s++) { var r = o.simulate(s); keys[r.duration + '|' + r.score.P1 + '|' + r.score.P2] = 1; }
    return { same: JSON.stringify(a) === JSON.stringify(b), a: a, distinct: Object.keys(keys).length, phase: o.phase };
  });
  assert(det.same, 'simulate(42) twice gives identical results: ' + JSON.stringify(det.a));
  assert(det.distinct >= 8, '10 different seeds give >= 8 distinct outcomes (got ' + det.distinct + ')');
  assert(det.phase === 'menu', 'simulate() leaves the live game at the menu');
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(1500);
  var after = await page.evaluate(function () {
    var o = window.__orbitDuel;
    return { phase: o.phase, clock: o.clock, alive: o.players.map(function (p) { return p.alive; }), p1ai: o.players[0].isAI };
  });
  assert(after.phase === 'playing' && after.clock > 1 && after.clock < 2 && !after.p1ai,
    'live match starts cleanly after simulate() (clock ' + after.clock.toFixed(2) + 's, P1 human)');
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'cycle4-screenshot.png') });

  // ---- Balance report ----
  async function batch(wells) {
    return page.evaluate(function (a) {
      var o = window.__orbitDuel, out = [];
      for (var s = 1; s <= a.n; s++) out.push(o.simulate(1000 + s, 180, { wells: a.wells }));
      return out;
    }, { n: N, wells: wells });
  }
  function summarise(rs) {
    var d = rs.map(function (r) { return r.duration; }).sort(function (a, b) { return a - b; });
    function sum(f) { return rs.reduce(function (t, r) { return t + f(r); }, 0); }
    var decided = rs.filter(function (r) { return r.winner !== 'timeout'; });
    var kills = sum(function (r) { return r.kills.bullet; });
    return {
      matches: rs.length,
      p1WinPct: decided.length ? +(100 * decided.filter(function (r) { return r.winner === 'P1'; }).length / decided.length).toFixed(1) : null,
      timeoutPct: +(100 * (rs.length - decided.length) / rs.length).toFixed(1),
      medianDurationS: d[Math.floor(d.length / 2)],
      p90DurationS: d[Math.floor(d.length * 0.9)],
      starDeathsPerMatch: +(sum(function (r) { return r.starDeaths.P1 + r.starDeaths.P2; }) / rs.length).toFixed(2),
      wellsPerMatch: +(sum(function (r) { return r.wellsDeployed.P1 + r.wellsDeployed.P2; }) / rs.length).toFixed(2),
      bentKillPct: kills ? +(100 * sum(function (r) { return r.kills.bulletBent; }) / kills).toFixed(1) : null,
      shotsPerKill: kills ? +(sum(function (r) { return r.shotsFired.P1 + r.shotsFired.P2; }) / kills).toFixed(1) : null
    };
  }
  var t0 = Date.now();
  var withWells = summarise(await batch(true));
  var noWells = summarise(await batch(false));
  console.log('\nBALANCE (AI vs AI, ' + N + ' seeded matches each, ' + ((Date.now() - t0) / 1000).toFixed(1) + 's wall time)');
  console.log('with wells   : ' + JSON.stringify(withWells));
  console.log('without wells: ' + JSON.stringify(noWells));
  assert(withWells.wellsPerMatch > 0, 'AI actually uses wells (' + withWells.wellsPerMatch + ' per match)');
  assert(withWells.timeoutPct < 20, 'fewer than 20% of matches with wells time out (' + withWells.timeoutPct + '%)');

  assert(errors.length === 0, 'no console or page errors' + (errors.length ? ': ' + errors.join('; ') : ''));
  await browser.close();
  console.log('\n' + (failures.length ? failures.length + ' FAILED' : 'ALL PASSED'));
  process.exit(failures.length ? 1 : 0);
}
main().catch(function (e) { console.error(e); process.exit(1); });
