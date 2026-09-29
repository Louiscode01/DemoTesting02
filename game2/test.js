const assert = require("assert");
const EV = require("./core.js");
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("PASS", name); };
const run = (g, s) => [...s].forEach((c) => EV.step(g, c));

t("walls block movement", () => {
  const g = EV.newGame(0); EV.step(g, "U"); assert.deepStrictEqual(g.player, [1, 1]);
  EV.step(g, "L"); assert.deepStrictEqual(g.player, [1, 1]);
});
t("level 1 solvable directly", () => {
  const g = EV.newGame(0); run(g, "RRRR"); assert(g.won);
});
t("door blocks without ghost", () => {
  const g = EV.newGame(1); run(g, "RRRRRRR"); assert(!g.won);
  assert.deepStrictEqual(g.player, [3, 1]);
});
t("level 2 solved with one ghost", () => {
  const g = EV.newGame(1); run(g, "R"); assert(EV.endLoop(g));
  assert.strictEqual(g.loop, 2); assert.deepStrictEqual(g.player, [1, 1]);
  run(g, "RRRRR"); assert(g.won);
});
t("ghost replay is deterministic and holds position", () => {
  const g = EV.newGame(1); run(g, "R"); EV.endLoop(g); run(g, "WWWW");
  assert.deepStrictEqual(g.ghosts[0].pos, [2, 1]);
});
t("level 3 needs two ghosts", () => {
  const g = EV.newGame(2); run(g, "RR"); EV.endLoop(g);
  run(g, "RRRR"); assert(!g.won); EV.endLoop(g);
  assert.strictEqual(g.ghosts.length, 2);
  run(g, "RRRRRRRR"); assert(g.won);
});
t("level 3 has no one-ghost shortcut", () => {
  const g = EV.newGame(2); run(g, "RR"); EV.endLoop(g);
  run(g, "RRRRRRRRRR"); assert(!g.won);
});
t("level 4 (detour to plate) solved with one ghost", () => {
  const g = EV.newGame(3); run(g, "DD");
  assert.deepStrictEqual(g.player, [1, 3]); EV.endLoop(g);
  run(g, "RRRRR"); assert(g.won);
});
t("level 4 unsolvable without ghost", () => {
  const g = EV.newGame(3); run(g, "RRRRRRRRRR"); assert(!g.won);
});
t("ghost cap enforced", () => {
  const g = EV.newGame(0);
  for (let i = 0; i < 5; i++) { run(g, "W"); EV.endLoop(g); }
  assert.strictEqual(g.ghosts.length, EV.MAX_GHOSTS);
});
t("empty recording cannot become a ghost", () => {
  const g = EV.newGame(0); assert(!EV.endLoop(g));
});
t("reset clears ghosts", () => {
  const g = EV.newGame(1); run(g, "R"); EV.endLoop(g); EV.resetLevel(g);
  assert.strictEqual(g.ghosts.length, 0); assert.strictEqual(g.loop, 1);
});
console.log(`${n} tests passed`);
