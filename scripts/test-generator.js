#!/usr/bin/env node
// Checks for game/drift-maze-gen.js across many seeds and every tier:
// determinism, well-formedness, solvability (the stored solution is replayed and
// independently re-solved), par accuracy, and the measured difficulty ramp.
// Run with: node scripts/test-generator.js [seedsPerTier]
'use strict';

var path = require('path');
var DriftMaze = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));
var Gen = require(path.join(__dirname, '..', 'game', 'drift-maze-gen.js'));

var SEEDS = parseInt(process.argv[2], 10) || 150;
var failures = [];
function fail(msg) { if (failures.length < 20) console.log('FAIL: ' + msg); failures.push(msg); }

var medians = [];
Gen.TIERS.forEach(function (tier, t) {
  var pars = [], inBand = 0, used = { breakable: 0, gate: 0, teleport: 0 }, maxMs = 0;
  for (var seed = 1; seed <= SEEDS; seed++) {
    var t0 = Date.now();
    var def = Gen.generate(seed, t);
    maxMs = Math.max(maxMs, Date.now() - t0);
    var tag = tier.name + ' seed ' + seed;

    if (JSON.stringify(Gen.generate(seed, t).rows) !== JSON.stringify(def.rows)) fail(tag + ': not deterministic');

    var flat = def.rows.join('');
    ['S', 'E'].forEach(function (ch) {
      if (flat.split(ch).length - 1 !== 1) fail(tag + ': expected exactly one ' + ch);
    });
    if ((flat.indexOf('1') >= 0) !== (flat.indexOf('2') >= 0)) fail(tag + ': unpaired teleport pad');
    var w = def.rows[0].length, h = def.rows.length;
    def.rows.forEach(function (row, y) {
      if (row.length !== w) fail(tag + ': ragged row');
      if (row[0] !== '#' || row[w - 1] !== '#' || ((y === 0 || y === h - 1) && /[^#]/.test(row))) fail(tag + ': border not sealed');
    });

    var level = DriftMaze.parseLevel(def);
    var replay = DriftMaze.analyzeRoute(level, def.solution);
    if (!replay.solved) fail(tag + ': stored solution does not reach the exit');
    var sol = DriftMaze.solveLevel(level);
    if (!sol.solvable || sol.length !== def.par) fail(tag + ': par ' + def.par + ' disagrees with re-solve ' + sol.length);
    if (sol.overflow) fail(tag + ': board contains a teleport loop');

    pars.push(def.par);
    if (def.inBand) inBand++;
    Object.keys(used).forEach(function (k) { if (def.used[k]) used[k]++; });
  }
  pars.sort(function (a, b) { return a - b; });
  var median = pars[Math.floor(pars.length / 2)];
  medians.push(median);
  console.log(
    tier.name + ': par min ' + pars[0] + ' / median ' + median + ' / max ' + pars[pars.length - 1] +
    ', target ' + tier.par.join('-') + ', in band ' + inBand + '/' + SEEDS +
    ', routes using cracked ' + used.breakable + ' gate ' + used.gate + ' teleport ' + used.teleport +
    ', slowest ' + maxMs + 'ms'
  );
  if (inBand / SEEDS < 0.9) fail(tier.name + ': only ' + inBand + '/' + SEEDS + ' levels inside the target par band');
});

for (var i = 1; i < medians.length; i++) {
  if (medians[i] <= medians[i - 1]) fail('median par does not rise from tier ' + (i - 1) + ' to ' + i + ' (' + medians.join(', ') + ')');
}

// Endless runs: different seeds give different opening levels; tiers escalate.
if (JSON.stringify(Gen.levelForRun(1, 1).rows) === JSON.stringify(Gen.levelForRun(2, 1).rows)) fail('runs 1 and 2 open with the same level');
var tiers = [1, 3, 4, 6, 7, 9, 10, 25].map(Gen.tierForDepth);
if (tiers.join(',') !== '0,0,1,1,2,2,3,3') fail('tierForDepth schedule wrong: ' + tiers.join(','));

console.log('\n' + (failures.length ? failures.length + ' FAILURE(S)' : 'Generator checks passed: ' + (SEEDS * Gen.TIERS.length) + ' levels, median par by tier ' + medians.join(' < ')));
process.exit(failures.length ? 1 : 0);
