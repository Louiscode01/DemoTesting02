# Tether Swing — Design

Phase: design (cycle 2)

## Architecture
Single self-contained `game2/index.html`; HTML5 canvas; no deps. Fixed-timestep (1/120 s) loop.
Test hook: `window.__tether` (getters for state; `step(n)` to advance deterministically).

## Model
- Player: point mass (pos, vel), gravity G=1400 px/s², air drag 0.1/s.
- Anchors: procedurally generated ahead of the camera (x spacing 140–260, y 80–260 from top), seeded RNG (mulberry32) so tests are reproducible.
- Hold Space / mouse: attach to nearest anchor within HOOK_RANGE (330px) that is ahead-ish and above the player; rope length fixed at attach distance.
  Rope constraint: if dist > L, project position onto circle and remove the outward radial velocity component (inelastic rope, taut only).
- Release: rope dropped, momentum preserved.
- Tide: rises from bottom at 40 px/s accelerating slowly; touching it or falling below the floor = game over. Touching the ceiling clamps.
- Score = max x / 10. R restarts. Camera follows player x.

## Tunables
G, HOOK_RANGE, TIDE_SPEED, TIDE_ACCEL, DRAG.

## Test plan
Playwright headless: (1) loads w/o errors, canvas non-blank; (2) with no input player dies by falling and game-over triggers; (3) scripted hold/release policy travels farther than the idle baseline and rope length is respected (|pos-anchor| <= L+eps while attached); (4) restart resets state.
