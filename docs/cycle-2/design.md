# Tether Twins — Design & Implementation Plan

Date: 2026-09-21
Phase: design

## Concept Summary
Single-player physics puzzler. Two orbs joined by an elastic tether are steered
*simultaneously* by one player — WASD thrusts orb A, arrow keys thrust orb B. Stretching,
compressing, and swinging the tether is the core skill: squeeze both orbs through a narrow
gap, swing one around an obstacle, keep both clear of hazards. A level clears when both
orbs come to rest on their goal pads at the same time. Three short hand-authored levels.

## Architecture

Single self-contained file: `game/cycle-2-tether-twins/index.html` (new directory —
Cycle 1's `game/index.html` is untouched). No build step, no dependencies, no assets —
inline `<style>` and `<script>`, HTML5 Canvas 2D, `requestAnimationFrame` loop. Runs by
opening the file in any modern browser or serving the directory statically.

### Core modules (all inline, organized by section comments in one script)
1. **Vector helpers** — plain `{x, y}` objects + add/sub/scale/length/normalize, plus
   `clamp` and a `circleRectResolve(orb, rect)` helper (closest-point-on-rect test).
2. **World state** — `orbs` (two objects: `{pos, vel, acc, onGoalFrames}`), `levelIndex`,
   the active level's `walls` / `hazards` / `goals` arrays, `phase`
   (`playing` | `levelClear` | `gameComplete`), and a `resetFlash` timer for hazard-death
   feedback.
3. **Input** — `keydown`/`keyup` into a `keys` set; `preventDefault` on arrows/space so the
   page doesn't scroll. Orb A: `W`/`A`/`S`/`D` = up/left/down/right. Orb B:
   `ArrowUp`/`ArrowLeft`/`ArrowDown`/`ArrowRight`. `R` restarts the current level; `N`
   (debug) skips to the next. Each frame both orbs' thrust vectors are built independently
   from the same `keys` snapshot — held keys sum per axis (left+right cancels), the result
   is normalized then scaled by `ORB_THRUST`, so diagonal thrust isn't faster and dual
   input is inherently simultaneous rather than sequential.
4. **Physics step** (`dt` from the rAF delta, clamped to `MAX_DT` to survive tab stalls):
   - Per-orb acceleration = player thrust + gravity (`{0, GRAVITY}`).
   - Tether spring between the two orbs: `d = B.pos - A.pos`, `len = |d|`,
     `n = d / len`; spring force `F = TETHER_STIFFNESS * (len - TETHER_REST_LENGTH)` along
     `n`, plus damping `TETHER_DAMPING * dot(B.vel - A.vel, n)`. Applied `+F*n` to A and
     `-F*n` to B (equal and opposite, equal masses). `len` is floored at a small epsilon to
     avoid a divide-by-zero when the orbs coincide.
   - Integrate semi-implicitly: `vel += acc * dt`, then linear drag `vel *= (1 - ORB_DRAG*dt)`,
     then `pos += vel * dt`. Velocity magnitude is clamped to `MAX_SPEED` so a
     badly-stretched tether can't launch an orb through a wall in one frame.
   - Collision: circle-vs-static-rect for each orb against every wall — find the closest
     point on the rect, and if the distance is under `ORB_RADIUS`, push the orb out along
     the contact normal and reflect the normal component of velocity scaled by
     `WALL_RESTITUTION`. Canvas edges are treated as four implicit walls.
   - Hazard overlap (same closest-point test, no resolution) -> level reset.
   - Goal test: an orb whose centre is inside its goal rect *and* whose speed is below
     `GOAL_REST_SPEED` increments its `onGoalFrames`; anything else resets it to 0.
5. **Render step** — dark background; walls as filled grey rects, hazards as red rects with
   a spike-hatch top edge, goal pads as outlined rects that fill in as `onGoalFrames`
   climbs; the tether as a line whose colour lerps from slack-blue to taut-orange by
   `len / TETHER_REST_LENGTH`; the two orbs as circles (A cyan, B magenta) with a thrust
   arrow when accelerating; HUD with level number, controls reminder, and `R` = restart;
   overlays for level-clear and all-levels-complete.
6. **Game loop** — rAF driving input resolution -> physics step -> collision/hazard/goal
   resolution -> win/lose state machine -> render.

## Level data structure
A module-level `LEVELS` array; each entry is
`{ name, orbA: {x,y}, orbB: {x,y}, walls: [{x,y,w,h}], hazards: [...], goals: [goalA, goalB] }`.
All rects are plain top-left/width/height in canvas pixels; `goals[0]` belongs to orb A and
`goals[1]` to orb B. Loading a level deep-copies start positions and zeroes velocities.

1. **First Steps** — open room, one full-height wall across the middle with a single gap
   slightly wider than one orb; goals side by side on the far side. Teaches passing the orbs
   through in sequence while the tether drags the trailing one.
2. **The Spike Pit** — floor-mounted hazard strip in the centre of the room with a ledge to
   either side; goals on the far ledge. Requires swinging one orb across as an anchor and
   pulling the second over the hazard rather than dragging it through.
3. **Pinch Point** — two staggered walls forming a narrow vertical channel narrower than
   `TETHER_REST_LENGTH`, hazards lining both approach edges. Requires thrusting the orbs
   *toward each other* to compress the tether and fit through, then separating onto goals
   placed far enough apart to stretch it again.

## Win / lose / reset flow
- **Level clear:** both orbs must satisfy the goal test (centre inside own goal rect, speed
  < `GOAL_REST_SPEED`) on the *same* frame for `GOAL_HOLD_FRAMES` consecutive frames —
  tracked as a single shared counter that resets to 0 the moment either orb fails the test,
  so a fly-through can't trigger a clear. On success, `phase = 'levelClear'`, an overlay
  shows for `CLEAR_OVERLAY_FRAMES`, then `levelIndex++` and the next level loads. After
  level 3, `phase = 'gameComplete'` with a restart-from-level-1 prompt.
- **Hazard touch:** either orb overlapping any hazard rect immediately reloads the current
  level from its start data (positions reset, velocities zeroed, counters cleared) and
  triggers a short `resetFlash`. No lives or score — instant retry, no penalty.
- **Restart:** `R` reloads the current level at any time; from the `gameComplete` overlay it
  restarts at level 1.

## Tunable constants (top of script, single source of truth)
`TETHER_REST_LENGTH` (natural tether length, px), `TETHER_STIFFNESS` (spring constant),
`TETHER_DAMPING` (spring velocity damping, kills oscillation), `ORB_RADIUS`,
`ORB_THRUST` (per-orb input acceleration), `ORB_DRAG` (linear velocity damping per second),
`GRAVITY` (downward acceleration), `MAX_SPEED` (velocity clamp, tunnelling guard),
`WALL_RESTITUTION` (wall bounce, low for a dead thud), `GOAL_REST_SPEED` (speed under which
an orb counts as "resting"), `GOAL_HOLD_FRAMES` (frames both orbs must hold their goals),
`CLEAR_OVERLAY_FRAMES`, `MAX_DT` (frame-delta clamp).

## Testing plan
- Expose `window.__tetherTwins` with **getters** (not snapshot properties — Cycle 1's
  test-hook bug came from exposing a reassigned reference): `orbA` / `orbB`
  (`{x, y, vx, vy}`), `tetherLength`, `levelIndex`, `levelName`, `goalHoldFrames`,
  `phase`, `resets` (hazard-reset counter), and `constants`.
- Playwright + headless Chromium (pre-installed: `/opt/pw-browsers/chromium`,
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), loading the file over `file://`, asserting:
  1. No console/page errors on load, and the canvas renders non-trivial pixel content.
  2. **Input isolation:** holding `KeyD` for ~0.5s moves orb A right by a measurable margin
     while orb B's displacement stays far smaller (it moves only via the tether, so the
     assertion is A's delta >> B's, not B being frozen); the mirrored check holds
     `ArrowLeft` and asserts the reverse.
  3. **Tether responds:** driving the orbs apart increases `tetherLength` above
     `TETHER_REST_LENGTH`, and thrusting them together drops it below — confirming the
     spring constraint is live rather than a fixed-length rod.
  4. **Hazard reset:** a scripted run into level 2's hazard increments `resets` and returns
     both orbs to their start positions.
- Constants are sanity-checked by reasoning, not a human playtest (unattended run); results
  and any follow-up tuning go in `docs/cycle-2/test-results.md`.

## Out of scope for this pass (documented as future work)
- More than 3 levels, a level file format, or a level editor.
- Sound effects / music.
- Mobile or touch controls (the mechanic is keyboard-dual-input by design).
- Visual polish beyond flat shapes — no sprites, particles, or animated backgrounds.
- Two-player mode (one orb each), timers, star ratings, or any progress persistence.
