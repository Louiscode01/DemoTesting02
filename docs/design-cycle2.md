# Tether Drift — Design

Single file `game2/index.html`, canvas 2D, no deps/assets/build.

- State: probe {pos, vel}, anchors (fixed, static ring + random scatter, seeded RNG),
  beacons (collect = +1 score, respawn elsewhere), mines (drift, wrap), tether {anchor, len}.
- Input: Space / mouse down / touch = attach to nearest anchor within TETHER_RANGE;
  release = detach. R restarts after game over.
- Physics: while tethered, rope is inextensible-ish: project velocity to tangent (keeps
  speed, removes radial component) and snap radius toward attach length with a gentle
  spring. Free flight: constant velocity with tiny drag. Screen wrap.
- Rules: mine hit = lose a life (3 lives, brief invulnerability); beacon = +1 and +time.
  Timer-less; difficulty scales by adding mines every 5 beacons.
- Tunables at top: TETHER_RANGE, DRAG, MINE_SPEED, LIVES, MAX_MINES.
- Test hooks: window.__tether {state getters, step(dt)} for headless tests.
- Test plan: Playwright headless: no console errors; tether attach changes velocity
  direction while keeping speed; beacon collection increments score; game-over + restart.
