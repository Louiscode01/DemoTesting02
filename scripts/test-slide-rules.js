#!/usr/bin/env node
// Unit checks for game/drift-maze-logic.js's slide() rule handling, one tile type
// at a time, isolated from any full level. No test framework dependency (kept
// consistent with the project's zero-build-step, zero-dependency approach).
// Run with: node scripts/test-slide-rules.js
'use strict';

var path = require('path');
var DriftMaze = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));

var passed = 0, failed = 0;

function check(name, actual, expected) {
  var a = JSON.stringify(actual);
  var e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log('PASS: ' + name);
  } else {
    failed++;
    console.log('FAIL: ' + name + '\n  expected: ' + e + '\n  actual:   ' + a);
  }
}

function grid(rows) {
  return rows.map(function (r) { return r.split(''); });
}

// 1. Wall stop: sliding right into a wall stops one cell short of it.
(function () {
  var g = grid(['#....#']);
  var r = DriftMaze.slide(g, 6, 1, { x: 1, y: 0 }, 'right');
  check('wall stops slide one cell short', r.stoppedAt, { x: 4, y: 0 });
})();

// 2. Level edge stop: sliding off the grid with no wall stops at the last in-bounds cell.
(function () {
  var g = grid(['.....']);
  var r = DriftMaze.slide(g, 5, 1, { x: 0, y: 0 }, 'right');
  check('level edge stops slide at last in-bounds cell', r.stoppedAt, { x: 4, y: 0 });
})();

// 3. Cracked wall: the first hit stops the slide in front of it and shatters it;
//    the next slide passes through the cleared cell.
(function () {
  var g = grid(['..B..#']);
  var r = DriftMaze.slide(g, 6, 1, { x: 0, y: 0 }, 'right');
  check('cracked wall stops the slide in front of it', r.stoppedAt, { x: 1, y: 0 });
  check('cracked wall reported as broken', r.brokenWalls, [{ x: 2, y: 0 }]);
  check('cracked wall cell becomes floor in the grid', g[0][2], '.');
  var r2 = DriftMaze.slide(g, 6, 1, r.stoppedAt, 'right');
  check('second slide passes through the shattered wall', r2.stoppedAt, { x: 4, y: 0 });
})();

// 3b. Cracked wall hit from the adjacent cell: no movement, but the move still acts.
(function () {
  var g = grid(['.B.#']);
  var r = DriftMaze.slide(g, 4, 1, { x: 0, y: 0 }, 'right');
  check('adjacent cracked wall: player does not move', r.moved, false);
  check('adjacent cracked wall: move still counts as an action', r.acted, true);
})();

// 3c. Exact solver accounts for shattered-wall state: S must break the wall (1),
//     then slide through to the exit (2).
(function () {
  var level = DriftMaze.parseLevel({ name: 't', rows: ['#######', '#S.B.E#', '#######'] });
  var sol = DriftMaze.solveLevel(level);
  check('solver finds the break-then-pass route', sol.moves, ['right', 'right']);
  check('route analysis reports the cracked wall as used', DriftMaze.analyzeRoute(level, sol.moves).used.breakable, true);
})();

// 3d. Solver reports unsolvable boards instead of looping.
(function () {
  var level = DriftMaze.parseLevel({ name: 't', rows: ['#####', '#S#E#', '#####'] });
  check('walled-off exit is unsolvable', DriftMaze.solveLevel(level).solvable, false);
})();

// 3e. Mutually-feeding teleport pads are flagged as overflow, not an infinite loop.
(function () {
  var g = grid(['2..1']); // start between the pads: 1 warps to 2, which slides back into 1
  var r = DriftMaze.slide(g, 4, 1, { x: 1, y: 0 }, 'right');
  check('teleport ping-pong terminates and is flagged', r.overflow, true);
  var ok = DriftMaze.slide(grid(['.1..2.#']), 7, 1, { x: 0, y: 0 }, 'right');
  check('ordinary teleport is not flagged as overflow', ok.overflow, false);
})();

// 4. One-way gate, wrong direction: blocks entry into the gate cell itself (like a
//    wall), though the slide may still travel through open floor up to that point.
(function () {
  var g = grid(['.R..']); // 'R' = passable only when sliding right
  var r = DriftMaze.slide(g, 4, 1, { x: 3, y: 0 }, 'left');
  check('one-way gate blocks entry from the disallowed direction', r.stoppedAt, { x: 2, y: 0 });
})();

// 4b. One-way gate, wrong direction, approached with no floor in between: no movement at all.
(function () {
  var g = grid(['.R..']);
  var r = DriftMaze.slide(g, 4, 1, { x: 2, y: 0 }, 'left');
  check('one-way gate immediately adjacent: blocked with zero movement', r.moved, false);
})();

// 5. One-way gate, correct direction: passable, slide continues through it.
(function () {
  var g = grid(['.R..']);
  var r = DriftMaze.slide(g, 4, 1, { x: 0, y: 0 }, 'right');
  check('one-way gate passes the allowed direction', r.stoppedAt, { x: 3, y: 0 });
})();

// 6. Teleport pad: warps to the paired pad and continues sliding in the same direction.
(function () {
  var g = grid(['.1..2.#']);
  var r = DriftMaze.slide(g, 7, 1, { x: 0, y: 0 }, 'right');
  // enters pad '1' at x=1, warps to pad '2' at x=4, continues right, stops before the wall at x=6.
  check('teleport warps to paired pad and continues in the same direction', r.stoppedAt, { x: 5, y: 0 });
  check('teleport reports teleported = true', r.teleported, true);
})();

// 7. Exit tile: stops the slide immediately upon reaching it, even if the path beyond is open.
(function () {
  var g = grid(['.E..']);
  var r = DriftMaze.slide(g, 4, 1, { x: 0, y: 0 }, 'right');
  check('exit tile stops the slide and reports hitExit', r.hitExit, true);
  check('exit tile stop position is the exit cell', r.stoppedAt, { x: 1, y: 0 });
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed.');
process.exit(failed > 0 ? 1 : 0);
