# Cycle 002 — Design: Tether Swing

- Single file `game/tether/index.html`, canvas 2D, no deps.
- Input: hold Space / mouse / touch = attach rope to nearest anchor within RANGE ahead of/above the player; release = detach, keeping velocity.
- Physics (fixed 1/120s step): gravity G; while attached, rope length is fixed (distance at attach) and radial velocity is removed (pendulum constraint).
- World: camera follows player x; anchors spawned procedurally ahead with random gaps/heights; lava rises with time; touching lava or falling off = game over. Score = distance.
- Tunables: G, RANGE, LAVA_SPEED, ANCHOR_GAP.
- Test hook: `window.__tether` (state getter, `step(n)`, `press()`, `release()`) for headless tests.
- Tests: Playwright headless: loads w/o errors; attach conserves rope length; unattached run dies to lava; restart works.
