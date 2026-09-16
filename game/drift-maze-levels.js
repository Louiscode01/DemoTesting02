// Drift Maze — level data. Pure data, no DOM dependency (see drift-maze-logic.js for
// the tile legend and the dual browser/Node export pattern this file mirrors).
//
// `par` is filled in by scripts/solve-levels.js (BFS optimal path length) rather than
// hand-guessed, so the HUD can show a trustworthy par without a human playtester.
// `requiresMechanic` lists tile types (beyond plain walls) that scripts/solve-levels.js
// asserts the BFS-optimal solution actually passes through, so a level can't silently
// make its "new" mechanic decorative/bypassable.

(function (root) {
  'use strict';

  var LEVELS = [
    {
      name: 'First Slide',
      par: null,
      requiresMechanic: [],
      rows: [
        '######',
        '#S...#',
        '#..#.#',
        '#...##',
        '###E##',
      ],
    },
    {
      name: 'Corridors',
      par: null,
      requiresMechanic: [],
      rows: [
        '########',
        '#S.....#',
        '######.#',
        '#......#',
        '#.######',
        '#....E.#',
        '########',
      ],
    },
    {
      name: 'Brittle Wall',
      par: null,
      requiresMechanic: ['breakable'],
      rows: [
        '########',
        '#S.....#',
        '#...#..#',
        '###B####',
        '#......#',
        '#.....E#',
        '########',
      ],
    },
    {
      name: 'Double Break',
      par: null,
      requiresMechanic: ['breakable'],
      rows: [
        '#########',
        '#S......#',
        '#..#....#',
        '##B######',
        '#.......#',
        '#......##',
        '######B##',
        '#.......#',
        '#......E#',
        '#########',
      ],
    },
    {
      name: 'One Way Out',
      par: null,
      requiresMechanic: ['gate'],
      rows: [
        '#########',
        '#S..#...#',
        '#...#...#',
        '#...RE..#',
        '#..##...#',
        '#...#...#',
        '#########',
      ],
    },
    {
      name: 'Gatekeeper',
      par: null,
      requiresMechanic: ['gate'],
      rows: [
        '#########',
        '#S......#',
        '#...#...#',
        '###D#####',
        '#.......#',
        '#......E#',
        '#########',
      ],
    },
    {
      name: 'Warp Step',
      par: null,
      requiresMechanic: ['teleport'],
      rows: [
        '#########',
        '#S..#...#',
        '#...#...#',
        '#1..#..2#',
        '#...#...#',
        '#...#..E#',
        '#########',
      ],
    },
    {
      name: 'Warp Detour',
      par: null,
      requiresMechanic: ['teleport'],
      rows: [
        '#########',
        '#S..#...#',
        '#...#...#',
        '#..1#..2#',
        '#...#...#',
        '#...#..E#',
        '#########',
      ],
    },
    {
      name: 'Convergence',
      par: null,
      requiresMechanic: ['breakable', 'gate', 'teleport'],
      rows: [
        '#########',
        '#S......#',
        '#..#....#',
        '##B######',
        '#.......#',
        '#......##',
        '######D##',
        '##2###1##',
        '##E######',
        '#########',
      ],
    },
    {
      name: 'The Long Drift',
      par: null,
      requiresMechanic: ['breakable', 'gate', 'teleport'],
      rows: [
        '###########',
        '#S........#',
        '#..#......#',
        '##B########',
        '#.........#',
        '#.......#.#',
        '#######D###',
        '#.........#',
        '##2####1###',
        '##E########',
        '###########',
      ],
    },
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEVELS;
  } else {
    root.DRIFT_MAZE_LEVELS = LEVELS;
  }
})(typeof window !== 'undefined' ? window : this);
