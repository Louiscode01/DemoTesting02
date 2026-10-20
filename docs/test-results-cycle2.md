# Echo Cavern — Test Results (2026-10-20)

Playwright + headless Chromium, `tests/echo-cavern.test.js`. All 9 checks PASS:
maze solvable (levels 1-12), player movement, ping reveals walls, hunters alerted by ping,
hunter contact costs a life, exit advances level + scores, game over after 3 lives,
outer wall blocks player, no console/page errors.

Not covered: human playtest of feel/balance (PING_COOLDOWN, HUNTER_SPEED, HEAR_RADIUS),
inner-wall collision under real input, hunter visibility rendering (pixel checks).
Run: `NODE_PATH=$(npm root -g) node tests/echo-cavern.test.js`; play: open `game2/index.html`.
