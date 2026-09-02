# Echo Maze — Test Results

Date: 2026-09-02
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium), run
against `game/echo-maze.html` directly via `file://`. No human playtest was performed
(unattended automated run) — see "Known limitations" below.

## Test 1 — Load, movement, ping/fog, and guard-patrol smoke test
Checks: page loads with zero console/page errors; canvas renders non-trivial pixel
content (confirms the render loop draws more than a blank background); holding a
movement key actually moves the player between grid cells (used `ArrowRight` — the
start cell `(1,1)` is a dead-end that only opens rightward, so an initial attempt with
`ArrowDown` correctly produced zero movement in early testing, which flagged this as
maze geometry rather than a bug); a manual ping increases the size of the `remembered`
fog-of-war set and arms the cooldown timer; guard positions change over time
(confirms patrol AI is running).

**Result: PASS**
```
errors: []
nonBlackPixelsOnLoad: ~31,400
cellBefore: (1,1) -> cellAfter: (3,1) [72px = 2 cells, matches CELL_SIZE=36]
rememberedBefore: 7 -> rememberedAfter: 9 (after a ping post-movement)
cooldownAfterPing: 1250ms (armed correctly, ~150ms elapsed at read time)
guardsMoved: true
```

## Test 2 — Win condition
Checks: directly driving the player onto `EXIT_CELL` (via the `_forcePlayerCell` test
hook, since scripting precise real input to walk the full ~40-step solution path is
higher-effort than the check warrants) flips `phase` from `playing` to `win`.

**Result: PASS** — `phaseBefore: "playing"`, `phaseAfterWin: "win"`.

## Test 3 — Lose condition
Checks: driving the player onto a guard's current cell flips `phase` to `lose`.

**Result: PASS** — `guardCell: (3,5)`, `phaseAfterLose: "lose"`.

## Test 4 — Restart
Checks: after reaching `win`, pressing `R` resets `phase` to `playing` and the player's
cell back to the start cell `(1,1)`.

**Result: PASS** — `phaseWin: "win"` -> `phaseAfterRestart: "playing"`,
`cellAfterRestart: (1,1)`.

## Test 5 — Extended mixed-input session
Checks: a ~2s sequence mixing real movement keys and ping presses runs with no thrown
errors, the player's logical cell updates consistently with the input sequence and
maze walls (ended at `(4,3)`, consistent with the input sequence and wall layout), and
the game correctly stays in `phase: "playing"` throughout (no spurious win/lose
trigger from ordinary movement near the start).

**Result: PASS**
```
finalCell: (4,3)
finalPhase: "playing"
rememberedFinal: 9
stressErrors: []
```

## Known limitations / not covered by automated tests
- **Win condition via real input** was verified via the `_forcePlayerCell` test hook
  rather than scripting the full ~40-step solution path with real key presses. Win/lose
  cell-equality and distance-based collision logic were verified directly instead
  (same approach Cycle 1 used for its win condition).
- **Fun/balance tuning** (`PING_DEPTH`, `PING_COOLDOWN_MS`, `GUARD_SPEED`,
  `COLLISION_DIST`) was reasoned about, not human-playtested — flagged as the top
  candidate for next-cycle follow-up if this concept is revisited.
- **Full-playthrough determinism**: the maze, start/exit cells, and both guard patrol
  paths were generated once by a seeded script (`/tmp/.../gen-maze.js`, not committed —
  a one-off generation tool, not part of the shipped prototype) and hand-verified for
  connectivity and patrol-path validity (see generator output in this session), then
  hardcoded into `game/echo-maze.html`. No automated test walks the entire solution
  path end-to-end with real timed input; this is a reasonable gap given the budget, not
  a correctness risk (the underlying win/lose/collision primitives are all covered by
  Tests 2-3 and code review of the fixed maze data).
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually
Open `game/echo-maze.html` directly in a browser (double-click, or `file://` URL) — no
server or build step required. Arrow keys / WASD move, Space pings, R restarts.
