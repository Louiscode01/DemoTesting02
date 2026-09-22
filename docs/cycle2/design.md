# Photon Reflect — Design & Implementation Plan

Date: 2026-09-22
Phase: design
Concept ref: docs/cycle2/concepts.md

## Core loop

A fixed light **emitter** on the edge of a grid fires a beam in a fixed initial
direction. The beam travels in straight lines through empty cells and changes
direction when it hits a **mirror** tile, or splits into two beams when it hits a
**splitter** tile. The player has a limited number of **placements**: click a cell to
cycle it through {empty, `/` mirror, `\` mirror, splitter} (emitter/target/wall cells are
fixed and not editable). After each placement the beam is fully re-simulated from the
emitter. The player wins the level when every **target** cell is lit by the beam
simultaneously (single simulation pass), using at most `maxPlacements` non-empty tiles.
Losing state: placements run out before all targets are lit -> level marked failed,
player can reset the level (free) or (once implemented) skip to a new generated one.

## Grid & entities

- Grid: `COLS x ROWS` (10x8 default), each cell one of:
  - `empty` — beam passes straight through.
  - `wall` — blocks the beam entirely (beam stops).
  - `emitter` — fixed, one per level, has a fixed direction (N/E/S/W).
  - `target` — fixed, must be lit (beam passes through or terminates on it — either
    counts as "lit") for the level to be solved.
  - `mirror-/`, `mirror-\` — reflects the beam 90°, direction depends on incoming
    direction and mirror orientation (standard laser-mirror reflection table).
  - `splitter` — beam entering from any direction exits in the two directions
    perpendicular to entry (e.g. entering East-bound exits both North and South).
- Player-editable cells are a fixed subset marked at generation time (`editable: true`);
  emitter/target/wall cells are never editable.

## Beam simulation (core algorithm)

Pure function `simulate(grid, emitter) -> { litCells: Set<"x,y">, path: Segment[] }`.
- BFS/iterative walk: maintain a queue of `(x, y, direction)` beam heads, starting from
  the emitter's first cell/direction.
- Step each head forward one cell at a time; on each new cell, apply the cell's
  reflect/split/block/pass rule; push resulting head(s) back onto the queue.
- Guard against infinite loops (a beam re-entering a mirror loop): track visited
  `(x, y, direction)` states and stop a head if it repeats a state.
- Record every cell the beam visited (`litCells`) and the ordered segments (`path`) for
  rendering.
- This function has **no dependency on canvas, DOM, or timers** — it is plain data in,
  plain data out, which is what makes it exhaustively unit-testable (see Testing plan).

## Level generation + solvability check

Levels must be guaranteed solvable, so generation works backward from a solution:
1. Randomly place the emitter on an edge cell with an inward-facing direction.
2. Randomly choose `k` cells to be the *solution* mirrors/splitters (the actual
   placements a working solve would use) and `simulate()` forward from the emitter
   through them.
3. Pick 2-4 of the lit non-mirror cells reached (and not the emitter cell) as `target`
   cells.
4. Discard the solution's mirror placements from the grid (the player must find them
   again) but remember `k` as `maxPlacements` for that level, then mark a set of empty
   cells (including the k solution cells, plus extra decoy-editable empty cells) as
   `editable`.
5. Re-run `simulate()` on the now-empty (no solution mirrors) grid as a sanity check
   that it does *not* already accidentally satisfy the win condition, and re-run it with
   the original solution mirrors restored as a check that it *does* — both checks must
   pass or the generator retries with a new random seed (bounded retry loop, falls back
   to one hand-authored level if generation keeps failing, so the game never fails to
   produce a playable level).
- This keeps generation deterministic-per-seed and testable: `generateLevel(seed)` is
  also a pure function.

## Architecture

Single self-contained file, `game/cycle2/index.html`, matching Cycle 1's pattern: no
build step, no external assets, no dependencies, opens directly via `file://`.

- Inline `<style>` for layout (grid rendered on `<canvas>`, HUD as plain HTML above it).
- Inline `<script>` organized as:
  - Pure logic section: `simulate()`, `generateLevel()`, reflection/split rule tables,
    grid helper functions — no globals touched, no DOM/canvas calls. This section is
    what gets exercised directly by automated tests.
  - Render section: draws grid lines, tile icons (mirror diagonals, splitter symbol,
    emitter arrow, target rings), the lit beam path, and an HUD (placements remaining,
    win/lose banner).
  - Input section: canvas click -> map to cell -> cycle tile type (if editable and
    placements remain, or removing a placed tile refunds it) -> re-simulate -> re-render.
  - Test hook: `window.__photonReflect = { grid, simulate, generateLevel, litCells,
    solved, placementsUsed, reset }` (getters where the underlying value is reassigned,
    following the exact pattern that fixed Cycle 1's stale-reference bug with
    `bullets`).
- Tunable constants grouped at the top of the script (`COLS`, `ROWS`, `MAX_PLACEMENTS`
  default, min/max target count) for easy balance iteration.

## Testing plan

Because the core logic is pure and deterministic, this cycle can close the exact gap
Cycle 1 flagged (win condition only verified by code review, not automated test):
1. **Unit-style tests of `simulate()`** run in a headless browser via `page.evaluate`:
   straight pass-through, each mirror orientation's reflection, splitter fan-out, wall
   blocking, and the infinite-loop guard (construct a small closed mirror loop and
   confirm simulation terminates).
2. **`generateLevel()` sanity tests**: run it for N seeds, assert every generated level
   passes its own solvability check (empty grid unsolved, solution grid solved) and that
   `maxPlacements` matches the recorded solution size.
3. **End-to-end win test**: load the page, read the generated level's solution back out
   via the test hook (available only to the test, not surfaced to the player as a
   hint), script clicks to reproduce that exact solution, and assert the win banner /
   `solved` flag flips true — directly closing Cycle 1's "win-condition end-to-end" gap.
4. **End-to-end lose test**: exhaust `maxPlacements` on wrong cells and assert a lose
   state is reachable and reset works.

## Known risks / out of scope for this pass

- Visual polish (animated beam draw-in, particle effects) is out of scope; a static
  per-frame redraw after each move is sufficient for a playable prototype.
- Difficulty curve across multiple levels (level select, progression) is out of scope;
  this pass targets one generated level at a time with a "new level" button.
- Human/manual feel-testing of difficulty (are generated levels *fun*, not just
  solvable) is deferred, same category of limitation Cycle 1 flagged for physics
  tuning — flagged up front here rather than discovered at the end.
