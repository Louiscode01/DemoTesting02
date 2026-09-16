# Drift Maze — Test Results

Date: 2026-09-16
Phase: testing
Method: fully automated — a Node-based logic/solver test suite plus a headless-browser
(Playwright + pre-installed Chromium) end-to-end test, run against `game/drift-maze.html`
directly via `file://`. No human playtest was performed (unattended automated run), but
unlike Cycle 1's Orbit Duel, this concept's determinism means the things that actually
matter for correctness (every level solvable, no mechanic bypassable, the win condition
itself firing) *are* fully covered by automated tests this cycle — see "Coverage vs.
Cycle 1" below.

## Test 1 — Level solvability + mechanic-necessity check
`node scripts/solve-levels.js`

For every one of the 10 levels: parses the level, BFS-solves it from start to exit, and
— for levels that declare `requiresMechanic` (breakable wall / one-way gate / teleport
pad) — replays the optimal solution and confirms it actually passes through a cell of
that type. This catches the failure mode where a "new mechanic" level is technically
solvable by walking around the mechanic entirely, which would make it decorative rather
than required.

**Result: PASS (after fixes — see "Bugs found" below)**
```
Level  1 "First Slide":      SOLVABLE, par = 3 moves
Level  2 "Corridors":        SOLVABLE, par = 5 moves
Level  3 "Brittle Wall":     SOLVABLE, par = 4 moves, uses: breakable
Level  4 "Double Break":     SOLVABLE, par = 6 moves, uses: breakable
Level  5 "One Way Out":      SOLVABLE, par = 3 moves, uses: gate
Level  6 "Gatekeeper":       SOLVABLE, par = 4 moves, uses: gate
Level  7 "Warp Step":        SOLVABLE, par = 1 move,  uses: teleport
Level  8 "Warp Detour":      SOLVABLE, par = 2 moves, uses: teleport
Level  9 "Convergence":      SOLVABLE, par = 5 moves, uses: breakable+gate+teleport
Level 10 "The Long Drift":   SOLVABLE, par = 5 moves, uses: breakable+gate+teleport

All 10 levels validated, solvable, and required mechanics confirmed non-bypassable.
```

## Test 2 — Rule unit checks
`node scripts/test-slide-rules.js`

Twelve isolated assertions against `slide()`, independent of any full level: wall stop,
level-edge stop, breakable-wall clear-then-continue (plus confirming the grid mutates),
one-way gate blocking the disallowed direction (both "some floor before the block" and
"blocked immediately"), one-way gate passing the allowed direction, teleport
warp-and-continue (plus the `teleported` flag), and the exit tile stopping the slide.

**Result: PASS — 12/12**

## Test 3 — Browser smoke test + win-condition end-to-end
`NODE_PATH="$(npm root -g)" node scripts/browser-test.js`
(Playwright isn't a local project dependency — no `package.json`/build step for this
prototype — so it's resolved from the environment's global install via `NODE_PATH`.)

Loads `game/drift-maze.html` in headless Chromium and checks: zero console/page errors,
the canvas renders non-trivial pixel content, the `window.__driftMaze` test hook is
exposed, a single arrow-key press registers as exactly one move and visibly changes the
player's position — **and then**, using Level 1's own BFS-solved optimal move sequence
(from `drift-maze-logic.js`, the same code the game runs), replays that exact sequence
via real keyboard events and confirms `solved` becomes `true` and the game auto-advances
to level 2. This is the automated win-condition end-to-end test flagged as a Cycle 1
follow-up that Orbit Duel's continuous-physics win condition couldn't get without
scripted precision hits.

**Result: PASS — 8/8 assertions**
```
no console/page errors on load
canvas renders non-trivial pixel content (61550 non-background pixels)
test hook window.__driftMaze is exposed
one keypress registers exactly one move
player position changed after input
level 1 solver reports a solution to replay (sanity check)
playing the solver's optimal move sequence for level 1 triggers solved=true
level auto-advances to level 2 after solving level 1
```

## Bugs found and fixed during testing
1. **Teleport pairing bug (logic module, found by Test 1):** `slide()`'s teleport
   handling searched the grid for another cell of the *same* pad character (`'1'`
   looking for another `'1'`) instead of its pair (`'1'` looking for `'2'`). Since each
   level has exactly one of each pad character, this always returned "no pair found"
   and silently aborted the slide, making every teleport-using level (7–10) falsely
   unsolvable. Fixed in `game/drift-maze-logic.js`'s `slide()` to look up the opposite
   character. All four affected levels passed immediately after the fix with no other
   changes needed.
2. **Level 10 alignment bug (level data, found by Test 1):** the pillar column meant to
   stop a rightward slide exactly at the gate's column was off by one, and a border
   wall was missing a character (row width silently correct but the wrong column was a
   wall), together making the level unsolvable. Reworked the affected rows using the
   same pillar-column = gate-column + 1 convention already working in the other levels.
3. **First draft of levels 2–10 had a design bug, not a code bug, caught by manual
   review before Test 1 was even run:** an initial pass reused a "wide-open top row +
   open rightmost column" template across most levels, which let a trivial "slide
   right, slide down" solve every level regardless of any breakable wall / gate /
   teleport placed in the middle — the special tiles were unreachable set dressing.
   Rebuilt every level (1–10) around single-width corridors and wall pillars that force
   the slide to stop exactly where the next mechanic needs it, which is also what makes
   the `requiresMechanic` check in Test 1 meaningful rather than trivially satisfied.

## Coverage vs. Cycle 1
Cycle 1's Orbit Duel test-results doc flagged two follow-ups that this cycle's concept
(deterministic grid logic vs. continuous physics) made directly solvable:
- "Automated end-to-end test of the win condition" — done, Test 3 above.
- Fun/balance tuning still isn't something an automated test can judge, but Drift Maze
  narrows what's left to tune down to move-feel/animation-speed and level *ordering* for
  difficulty ramp — the harder property, "is every level actually completable and does
  it actually require its mechanic," is now covered by Test 1 rather than resting on
  human judgment or code review alone.

## Known limitations / not covered by automated tests
- Level difficulty *curve* (whether level 5 genuinely feels harder than level 4) is a
  subjective fun-balance judgment, not exercised by the solver — flagged as a follow-up
  for a human playtest, same category of gap as Cycle 1's constant-tuning follow-up.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).
- The slide-animation tween's timing constants (`Math.max(120, path.length * 55)`) are a
  first pass, reasoned about rather than playtested for feel.

## How to run manually
Open `game/drift-maze.html` directly in a browser (double-click, or `file://` URL) — no
server or build step required, single player, arrow keys or WASD, `R` to reset a level.

To re-run the automated checks:
```
node scripts/solve-levels.js
node scripts/test-slide-rules.js
NODE_PATH="$(npm root -g)" node scripts/browser-test.js   # needs the environment's global Playwright install
```
