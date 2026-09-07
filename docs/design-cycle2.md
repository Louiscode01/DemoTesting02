# Cycle 002 — Design: Tether Sumo

Date: 2026-09-07
Phase: design
Selected concept: Tether Sumo (see docs/concepts-cycle2.md)

## Concept summary

Local 2-player arcade game. Two ships sit inside a circular arena, connected by an
elastic tether (a spring). Each player accelerates their ship with thrust + rotation.
Moving away from the opponent stretches the tether, storing spring energy that pulls
both ships back together; there is no "release button" — the spring is always live,
so skilled play is about *when* to thrust with/against the pull, using the snap-back
to fling the opponent (or yourself, if mistimed) toward the arena wall. Touching the
outer boundary eliminates a ship for that round. First to 3 round wins takes the match.

## Architecture

Single self-contained file: `game/tether-sumo/index.html` (HTML + inline CSS + inline
JS, no build step, no external assets or CDN dependencies — same constraint as Cycle
1's Orbit Duel, and kept in its own subfolder so Cycle 1's game/index.html is
untouched).

- **Canvas + fixed-timestep loop**: `requestAnimationFrame` driving a fixed-dt physics
  step (accumulator pattern), matching Cycle 1's proven approach.
- **Entities**: two `Ship` objects `{x, y, vx, vy, angle, angularVelocity, alive}`.
  No bullets/projectiles this cycle — the only "weapon" is the tether itself.
- **Forces per step**:
  1. Thrust: `SHIP_THRUST` along facing angle when a player holds their thrust key.
  2. Rotation: `SHIP_TURN_RATE` for left/right keys.
  3. Drag: `SHIP_DRAG` velocity damping (prevents infinite acceleration/energy gain).
  4. Tether spring force: Hooke's law between the two ships —
     `F = TETHER_K * (dist - TETHER_REST_LENGTH)` directed along the line between
     them, pulling them together when stretched beyond rest length (no push force
     when compressed — a rope, not a rigid rod — clamped at `Math.max(0, ...)`).
  5. Tether damping: small velocity term along the tether axis to keep oscillation
     controllable and avoid perpetual energy gain (energy in must trend down over
     time without input, so a round can't stalemate forever).
- **Boundary check**: circular arena of `ARENA_RADIUS`; a ship whose center exceeds
  the radius is eliminated for the round (`alive = false`), rendered as an explosion
  particle burst (reuse Cycle 1's simple particle-burst pattern).
- **Round / match state machine**: `playing → roundOver → (nextRound | matchOver)`.
  First to `WINS_TO_TAKE_MATCH = 3` wins. `R` restarts the whole match at any time.
- **Rendering**: ships as triangles (angle-oriented, like Orbit Duel), tether as a
  line whose color/thickness scales with stretch (visual tension feedback), arena
  boundary as a circle, on-canvas HUD text for round wins and controls reminder.
- **Input**: two independent local keyboard sets, same convention as Cycle 1:
  - P1: `W` thrust, `A`/`D` rotate.
  - P2: `↑` thrust, `←`/`→` rotate.
  - `R` restart match (any time).
- **Test hook**: expose `window.__tetherSumo` with live getters for ship state, round
  wins, and match-over flag — mirroring the Cycle 1 pattern, and explicitly using
  *live getters, not snapshots*, to avoid the staleness bug found and fixed in Cycle
  1's testing phase (docs/test-results.md).

## Tunable constants (top of file, single source of truth)

```
ARENA_RADIUS, SHIP_THRUST, SHIP_TURN_RATE, SHIP_DRAG,
TETHER_REST_LENGTH, TETHER_K, TETHER_DAMPING, WINS_TO_TAKE_MATCH
```

## Risks / mitigations

- **Spring energy runaway** (game never settles / never ends): mitigate with
  velocity-damping term along the tether axis plus general `SHIP_DRAG`, tuned so a
  no-input round still slowly settles rather than oscillating forever. Covered by an
  automated "no-input" soak test (see test plan).
- **Degenerate stalemate** (both ships elimination-proof by hugging center): the
  spring's pull toward each other combined with drag means passivity trends ships
  toward the *center*, not the wall, so add an outward "wind" force pushing both
  ships gently outward to force eventual action and guarantee rounds terminate.
  **Update from testing:** a *constant*-magnitude drift force against a linear
  spring just settles at a new, small equilibrium stretch and never resolves the
  round — caught by the no-input soak test (see docs/test-results-cycle2.md).
  Fixed by making the drift escalate with idle time since the last movement key
  press (`ARENA_DRIFT + IDLE_DRIFT_RAMP * idleSeconds^2`, reset on any input), so
  active play is unaffected but true idleness eventually overwhelms any tether
  stretch.

## Test plan

1. **Load + basic interaction smoke test** (Playwright/headless Chromium, mirroring
   Cycle 1): page loads without console errors, canvas renders, `window.__tetherSumo`
   hook exists, simulated key input moves a ship (position changes).
2. **No-input soak test**: run N seconds with no key input; assert the match
   eventually produces a round result (elimination happens) rather than looping
   forever, thanks to `ARENA_DRIFT` — directly testing the anti-stalemate mitigation
   above.
3. **Round/match win-condition end-to-end test**: drive one ship via simulated input
   to push the other past the boundary repeatedly; assert round-win counter
   increments and match-over triggers at `WINS_TO_TAKE_MATCH`, and that `R` resets
   state. This explicitly covers the category of test Cycle 1 flagged as a follow-up
   gap (win-condition + restart e2e), applied here from the start.

## Explicitly out of scope for this cycle

- AI opponent (local 2-player only, matching Cycle 1's scope decision).
- Sound/music, external art assets, persistence/leaderboards.
- Mobile/touch input (keyboard only, desktop-browser target).
