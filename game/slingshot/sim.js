(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SlingSim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const WORLD = { w: 800, h: 500, margin: 150 };
  const DT = 1 / 120;
  const MAX_STEPS = 2400;
  const MIN_SPEED = 60, MAX_SPEED = 420;
  const PREVIEW_STEPS = 90;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function accel(level, x, y) {
    let ax = 0, ay = 0;
    for (const p of level.planets) {
      const dx = p.x - x, dy = p.y - y;
      const d2 = Math.max(dx * dx + dy * dy, p.r * p.r);
      const d = Math.sqrt(d2);
      const a = p.m / d2;
      ax += a * dx / d; ay += a * dy / d;
    }
    return { ax, ay };
  }

  // Launch: angle in radians (0 = right, +y down), power 0..1.
  // Returns { outcome, steps, path } where path is sampled each step if wantPath.
  function simulate(level, angle, power, opts) {
    opts = opts || {};
    const maxSteps = opts.maxSteps || MAX_STEPS;
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0, Math.min(1, power));
    let x = level.start.x, y = level.start.y;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    const path = opts.wantPath ? [{ x, y }] : null;
    const t = level.target;
    for (let i = 1; i <= maxSteps; i++) {
      const a = accel(level, x, y);
      vx += a.ax * DT; vy += a.ay * DT;
      x += vx * DT; y += vy * DT;
      if (path) path.push({ x, y });
      const tx = x - t.x, ty = y - t.y;
      if (tx * tx + ty * ty <= t.r * t.r) return { outcome: 'hit', steps: i, path };
      for (const p of level.planets) {
        const dx = x - p.x, dy = y - p.y;
        if (dx * dx + dy * dy <= p.r * p.r) return { outcome: 'crash', steps: i, path };
      }
      if (x < -WORLD.margin || x > WORLD.w + WORLD.margin ||
          y < -WORLD.margin || y > WORLD.h + WORLD.margin) return { outcome: 'lost', steps: i, path };
    }
    return { outcome: 'timeout', steps: maxSteps, path };
  }

  function preview(level, angle, power) {
    return simulate(level, angle, power, { maxSteps: PREVIEW_STEPS, wantPath: true }).path;
  }

  // Brute-force search for a winning shot. Returns {angle, power} or null.
  function solve(level) {
    const deg = Math.PI / 180;
    for (let pw = 0.3; pw <= 1.0001; pw += 0.05) {
      for (let a = -80; a <= 80; a += 1) {
        if (simulate(level, a * deg, pw).outcome === 'hit') return { angle: a * deg, power: pw };
      }
    }
    return null;
  }

  function candidate(seed, difficulty) {
    const rnd = mulberry32(seed);
    const n = Math.min(4, 2 + Math.floor(difficulty / 2));
    const level = {
      seed,
      start: { x: 60 + rnd() * 80, y: 100 + rnd() * 300 },
      target: { x: 640 + rnd() * 100, y: 80 + rnd() * 340, r: 22 },
      planets: [],
      maxShots: 5
    };
    let guard = 0;
    while (level.planets.length < n && guard++ < 200) {
      const r = 18 + rnd() * 20;
      const p = { x: 220 + rnd() * 360, y: 60 + rnd() * 380, r, m: 6000 + rnd() * 14000 };
      const ok = level.planets.every(q => Math.hypot(p.x - q.x, p.y - q.y) > p.r + q.r + 50);
      if (ok) level.planets.push(p);
    }
    return level;
  }

  function straightShotHits(level) {
    // No-gravity line from start at angle toward target, any power: does a straight line hit?
    const dx = level.target.x - level.start.x, dy = level.target.y - level.start.y;
    const ang = Math.atan2(dy, dx);
    const free = Object.assign({}, level, { planets: [] });
    // A straight (gravity-free) launch toward the target hits by construction; the question
    // is whether the same aim hits WITH gravity -- if so the level needs no gravity use.
    return simulate(level, ang, 1).outcome === 'hit' && simulate(free, ang, 1).outcome === 'hit';
  }

  // Generate a verified-solvable level for a given level number and base seed.
  function generate(levelNumber, baseSeed) {
    baseSeed = baseSeed === undefined ? 1 : baseSeed;
    for (let attempt = 0; attempt < 200; attempt++) {
      const seed = baseSeed * 100003 + levelNumber * 1009 + attempt * 7919;
      const level = candidate(seed, levelNumber);
      if (straightShotHits(level)) continue;
      const solution = solve(level);
      if (solution) { level.solution = solution; return level; }
    }
    throw new Error('no solvable level found for level ' + levelNumber);
  }

  return { WORLD, DT, MAX_STEPS, PREVIEW_STEPS, MIN_SPEED, MAX_SPEED,
           mulberry32, simulate, preview, solve, generate, candidate };
});
