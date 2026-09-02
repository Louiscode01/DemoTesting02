# Echo Maze — Test Results

Date: 2026-09-02
Phase: testing

## Method

Automated headless-Chromium (Playwright) end-to-end test:
`tests/cycle2/echo-maze.test.js`, run via `node tests/cycle2/echo-maze.test.js`.
Drives `game/cycle2/index.html` with real simulated keyboard input (no cheats or
test-only shortcuts in the game code itself) and reads state back through the
live getters exposed at `window.__echoMaze`.

## Results — 6/6 checks passed

| # | Check | Result |
|---|---|---|
| 1 | No console errors on load | PASS |
| 2 | Canvas renders non-trivial pixel content | PASS |
| 3 | Movement input measurably changes player position | PASS |
| 4 | A ping reveals a previously-dark cell in range | PASS |
| 5 | Known-solvable serpentine path reaches the exit (`phase === "won"`) without ever entering the guard's room | PASS |
| 6 | Deliberately walking into the guard's room triggers a catch (`phase === "lost"`) | PASS |

Checks 5 and 6 are true end-to-end runs: the maze and guard patrol are fully
deterministic (no RNG), so both the win path and the lose path are scripted
exactly and reliably reproduce the same outcome every run.

## Bug found and fixed during testing

Not a gameplay bug — a bug in the **test script's** movement helper. The first
version released a held movement key the instant the player's grid cell first
matched the leg's target, which frequently left the player hugging the edge of
that cell rather than reasonably centered in it (e.g. a wall-stop leg landed
the player ~2px into the target row instead of settling flush against the far
wall). The very next leg, moving perpendicular through a single-cell-wide
connector, then failed: with the player's y-position near a row boundary, the
top or bottom edge of its collision box would land in an adjacent (wall) row,
so `collides()` correctly reported a collision, and the leg silently made zero
progress within its timeout.

Fixed by making the helper keep holding the key for a short settle dwell after
the cell first matches, rather than releasing immediately — long enough
(350ms) to let a wall-adjacent stop settle flush against the wall, but
short enough (80ms, passed explicitly for the one leg that stops mid-corridor
with no wall to rest against) to avoid sailing straight through a cell that is
only transited, not rested in. See `tests/cycle2/echo-maze.test.js` for the
`moveUntilCell` helper and inline comments. The game code itself
(`game/cycle2/index.html`) needed no changes — this is the same category of
lesson as Cycle 1's stale-test-hook bug: get the *test's* model of the running
system right before trusting its verdict.

## Not covered by automated tests (follow-up)

- Human/manual playtest for feel and balance (is `PING_ALERT_RADIUS` too
  generous/stingy, does the guard's BFS-based investigate behavior feel fair
  or frustrating, is `CATCH_RADIUS` forgiving enough for precise dodges).
- The `investigate` state transition itself (a ping near the guard causing it
  to leave its patrol loop and head for the ping's cell) is exercised by the
  game logic but not asserted by an automated check in this pass — the lose
  test catches the player via ordinary `patrol`-state movement, not by
  triggering `investigate` first.
- Multiple concurrent pings / overlapping reveal radii.
- Any visual/readability review of the fog-of-war rendering (contrast,
  legibility of guards/pings against the dark background) — reasoned about,
  not eyeballed by a human.
