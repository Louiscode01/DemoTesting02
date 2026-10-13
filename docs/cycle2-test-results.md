# Lantern Flock — Test Results

Date: 2026-10-13 | Phase: testing
Method: headless Chromium via Playwright (`tests/lantern-flock.test.mjs`, run with
`PW_PATH=/opt/node-tools/node_modules/playwright node tests/lantern-flock.test.mjs` from repo root), file:// load.

| Test | Result |
|---|---|
| Loads, zero console/page errors, canvas non-trivially drawn (~101k bright px) | PASS |
| Guided run without wisps: flock follows lantern to exit (40/40 saved, phase `over`) | PASS |
| Unguided run with wisps: flock is destroyed (0 saved, 40 lost) | PASS |
| Restart (R) resets state | PASS |

Balance probe (10 runs, naive straight-line lantern, wisps on): saved = 32,40,17,33,40,1,25,31,40,39
-> wide variance; winnable but not trivial.

## Known limitations / follow-ups
- No human playtest; feel (LANTERN_PULL, wisp speed) untuned.
- Mouse input and rendering verified only indirectly (no screenshot review).
- Ideas: multiple levels with walls, wisps that dislike light more, sound.

## Run
Open `game/lantern-flock.html` in a browser.
