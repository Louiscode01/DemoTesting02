'use strict';
const test = require('node:test');
const assert = require('node:assert');
const S = require('../game/slingshot/sim.js');

const flat = { start: { x: 0, y: 250 }, target: { x: 300, y: 250, r: 20 }, planets: [], maxShots: 5 };

test('seeded RNG is deterministic', () => {
  const a = S.mulberry32(42), b = S.mulberry32(42);
  for (let i = 0; i < 10; i++) assert.strictEqual(a(), b());
});

test('free flight: straight shot hits a target on the line', () => {
  assert.strictEqual(S.simulate(flat, 0, 0.5).outcome, 'hit');
});

test('free flight: shot aimed away is lost', () => {
  assert.strictEqual(S.simulate(flat, Math.PI, 0.5).outcome, 'lost');
});

test('gravity bends the path toward a planet', () => {
  const lv = { ...flat, planets: [{ x: 150, y: 330, r: 15, m: 20000 }] };
  const path = S.simulate(lv, 0, 0.5, { wantPath: true, maxSteps: 120 }).path;
  assert.ok(path[path.length - 1].y > 250, 'path deflected toward planet (positive y)');
});

test('shot into a planet crashes', () => {
  const lv = { ...flat, planets: [{ x: 150, y: 250, r: 25, m: 100 }] };
  assert.strictEqual(S.simulate(lv, 0, 0.5).outcome, 'crash');
});

test('simulation is deterministic', () => {
  const lv = S.generate(3, 1);
  const a = S.simulate(lv, 0.1, 0.7, { wantPath: true });
  const b = S.simulate(lv, 0.1, 0.7, { wantPath: true });
  assert.deepStrictEqual(a, b);
});

test('preview is a strict prefix of the full path', () => {
  const lv = S.generate(2, 1);
  const full = S.simulate(lv, 0.1, 0.7, { wantPath: true, maxSteps: 400 }).path;
  const pre = S.preview(lv, 0.1, 0.7);
  assert.ok(pre.length <= S.PREVIEW_STEPS + 1);
  assert.deepStrictEqual(pre, full.slice(0, pre.length));
});

test('generator: levels 1-12 across 5 base seeds are solvable and need gravity', () => {
  for (let seed = 1; seed <= 5; seed++) {
    for (let n = 1; n <= 12; n++) {
      const lv = S.generate(n, seed);
      assert.ok(lv.solution, `seed ${seed} level ${n} has solution`);
      assert.strictEqual(S.simulate(lv, lv.solution.angle, lv.solution.power).outcome, 'hit');
      assert.ok(lv.planets.length >= 2 && lv.planets.length <= 4);
    }
  }
});

test('generator is deterministic', () => {
  assert.deepStrictEqual(S.generate(5, 7), S.generate(5, 7));
});
