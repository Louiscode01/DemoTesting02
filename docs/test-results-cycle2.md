# Echo Vault — Test Results (Cycle 002, 2026-09-29)
- `node game2/test.js`: 12/12 PASS (movement, walls, door gating, ghost replay/hold, ghost cap, reset, levels 1–4 solvable, no shortcuts on levels 3–4).
- `game2/browser-test.js` (Playwright/Chromium, file://): PASS — loads, level 1 solved, next level, ghost loop on level 2 solved, no page errors.
- Bug found in design: initial level 4 had an unreachable exit; caught by writing solution tests, level redesigned.
## Not covered
Human playtest for puzzle difficulty/feel; levels 3 and 4 not run in the browser (logic-tested only); only 4 short levels; no undo.
## Run
Open `game2/index.html` in a browser.
