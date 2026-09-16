# Orbit Duel — Design & Implementation Plan

Date: 2026-08-31
Phase: design

## Concept Summary
Local 2-player arcade space duel. A central star exerts gravity on both ships and all
bullets. Players thrust, rotate, and fire, using orbital paths and gravity-curved shots
to outmaneuver and destroy each other. First to 5 kills wins.

## Architecture

Single self-contained file: `game/index.html`. No build step, no external dependencies,
no assets — inline `<style>` and `<script>`, HTML5 Canvas 2D rendering,
`requestAnimationFrame` game loop. Runs by opening the file in any modern browser, or
serving the `game/` directory with any static file server.

### Core modules (all inline, organized by section comments in one script)
1. **Vector helpers** — plain `{x, y}` objects + add/scale/sub/length/normalize helpers.
2. **World state** — star (fixed at canvas center, fixed mass), two `Ship` objects,
   `bullets` array, `particles` array (visual-only explosion effects), score counters,
   game phase (`playing` | `roundEnd`).
3. **Input** — `keydown`/`keyup` listeners into a `keys` set. Player 1: `A`/`D` rotate,
   `W` thrust, `Space` fire. Player 2: `ArrowLeft`/`ArrowRight` rotate, `ArrowUp` thrust,
   `Enter` fire. Fire is rate-limited per-ship (cooldown timer).
4. **Physics step** (fixed-ish `dt` from `requestAnimationFrame` delta, clamped):
   - Gravity acceleration on ships and bullets: `a = G * M / r^2` directed toward star
     center, with a minimum-radius clamp to avoid singularity blow-up near the star.
   - Ship thrust adds acceleration along facing angle; simple linear velocity damping
     (space-drag) keeps speeds controllable for an arcade feel rather than true Newtonian
     drift.
   - Screen-wrap on all four edges for ships and bullets (asteroids-style arena).
   - Star-collision: ship within star radius -> destroyed (counts as a self-loss, no
     point awarded), respawns after a short delay at one of two fixed spawn points.
   - Bullet-ship collision: circle-circle distance check; on hit, shooter's score += 1,
     victim destroyed + respawns; explosion particles spawned at impact.
   - Bullet lifetime (ttl) so stray shots eventually despawn instead of orbiting forever.
5. **Render step** — draw starfield background (static seeded points), star with glow,
   ships as triangles oriented by facing angle + thrust flame when accelerating, bullets
   as small dots with trail, particles fading out, HUD (scores, controls reminder), and
   a win overlay with restart prompt when a player reaches 5 kills.
6. **Game loop** — `requestAnimationFrame` driving input resolution -> physics step ->
   collision resolution -> render, plus a simple round/win-state machine (`R` key
   restarts).

## Tunable constants (top of script, single source of truth)
`G`, `STAR_MASS`, `STAR_RADIUS`, `SHIP_THRUST`, `SHIP_ROT_SPEED`, `SHIP_DRAG`,
`BULLET_SPEED`, `BULLET_TTL`, `FIRE_COOLDOWN`, `WIN_SCORE`.

## Testing plan
- Load `game/index.html` in headless Chromium (Playwright, already available in this
  environment) and assert: no console errors on load, canvas element renders with
  non-trivial pixel content, and simulated key input (hold P1 thrust) measurably changes
  ship position over a short simulated time window — confirms the game loop and physics
  step are actually running, not just that the page parses.
- Manual-play notes (constants sanity-checked by reasoning, not a human playtest, since
  this is an unattended automated run): documented in `docs/test-results.md` along with
  any follow-up tuning this pass didn't have budget for.

## Out of scope for this pass (documented as future work)
- Sound effects/music.
- More than 2 players / AI opponent.
- Persistent match history or menu screens beyond the in-canvas HUD.
- Mobile/touch controls.
