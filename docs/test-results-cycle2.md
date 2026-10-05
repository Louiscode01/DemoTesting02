# Tether Swing — Test Results (cycle 2)

Date: 2026-10-05. Method: `node tests/tether.test.js` (Playwright, headless Chromium, file://). No human playtest.

Result: **PASS**
- No console/page errors; canvas renders non-background content.
- Idle player falls and triggers game over (~20 score).
- Scripted grapple policy scores ~94 (>4x idle); rope constraint never violated (max excess ~1e-13 px); attached on 186 steps.
- Restart resets state.

Initial run failed once: my render check counted only bright red-channel pixels (the blue tide/dark scene didn't qualify). Test bug, fixed by diffing against the background colour; game unchanged.

Known limits: scripted policy is naive (dies ~10s in), so feel/difficulty tuning (G, HOOK_RANGE, TIDE_SPEED) needs a human playtest; no keyboard/mouse event-path test (tests drive the hook API).
