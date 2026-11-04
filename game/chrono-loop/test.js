// Run: node game/chrono-loop/test.js
const S = require("./sim.js");
const assert = require("assert");
const run = (s, str) => { for (const c of str) S.step(s, c); };
const results = [];
function t(name, fn) { try { fn(); results.push("PASS " + name); } catch (e) { results.push("FAIL " + name + ": " + e.message); process.exitCode = 1; } }

t("level 1: door blocks without ghost", () => {
  const s = S.newState(S.parse(S.LEVELS[0]));
  run(s, "DRRRRRRRRR");
  assert(!s.won);
});
t("level 1: ghost holds plate, player wins", () => {
  const s = S.newState(S.parse(S.LEVELS[0]));
  run(s, "RRW"); S.rewind(s);
  run(s, "DRRRRURR");
  assert(s.won, "pos " + s.player);
});
t("ghost replay is deterministic and resets to start", () => {
  const s = S.newState(S.parse(S.LEVELS[0]));
  run(s, "RRW"); S.rewind(s);
  assert.deepStrictEqual(s.ghosts[0].pos, s.lvl.start);
  run(s, "WWW");
  assert.deepStrictEqual(s.ghosts[0].pos, [3, 1]);
  assert.deepStrictEqual(s.moves.length, 3);
});
t("turn limit stops input", () => {
  const s = S.newState(S.parse(S.LEVELS[0]));
  for (let i = 0; i < 40; i++) S.step(s, "W");
  assert.strictEqual(s.turn, S.MAX_TURNS);
});
t("all levels parse with start, exit, matching plates/doors", () => {
  for (const d of S.LEVELS) {
    const l = S.parse(d);
    assert(l.start && l.exit);
    assert.deepStrictEqual(Object.keys(l.plates).sort(), Object.keys(l.doors).sort());
  }
});
t("level 2 solvable with two ghosts", () => {
  const s = S.newState(S.parse(S.LEVELS[1]));
  run(s, "RRRW"); S.rewind(s);
  run(s, "DRRRRRU"); S.rewind(s);
  run(s, "DRRRRRWDDRRR");
  assert(s.won, "pos " + s.player);
});
t("level 2 unsolvable with one ghost", () => {
  const s = S.newState(S.parse(S.LEVELS[1]));
  run(s, "RRRW"); S.rewind(s);
  run(s, "DRRRRRWWDDRRR");
  assert(!s.won);
});
t("level 3 solvable with two ghosts", () => {
  const s = S.newState(S.parse(S.LEVELS[2]));
  run(s, "RRW"); S.rewind(s);
  run(s, "DDDDRRRRRRRRU"); S.rewind(s);
  run(s, "DRRRRRR" + "WWWWWW" + "RRRUR");
  assert(s.won, "pos " + s.player);
});
t("level 3: player alone cannot win", () => {
  const s = S.newState(S.parse(S.LEVELS[2]));
  run(s, "DRRRRRRRRRRRRRRRRRRR");
  assert(!s.won);
});
console.log(results.join("\n"));
