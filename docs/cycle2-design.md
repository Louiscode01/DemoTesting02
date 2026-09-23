# Tether Duel — Design & Implementation Plan

Date: 2026-09-23
Phase: design

## Concept Summary
Local 2-player arena duel. Two ships are joined by an elastic tether. Thrusting away
from your opponent stretches the tether and builds spring tension; releasing thrust
(or getting yanked) converts that tension into a sudden velocity kick. Ring-shaped
hazard zones sit near the arena edge — get flung (or drift) into one and you lose the
round. First to 3 rounds wins the match.

## Architecture
Single self-contained file: `game/tether-duel.html`. No build step, no external
dependencies, no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering,
`requestAnimationFrame` game loop. Runs by opening the file directly in a browser.

### Core modules (all inline, organized by section comments in one script)
1. **Vector helpers** — reused pattern from Cycle 001: plain `{x, y}` objects +
   add/scale/sub/length/normalize helpers.
2. **World state** — two `Ship` objects (position, velocity, facing angle), a fixed
   `tetherRestLength`, hazard-ring list (fixed positions/radii near the arena border),
   round scores, match phase (`playing` | `roundEnd` | `matchEnd`).
3. **Input** — `keydown`/`keyup` into a `keys` set. Player 1: `A`/`D` rotate, `W`
   thrust. Player 2: `ArrowLeft`/`ArrowRight` rotate, `ArrowUp` thrust. No fire button
   this time — the whole game is movement/tension management. `R` restarts a finished
   match.
4. **Physics step** (delta-time from `requestAnimationFrame`, clamped to avoid
   spiral-of-death on tab-switch lag):
   - Tether spring force on both ships: `F = -k * (dist - restLength)` directed along
     the line between ships (pulls them back toward rest length; pushes apart only if
     compressed past a minimum distance, so ships can't overlap indefinitely).
   - Ship thrust adds acceleration along facing angle; linear velocity damping
     (drag) for an arcade feel.
   - Screen-bounded arena (no wraparound this time, since hazards live at the border
     and wraparound would let players cheese past them).
   - Hazard collision: ship-center-to-hazard-center distance check; entering a hazard
     ends the round immediately (other player scores a point) and both ships reset to
     opposite spawn points with tether at rest length.
   - Tether-overstretch safety valve: if stretched beyond a max distance (should be
     rare given arena size vs. spring constant, but guards against edge cases), the
     tether snaps back hard (strong corrective impulse) rather than allowing infinite
     stretch.
5. **Render step** — arena background, hazard rings (pulsing warning color), tether
   line between ships (color-coded by current tension: green → yellow → red as it
   stretches), ships as triangles oriented by facing angle + thrust flame when
   accelerating, HUD (round scores, controls reminder), round-end flash + match-end
   overlay with restart prompt.
6. **Game loop** — `requestAnimationFrame` driving input resolution -> physics step ->
   collision resolution -> render, plus the round/match win-state machine.

## Tunable constants (top of script, single source of truth)
`TETHER_REST_LENGTH`, `TETHER_K` (spring constant), `TETHER_MAX_STRETCH`,
`SHIP_THRUST`, `SHIP_ROT_SPEED`, `SHIP_DRAG`, `HAZARD_RADIUS`, `ROUNDS_TO_WIN`.

## Testing plan
- Load `game/tether-duel.html` in headless Chromium (Playwright) and assert: no
  console errors on load, canvas renders non-trivial pixel content, holding P1 thrust
  measurably changes ship position and increases tether stretch distance over a short
  simulated window — confirms the physics step (thrust + spring) is actually running.
- Scripted hazard-collision test: programmatically place a ship inside a hazard ring
  via the exposed debug hook and step the simulation forward, asserting the round-end
  state machine fires (score increments, ships reset to spawn) — this directly
  addresses Cycle 001's follow-up gap where win/round-condition logic was only
  verified by code review, not by an automated test.
- Manual-play notes (constants sanity-checked by reasoning, not a human playtest,
  since this is an unattended automated run): documented in
  `docs/cycle2-test-results.md` along with any follow-up tuning this pass didn't have
  budget for.

## Out of scope for this pass (documented as future work)
- Sound effects/music.
- More than 2 players / AI opponent.
- Persistent match history or menu screens beyond the in-canvas HUD.
- Mobile/touch controls.
- Moving/rotating hazards (fixed hazard positions only, for this pass).
