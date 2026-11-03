# Echo Loop — Test Results (Cycle 2, 2026-11-03)

Run: `node tests/echo-solver.js` and `node tests/echo-smoke.js` (Playwright, headless Chromium).

- Solver/mechanics: 14/14 PASS. All 3 levels proven solvable; ghost counts required are 0, 1, 2 (intended progression). Level 3 initially needed only 1 ghost (exit bypassed door B) — caught by the solver and redesigned.
- Smoke: 8/8 PASS (load, canvas painted, keyboard play, level advance, ghost recording, ghost-held door, no console errors).
- Not covered: human playtest of feel/difficulty; visual polish; mobile/touch input.

Run it: open `echo-loop/index.html` in a browser (no build step).
