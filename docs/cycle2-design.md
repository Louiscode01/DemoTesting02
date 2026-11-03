# Echo Loop — Design (Cycle 2)

Date: 2026-11-03 · Phase: design

## Rules
- Grid, turn-based. Each loop has T turns. Moves: U/D/L/R/Wait.
- When a loop ends (T turns used, or player presses `E`), the player's per-turn *positions* are stored as a ghost that replays every loop after, then stands still on its last tile.
- Plates (`a`,`b`) open matching doors (`A`,`B`) while any actor (player or ghost) stands on them at the start of a turn.
- Reach exit `X` to clear the level. `Z` restarts the current loop, `R` resets the level (drops ghosts), `N`/`P` change level (after clearing / free).

## Architecture
- `echo-loop/core.js` — pure, dependency-free logic (UMD: browser global `EchoCore`, Node `module.exports`). Level parse, `step`, `endLoop`, `reset`.
- `echo-loop/index.html` — canvas renderer + keyboard input + level select; loads core.js. No build step, no deps. `window.__echo` test hook.
- `tests/echo-solver.js` — Node: verifies every level solvable with a time-expanded BFS over ghost sequences, and unit-checks mechanics.
- `tests/echo-smoke.js` — Playwright headless smoke test of the real page.

## Key decisions
- Record positions, not inputs → ghost replay is exact; no divergence/paradox handling.
- Door open check uses state at turn start (simultaneous-move semantics).
- Levels are ASCII maps; solvability proven by solver rather than by hand.
