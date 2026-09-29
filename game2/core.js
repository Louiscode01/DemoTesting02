// Echo Vault core: pure logic, no DOM.
(function (root) {
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0], W: [0, 0] };
  const MAX_GHOSTS = 3;

  const LEVELS = [
    { name: "First Steps", rows: ["#######", "#S...E#", "#######"] },
    { name: "Hold the Plate", rows: ["#########", "#SP.D.E##", "#########"] },
    { name: "Two Keys", rows: ["#############", "#S.P.Q.D.E###", "#############"] },
    {
      name: "Detour",
      rows: ["#########", "#S..D.E.#", "#.#######", "#P#######", "#########"],
    },
  ];

  function parseLevel(rows) {
    const lv = { w: rows[0].length, h: rows.length, tiles: [], start: null, exit: null, plates: [] };
    rows.forEach((r, y) => {
      lv.tiles.push([]);
      [...r].forEach((c, x) => {
        if (c === "S") { lv.start = [x, y]; c = "."; }
        else if (c === "E") lv.exit = [x, y];
        else if (c === "P" || c === "Q") lv.plates.push([x, y]), (c = "P");
        lv.tiles[y].push(c);
      });
    });
    return lv;
  }

  function newGame(levelIndex) {
    const level = parseLevel(LEVELS[levelIndex].rows);
    const g = { levelIndex, level, ghosts: [], loop: 1, tick: 0, player: [...level.start], recording: [], won: false };
    return g;
  }

  function occupied(g, [x, y]) {
    return (g.player[0] === x && g.player[1] === y) ||
      g.ghosts.some((gh) => gh.pos[0] === x && gh.pos[1] === y);
  }
  function doorsOpen(g) {
    return g.level.plates.length > 0 && g.level.plates.every((p) => occupied(g, p));
  }
  function walkable(g, x, y, open) {
    const lv = g.level;
    if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return false;
    const t = lv.tiles[y][x];
    if (t === "#") return false;
    if (t === "D") return open;
    return true;
  }
  function tryMove(g, pos, dir, open) {
    const [dx, dy] = DIRS[dir];
    const nx = pos[0] + dx, ny = pos[1] + dy;
    return walkable(g, nx, ny, open) ? [nx, ny] : pos;
  }

  // Advance one tick. Returns false if ignored (game already won / bad dir).
  function step(g, dir) {
    if (g.won || !(dir in DIRS)) return false;
    const open = doorsOpen(g);
    g.player = tryMove(g, g.player, dir, open);
    g.recording.push(dir);
    for (const gh of g.ghosts) {
      const d = g.tick < gh.moves.length ? gh.moves[g.tick] : "W";
      gh.pos = tryMove(g, gh.pos, d, open);
    }
    g.tick++;
    if (g.player[0] === g.level.exit[0] && g.player[1] === g.level.exit[1]) g.won = true;
    return true;
  }

  function resetPositions(g) {
    g.player = [...g.level.start];
    g.tick = 0;
    g.recording = [];
    g.ghosts.forEach((gh) => (gh.pos = [...g.level.start]));
  }

  // Turn the current recording into a ghost and restart the loop.
  function endLoop(g) {
    if (g.won || g.recording.length === 0 || g.ghosts.length >= MAX_GHOSTS) return false;
    g.ghosts.push({ moves: g.recording.slice(), pos: [...g.level.start] });
    g.loop++;
    resetPositions(g);
    return true;
  }

  function resetLevel(g) {
    const fresh = newGame(g.levelIndex);
    Object.assign(g, fresh);
  }

  const api = { LEVELS, MAX_GHOSTS, newGame, step, endLoop, resetLevel, doorsOpen, DIRS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EchoVault = api;
})(typeof window !== "undefined" ? window : globalThis);
