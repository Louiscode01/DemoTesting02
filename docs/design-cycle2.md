# Echo Maze — Design & Implementation Plan

Date: 2026-09-02
Phase: design

## Concept Summary
Top-down single-player stealth-navigation game. The player starts blind in a dark
maze. Pressing a "ping" key emits a sound pulse that reveals nearby open passages
(depth-limited flood fill through non-wall cells) and briefly lights up anything in
range, including patrolling guards. Previously-revealed passages stay dimly
"remembered" (fog-of-war), but guards are only visible for a short flash right after a
fresh ping — the player must use limited, cooldown-gated pings to track guard patrol
patterns from memory and route around them to reach the exit.

## Architecture

Single self-contained file: `game/echo-maze.html`. No build step, no external
dependencies, no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering,
`requestAnimationFrame` game loop. Runs by opening the file in any modern browser, or
serving the `game/` directory with any static file server.

### Core modules (all inline, organized by section comments in one script)
1. **Maze data** — a hand-authored, fixed 2D grid (`MAZE_W` x `MAZE_H` cells), each
   cell either wall or open, guaranteed solvable by construction (single main
   corridor with a few loop-back branches, no procedural generation risk). Fixed
   player start cell and exit cell.
2. **World state** — player grid position (with sub-cell interpolated pixel position
   for smooth movement), `visited`/`remembered` cell set (fog-of-war memory, persists
   once revealed), `litCells` set with a per-cell expiry timestamp (bright flash from
   the most recent ping, fades out), guards array (each with a patrol waypoint list,
   current index, direction, pixel position), ping cooldown timer, game phase
   (`playing` | `win` | `lose`).
3. **Input** — `keydown`/`keyup` into a `keys` set. Arrow keys / WASD move the player
   one cell at a time (grid-stepped, blocked by walls, smoothly animated between
   cells over a short duration rather than teleporting). `Space` triggers a ping if
   its cooldown has elapsed. `R` restarts after win/lose.
4. **Ping / fog system**
   - On ping: BFS flood fill outward from the player's cell through open
     (non-wall) neighbors up to `PING_DEPTH` steps; every cell reached is added to
     `remembered` (stays dim-visible forever after) and to `litCells` with an expiry
     `now + PING_FLASH_MS` (bright, and guards standing in a lit cell are drawn).
   - Cooldown `PING_COOLDOWN_MS` prevents spamming; a HUD indicator shows readiness.
5. **Guard patrol AI** — each guard walks a fixed loop of 2+ waypoints (grid cells) at
   constant speed, reversing direction at each end (or looping, for a cyclic patrol);
   pure scripted movement, no pathfinding/awareness needed since detection is purely
   positional (see below) — keeps this system small and deterministic/testable.
6. **Collision / win-lose detection** (checked once per frame, grid-cell-based):
   - Player cell == a guard's current cell → `lose` (guard caught the player).
   - Player cell == exit cell → `win`.
   - Both freeze the game loop's movement/AI updates and show an overlay
     ("You reached the exit!" / "A guard found you!") with a restart prompt.
7. **Render step** — draw the maze: unrevealed cells solid black; `remembered`
   (not currently lit) cells dim gray with walls outlined; `litCells` bright white/
   blue with a fading-alpha pulse ring emanating from the player's position; the
   player as a small circle (always drawn — the player can always see themselves);
   guards as small red triangles, drawn *only* when their current cell is in
   `litCells`; the exit tile drawn with a distinct marker whenever its cell has ever
   been remembered; HUD showing ping cooldown state and controls reminder; win/lose
   overlay.
8. **Game loop** — `requestAnimationFrame` driving input resolution → player move
   animation → guard patrol step → collision/win-lose check → lit-cell expiry sweep →
   render, gated by game phase (frozen once `win`/`lose`, resumes fresh on `R`).

## Tunable constants (top of script, single source of truth)
`MAZE_W`, `MAZE_H`, `CELL_SIZE`, `PLAYER_MOVE_MS`, `PING_DEPTH`, `PING_COOLDOWN_MS`,
`PING_FLASH_MS`, `GUARD_SPEED` (cells/sec along patrol path).

## Testing plan
- Load `game/echo-maze.html` in headless Chromium (Playwright, already available in
  this environment) and assert: no console errors on load, canvas renders non-trivial
  pixel content, and simulated key input (hold a move key) measurably changes the
  player's pixel position over a short simulated time window — confirms the game loop,
  movement, and render step are actually running.
- Directed checks via an exposed `window.__echoMaze` test hook (position, remembered/
  lit sets, guards, phase): verify a ping call increases the size of `remembered`, and
  verify guard positions update over time (patrol AI is running).
- Win/lose conditions verified primarily by code review plus a directed test that
  drives the exposed player-position setter to the exit cell / a guard's cell and
  confirms `phase` flips to `win` / `lose` respectively — same approach Cycle 1 used
  for its win-condition logic, documented here as a known limitation of "not exercised
  via literal player input" rather than skipped entirely.
- Manual-play notes on fun/balance (ping depth/cooldown, guard speed) are reasoned
  about, not human-playtested, consistent with Cycle 1's unattended-run approach —
  documented as follow-up in `docs/test-results-cycle2.md`.

## Out of scope for this pass (documented as future work)
- Multiple maze levels / procedural maze generation.
- Sound effects/music (the "echo" is purely visual in this prototype).
- Guard awareness beyond fixed patrol loops (e.g. guards reacting to a nearby ping).
- Mobile/touch controls.
