// Drift Maze — pure game logic (no DOM dependency).
// Loaded as a plain <script> in the browser (attaches to window.DriftMaze) and
// also require()-able from Node for automated tests (module.exports.DriftMaze).
//
// Tile legend:
//   '#' wall            '.' floor           'S' start (becomes floor)
//   'E' exit            'B' cracked wall (first hit stops you and shatters it)
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
        // Cracked wall: it absorbs the hit. The wall shatters to floor, but the
        // slide stops in front of it, so breaking one costs a move and changes
        // where later slides come to rest.
        grid[ny][nx] = '.';
        brokenWalls.push({ x: nx, y: ny });
        break;
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
      // A move "acts" if the player moved or a wall was shattered in place.
      acted: path.length > 0 || brokenWalls.length > 0,
      // True only for malformed boards where teleport pads feed each other forever.
      overflow: steps > maxSteps,
    };
  }

  // Exact breadth-first search. Shattering a cracked wall changes where later
  // slides stop, so the search state is (position, set of shattered walls), not
  // position alone. Returns the optimal move list plus search statistics that the
  // generator uses to rate difficulty.
  //
  // opts.grid / opts.pos let callers solve from a mid-game position (hints).
  function solveLevel(level, opts) {
    opts = opts || {};
    var base = opts.grid || level.grid;
    var start = opts.pos || level.start;
    var width = level.width, height = level.height;
    var maxStates = opts.maxStates || 200000;

    var cracked = [];
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (base[y][x] === 'B') cracked.push({ x: x, y: y });
      }
    }
    var crackedIndex = {};
    cracked.forEach(function (c, i) { crackedIndex[c.x + ',' + c.y] = i; });

    function gridFor(mask) {
      var g = cloneGrid(base);
      for (var i = 0; i < cracked.length; i++) {
        if (mask & (1 << i)) g[cracked[i].y][cracked[i].x] = '.';
      }
      return g;
    }
    function key(p, mask) { return p.x + ',' + p.y + '|' + mask; }

    var visited = {};
    visited[key(start, 0)] = true;
    var queue = [{ pos: start, mask: 0, depth: 0, parent: -1, dir: null }];
    var head = 0;
    var overflow = false;

    while (head < queue.length && queue.length < maxStates) {
      var node = queue[head];
      for (var dir in DIRS) {
        var g = gridFor(node.mask);
        var result = slide(g, width, height, node.pos, dir);
        if (result.overflow) { overflow = true; continue; }
        if (!result.acted) continue;
        if (result.hitExit) {
          var moves = [dir];
          for (var n = node; n.parent !== -1; n = queue[n.parent]) moves.unshift(n.dir);
          return {
            solvable: true, moves: moves, length: moves.length,
            statesExplored: queue.length, overflow: overflow,
          };
        }
        var mask = node.mask;
        for (var b = 0; b < result.brokenWalls.length; b++) {
          var w = result.brokenWalls[b];
          mask |= 1 << crackedIndex[w.x + ',' + w.y];
        }
        var k = key(result.stoppedAt, mask);
        if (!visited[k]) {
          visited[k] = true;
          queue.push({ pos: result.stoppedAt, mask: mask, depth: node.depth + 1, parent: head, dir: dir });
        }
      }
      head++;
    }
    return { solvable: false, moves: null, length: -1, statesExplored: queue.length, overflow: overflow };
  }

  // Replays a move list on a fresh copy of the level and reports which special
  // tiles the route really depends on.
  function analyzeRoute(level, moves) {
    var grid = cloneGrid(level.grid);
    var pos = level.start;
    var used = { breakable: false, gate: false, teleport: false };
    var solved = false;
    for (var i = 0; i < moves.length; i++) {
      var r = slide(grid, level.width, level.height, pos, moves[i]);
      if (r.brokenWalls.length) used.breakable = true;
      if (r.teleported) used.teleport = true;
      for (var j = 0; j < r.path.length; j++) {
        if (GATE_DIR[level.grid[r.path[j].y][r.path[j].x]]) used.gate = true;
      }
      pos = r.stoppedAt;
      if (r.hitExit) { solved = true; break; }
    }
    return { used: used, solved: solved, endPos: pos };
  }

  var DriftMaze = {
    DIRS: DIRS,
    GATE_DIR: GATE_DIR,
    parseLevel: parseLevel,
    cloneGrid: cloneGrid,
    slide: slide,
    solveLevel: solveLevel,
    analyzeRoute: analyzeRoute,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriftMaze;
  } else {
    root.DriftMaze = DriftMaze;
  }
})(typeof window !== 'undefined' ? window : this);
