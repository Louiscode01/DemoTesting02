# Territory Ink — Design & Architecture

Date: 2026-09-09
Phase: design
Cycle: 2

## Overview

Two-player local, grid-based territory-capture duel (Tron/Qix/"paper.io"-style).
Both players share one keyboard. Each owns a colored home base and a running trail;
looping a trail back into your own territory claims the neutral cells it encloses.
Crossing an opponent's live trail destroys it and costs them a life; crossing your own
trail costs you a life. First player to lose all 3 lives loses the match.

Constraints (same as Cycle 1): single self-contained `index.html`, no external
assets/dependencies, no build step, must run by opening the file directly in a browser.

## File

`game/territory-ink.html` — kept as a separate file from Cycle 1's `game/index.html` so
both prototypes remain runnable and auditable side by side.

## Core data model

- Grid: `COLS x ROWS` cells (44 x 30), `CELL = 18px` → canvas 792x540, plus a small HUD
  strip.
- `board[row][col]` — one of: `EMPTY`, `P1_TERRITORY`, `P2_TERRITORY`, `P1_TRAIL`,
  `P2_TRAIL`.
- Each player: `{ headRow, headCol, dir, queuedDir, trail: [{row,col}, ...], lives,
  alive, baseRow, baseCol }`.
- Player 1 base: top-left 4x4 block, pre-filled `P1_TERRITORY`. Player 2 base:
  bottom-right 4x4 block, pre-filled `P2_TERRITORY`.

## Loop & movement

- Fixed-tick simulation via `setInterval`/accumulator inside `requestAnimationFrame`
  (tick = 110ms) — deliberately discrete/grid-based (unlike Orbit Duel's continuous
  vector physics), which is what keeps flood-fill and collision detection simple and
  correct.
- Controls: P1 = WASD, P2 = Arrow keys. Input sets `queuedDir`; a queued direction that
  directly reverses the current direction is ignored (prevents instant self-collision
  from a same-cell reversal).
- Each tick, for each *alive* player: apply `queuedDir` → `dir`, compute new head cell.

## Collision & trail rules (resolved per tick, order matters)

1. **Out of bounds** → that player dies this tick.
2. **Head-on collision** (both players' new head cells are the same cell) → both
   players die this tick (draw on that exchange).
3. **Moves onto own trail cell** → self-crash, that player dies.
4. **Moves onto opponent's live trail cell** → the *opponent* (trail owner) dies, mover
   is unaffected and keeps moving (rewards aggressive trail-cutting).
5. **Moves onto own territory** → safe; if the player was carrying a trail (i.e. had
   left their territory), this closes the loop: run flood-fill capture (below), then
   clear the trail.
6. **Moves onto neutral cell or opponent's territory** → mark cell as this player's
   trail (`P{n}_TRAIL`), append to `trail[]`. (Opponent territory is walkable — passing
   through it does not itself claim or damage it; only an enclosing loop captures
   cells, and only neutral cells are captured — see Scope cut below.)

### Death / respawn

On death: player's `trail[]` cells are reverted to `EMPTY` (their in-progress trail is
lost, but previously *claimed* territory is unaffected), `lives -= 1`. If `lives > 0`,
respawn after a short delay (~1s) at their base cell with `dir` reset facing into the
open board. If `lives === 0`, that player is eliminated — the other player wins
immediately and the game enters a "Game Over" state (matches Orbit Duel's pattern of an
overlay + press-R-to-restart).

### Flood-fill capture (on loop closure)

1. Treat `trail[]` cells (now converted to territory) plus existing
   `P{n}_TERRITORY` cells as "claimed" for this player.
2. BFS/DFS flood-fill from every border cell of the grid across `EMPTY` cells only
   (4-directionally), marking all empty cells reachable from the outside.
3. Any `EMPTY` cell **not** reached by that flood is enclosed → convert it to this
   player's territory.
4. Convert all of this player's `trail[]` cells to territory; clear `trail[]`.

**Scope cut (documented, not a bug):** capture only claims `EMPTY` (neutral) cells, not
cells already owned by the opponent. Stealing enemy territory via encirclement is a
natural extension but adds real edge-case risk (recursive ownership flips, base
protection rules) — left as a follow-up rather than risking an under-tested mechanic in
this pass.

## Win condition

- First to 0 lives loses; the other player wins → overlay "P{n} WINS" + "Press R to
  restart".
- `R` resets both players to starting lives/positions/territory and clears the board
  back to the two base squares.

## Rendering

- Canvas 2D. Territory cells filled with each player's base color at partial opacity;
  trail cells filled solid brighter; grid lines drawn faint. Player heads drawn as a
  small bright square/triangle indicating facing direction. HUD strip shows lives
  (hearts or pip counters) and player labels/colors.

## Test hooks

Mirroring Cycle 1's `window.__orbitDuel` pattern, expose `window.__territoryInk` with
live getters (not stale snapshots — Cycle 1 found and fixed exactly this bug, so this
cycle uses getters from the start): `board`, `players` (P1/P2 state), `gameOver`,
`winner`, `tick` (frame counter), plus a `setDir(playerIndex, dir)` helper so automated
tests can drive input deterministically instead of simulating raw key events only.

## Testing plan

1. **Load & smoke test**: page loads with zero console errors, canvas renders non-blank
   content, both players' territory visible at start.
2. **Movement & trail test**: drive P1 out of its base via `setDir`, confirm trail
   cells appear in `board` and `players[0].trail`.
3. **Self-crash test**: script a path that loops P1 back onto its own trail, confirm
   `lives` decrements and trail clears.
4. **Capture test**: script a closed loop through neutral territory back into P1's
   base, confirm previously-neutral enclosed cells flip to `P1_TERRITORY` via the
   flood-fill.
5. **Trail-cut test**: script P2 crossing P1's live trail, confirm P1 (not P2) loses a
   life.
6. **Win condition test**: force a player's `lives` to 0 (directly, or via repeated
   scripted deaths) and confirm the game-over overlay/state appears with the correct
   winner, and that `R` restores initial state.

As with Cycle 1, fun/balance tuning (tick speed, life count, grid size) is reasoned
about but not human-playtested in this automated pass — flagged as a follow-up.
