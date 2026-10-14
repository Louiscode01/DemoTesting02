# Slingshot Courier — Test Results

Date: 2026-10-14

## Unit tests (Node, `node --test tests/slingshot.test.js`)
9/9 PASS: RNG determinism, free flight hit/lost, gravity deflection, planet crash,
sim determinism, preview-is-prefix, generator solvability + "needs gravity" for levels
1-12 x 5 base seeds, generator determinism.

## E2E (Playwright + headless Chromium, `NODE_PATH=/opt/node22/lib/node_modules node tests/slingshot.e2e.js`)
PASS: no console/page errors; 28,669 non-background pixels; 3 levels completed using the
verified solutions through the real fire/flight/result path (scores 5, 10, 15); advance
to level 4; 5 misses -> gameover -> real `R` keypress resets (mode aim, 0 shots);
real mouse drag launches a shot. This closes cycle 1's gap (end-to-end win flow + restart).

## Not covered
- Human playtest for feel (MAX_DRAG, speed range, planet mass range, preview length).
- Touch devices (pointer events used, untested). Cross-browser beyond Chromium.
- Levels beyond 12 not verified for solvability (generator throws if none found).

## Run
Open `game/slingshot/index.html` in a browser. No build, no dependencies.
