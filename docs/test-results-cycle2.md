# Tether Duel — Test Results

Date: 2026-08-31
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium), run
against `game/tether-duel.html` directly via `file://`. No human playtest was performed
(unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic interaction smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content, holding P1's thrust key measurably moves the ship, and — with P2 placed at
tether-stretch range — pressing P1's yank measurably changes P2's velocity toward P1
(confirms the tether/yank physics path runs, not just that the page parses).

**Result: PASS**
```
errors: []
nonBackgroundPixels: 8348
shipMovedDistance: 268.2px (over ~0.5s of held thrust)
yankVelDelta: 286.7 (P2 velocity vector magnitude change after P1's yank)
```

## Test 2 — Extended session (~6s simulated play, mixed thrust/rotate/yank)
Checks: no errors over a longer session mixing thrust, rotation, and repeated yanking
near the arena's central hazard; both ships stay within arena bounds; lives never go
negative.

**Result: PASS**
```
errors: []
p1: in-bounds, lives: 1 (took hazard hits during the stress-test maneuvering — expected,
    confirms hazard-collision detection fires organically during real play, not only
    via the test hook)
p2: in-bounds, lives: 1
gameOver: false (win condition correctly not yet triggered at 1-1 lives)
```

## Test 3 — Scripted win-condition + restart e2e test (new this cycle)
Carries forward cycle 1's explicit follow-up ("automated end-to-end test of the win
condition + restart flow was not covered") by adding this coverage from the start.
Uses the exposed `__testForceHit` hook to deterministically drive P2's lives to 0
(rather than relying on scripted precision movement into a hazard), then checks the
win state and the `R`-key restart flow.

**Result: PASS**
```
midState:   { p2Lives: 0, gameOver: true, winner: "P1" }
afterReset: { p1Lives: 3, p2Lives: 3, gameOver: false, winner: null }
```
Confirms: lives reaching 0 correctly sets `gameOver`/`winner`, and pressing `R` fully
resets both players' lives and clears the win state.

## Known limitations / not covered by automated tests
- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`TETHER_K`, `TETHER_MAX_FORCE`, `YANK_IMPULSE_BASE`, `YANK_IMPULSE_PER_STRETCH`,
  `SHIP_THRUST`, `SHIP_DRAG`) are a first pass and may need adjustment for feel —
  flagged as the top candidate follow-up if this concept is revisited.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).
- The win-condition test uses a test-only hook (`__testForceHit`) to force hazard hits
  rather than driving a ship into a hazard via simulated movement input; this
  deterministically exercises the life/game-over/restart *logic* but does not add new
  coverage of hazard *collision-detection accuracy* beyond what Test 2's organic hits
  already show.

## How to run manually
Open `game/tether-duel.html` directly in a browser (double-click, or `file://` URL) —
no server or build step required. Two players share one keyboard.
