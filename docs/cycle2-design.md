# Drift Maze — Design & Implementation Plan

Date: 2026-09-16
Phase: design

## Concept Summary
Single-player grid puzzle. Pressing a direction slides the player continuously through
open tiles until they hit a wall or obstacle — no stopping mid-slide, like classic
ice-cave puzzles. Reach the marked exit tile to clear a level. Extra tile types
(breakable walls, one-way gates, teleport pads) raise the difficulty ceiling on later
levels. 10 hand-authored levels, easy → hard.

## Architecture

Single self-contained file: `game/drift-maze.html`. No build step, no external
dependencies, no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering.
The game is turn-based (grid moves), so no `requestAnimationFrame` physics loop is
needed; rendering redraws on each move plus a lightweight slide-animation tween.

### Core modules (all inline, organized by section comments in one script)
1. **Level data** — array of level objects: `{ width, height, tiles, start, exit }`.
   `tiles` is a flat array of tile-type codes:
   - `.` floor, `#` wall, `S` start, `E` exit, `B` breakable wall (cleared once the
     player slides into it, then becomes floor), `O` one-way gate (passable only from
     one side; encoded as `O_up`/`O_down`/`O_left`/`O_right`), `T1`/`T2` teleport pad
     pair (sliding onto `T1` continues the slide in the same direction from `T2`'s
     position, and vice versa).
2. **Grid engine** — pure function `slide(level, pos, dir) -> { path, stoppedAt,
   hitExit, brokeWallAt }` that walks the grid one cell at a time in `dir` from `pos`,
   applying tile rules (stop at `#`, stop *before* a one-way gate faced the wrong way,
   pass through and clear a `B` then keep sliding, warp via teleport pads and continue
   sliding from the paired pad), stopping at the first blocking tile or level edge.
   This function has no rendering or DOM dependency, so it is directly unit-testable.
3. **Input** — `keydown` listener mapping arrow keys / WASD to `slide()` calls; `R` to
   reset the current level; `N`/`P` (or auto-advance on exit) for next/prev level
   during dev, hidden from normal play once a level is solved sequentially.
4. **Game state** — current level index, current player position, move counter,
   per-level best move count (in-memory only, no persistence needed for a prototype).
5. **Render step** — draw grid tiles by type (distinct fill colors + simple icons for
   gates/teleports), player as a circle, slide animation as a short tween across the
   computed path (purely cosmetic, does not affect input handling — inputs during a
   tween are queued and applied after it completes to keep the turn-based logic simple
   and bug-free), HUD (level number, move count, level-complete banner with move count
   vs. a par value defined per level).
6. **Level-complete / progression** — on reaching `E`, show a brief banner and
   auto-advance to the next level after a short delay or on next keypress; a final
   "all levels complete" screen after the last level.

## Level design plan
10 levels, escalating:
1–2: teach sliding + walls only.
3–4: introduce breakable walls (`B`) as one-time shortcuts/dead-end traps.
5–6: introduce one-way gates (`O`).
7–8: introduce teleport pads (`T1`/`T2`), combined with walls.
9–10: combine all mechanics in denser layouts requiring multi-step planning.

Each level's `par` move count is set by solving it with the automated solver (below)
and recording the optimal path length, so the HUD can show "solved in N / par P moves"
without needing a human to hand-tune difficulty ratings.

## Testing plan
Because the grid engine (`slide()`) is a pure function independent of rendering, this
prototype can get much stronger automated coverage than Cycle 1's continuous-physics
game:
1. **Solvability check (all levels):** a small BFS/DFS solver script (run under Node,
   not the browser) that reuses the same `slide()` logic (extracted so it can be
   `require`d/loaded outside the browser, or duplicated verbatim in a test harness if
   extraction isn't practical in one file) explores the state space of each level from
   `start` and asserts a path to `exit` exists. This directly verifies every shipped
   level is actually completable — something Cycle 1 could not verify for its win
   condition without a human.
2. **Rule unit checks:** targeted `slide()` calls covering each tile type in isolation
   (wall stop, breakable-wall clear-then-continue, one-way gate blocking from the wrong
   side vs. passing from the right side, teleport pad warp-and-continue, level-edge
   stop) with expected `stoppedAt`/`path` assertions.
3. **Browser smoke test (Playwright/headless Chromium, as in Cycle 1):** load
   `game/drift-maze.html`, assert no console errors, canvas renders non-trivial pixel
   content, and a simulated arrow-key press measurably moves the player (confirms
   input wiring end-to-end, not just that `slide()` is correct in isolation).
4. **End-to-end win check:** script simulated keypresses through the solver's optimal
   path for level 1 and assert the level-complete banner/state actually triggers —
   directly covering the "win condition end-to-end" gap flagged as a Cycle 1 follow-up.

## Out of scope for this pass (documented as future work)
- Procedural level generation (deliberately deferred to Tidal Push/future work — hand
  -authored levels avoid solvability-generation complexity this cycle).
- Move-count leaderboards / persistence across sessions.
- Mobile/touch controls.
- Level editor.
