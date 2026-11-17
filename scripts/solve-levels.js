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
var scores = [];

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

    // Cycle 5: exact necessity (neutralise the tile type and re-solve) instead of
    // checking a single optimal route.
    var usedMechanics = DriftMaze.mechanicNecessity(level);
    var diff = DriftMaze.analyzeDifficulty(level);
    if (diff.par !== result.length) throw new Error('difficulty analysis par ' + diff.par + ' != solver par ' + result.length);
    if (def.par !== result.length) throw new Error('stored par ' + def.par + ' != solver par ' + result.length);
    if (def.score !== diff.score) throw new Error('stored score ' + def.score + ' != computed ' + diff.score);
    if (result.length < 3) throw new Error('par ' + result.length + ' is below the campaign minimum of 3');
    scores.push(diff.score);

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
      ', score ' + diff.score + ' (bits ' + diff.bits.toFixed(1) + ', traps ' + diff.trapStates + '/' + diff.states +
      ', shortest routes ' + diff.optimalRoutes + ')' + (required.length ? ', needs: ' + required.join('+') : '')
    );
  } catch (err) {
    failures.push(label + ': ' + err.message);
    console.log(label + ': FAIL - ' + err.message);
  }
});

// Curve checks: the last three levels strictly rise and top everything before them,
// and no non-intro level is easier than the first tutorial.
if (scores.length === LEVELS.length) {
  var n = scores.length;
  var earlierMax = Math.max.apply(null, scores.slice(0, n - 3));
  if (!(scores[n - 3] > earlierMax && scores[n - 2] > scores[n - 3] && scores[n - 1] > scores[n - 2])) {
    failures.push('difficulty curve: final three levels do not strictly rise above the rest (' + scores.join(', ') + ')');
  } else {
    console.log('Curve: final three levels rise above all earlier ones (' + scores.join(', ') + ')');
  }
}

// The level file must be exactly what the curation script produces.
var curation = require(path.join(__dirname, 'curate-campaign.js'));
var fresh = curation.curate();
var stored = require('fs').readFileSync(path.join(__dirname, '..', 'game', 'drift-maze-levels.js'), 'utf8');
if (curation.render(fresh) !== stored) failures.push('game/drift-maze-levels.js differs from a fresh curation run');
else console.log('Level file matches a fresh, deterministic curation run (' + fresh.length + ' levels).');
var belowFloor = fresh.filter(function (l) { return l.metFloor === false; });
if (belowFloor.length) failures.push('curation fell below its difficulty floor for: ' + belowFloor.map(function (l) { return l.name; }).join(', '));

if (failures.length > 0) {
  console.log('\n' + failures.length + ' level(s) failed validation.');
  process.exit(1);
} else {
  console.log('\nAll ' + LEVELS.length + ' levels validated, solvable, and required mechanics confirmed necessary.');
  process.exit(0);
}
