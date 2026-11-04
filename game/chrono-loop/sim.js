// Chrono Loop - deterministic turn-based simulation (no DOM). Works in browser and node.
(function (root) {
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], W: [0, 0] };
  const MAX_TURNS = 24;

  const LEVELS = [
    { name: "Plate & Door", hint: "Stand on the plate, rewind (R), then walk through the door as your past self holds it.",
      map: ["#########",
            "#@.a#..E#",
            "#...A...#",
            "#########"] },
    { name: "Two Keys", hint: "Two plates, two doors. You will need two ghosts.",
      map: ["###########",
            "#@..a#b...#",
            "#....A....#",
            "#.####B####",
            "#........E#",
            "###########"] },
    { name: "Relay", hint: "Send one ghost to plate b the long way round; wait for it, then cross both doors.",
      map: ["#############",
            "#@.a#...#..E#",
            "#...A...B...#",
            "#.###.###b###",
            "#...........#",
            "#############"] },
  ];

  function parse(def) {
    const h = def.map.length, w = def.map[0].length;
    const lvl = { name: def.name, hint: def.hint, w, h, walls: [], plates: {}, doors: {}, start: null, exit: null };
    for (let y = 0; y < h; y++) {
      lvl.walls.push([]);
      for (let x = 0; x < w; x++) {
        const c = def.map[y][x];
        lvl.walls[y][x] = c === "#";
        if (c === "@") lvl.start = [x, y];
        else if (c === "E") lvl.exit = [x, y];
        else if (c >= "a" && c <= "z") lvl.plates[c] = [x, y];
        else if (c >= "A" && c <= "Z") lvl.doors[c.toLowerCase()] = [x, y];
      }
    }
    return lvl;
  }

  function newState(lvl) {
    return { lvl, turn: 0, player: lvl.start.slice(), moves: [], ghosts: [], won: false };
  }

  function actors(s) { return [s.player].concat(s.ghosts.map(g => g.pos)); }

  // door key -> open? A door is open iff some actor stands on its plate.
  function doorsOpen(s) {
    const open = {};
    const acts = actors(s);
    for (const k in s.lvl.plates) {
      const p = s.lvl.plates[k];
      open[k] = acts.some(a => a[0] === p[0] && a[1] === p[1]);
    }
    return open;
  }

  function blocked(lvl, open, x, y) {
    if (x < 0 || y < 0 || x >= lvl.w || y >= lvl.h || lvl.walls[y][x]) return true;
    for (const k in lvl.doors) {
      const d = lvl.doors[k];
      if (d[0] === x && d[1] === y && !open[k]) return true;
    }
    return false;
  }

  function tryMove(lvl, open, pos, m) {
    const d = DIRS[m] || DIRS.W;
    const nx = pos[0] + d[0], ny = pos[1] + d[1];
    return blocked(lvl, open, nx, ny) ? pos : [nx, ny];
  }

  // Advance one turn. Door state is sampled at turn start so all actors move simultaneously.
  function step(s, move) {
    if (s.won || s.turn >= MAX_TURNS) return false;
    const open = doorsOpen(s);
    s.moves.push(move);
    s.player = tryMove(s.lvl, open, s.player, move);
    for (const g of s.ghosts) {
      const m = g.moves[s.turn];
      if (m) g.pos = tryMove(s.lvl, open, g.pos, m);
    }
    s.turn++;
    if (s.player[0] === s.lvl.exit[0] && s.player[1] === s.lvl.exit[1]) s.won = true;
    return true;
  }

  // Commit current run as a ghost and restart the timeline.
  function rewind(s) {
    if (s.won) return;
    const ghosts = s.ghosts.map(g => ({ moves: g.moves, pos: s.lvl.start.slice() }));
    ghosts.push({ moves: s.moves.slice(), pos: s.lvl.start.slice() });
    s.ghosts = ghosts;
    s.turn = 0;
    s.moves = [];
    s.player = s.lvl.start.slice();
  }

  const api = { LEVELS, MAX_TURNS, parse, newState, step, rewind, doorsOpen };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ChronoSim = api;
})(typeof window !== "undefined" ? window : globalThis);
