# Orbit Duel: Rival AI — Test Results

Date: 2026-09-15
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium),
run against `game/index.html` directly via `file://`, via a real Playwright Test
suite this time (`tests/e2e.spec.js`) rather than Cycle 1's ad-hoc script. No
human playtest was performed (unattended automated run) — see "Known
limitations" below.

## Environment note (deviation from `docs/cycle2-design.md`)
The design doc's testing plan assumed `@playwright/test` was already resolvable.
In this environment only the base `playwright` package is installed globally;
`@playwright/test` had to be added as a local pinned dependency
(`package.json`, `@playwright/test@1.56.1` — matching the global `playwright`
version so the already-downloaded Chromium build at `/opt/pw-browsers/` is
compatible without a browser download). This only affects how the suite is
*run*; the test plan itself (four tests, same hook surface) matches the design
doc.

## How to run
```
npm install   # pulls in @playwright/test only; no browser download (pinned
              # version matches the pre-installed Chromium build)
npx playwright test
```
No server or build step is needed to *play* the game — `game/index.html` still
opens directly in a browser. The above is only for running the automated suite.

## Test 1 — Load & basic interaction smoke test
Ported from Cycle 1. Checks: zero console/page errors on load, canvas renders
non-trivial pixel content, holding P1 thrust measurably moves the ship, firing
increases bullet count. Updated to call `startGame('local')` first, since the
new menu now gates the sim (Cycle 1 assumed gameplay was live on load).

**Result: PASS** (stable across 4 consecutive runs)

Bug found and fixed during this test: the initial version used
`page.keyboard.press('Space')` (an effectively zero-delay keydown+keyup) to
test firing. On some frames the down/up pair landed entirely between two
`requestAnimationFrame` callbacks, so the game loop never observed the key as
"held" and no bullet fired — an intermittent test-only race, not a gameplay
bug (a real keypress is never that short). Fixed by holding the key down for
80ms before releasing, matching the pattern already used for the thrust check
earlier in the same test.

## Test 2 — Extended mixed-input session (~6s)
Ported from Cycle 1, with `startGame('local')` added and small keypress delays
(`{ delay: 30 }`) added to the repeated fire presses for the same reason as
Test 1's fix.

**Result: PASS** (stable across 4 consecutive runs)

## Test 3 — Win condition + restart flow (end-to-end) — closes the Cycle 1 gap
Drives a real win via `awardKill('P1')` (which routes through the same
`registerKill()` the bullet-collision code calls) five times, then asserts:
score/winner/phase state, that the win overlay is actually **rendered**
(near-white pixel count in the "Press R to restart" text band goes from
near-zero to >50), then restarts via a real `R` keypress and asserts the reset
took (`phase`, scores, `winner`, bullet count, both ships alive, overlay gone).

**Result: PASS** (stable across 4 consecutive runs)

Two bugs found and fixed while building this test (both test-only, not
gameplay bugs):
1. The pixel-band check was read immediately after the JS-side `startGame()`
   call, before any `requestAnimationFrame` had painted the new `'playing'`
   phase — so the canvas still showed the *previous* painted frame (the
   title-screen menu, whose "2 — vs Rival AI" line happens to fall in the same
   band later used to detect the win overlay), producing a false-positive
   "overlay already present" baseline. Fixed by waiting one short timeout
   after `startGame()` before taking the pre-win baseline.
2. Same root cause as Test 1's fire-timing race — not present in this test
   itself, but confirms the pattern to watch for whenever a test reads canvas
   state immediately after a script-driven state change.

## Test 4 — AI opponent smoke test (agency, not drift)
Starts `mode: 'ai'` with `setAimJitter(0)` for determinism, gives zero player
input, and polls for up to 4s. Asserts genuine AI *agency* rather than passive
drift: `players[1].angle` changed (gravity never rotates a ship, so this is
exact proof of rotation input), `aiDebug.ticks > 60` (the decision function is
running every tick), `aiDebug.thrustTicks > 0` (it maneuvered), `aiDebug.fires
> 0` **and** a live bullet with `owner === 'P2'` was observed (it pulled the
trigger and a real bullet was produced by the normal fire path — not just an
internal debug counter), and no `NaN` propagated into position/velocity/angle
(would indicate a divide-by-zero in the trajectory search, e.g. two
coincident ship positions).

**Result: PASS** (stable across 4 consecutive runs). Against a stationary P1
at spawn (the easiest case, appropriate for a smoke test), the AI reliably
rotated to face the target, closed distance from its starting range, and
landed at least one shot within the polling window.

## Regression check
Re-ran Cycle 1's `game/index.html` behavior via Tests 1 & 2 (2-player local
mode) — both pass, confirming the AI/menu additions didn't regress the
original local-multiplayer path.

## Known limitations / not covered by automated tests
- **Fun/balance tuning** for both the base physics (carried over from Cycle 1)
  and the new AI constants (`AI_AIM_JITTER`, `AI_RANGE_MIN/MAX`,
  `AI_ORBIT_BIAS`, etc.) was reasoned about, not human-playtested. This is now
  the single most-repeated open follow-up across two cycles — see
  `state.json` follow-ups.
- **AI difficulty curve** — only one AI configuration was exercised (default
  constants vs. a stationary target). Behavior against a moving/thrusting
  human opponent, and whether the AI feels "fair" rather than either
  trivially weak or unbeatable, is unverified.
- Test 4 exercises the AI against a *stationary* target only, per the design
  doc's "easiest case" scope decision — it does not verify AI aim quality
  against a moving/evading target.
- No cross-browser testing beyond Chromium (matches the environment's
  available browser).
- Wrap-around trick shots and thrust-prediction are out of scope for the AI's
  trajectory search by design (see `docs/cycle2-design.md` §3) and therefore
  not tested.

## How to run manually
Open `game/index.html` directly in a browser (double-click, or `file://` URL)
— no server or build step required. Press `1` for 2-player local (shared
keyboard) or `2` for vs Rival AI.
