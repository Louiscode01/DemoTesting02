# Tether Duel — Test Results

Date: 2026-09-23
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium), run
against `game/tether-duel.html` directly via `file://`. No human playtest was
performed (unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic interaction smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial opaque
pixel content (counting alpha-opaque pixels, since the canvas is transparency-cleared
each frame over a CSS background rather than filled with an opaque background color —
counting literal background-color pixels as in Cycle 001's test would have massively
overcounted here), holding P1's thrust key measurably moves the ship, and the tether
stretch distance changes as a result.

**Result: PASS**
```
errors: []
nonBackgroundPixels (opaque): 50531
shipMovedDistance: 130.3px (over ~0.5s of held thrust)
tetherStretchDelta: -230.4px
```

## Test 2 — Scripted hazard-collision / round-end test
This directly closes the gap flagged in Cycle 001's `docs/test-results.md`, where the
win/round-condition logic was verified only by code review rather than by an
automated test. Using the `forceShipOntoHazard(shipIndex, hazardIndex)` debug hook
(teleports a ship onto a hazard without needing precision physics timing), this test
asserts the round-end state machine fires correctly.

**Result: PASS**
```
scoresBefore: [0, 0] -> phaseAfterHit: roundEnd, scoresAfter: [0, 1]
phaseAfterResetWindow (1.4s later): playing
p1 position after reset: back at spawn point (x≈369, y=300)
```
Confirms: hazard collision ends the round, awards the point to the *other* player,
and the round auto-resets both ships to spawn after the round-end delay.

## Test 3 — Match-end win condition
Forced two more hazard hits for the same player (3 total) to drive the match to
`ROUNDS_TO_WIN`.

**Result: PASS**
```
phase: matchEnd, winner: 1 (player index), scores: [0, 3]
```

## Test 4 — Restart via 'R' key
Pressed `R` while `phase === "matchEnd"` and confirmed the match state fully resets.

**Result: PASS**
```
phase: playing, scores: [0, 0]
```

No console or page errors were recorded across any of the four tests.

## Known limitations / not covered by automated tests
- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`TETHER_K`, `TETHER_REST_LENGTH`, `SHIP_THRUST`, `SHIP_DRAG`) are a first pass and
  may need adjustment for feel — flagged as follow-up.
- The hazard-collision test uses a debug teleport hook rather than driving the ship
  into a hazard through simulated thrust/rotation input; the underlying spring
  physics that gets ships moving (thrust, drag, tether force) is covered by Test 1,
  but the two are not exercised together end-to-end (e.g. "thrust hard enough to
  fling your opponent into a hazard via tether tension" is not itself scripted).
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually
Open `game/tether-duel.html` directly in a browser (double-click, or `file://` URL)
— no server or build step required. Two players share one keyboard.
