// Drift Maze — seeded procedural level generator (no DOM dependency).
// Browser: window.DriftMazeGen. Node: module.exports.
//
// Method: generate-and-test. For a (seed, tier) pair, build a fixed number of
// random boards from a seeded PRNG, solve each with the exact solver, and keep
// the board whose optimal solution best matches the tier's target length and
// uses the tier's special tiles. The same seed always yields the same level.

(function (root) {
  'use strict';

  var DriftMaze = (typeof module !== 'undefined' && module.exports)
    ? require('./drift-maze-logic.js')
    : root.DriftMaze;

  // par: [min, max] target for the optimal solution length.
  var TIERS = [
    { name: 'Breeze',    w: [7, 8],   h: [6, 7],  wall: [0.08, 0.14], cracked: [0, 0], gates: [0, 0], pads: 0,   par: [4, 6] },
    { name: 'Current',   w: [8, 10],  h: [7, 8],  wall: [0.09, 0.15], cracked: [1, 2], gates: [0, 1], pads: 0,   par: [6, 8] },
    { name: 'Riptide',   w: [10, 12], h: [8, 9],  wall: [0.09, 0.15], cracked: [1, 3], gates: [1, 2], pads: 0.5, par: [8, 11] },
    { name: 'Maelstrom', w: [12, 13], h: [9, 10], wall: [0.10, 0.16], cracked: [2, 4], gates: [1, 3], pads: 1,   par: [10, 16] },
  ];

  var ATTEMPTS = 400;
  var GATE_CHARS = ['U', 'D', 'L', 'R'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCandidate(rng, tier) {
    function int(range) { return range[0] + Math.floor(rng() * (range[1] - range[0] + 1)); }
    var w = int(tier.w), h = int(tier.h);
    var density = tier.wall[0] + rng() * (tier.wall[1] - tier.wall[0]);
    var grid = [];
    var open = [];
    for (var y = 0; y < h; y++) {
      var row = [];
      for (var x = 0; x < w; x++) {
        var border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        var ch = border || rng() < density ? '#' : '.';
        row.push(ch);
        if (ch === '.') open.push({ x: x, y: y });
      }
      grid.push(row);
    }
    function take() {
      if (!open.length) return null;
      var i = Math.floor(rng() * open.length);
      return open.splice(i, 1)[0];
    }
    function place(ch) {
      var c = take();
      if (c) grid[c.y][c.x] = ch;
      return c;
    }
    if (!place('S') || !place('E')) return null;
    var n, i;
    for (n = int(tier.cracked), i = 0; i < n; i++) place('B');
    for (n = int(tier.gates), i = 0; i < n; i++) place(GATE_CHARS[Math.floor(rng() * 4)]);
    if (rng() < tier.pads) { place('1'); place('2'); }
    return grid.map(function (r) { return r.join(''); });
  }

  function scoreCandidate(tier, solution, analysis) {
    var lo = tier.par[0], hi = tier.par[1], len = solution.length;
    var score;
    if (len < lo) score = -10 * (lo - len);
    else if (len > hi) score = -4 * (len - hi);
    else score = 10 + (len - lo);          // inside the band: longer is better
    if (analysis.used.breakable) score += 3;
    if (analysis.used.gate) score += 3;
    if (analysis.used.teleport) score += 3;
    return score;
  }

  function generate(seed, tierIndex) {
    tierIndex = Math.max(0, Math.min(TIERS.length - 1, tierIndex | 0));
    var tier = TIERS[tierIndex];
    var rng = mulberry32(((seed >>> 0) * 2654435761 + tierIndex * 40503 + 1) >>> 0);
    var best = null;
    // Fixed attempt count keeps the result a pure function of (seed, tier); the
    // loop only runs on if no solvable board has turned up yet.
    for (var attempt = 0; attempt < ATTEMPTS || (!best && attempt < ATTEMPTS * 20); attempt++) {
      var rows = buildCandidate(rng, tier);
      if (!rows) continue;
      var level = DriftMaze.parseLevel({ name: 'gen', rows: rows });
      var solution = DriftMaze.solveLevel(level);
      if (!solution.solvable || solution.overflow) continue;
      var analysis = DriftMaze.analyzeRoute(level, solution.moves);
      var score = scoreCandidate(tier, solution, analysis);
      if (!best || score > best.score) {
        best = { rows: rows, score: score, solution: solution, used: analysis.used, attempt: attempt };
      }
    }
    if (!best) throw new Error('generator found no solvable board for seed ' + seed + ' tier ' + tierIndex);
    return {
      name: tier.name + ' #' + (seed >>> 0),
      rows: best.rows,
      par: best.solution.length,
      solution: best.solution.moves,
      used: best.used,
      tier: tierIndex,
      tierName: tier.name,
      seed: seed >>> 0,
      inBand: best.solution.length >= tier.par[0] && best.solution.length <= tier.par[1],
    };
  }

  // Endless run: depth 1.. maps to escalating tiers, three levels per tier.
  function tierForDepth(depth) {
    return Math.min(TIERS.length - 1, Math.floor((depth - 1) / 3));
  }
  function levelForRun(runSeed, depth) {
    return generate(((runSeed >>> 0) + depth * 7919) >>> 0, tierForDepth(depth));
  }

  var api = {
    TIERS: TIERS, ATTEMPTS: ATTEMPTS,
    mulberry32: mulberry32, generate: generate,
    tierForDepth: tierForDepth, levelForRun: levelForRun,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DriftMazeGen = api;
})(typeof window !== 'undefined' ? window : this);
