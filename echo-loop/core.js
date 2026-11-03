(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EchoCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Legend: # wall, . floor, P start, X exit, a/b plates, A/B doors
  var LEVELS = [
    { name: 'First Steps', turns: 10, map: [
      '#######',
      '#P...X#',
      '#######'] },
    { name: 'Hold the Door', turns: 14, map: [
      '#########',
      '#P.#....#',
      '#..#.##X#',
      '#a.A.#..#',
      '#########'] },
    { name: 'Two Keys', turns: 20, map: [
      '###########',
      '#P.#b...BX#',
      '#..A.######',
      '#a.########',
      '###########'] },
  ];

  function parse(def) {
    var h = def.map.length, w = def.map[0].length;
    var L = { name: def.name, T: def.turns, w: w, h: h, wall: [], plates: [], doors: [], start: null, exit: null };
    for (var y = 0; y < h; y++) {
      L.wall.push([]);
      for (var x = 0; x < w; x++) {
        var c = def.map[y][x];
        L.wall[y].push(c === '#');
        if (c === 'P') L.start = { x: x, y: y };
        else if (c === 'X') L.exit = { x: x, y: y };
        else if (c === 'a' || c === 'b') L.plates.push({ x: x, y: y, id: c });
        else if (c === 'A' || c === 'B') L.doors.push({ x: x, y: y, id: c.toLowerCase() });
      }
    }
    return L;
  }

  function newGame(level) {
    var L = typeof level === 'number' ? parse(LEVELS[level]) : level;
    return { L: L, ghosts: [], path: [{ x: L.start.x, y: L.start.y }], t: 0, won: false, loops: 1 };
  }

  function ghostAt(g, path, t) { return path[Math.min(t, path.length - 1)]; }

  // Set of open door ids at time t given the player's position.
  function openDoors(L, ghosts, t, pp) {
    var open = {};
    for (var i = 0; i < L.plates.length; i++) {
      var p = L.plates[i], on = pp && pp.x === p.x && pp.y === p.y;
      for (var j = 0; j < ghosts.length && !on; j++) {
        var q = ghostAt(null, ghosts[j], t);
        on = q.x === p.x && q.y === p.y;
      }
      if (on) open[p.id] = true;
    }
    return open;
  }

  function canMove(L, ghosts, t, pp, nx, ny) {
    if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h || L.wall[ny][nx]) return false;
    for (var i = 0; i < L.doors.length; i++) {
      var d = L.doors[i];
      if (d.x === nx && d.y === ny) return !!openDoors(L, ghosts, t, pp)[d.id];
    }
    return true;
  }

  var DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], W: [0, 0] };

  // Returns true if a turn was consumed.
  function step(G, move) {
    if (G.won || G.t >= G.L.T) return false;
    var d = DIRS[move]; if (!d) return false;
    var pp = G.path[G.t], nx = pp.x + d[0], ny = pp.y + d[1];
    var np = canMove(G.L, G.ghosts, G.t, pp, nx, ny) ? { x: nx, y: ny } : { x: pp.x, y: pp.y };
    G.path.push(np); G.t++;
    if (np.x === G.L.exit.x && np.y === G.L.exit.y) { G.won = true; return true; }
    if (G.t >= G.L.T) endLoop(G);
    return true;
  }

  function endLoop(G) {
    if (G.won) return;
    var path = G.path.slice();
    while (path.length < G.L.T + 1) path.push(path[path.length - 1]);
    G.ghosts.push(path);
    G.path = [{ x: G.L.start.x, y: G.L.start.y }]; G.t = 0; G.loops++;
  }

  function restartLoop(G) { if (!G.won) { G.path = [{ x: G.L.start.x, y: G.L.start.y }]; G.t = 0; } }
  function reset(G) { var n = newGame(G.L); for (var k in n) G[k] = n[k]; }

  return { LEVELS: LEVELS, parse: parse, newGame: newGame, step: step, endLoop: endLoop,
           restartLoop: restartLoop, reset: reset, openDoors: openDoors, canMove: canMove,
           ghostAt: ghostAt, DIRS: DIRS };
});
