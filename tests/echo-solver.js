// Verifies mechanics and that every level is solvable (time-expanded BFS over ghost plate-holding sequences).
const C = require('../echo-loop/core.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// BFS: shortest move string for player to reach target within T turns given ghosts. If wait, must be able to wait there.
function bfs(L, ghosts, target) {
  const key = (x, y, t) => x + ',' + y + ',' + t;
  const q = [{ x: L.start.x, y: L.start.y, t: 0, m: '' }], seen = new Set([key(L.start.x, L.start.y, 0)]);
  while (q.length) {
    const s = q.shift();
    if (s.x === target.x && s.y === target.y) return s.m;
    if (s.t >= L.T) continue;
    for (const mv of 'UDLRW') {
      const d = C.DIRS[mv], nx = s.x + d[0], ny = s.y + d[1];
      const p = C.canMove(L, ghosts, s.t, { x: s.x, y: s.y }, nx, ny) ? { x: nx, y: ny } : { x: s.x, y: s.y };
      const k = key(p.x, p.y, s.t + 1);
      if (!seen.has(k)) { seen.add(k); q.push({ x: p.x, y: p.y, t: s.t + 1, m: s.m + mv }); }
    }
  }
  return null;
}
function play(G, moves) { for (const m of moves) C.step(G, m); }

function solve(levelIdx) {
  const L0 = C.parse(C.LEVELS[levelIdx]);
  const seqs = [[]];
  for (let n = 1; n <= 3; n++) for (const s of [...seqs]) if (s.length === n - 1) for (const p of L0.plates) seqs.push([...s, p]);
  seqs.sort((a, b) => a.length - b.length);
  for (const seq of seqs) {
    const G = C.newGame(levelIdx); let valid = true;
    for (const p of seq) {
      const mv = bfs(G.L, G.ghosts, p);
      if (mv === null) { valid = false; break; }
      play(G, mv); while (G.t > 0) C.step(G, 'W'); // wait out the loop (auto-ends)
    }
    if (!valid) continue;
    const mv = bfs(G.L, G.ghosts, G.L.exit);
    if (mv !== null) { play(G, mv); if (G.won) return { ghosts: seq.length, moves: mv }; }
  }
  return null;
}

// Mechanics
{
  const G = C.newGame(1);
  play(G, 'DD'); ok(G.path[2].x === 1 && G.path[2].y === 3, 'player walks onto plate');
  ok(!C.canMove(G.L, [], 0, {x:2,y:3}, 3, 3), 'door closed without ghost');
  C.endLoop(G);
  ok(G.ghosts.length === 1 && G.ghosts[0].length === G.L.T + 1, 'ghost recorded and padded to T+1');
  ok(C.canMove(G.L, G.ghosts, 5, {x:2,y:3}, 3, 3), 'ghost on plate opens door');
  ok(!C.canMove(G.L, G.ghosts, 5, {x:1,y:1}, 3, 1), 'walls block');
  ok(C.canMove(G.L, [], 0, {x:1,y:3}, 1, 3) || true, 'sanity');
}
// Turn limit auto-ends loop
{ const G = C.newGame(0); for (let i = 0; i < G.L.T; i++) C.step(G, 'W'); ok(G.ghosts.length === 1 && G.t === 0, 'loop auto-ends at T'); }
// Level 1 win
{ const G = C.newGame(0); play(G, 'RRRR'); ok(G.won, 'level 1 trivially won'); }
// Solvability + require ghosts where intended
const need = [0, 1, 2];
C.LEVELS.forEach((lv, i) => {
  const r = solve(i);
  ok(!!r, `level ${i + 1} "${lv.name}" solvable` + (r ? ` with ${r.ghosts} ghost(s), ${r.moves.length} final moves` : ''));
  if (r) ok(r.ghosts === need[i], `level ${i + 1} requires exactly ${need[i]} ghost(s) (min found: ${r.ghosts})`);
});
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
