# Cycle 002 Test Results — Magnet Mason (2026-10-28)

- `node tests/solve.js`: determinism PASS; every level loses with 0 magnets; all 6 levels have a verified solution
  (grid exhaustive 1-magnet, seeded random 2–4 magnets). Solutions saved in tests/solutions.json.
- `node tests/browser.js` (headless Chromium): replays each solution via real mouse/keyboard input; 6/6 levels WON, no page errors.
- Tuning log: initial K/drag made the ball nearly immobile (Level 1 unsolvable) -> K=5e6, drag=0.8. Levels Push Off and
  Slalom had unsolvable geometry -> widened corridors. Playwright mouse.click has no modifiers option -> used keyboard.down('Shift').
- Not covered: human feel/fun; the 'The Gap' level is solvable with 1 magnet (likely too easy); the solver finds odd
  corner-repel solutions, so intended-solution design is untested. Run: open game2/index.html.
