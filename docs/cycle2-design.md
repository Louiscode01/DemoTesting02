# Ink Territory — Design & Implementation Plan

Date: 2026-09-14
Phase: design
Concept source: `docs/cycle2-concepts.md` (Concept 1, selected)

## Overview

Local 2-player, keyboard-only, grid-based territory-control duel in the spirit of
Tron/Qix. Each player permanently owns a starting block of territory and extends it
by leaving the safety of owned tiles, laying a "wet" trail across neutral (or
contested) ground, and returning to owned territory to convert that trail into
permanent territory. Running into *any* wet trail — including your own — kills you
instantly. When the round timer expires, whoever owns more tiles wins.

This keeps the "duel" tension from Cycle 1's Orbit Duel (direct player-vs-player
risk) while being a structurally different genre (area control, discrete grid
movement, no projectiles/physics simulation), per the Cycle 2 concept selection.

## Architecture

Single self-contained file, no build step, no external assets or dependencies —
same constraint as Cycle 1:

- `game/ink-territory.html` — HTML shell, inline `<style>`, inline `<script>`.
- `<canvas>` for all rendering (grid cells drawn as filled rects; no sprites/images).
- Fixed-timestep game loop: game logic advances on a tick timer (`TICK_MS`), not on
  `requestAnimationFrame` — movement is inherently discrete (one grid cell per
  tick), so this avoids interpolation code and keeps behavior fully deterministic,
  which matters for automated testing. `requestAnimationFrame` is still used purely
  to redraw the canvas every frame (cheap — just re-blits current grid state), so
  visuals don't feel choppier than the tick rate already implies.

### Core constants (tunable)

```
GRID_W = 30, GRID_H = 20      // cells
CELL_PX = 24                  // pixel size per cell
TICK_MS = 130                 // ms between grid-movement ticks (~7.7 moves/sec)
ROUND_SECONDS = 60            // countdown length
RESPAWN_MS = 1500             // frozen delay after death before player reappears
START_BLOCK = 3               // NxN starting owned-territory block per player
```

### State model

- `grid`: 2D array of `{ owner: 0|1|2, wet: 0|1|2 }` — `owner` is permanent
  territory color (0 = neutral), `wet` is an in-progress trail belonging to
  whichever player is currently extending it (0 = none).
- `players[2]`: `{ x, y, dir, pendingDir, trail: [{x,y}], alive, respawnAt,
  deaths, color }`.
- `timeRemaining`, `gameOver`, `winner` (0 = draw, 1 or 2).

### Per-tick update (for each alive player, simultaneously — order-independent
except the head-on-collision check which is resolved after both moves land)

1. Apply `pendingDir` to `dir`, ignoring the change if it's the exact opposite of
   the current `dir` while a trail is active (standard Snake/Tron anti-instant-
   suicide rule; a stationary/fresh player may reverse freely).
2. Compute next cell from `dir`. If out of bounds, the move is skipped (player
   waits in place) rather than treated as a crash — keeps the arena's edges from
   being an unforgiving instant-death rule that would dominate play at this
   grid size.
3. Resolve landing on the next cell:
   - **Own territory (`owner === self`)**: safe. If a trail is currently open,
     *seal* it — every cell in `trail` becomes `owner = self`, `wet = 0`, then
     clear `trail`. This is the "return home" territory-claim moment.
   - **Wet cell (`wet !== 0`, regardless of whose)**: the *mover* dies (running
     into any live trail is fatal, including your own). See Death below.
   - **Otherwise (neutral or enemy-owned territory)**: mark cell `wet = self`,
     push to `trail`. Enemy-owned tiles can be painted over as trail like any
     other non-owner cell — they only permanently flip to the mover's color once
     the trail is sealed by returning home.
4. **Head-on collision**: after both players have moved, if both occupy the same
   cell, both die simultaneously.

### Death

- Player's `alive = false`, all of their currently-open `trail` cells revert to
  neutral (`wet = 0`; note this never touches `owner`, so already-sealed
  territory is untouched), `trail = []`, `deaths += 1`.
- `respawnAt = now + RESPAWN_MS`. While dead, the player is skipped by the tick
  update and rendered as a faded marker.
- On respawn: reposition to the centroid of the player's current owned
  territory (falls back to their original start corner if they somehow own zero
  tiles), `alive = true`, fresh `dir` facing into open space.

### Round end

- `timeRemaining` counts down in real time (independent of tick rate) and is
  decremented in the `requestAnimationFrame` loop using a real delta-time clock,
  not the fixed tick — so the countdown stays accurate regardless of `TICK_MS`.
- At 0: `gameOver = true`, tally `owner` counts across the grid, higher count
  wins (equal counts = draw). Freeze all ticks; show overlay with final score
  and "Press R to restart".

### Controls

- Player 1: `W A S D` (blue).
- Player 2: Arrow keys (orange).
- `R`: restart at any time (mainly meaningful once `gameOver`, but available
  throughout for convenience during manual testing).

### Rendering

- Owned territory: solid player color.
- Wet trail: same hue, lower opacity/lighter shade, so a trail visually reads as
  "temporary" versus solid territory.
- Players: small solid square in their color, slightly larger than a trail cell,
  outlined in white so they're readable against same-color territory.
- HUD bar above the grid: live tile counts for both players and the countdown
  timer, always visible (not just at game end) so players can track the race.

## Testability / debug hooks

Following Cycle 1's pattern (`window.__orbitDuel`), expose `window.__inkTerritory`
with:
- `grid` getter (live reference, not a stale snapshot — Cycle 1 found and fixed
  exactly this bug with `bullets`, so getters are used for every mutable/
  reassigned reference from the start here).
- `players` getter.
- `gameOver`, `winner`, `timeRemaining` getters.
- `setTimeRemaining(seconds)` — lets automated tests force the round-end path
  quickly instead of waiting the full 60 real seconds, directly closing the gap
  Cycle 1 flagged ("win-condition end-to-end... not exercised by an automated
  test").
- `tick()` — manually advance one game-logic tick, so tests can drive exact
  movement sequences deterministically instead of relying on timed key holds.

## Testing plan

1. **Load smoke test**: page loads with zero console errors; canvas shows two
   distinct starting territory colors; HUD shows correct initial tile counts
   (`START_BLOCK^2` each) and `ROUND_SECONDS`.
2. **Movement + trail test**: drive P1 out of its territory via `tick()` calls
   with scripted directions; assert wet trail cells appear with the correct
   owner and that neutral tile count decreases accordingly.
3. **Territory-claim test**: script a full out-and-back loop for P1; assert
   trail cells convert to `owner = 1` and P1's tile count increases by the
   loop's enclosed path length.
4. **Death test — enemy trail**: script P2's path to intersect a wet cell P1
   currently owns; assert P2's `alive` flips false, `deaths` increments, and
   P2's own open trail cells revert to neutral.
5. **Death test — self trail**: script a player to double back onto its own
   wet trail; assert the same death path fires (confirms the "any wet trail
   is fatal, including your own" rule).
6. **Win-condition end-to-end**: use `setTimeRemaining(0)` (or a small positive
   value + a couple of frames) to force round end from a known board state;
   assert `gameOver === true` and `winner` matches whichever player has more
   `owner` tiles on the forced board; also assert restart (`R`) resets the
   grid/timer/scores to initial state.

## Known scope cuts (documented up front, not discovered late)

- No AI opponent — this is a local 2-player-only prototype, same as Cycle 1's
  Orbit Duel.
- No enclosed-area flood fill (classic Qix-style "claim everything inside the
  loop, not just the path"). Sealing a trail claims exactly the path cells, not
  interior area — a deliberate simplification to keep the algorithm O(trail
  length) instead of requiring a flood-fill/point-in-polygon pass. Flagged as a
  candidate enhancement if this concept is revisited.
- No sound.
