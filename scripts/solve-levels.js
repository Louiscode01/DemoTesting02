#!/usr/bin/env node
// Validates every Drift Maze level (well-formed grid, exactly one S/E, paired
// teleports), BFS-solves it, and — for levels that declare `requiresMechanic` —
// confirms the optimal solution actually passes through that tile type, so a
// "new mechanic" level can't silently be solvable by walking around it.
// Run with: node scripts/solve-levels.js
'use strict';

var path = require('path');
var DriftMaze = require(path.join(__dirname, '..', 'game', 'drift-maze-logic.js'));
var LEVELS = require(path.join(__dirname, '..', 'game', 'drift-maze-levels.js'));

var failures = [];

LEVELS.forEach(function (def, idx) {
  var label = 'Level ' + (idx + 1) + ' "' + def.name + '"';
  try {
    var level = DriftMaze.parseLevel(def);

    var counts = {};
    level.grid.forEach(function (row) {
      row.forEach(function (ch) { counts[ch] = (counts[ch] || 0) + 1; });
    });
    ['1', '2'].forEach(function (padChar) {
      var n = counts[padChar] || 0;
      if (n !== 0 && n !== 1) {
        throw new Error('teleport pad "' + padChar + '" appears ' + n + ' times (expected 0 or 1)');
      }
    });
    if (!!counts['1'] !== !!counts['2']) {
      throw new Error('unpaired teleport pad (1 present: ' + !!counts['1'] + ', 2 present: ' + !!counts['2'] + ')');
    }

    var result = DriftMaze.solveLevel(level);
    if (!result.solvable) {
      throw new Error('no path from S to E found by BFS');
    }

    var usedMechanics = DriftMaze.analyzeRoute(level, result.moves).used;

    var required = def.requiresMechanic || [];
    var missing = required.filter(function (m) { return !usedMechanics[m]; });
    if (missing.length > 0) {
      throw new Error(
        'optimal solution does not require declared mechanic(s): ' + missing.join(', ') +
        ' (solution: ' + result.moves.join(', ') + ') — level is bypassable'
      );
    }

    console.log(
      label + ': SOLVABLE, par = ' + result.length + ' moves [' + result.moves.join(', ') + ']' +
      (required.length ? ', uses: ' + required.join('+') : '')
    );
  } catch (err) {
    failures.push(label + ': ' + err.message);
    console.log(label + ': FAIL - ' + err.message);
  }
});

if (failures.length > 0) {
  console.log('\n' + failures.length + ' level(s) failed validation.');
  process.exit(1);
} else {
  console.log('\nAll ' + LEVELS.length + ' levels validated, solvable, and required mechanics confirmed non-bypassable.');
  process.exit(0);
}
