#!/usr/bin/env node
// Unit tests for analyzeDifficulty() and mechanicNecessity().
// Run with: node scripts/test-difficulty.js
'use strict';
var path = require('path');
var DM = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));
var Gen = require(path.join(__dirname, '..', 'game', 'drift-maze-gen.js'));

var failures = 0, passes = 0;
function assert(cond, msg) {
  if (cond) { passes++; console.log('PASS: ' + msg); }
  else { failures++; console.log('FAIL: ' + msg); }
}
function L(rows) { return DM.parseLevel({ name: 't', rows: rows }); }

// 1. A corridor with one acting move per step: no choices, no traps.
var corridor = DM.analyzeDifficulty(L(['#####', '#S.E#', '#####']));
assert(corridor.par === 1 && corridor.bits === 0 && corridor.trapStates === 0 && corridor.optimalRoutes === 1,
  'corridor: par 1, 0 bits, 0 traps, 1 route (' + JSON.stringify(corridor) + ')');

// 2. Open room: both first moves are optimal (0 bits), but after "right" the
//    player rests at the top-right corner where left and down both act and only
//    down is optimal (1 bit).
var room = DM.analyzeDifficulty(L(['#####', '#S..#', '#...#', '#..E#', '#####']));
assert(room.par === 2 && room.optimalRoutes === 2, 'open room: par 2 with 2 shortest routes (' + room.par + ', ' + room.optimalRoutes + ')');
assert(room.bits === 1, 'open room: exactly 1 bit of choice along the route (' + room.bits + ')');

// 3. One-way pocket. From S: down reaches the exit; left passes the gate into a
//    sealed cell; right rests at the far wall, from where the only move slides
//    back through the gate. Both other states are traps.
var pk = DM.analyzeDifficulty(L([
  '#######',
  '#.LS..#',
  '###.###',
  '###E###',
  '#######',
]));
assert(pk.solvable && pk.par === 1 && pk.states === 3 && pk.trapStates === 2,
  'gate pocket: par 1, 3 states, 2 traps (' + pk.par + ', ' + pk.states + ', ' + pk.trapStates + ')');
assert(Math.abs(pk.bits - Math.log(3) / Math.LN2) < 1e-9, 'gate pocket: log2(3) bits (' + pk.bits.toFixed(3) + ')');
assert(pk.score > corridor.score, 'gate pocket scores above a corridor (' + pk.score + ' > ' + corridor.score + ')');

// 4. Unsolvable board.
var dead = DM.analyzeDifficulty(L(['#####', '#S#E#', '#####']));
assert(!dead.solvable && dead.par === -1 && dead.score === 0, 'sealed exit: unsolvable, par -1, score 0');

// 5. Necessity: cracked wall is the only way through.
var needB = DM.mechanicNecessity(L(['#####', '#S###', '#B###', '#..E#', '#####']));
assert(needB.breakable === true && needB.gate === false && needB.teleport === false,
  'cracked wall on the only route is necessary (' + JSON.stringify(needB) + ')');

// 6. Necessity: decorative pads off the route are not necessary.
var deco = DM.mechanicNecessity(L(['######', '#S..E#', '#....#', '#1..2#', '######']));
assert(deco.teleport === false, 'pads that the shortest route ignores are not necessary');

// 7. Necessity: a gate that only saves moves still counts (removing it costs moves).
var hand = require(path.join(__dirname, '..', 'game', 'drift-maze-levels.js'));
var brittle = hand.filter(function (l) { return l.name === 'Brittle Wall'; })[0];
assert(DM.mechanicNecessity(DM.parseLevel(brittle)).breakable === true, 'campaign "Brittle Wall" really needs its cracked wall');

// 8. Agreement with the existing solver on generated boards, all tiers.
var N = 200, mismatches = 0, minScore = Infinity, maxScore = -Infinity, byTier = [[], [], [], []];
for (var i = 0; i < N; i++) {
  var tier = i % 4;
  var g = Gen.generate(9000 + i, tier);
  var lvl = DM.parseLevel(g);
  var a = DM.analyzeDifficulty(lvl);
  if (a.par !== g.par || !a.solvable || a.optimalRoutes < 1 || a.bits < 0 || a.overflow) mismatches++;
  minScore = Math.min(minScore, a.score); maxScore = Math.max(maxScore, a.score);
  byTier[tier].push(a.score);
}
assert(mismatches === 0, 'analysis par equals solver par on ' + N + ' generated boards (mismatches ' + mismatches + ')');
function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }
var meds = byTier.map(median);
assert(meds[0] < meds[1] && meds[1] < meds[2] && meds[2] < meds[3],
  'median score rises with tier (' + meds.join(' < ') + '; range ' + minScore + '..' + maxScore + ')');

// 9. Daily puzzle is a pure function of the date.
var d1 = Gen.daily(20261117), d2 = Gen.daily(20261117), d3 = Gen.daily(20261118);
assert(JSON.stringify(d1.rows) === JSON.stringify(d2.rows) && JSON.stringify(d1.rows) !== JSON.stringify(d3.rows),
  'daily level is the same for one date and differs the next day');
assert(d1.dateLabel === '2026-11-17' && Gen.dateSeed(new Date(Date.UTC(2026, 0, 5))) === 20260105, 'date seed and label format');

console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exit(failures ? 1 : 0);
