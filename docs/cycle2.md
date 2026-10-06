# Cycle 002 — Echo Vault

## Research (concepts considered)
1. **Echo Vault** — scoped-down evolution of cycle 1's "Chrono Loop": grid puzzle where each finished loop becomes a ghost that replays your moves, holding pressure plates open for the next loop. Feasible (deterministic tick logic), high novelty. **Selected.**
2. Orbit Duel AI — add a bot opponent to cycle 1's game. Feasible, low novelty.
3. Tether Swing — rope-physics platformer. Medium feasibility, physics tuning risk.
4. Tide Tiles — grid puzzle with rising/falling water phases. Medium scope (level design).
5. Pulse Defense — rhythm-synced tower defense. Medium scope (audio timing).

## Design
Single file `game2/index.html`, no deps. Pure logic (`loadLevel`, `step`, `sendEcho`) separate from canvas UI. Turn-based ticks: each key press (move or wait) is one tick. Enter finishes the loop; the recorded path becomes a ghost (max 3) that replays in lockstep from tick 0 and stays on its final cell. Plates (`a`,`b`) open matching doors (`A`,`B`) while occupied by a ghost or the player. Doors only constrain the live player; ghosts replay recorded paths verbatim (known limitation: a changed earlier ghost could invalidate a later ghost's path).

## Implementation / test
2 levels. `game2/test.js` (Playwright) solves both levels, and checks that level 1 is blocked without an echo; PASS, no console errors. Run: `NODE_PATH=$(npm root -g) node game2/test.js`.

## Follow-ups
Manual playtest/feel; more levels (3+ ghosts, timing puzzles); undo; ghost-desync handling; mobile controls.
