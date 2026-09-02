# Echo Maze — Design & Implementation Plan

Date: 2026-09-02
Phase: design

## Concept Summary
Single-player stealth-puzzle. The maze is invisible except for a short-lived glow
around the player and any walls revealed by a "ping." Pinging reveals nearby walls in
a radius for a couple of seconds, but the pulse is audible to patrolling guards within
a larger radius — a guard that hears a ping investigates the ping's location. Reach
the exit without being caught (touched) by a guard.

## Architecture

Single self-contained file: `game/cycle2/index.html`. No build step, no external
dependencies, no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering,
`requestAnimationFrame` game loop. Runs by opening the file in any modern browser, or
serving the `game/cycle2/` directory with any static file server.

### Core modules (all inline, organized by section comments in one script)
1. **Maze data** — fixed grid (cell-based) maze defined as a 2D array (wall bitmask or
   `1`/`0` cells), authored by hand for this pass (procedural generation is out of
   scope, see below). One start cell, one exit cell.
2. **World state** — `player` (grid-continuous `{x, y}` position + facing), `guards[]`
   (each with a patrol path = ordered list of waypoint cells, current target index,
   speed, and state `patrol` | `investigate` | `chase`), `pings[]` (active reveal
   pulses: origin, start time, reveal radius, alert radius), game phase
   (`playing` | `lost` | `won`).
3. **Input** — `keydown`/`keyup` into a `keys` set. `WASD`/arrow keys move the player
   (continuous, collision-checked against maze walls each step). `Space` emits a ping
   (rate-limited by a cooldown).
4. **Fog-of-war / visibility model** — canvas is cleared to black each frame; only
   cells within a small constant "you can always see adjacent walls" radius around the
   player, plus any cells within an active ping's reveal radius (alpha fading out over
   the ping's lifetime), are drawn. Everything else stays black. This is the core
   visual hook.
5. **Guard AI** (simple finite state machine, no pathfinding library — grid-local
   logic only):
   - `patrol`: walk the waypoint loop at fixed speed.
   - On a ping within `ALERT_RADIUS` of a guard: guard switches to `investigate` and
     heads for the ping's origin cell via straight-line-with-wall-avoidance movement
     (grid-local steering: try direct vector, fall back to nearest open neighbor cell
     if blocked). If nothing found there after a timeout, return to `patrol` from the
     nearest waypoint.
   - If a guard's position comes within `CATCH_RADIUS` of the player at any time
     (patrol or investigate — this is a stealth game, guards don't need line-of-sight
     vision cones for this scope), the game transitions to `lost`.
6. **Win/lose state** — reaching the exit cell -> `won`. Guard contact -> `lost`. Both
   states show an overlay with a restart prompt (`R` key restarts, resets player/guard
   positions and phase).
7. **Render step** — black background; fog-of-war-masked maze walls/floor; player as a
   small circle with a facing tick; guards as colored triangles (only drawn when
   inside a currently-revealed area, consistent with the fog-of-war rule — this keeps
   "guards are only visible if you've pinged near them" honest); active ping(s) as
   expanding rings; HUD (ping cooldown indicator, controls reminder); win/lose overlay.
8. **Game loop** — `requestAnimationFrame` driving input resolution -> player movement
   + wall collision -> ping lifecycle update -> guard AI/movement -> catch/win checks
   -> render.

## Tunable constants (top of script, single source of truth)
`CELL_SIZE`, `PLAYER_SPEED`, `GUARD_SPEED`, `PING_COOLDOWN`, `PING_REVEAL_RADIUS`,
`PING_REVEAL_DURATION`, `PING_ALERT_RADIUS`, `AMBIENT_VISIBILITY_RADIUS`,
`CATCH_RADIUS`, `INVESTIGATE_TIMEOUT`.

## Testing plan
- Load `game/cycle2/index.html` in headless Chromium (Playwright) and assert: no
  console errors on load, canvas renders non-trivial pixel content, simulated player
  movement input measurably changes the player's grid position over a short simulated
  time window (confirms input + collision-checked movement actually run), and a
  simulated ping keypress measurably changes revealed-area state (confirms the
  fog-of-war/reveal system runs, not just that the page parses).
- A scripted end-to-end run driving the player along the known-good hand-authored path
  to the exit, asserting the `won` state is reached, and a separate run that parks the
  player in a guard's path asserting the `lost` state is reached — both automatable
  since the maze and patrols are deterministic (no RNG in this pass).
- Manual-play notes (constants sanity-checked by reasoning, not a human playtest, since
  this is an unattended automated run): documented in `docs/cycle2/test-results.md`
  along with any follow-up tuning this pass didn't have budget for.

## Out of scope for this pass (documented as future work)
- Procedural maze generation (hand-authored single layout only).
- Guard line-of-sight vision cones (guards currently react to pings and proximity
  only, not sight).
- Multiple levels / progression / scoring beyond win-lose.
- Sound effects/music.
- Mobile/touch controls.
