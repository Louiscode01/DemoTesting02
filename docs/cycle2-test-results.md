# Cycle 002 test results — Tether Swing
Headless Chromium via Playwright (`NODE_PATH=$(npm root -g) node game/tether/test.js`): PASS.
- Page loads, no page errors.
- Rope length conserved while attached (max error ~1e-13 px).
- Without grappling, player dies to rising lava.
- Restart via input works.
Not covered: feel/difficulty tuning (G, RANGE, LAVA_SPEED, anchor gaps), mobile touch, anchor reachability guarantees (gaps 120-230px vs RANGE 260 — a gap could be unreachable in rare cases).
