# Echo Vault — Test Results

Date: 2026-10-07
Phase: testing
Method: headless Chromium via Playwright, `tests/echo-vault.test.js` against `game/echo-vault/index.html` (file://).
Run: `NODE_PATH=/opt/node-tools/node_modules node tests/echo-vault.test.js`

```
PASS ping reveals walls (pixels lit) 346 -> 4005
PASS ping decrements counter 9
PASS reveal fades back to dark 344
PASS reaches exit -> levelDone 
PASS Enter advances to level 2 (bigger maze) [2,9]
PASS player blocked by boundary wall 
PASS guard enters investigate mode on ping 
PASS guard can catch player (state caught) or still hunting caught
PASS R restarts attempt 
PASS no console/page errors []
```

Covered: ping reveal + fade, ping counter, end-to-end level clear (BFS-solved route driven by real key input), level advance, wall collision, guard investigate-on-ping, caught + R restart, zero console errors.
Initial run had 1 failing assertion; cause was a wrong test expectation (10 vs 9 pings), not a game bug.

Not covered: human playtest of fun/difficulty, levels 3-5 end-to-end, win-all screen, cross-browser.
Run manually: open game/echo-vault/index.html (optional ?seed=N&guards=N&level=N).
