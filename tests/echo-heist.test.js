// Run: node tests/echo-heist.test.js  (extracts the <script> from game/echo-heist.html; sim is DOM-free)
const fs = require("fs"), assert = require("assert"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "../game/echo-heist.html"), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];
const m = { exports: {} };
new Function("module", src)(m);
const { createSim, step, endLoop, LEVELS } = m.exports;
const C = t => t * 40 + 20;

function walk(sim, pts) { // waypoints in tile coords, axis-by-axis moves
  for (const [tx, ty] of pts) for (const axis of ["x", "y"]) {
    const target = C(axis === "x" ? tx : ty);
    for (let i = 0; i < 2000 && Math.abs(sim.pos[axis] - target) > 1.5 && !sim.won; i++) {
      const d = Math.sign(target - sim.pos[axis]);
      step(sim, axis === "x" ? { dx: d } : { dy: d });
    }
  }
}
const results = [];
function test(name, fn) { try { fn(); results.push("PASS " + name); } catch (e) { results.push("FAIL " + name + ": " + e.message); process.exitCode = 1; } }

test("all level rows are 16 wide with one S and one E", () => LEVELS.forEach(l => {
  l.map.forEach(r => assert.strictEqual(r.length, 16));
  const j = l.map.join(""); assert.strictEqual((j.match(/S/g) || []).length, 1); assert.strictEqual((j.match(/E/g) || []).length, 1);
}));
test("L1 unsolvable without echo (door blocks exit)", () => {
  const s = createSim(0); walk(s, [[1, 3], [6, 3]]);
  const before = s.pos.x; for (let i = 0; i < 60; i++) step(s, { dx: 1 });
  assert(s.pos.x < 7 * 40, "passed closed door"); assert(!s.won); assert(before <= s.pos.x);
});
test("L1 solved with 1 echo", () => {
  const s = createSim(0); walk(s, [[1, 5], [2, 5]]); endLoop(s);
  assert.strictEqual(s.echoes.length, 1); walk(s, [[1, 3], [14, 3]]); assert(s.won);
});
test("L2 solved with 2 echoes", () => {
  const s = createSim(1); walk(s, [[1, 3], [2, 3]]); endLoop(s);
  walk(s, [[1, 5], [2, 5]]); endLoop(s);
  walk(s, [[1, 3], [14, 3]]); assert(s.won);
});
test("L2 not solved with only 1 echo", () => {
  const s = createSim(1); walk(s, [[1, 3], [2, 3]]); endLoop(s);
  walk(s, [[1, 3], [14, 3]]); assert(!s.won);
});
test("L3 solved with 2 echoes (chain)", () => {
  const s = createSim(2); walk(s, [[1, 3], [2, 3]]); endLoop(s);
  walk(s, [[1, 3], [8, 3]]); endLoop(s);
  walk(s, [[1, 3], [14, 3]]); assert(s.won);
});
test("loop timeout auto-ends loop", () => {
  const s = createSim(0); for (let i = 0; i < 900; i++) step(s, {});
  assert.strictEqual(s.loops, 2); assert.strictEqual(s.echoes.length, 1);
});
test("echo cap is 3", () => {
  const s = createSim(0); for (let i = 0; i < 5; i++) endLoop(s); assert.strictEqual(s.echoes.length, 3);
});
console.log(results.join("\n"));
