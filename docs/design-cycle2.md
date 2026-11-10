# Cycle 002 — Design: Tether Swing

Architecture: single `game/tether-swing.html`, canvas 2D, no deps, fixed-timestep (1/120s) loop, `window.__tether` test hook.

- **Player**: point mass (pos, vel), gravity G=900 px/s², air drag.
- **Grapple**: hold Space/mouse/touch → attach to nearest peg within RANGE (220px) preferring pegs above. Rope is an inextensible-when-taut constraint (length fixed at attach distance, slack allowed): if dist > len, project position onto circle and remove outward radial velocity. Release → keep velocity (fling).
- **World**: camera follows player upward. Pegs generated in chunks above (seeded RNG, spacing 90–170px, gaps scale with height). Lava rises at speed growing with time; touching it = game over.
- **Score**: max height (m) + stars collected (bonus pegs). Best score in localStorage (try/catch).
- **States**: title → play → over (Space/click restarts).
- **Tunable constants** at top of file.
- **Tests (Playwright)**: loads without errors; grapple attaches; ball height increases under scripted swinging; death on lava triggers game over and restart; deterministic peg generation by seed.
