# Slingshot Courier — Design & Implementation Plan

Date: 2026-10-14
Phase: design

## Layout
- `game/slingshot/sim.js` — pure, DOM-free UMD module (browser global `SlingSim`, Node
  `module.exports`). Seeded RNG (mulberry32), level generation, physics, solver.
- `game/slingshot/index.html` — canvas UI, drag-to-aim, preview, HUD; loads `sim.js`.
- `tests/slingshot.test.js` — Node (built-in `node:test`) tests of the sim: determinism,
  gravity, collisions, generator solvability for many seeds.
- `tests/slingshot.e2e.js` — Playwright headless smoke/e2e: loads page, plays a level
  using the solver's solution, asserts win + next level.

## Sim spec
World 800x500. Level = `{ seed, start{x,y}, target{x,y,r}, planets[{x,y,r,m}], maxShots }`.
Launch: angle + power (power 0..1 -> speed 60..420). Integration: semi-implicit Euler,
fixed dt = 1/120, max 20 s (2400 steps). Gravity: a = sum m_i / max(d^2, (r_i)^2) toward
planet i (G folded into m). Outcomes: `hit` (within target r), `crash` (inside planet r),
`lost` (leaves world bounds + 150 margin), `timeout`.
Preview = first 90 steps of the same integrator (partial only).

## Generator
Seeded: place start on left third, target on right third, 2-4 planets in between with
min separation. Then solve: sweep angle (-80..80 deg, step 1) x power (0.3..1, step 0.05);
accept level only if at least one hit exists AND a straight shot (no gravity) does NOT hit
(forces use of gravity). Retry with seed+1000 variants up to 50 times. Solution is stored
for tests/hint (H key shows hint after 3 failed shots).

## Game rules
Level n gets n-dependent planet count (2..4) and `maxShots` 5. Hit = next level; running out
of shots = retry same level. Score = sum over levels of (maxShots - shotsUsed + 1).

## Testing plan
Node unit tests on the sim (fast, deterministic) + one Playwright e2e that plays via the
exposed `window.__slingshot` hook. Manual feel playtest remains a known gap.

## Out of scope
Sound, mobile touch polish (mouse+touch pointer events supported minimally), level select.
