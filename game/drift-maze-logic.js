// Drift Maze — pure game logic (no DOM dependency).
// Loaded as a plain <script> in the browser (attaches to window.DriftMaze) and
// also require()-able from Node for automated tests (module.exports.DriftMaze).
//
// Tile legend:
//   '#' wall            '.' floor           'S' start (becomes floor)
//   'E' exit            'B' breakable wall (clears to floor once entered)
//   'U' 'D' 'L' 'R'      one-way gate, passable only when sliding Up/Down/Left/Right
//   '1' '2'             teleport pad pair (sliding onto one continues the slide
//                        from the other, in the same direction)

(function (root) {
  'use strict';

  var DIRS = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  var GATE_DIR = { U: 'up', D: 'down', L: 'left', R: 'right' };

  function parseLevel(def) {
    var rows = def.rows;
    var height = rows.length;
    var width = rows[0].length;
    var grid = [];
    var start = null;
    var exit = null;

    for (var y = 0; y < height; y++) {
      var row = rows[y];
      if (row.length !== width) {
        throw new Error(
          'Level "' + def.name + '" row ' + y + ' length ' + row.length +
          ' does not match width ' + width
        );
      }
      var gridRow = [];
      for (var x = 0; x < width; x++) {
        var ch = row[x];
        if (ch === 'S') {
          start = { x: x, y: y };
          gridRow.push('.');
        } else if (ch === 'E') {
          exit = { x: x, y: y };
          gridRow.push('E');
        } else {
          gridRow.push(ch);
        }
      }
      grid.push(gridRow);
    }

    if (!start) throw new Error('Level "' + def.name + '" has no start (S) tile');
    if (!exit) throw new Error('Level "' + def.name + '" has no exit (E) tile');

    return { name: def.name, width: width, height: height, grid: grid, start: start, exit: exit, par: def.par };
  }

  function cloneGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  function inBounds(width, height, x, y) {
    return x >= 0 && y >= 0 && x < width && y < height;
  }

  function findPad(grid, width, height, ch, excludeX, excludeY) {
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (grid[y][x] === ch && !(x === excludeX && y === excludeY)) {
          return { x: x, y: y };
        }
      }
    }
    return null;
  }

  // Mutates `grid` in place (breakable walls clear permanently), matching how a
  // live level's state persists between moves. Callers that need a dry-run
  // (e.g. the solver) must pass a cloned grid.
  function slide(grid, width, height, pos, dir) {
    var d = DIRS[dir];
    if (!d) throw new Error('Unknown direction: ' + dir);

    var x = pos.x, y = pos.y;
    var path = [];
    var brokenWalls = [];
    var hitExit = false;
    var teleported = false;
    var maxSteps = width * height * 4 + 4; // safety bound against pathological loops
    var steps = 0;

    while (steps++ < maxSteps) {
      var nx = x + d.dx, ny = y + d.dy;

      if (!inBounds(width, height, nx, ny)) break; // edge of the level
      var tile = grid[ny][nx];

      if (tile === '#') break; // wall blocks entry
      if (GATE_DIR[tile] && GATE_DIR[tile] !== dir) break; // one-way gate, wrong side

      if (tile === 'B') {
        grid[ny][nx] = '.';
        brokenWalls.push({ x: nx, y: ny });
        x = nx; y = ny;
        path.push({ x: x, y: y });
        continue;
      }

      if (tile === '1' || tile === '2') {
        x = nx; y = ny;
        path.push({ x: x, y: y });
        var pairChar = tile === '1' ? '2' : '1';
        var pair = findPad(grid, width, height, pairChar, x, y);
        if (!pair) break; // malformed level (unpaired pad); stop rather than loop
        teleported = true;
        x = pair.x; y = pair.y;
        path.push({ x: x, y: y });
        continue;
      }

      if (tile === 'E') {
        x = nx; y = ny;
        path.push({ x: x, y: y });
        hitExit = true;
        break;
      }

      // floor, or a one-way gate entered from its permitted direction
      x = nx; y = ny;
      path.push({ x: x, y: y });
    }

    return {
      path: path,
      stoppedAt: { x: x, y: y },
      moved: path.length > 0,
      hitExit: hitExit,
      brokenWalls: brokenWalls,
      teleported: teleported,
    };
  }

  // Breadth-first search over the (position) state space to confirm a level is
  // solvable. Breakable walls make the state space technically history-dependent
  // (grid, not just position, can change), but since breaking a wall only ever
  // opens up the grid (never closes it), searching over position-only state with
  // a *shared*, progressively-mutated grid across the whole BFS is sound: once a
  // cell is floor, it stays floor, so no reachable position is ever missed by
  // treating "grid state" as monotonically non-decreasing in reachability.
  function solveLevel(level, maxDepth) {
    var grid = cloneGrid(level.grid);
    var start = level.start;
    var visited = {};
    var key = function (p) { return p.x + ',' + p.y; };
    visited[key(start)] = true;
    var queue = [{ pos: start, depth: 0, moves: [] }];
    var head = 0;
    var limit = maxDepth || 500;

    while (head < queue.length) {
      var node = queue[head++];
      if (node.depth > limit) continue;
      for (var dir in DIRS) {
        var result = slide(grid, level.width, level.height, node.pos, dir);
        if (!result.moved) continue;
        if (result.hitExit) {
          return { solvable: true, moves: node.moves.concat([dir]), length: node.depth + 1 };
        }
        var k = key(result.stoppedAt);
        if (!visited[k]) {
          visited[k] = true;
          queue.push({ pos: result.stoppedAt, depth: node.depth + 1, moves: node.moves.concat([dir]) });
        }
      }
    }
    return { solvable: false, moves: null, length: -1 };
  }

  var DriftMaze = {
    DIRS: DIRS,
    GATE_DIR: GATE_DIR,
    parseLevel: parseLevel,
    cloneGrid: cloneGrid,
    slide: slide,
    solveLevel: solveLevel,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriftMaze;
  } else {
    root.DriftMaze = DriftMaze;
  }
})(typeof window !== 'undefined' ? window : this);
