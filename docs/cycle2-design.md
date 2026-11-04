# Cycle 002 — Chrono Loop design
- `game/chrono-loop/sim.js`: DOM-free deterministic sim (UMD, runs in browser + node). Turn-based, 24 turns/loop. Doors open iff any actor (player or ghost) stands on matching plate; state sampled at turn start so actors move simultaneously. Ghosts replay recorded moves and park at their final tile (holding plates).
- `game/chrono-loop/index.html`: canvas renderer + keyboard input. Open directly in a browser; no build.
- 3 levels (1, 2, 2 ghosts needed). Tests: `node game/chrono-loop/test.js`.
