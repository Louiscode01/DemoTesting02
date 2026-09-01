# Tether Tag — Test Results

Date: 2026-09-01
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium), run
against `game/tether-tag/index.html` directly via `file://`. No human playtest was
performed (unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic interaction smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content, and holding P1's movement key measurably moves the player.

**Result: PASS**
```
errors: []
nonBackgroundPixels: ~8360
shipMovedDistance: ~81-85px (over ~0.5s of held movement)
```

## Test 2 — Tether constraint holds under sustained opposite pulling
Checks: driving both players apart in opposite directions for ~3s never lets the
inter-player distance exceed `TETHER_LEN` (220px) beyond a small numerical tolerance.

**Result: PASS**
```
errors: []
maxDist: 220
tetherLen: 220
withinTolerance: true
```
Confirms the positional constraint (clamp + zero outward-radial velocity) holds the
tether taut exactly at its configured max length rather than letting numerical
integration overshoot it.

## Test 3 — Tag transfers role, scores once, respects immunity
Checks: driving P2 into P1 causes exactly one role swap and one point awarded to the
new chaser, and that holding position near contact for 400ms afterward (inside the
0.9s immunity window) does not trigger a second tag/score.

**Result: PASS**
```
errors: []
before: { p1It: true, p2It: false, p1Score: 0, p2Score: 0 }
afterTag: { p1It: false, p2It: true, p1Score: 0, p2Score: 1 }
afterImmunityHold: { p1It: false, p2It: true, p1Score: 0, p2Score: 1 }  (unchanged)
```

## Test 4 — Win-condition end-to-end (reach WIN_SCORE, restart with 'R')
Checks: repeatedly steering both players toward each other's *current* position
(re-read every round, since a tag can swap which side each player ends up on) until one
player reaches `WIN_SCORE` (5), then confirms `gameOver`/`winner` are set correctly and
that pressing `R` resets both scores and the `gameOver` flag.

**Result: PASS**
```
errors: []
roundsTaken: 28
winState: { gameOver: true, winner: "P2", p1Score: 4, p2Score: 5 }
afterRestart: { gameOver: false, p1Score: 0, p2Score: 0 }
```
This closes the gap Cycle 1 flagged as a follow-up ("automated end-to-end test of the
win condition + restart flow was not exercised") — for this cycle's prototype it is
now covered.

## Bugs found and fixed during testing
- **Test-authoring bug (not a game bug), fixed in the test script before it produced a
  false negative:** an early version of Test 4 always pressed the same fixed keys
  (`ArrowLeft` for P2, `KeyD` for P1) every round. Once a tag swapped which physical
  side each player ended up on, those fixed keys started pulling the players *apart*
  instead of together, so the players got stuck at exactly `TETHER_LEN` apart and no
  further tags occurred. Fixed by re-reading each player's current x-position every
  round and choosing the key that steers each player toward the other's *current*
  position, not a direction fixed at test-authoring time.
- No bugs found in the shipped game code itself during this pass — the earlier
  "dead no-op scoring code" cleanup happened during implementation, before testing
  began (see the `implementation` checkpoint in `state.json`), not during testing.

## Known limitations / not covered by automated tests
- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`ACCEL`, `DRAG`, `TETHER_LEN`, `TAG_IMMUNITY`) are a first pass and may need
  adjustment for feel — flagged as a follow-up.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).
- The scoring rule (the player who was NOT "it" and initiates contact becomes the new
  chaser *and* scores the point) is a deliberate design choice documented in
  `docs/design-cycle2.md`, but was not validated for "fun" against the more
  traditional alternative (award the point to whoever successfully avoided being "it"
  the longest, or track survival time instead of tag count) — worth a look during
  human playtest.

## How to run manually
Open `game/tether-tag/index.html` directly in a browser (double-click, or `file://`
URL) — no server or build step required. Two players share one keyboard.
