const assert = require('assert');
const Sim = require('../game2/sim.js');
const levels = require('../game2/levels.js');
let fails = 0;
const ok = (n, c, extra = '') => { console.log((c ? 'PASS' : 'FAIL') + ' ' + n + ' ' + extra); if (!c) fails++; };

// determinism
const l0 = levels[0], mg = [{ x: 700, y: 250, s: 1 }];
const a = Sim.run(l0, mg), b = Sim.run(l0, mg);
ok('determinism', a.x === b.x && a.y === b.y && a.status === b.status);
ok('level1 loses with no magnets', Sim.run(l0, []).status === 'lost');

// brute-force: grid candidates, up to 2 magnets exhaustive, then greedy random for more
const cands = [];
for (let x = 40; x < 800; x += 40) for (let y = 40; y < 500; y += 40)
  for (const s of [1, -1]) cands.push({ x, y, s });
function search(level) {
  const valid = cands.filter(m => Sim.validPlacement(level, m));
  for (const m of valid) if (Sim.run(level, [m]).status === 'won') return [m];
  if (false)
    for (let i = 0; i < valid.length; i++) for (let j = i + 1; j < valid.length; j++)
      if (Sim.run(level, [valid[i], valid[j]]).status === 'won') return [valid[i], valid[j]];
  // seeded random for 3-4 magnets
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let n = 2; n <= level.maxMagnets; n++)
    for (let k = 0; k < 150000; k++) {
      const set = Array.from({ length: n }, () => valid[Math.floor(rnd() * valid.length)]);
      if (Sim.run(level, set).status === 'won') return set;
    }
  return null;
}
const solutions = {};
for (const lv of levels) {
  const sol = search(lv);
  ok(`solvable: ${lv.name}`, !!sol, sol ? JSON.stringify(sol) : '');
  if (sol) solutions[lv.name] = sol;
  ok(`not trivial: ${lv.name}`, Sim.run(lv, []).status !== 'won');
}
require('fs').writeFileSync(__dirname + '/solutions.json', JSON.stringify(solutions, null, 1));
process.exit(fails ? 1 : 0);
