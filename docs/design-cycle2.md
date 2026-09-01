# Tether Tag — Design & Implementation Plan

Date: 2026-09-01
Phase: design

## Concept Summary
Local 2-player arcade pursuit. Both players share an elastic tether with a fixed
maximum length; once fully stretched it hard-constrains further separation, so chasing
or escaping means swinging around the arena and using the tether's pull rather than
moving freely. One player starts "it" (highlighted); touching the other transfers the
role, awards the *new* chaser a point for the tag just completed, and starts a brief
mutual immunity window so roles can't ping-pong instantly. First to `WIN_SCORE` tags
wins.

## Architecture

Single self-contained file: `game/tether-tag/index.html`. No build step, no external
dependencies, no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering,
`requestAnimationFrame` game loop. Runs by opening the file in any modern browser, or
serving the `game/` directory with any static file server. Mirrors Cycle 1's Orbit Duel
file structure/conventions for consistency (tunable constants block, vector helpers,
exposed test hook).

### Core modules (all inline, organized by section comments in one script)
1. **Vector helpers** — same `{x, y}` add/scale/sub/length/normalize helpers as Cycle 1.
2. **World state** — two `Player` objects (position, velocity, color, `it` flag, score,
   tag-immunity timer), rectangular arena bounds, game phase (`playing` | `roundEnd`).
3. **Input** — `keydown`/`keyup` listeners into a `keysDown` set. Player 1: `W`/`A`/`S`/`D`
   for 2D acceleration. Player 2: Arrow keys for 2D acceleration. `R` restarts after a
   win.
4. **Physics step** (clamped `dt` from `requestAnimationFrame` delta):
   - Each player accelerates along the sum of pressed directional inputs (normalized),
     scaled by `ACCEL`.
   - Linear velocity damping (`DRAG`) per second for arcade-y, controllable movement.
   - Integrate position; **wall bounce** on all four arena edges (reflect the relevant
     velocity component and clamp position inside bounds) — chosen over Cycle 1's
     screen-wrap so the tether's pull against a wall creates a distinct, readable
     dynamic (no free teleport to escape a stretched tether).
   - **Tether constraint** (positional, not spring/verlet): after integrating both
     players, compute `d = distance(p1, p2)`. If `d > TETHER_LEN`, pull each player
     toward the other along the connecting line by `(d - TETHER_LEN) / 2`, and zero out
     each player's outward-radial velocity component so the tether reads as taut rope
     rather than a springy snap-back. Below `TETHER_LEN` the tether is slack and applies
     no force at all.
   - **Tag detection**: circle-circle overlap (`d < r1 + r2`) between the two players,
     gated on both immunity timers being expired. On tag: swap the `it` flag, award the
     new chaser (the one who was *not* `it` and initiated contact — i.e. the player who
     was not `it` before the swap) one point, set both players' immunity timer to
     `TAG_IMMUNITY`, and spawn a small particle burst at the contact point. Check
     `WIN_SCORE` after scoring.
5. **Render step** — arena background + border, tether line (color/opacity reflecting
   slack vs. taut), players as circles (the current "it" player outlined/pulsing to
   read clearly at a glance), particles fading out, HUD (scores, who's "it", controls
   reminder), win overlay with restart prompt.
6. **Game loop** — `requestAnimationFrame` driving input resolution -> physics step ->
   tether constraint -> tag resolution -> render, plus a simple round/win-state machine
   (`R` key restarts).

## Tunable constants (top of script, single source of truth)
`ACCEL`, `DRAG`, `PLAYER_RADIUS`, `TETHER_LEN`, `TAG_IMMUNITY`, `WIN_SCORE`,
`ARENA_W`, `ARENA_H`.

## Testing plan
- Load `game/tether-tag/index.html` in headless Chromium (Playwright, already available
  in this environment) and assert: no console errors on load, canvas renders
  non-trivial pixel content, simulated key input (hold P1 movement keys) measurably
  changes player position over a short simulated time window, and the tether constraint
  actually holds — drive the two players apart via opposite-direction input over a
  longer simulated window and assert the exposed inter-player distance never exceeds
  `TETHER_LEN` by more than a small numerical-integration tolerance.
- A scripted tag test: place/drive players into contact (via the exposed test hook or
  sustained opposite-then-converging input) and assert score increments and the `it`
  flag swaps exactly once per contact event (not repeatedly while overlapping), and does
  not swap again during the immunity window.
- Manual-play notes (constants sanity-checked by reasoning, not a human playtest, since
  this is an unattended automated run): documented in `docs/test-results-cycle2.md`
  along with any follow-up tuning this pass didn't have budget for.

## Out of scope for this pass (documented as future work)
- Sound effects/music.
- More than 2 players / AI opponent.
- Persistent match history or menu screens beyond the in-canvas HUD.
- Mobile/touch controls.
- Visual tether "slack" curve (rendered as a straight line for this pass; a catenary/
  sag curve would be a nice-to-have polish item).
