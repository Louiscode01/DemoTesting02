# Echo Heist — Test Results (2026-10-19)

- `node tests/echo-heist.test.js`: 8/8 PASS (level shape, L1 blocked without echo, L1/L2/L3 solved by scripted echo plans,
  L2 not solvable with 1 echo, loop timeout, echo cap).
- `NODE_PATH=$(npm root -g) node tests/echo-heist.browser.test.js` (headless Chromium): PASS — no console errors,
  player moved 90px in 0.5s, `R` created 1 echo, canvas rendered (3372 bright pixels).

Bug found & fixed: `S`/`E` tile markers were uppercase and treated as doors (solid), making the exit unreachable.
Added `isDoor` helper excluding S/E.

Not covered: human playtest/feel (speed, loop length), level difficulty, win screen/next-level flow visually,
echoes that are blocked by closed doors (echoes ignore collisions by design).
