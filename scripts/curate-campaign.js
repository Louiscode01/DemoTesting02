#!/usr/bin/env node
// Builds the Drift Maze campaign from measured difficulty.
//   node scripts/curate-campaign.js          print the curated campaign
//   node scripts/curate-campaign.js --write  also rewrite game/drift-maze-levels.js
// Deterministic: the same script always selects the same levels. Used as a module by
// scripts/solve-levels.js to confirm the level file matches a fresh curation run.
'use strict';
var fs = require('fs');
var path = require('path');
var DM = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));
var Gen = require(path.join(__dirname, '..', 'game', 'drift-maze-gen.js'));

var CANDIDATES = 4000;      // seeded boards drawn per generated slot (slot.n overrides)
var CURATION_SEED = 5005;

// Hand-made tutorials kept from Cycle 2.
var TUTORIALS = [
  { name: 'First Slide', requiresMechanic: [], rows: ['######', '#S...#', '#..#.#', '#...##', '###E##'] },
  { name: 'Corridors', requiresMechanic: [], rows: ['########', '#S.....#', '######.#', '#......#', '#.######', '#....E.#', '########'] },
  { name: 'Brittle Wall', requiresMechanic: ['breakable'], rows: ['########', '#S.....#', '#...#..#', '###B####', '#......#', '#.....E#', '########'] },
];

// intro: first level of a mechanic; may be easier than the level before it.
var SLOTS = [
  { name: 'Double Break',   need: ['breakable'], par: [6, 7],
    spec: { w: [8, 9], h: [7, 8], wall: [0.10, 0.16], cracked: [2, 3], gates: [0, 0], pads: 0 } },
  { name: 'One Way Out',    need: ['gate'], par: [4, 6], intro: true,
    spec: { w: [7, 8], h: [6, 7], wall: [0.10, 0.16], cracked: [0, 0], gates: [1, 2], pads: 0 } },
  { name: 'Gatekeeper',     need: ['gate'], par: [6, 8],
    spec: { w: [8, 10], h: [7, 8], wall: [0.10, 0.16], cracked: [0, 0], gates: [2, 3], pads: 0 } },
  { name: 'Warp Step',      need: ['teleport'], par: [4, 6], intro: true,
    spec: { w: [7, 8], h: [6, 7], wall: [0.10, 0.16], cracked: [0, 0], gates: [0, 0], pads: 1 } },
  { name: 'Warp Detour',    need: ['teleport'], par: [6, 8],
    spec: { w: [8, 10], h: [7, 8], wall: [0.10, 0.16], cracked: [0, 0], gates: [0, 0], pads: 1 } },
  { name: 'Crack and Gate', n: 20000, need: ['breakable', 'gate'], par: [7, 9],
    spec: { w: [9, 11], h: [8, 9], wall: [0.09, 0.15], cracked: [1, 3], gates: [1, 2], pads: 0 } },
  { name: 'Convergence',    n: 40000, need: ['breakable', 'gate', 'teleport'], par: [8, 10],
    spec: { w: [10, 12], h: [8, 9], wall: [0.09, 0.15], cracked: [1, 3], gates: [1, 2], pads: 1 } },
  { name: 'The Long Drift', n: 80000, need: ['breakable', 'gate', 'teleport'], par: [10, 12],
    spec: { w: [11, 13], h: [9, 10], wall: [0.10, 0.16], cracked: [2, 4], gates: [1, 3], pads: 1 } },
  { name: 'Maelstrom',      n: 200000, need: ['breakable', 'gate', 'teleport'], par: [12, 16],
    spec: { w: [12, 13], h: [9, 10], wall: [0.10, 0.16], cracked: [2, 4], gates: [1, 3], pads: 1 } },
];

function rate(def) {
  var level = DM.parseLevel(def);
  var a = DM.analyzeDifficulty(level);
  return { level: level, analysis: a, necessity: DM.mechanicNecessity(level) };
}

function curate(log) {
  log = log || function () {};
  var out = [];
  var runningMax = 0, introFloor = 0;

  TUTORIALS.forEach(function (t) {
    var r = rate(t);
    out.push({ name: t.name, requiresMechanic: t.requiresMechanic, rows: t.rows, par: r.analysis.par,
      score: r.analysis.score, source: 'hand' });
    runningMax = Math.max(runningMax, r.analysis.score);
  });
  introFloor = out[0].score; // an intro level must at least beat the first tutorial

  SLOTS.forEach(function (slot, slotIndex) {
    var rng = Gen.mulberry32((CURATION_SEED * 2654435761 + slotIndex * 40503 + 1) >>> 0);
    var floor = slot.intro ? introFloor : runningMax;
    var best = null, fallback = null, eligible = 0;
    var total = slot.n || CANDIDATES;
    for (var c = 0; c < total; c++) {
      var rows = Gen.buildCandidate(rng, slot.spec);
      if (!rows) continue;
      var level = DM.parseLevel({ name: slot.name, rows: rows });
      var sol = DM.solveLevel(level);
      if (!sol.solvable || sol.overflow || sol.length < slot.par[0] || sol.length > slot.par[1]) continue;
      var nec = DM.mechanicNecessity(level);
      if (!slot.need.every(function (m) { return nec[m]; })) continue;
      var a = DM.analyzeDifficulty(level);
      eligible++;
      var cand = { rows: rows, par: a.par, score: a.score, candidate: c };
      if (!fallback || a.score > fallback.score) fallback = cand;
      if (a.score > floor && (!best || a.score < best.score)) best = cand;
    }
    var pick = best || fallback;
    if (!pick) throw new Error('no eligible candidate for slot "' + slot.name + '"');
    log(slot.name + ': ' + eligible + ' eligible of ' + total + ', floor ' + floor +
      ', picked #' + pick.candidate + ' score ' + pick.score + (best ? '' : ' (BELOW FLOOR)'));
    out.push({ name: slot.name, requiresMechanic: slot.need, rows: pick.rows, par: pick.par, score: pick.score,
      intro: !!slot.intro, metFloor: !!best,
      source: 'curated slot ' + (slotIndex + 1) + ' candidate ' + pick.candidate });
    runningMax = Math.max(runningMax, pick.score);
  });
  return out;
}

function render(levels) {
  var s = '// Drift Maze — campaign levels. GENERATED by scripts/curate-campaign.js --write.\n' +
    '// Do not edit by hand: scripts/solve-levels.js checks this file against a fresh\n' +
    '// curation run. Levels 1-3 are hand-made tutorials; the rest were selected from\n' +
    '// seeded generator output by measured difficulty (see docs/cycle5-design.md).\n' +
    '// `par` and `score` are computed by the exact solver, `requiresMechanic` lists\n' +
    '// tile types the level cannot be solved at par without.\n\n' +
    '(function (root) {\n  \'use strict\';\n\n  var LEVELS = [\n';
  levels.forEach(function (l) {
    s += '    {\n      name: ' + JSON.stringify(l.name) + ',\n      par: ' + l.par + ',\n      score: ' + l.score +
      ',\n      requiresMechanic: ' + JSON.stringify(l.requiresMechanic) + ',\n      source: ' + JSON.stringify(l.source) +
      ',\n      rows: [\n' + l.rows.map(function (r) { return '        ' + JSON.stringify(r) + ',\n'; }).join('') +
      '      ],\n    },\n';
  });
  s += '  ];\n\n  if (typeof module !== \'undefined\' && module.exports) {\n    module.exports = LEVELS;\n' +
    '  } else {\n    root.DRIFT_MAZE_LEVELS = LEVELS;\n  }\n})(typeof window !== \'undefined\' ? window : this);\n';
  return s;
}

module.exports = { curate: curate, render: render, SLOTS: SLOTS, TUTORIALS: TUTORIALS };

if (require.main === module) {
  var levels = curate(console.log);
  console.log('');
  levels.forEach(function (l, i) {
    console.log((i + 1) + '. ' + l.name + ' — par ' + l.par + ', score ' + l.score + ' [' + l.requiresMechanic.join('+') + ']');
  });
  if (process.argv.indexOf('--write') !== -1) {
    fs.writeFileSync(path.join(__dirname, '..', 'game', 'drift-maze-levels.js'), render(levels));
    console.log('\nWrote game/drift-maze-levels.js');
  }
}
