# Orbit Duel — Test Results

Date: 2026-08-31
Phase: testing
Method: automated headless-browser smoke tests (Playwright + pre-installed Chromium),
run against `game/index.html` directly via `file://`. No human playtest was performed
(unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic interaction smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content (confirms the render loop draws more than a blank background), holding P1's
thrust key measurably moves the ship, and firing increases the bullet count.

**Result: PASS**
```
errors: []
nonBackgroundPixels: 17905
shipMovedDistance: 32.8px (over ~0.5s of held thrust)
bulletsBefore: 0 -> bulletsAfter: 1
```

Bug found and fixed during this test: `window.__orbitDuel.bullets` was exposed as a
plain object-literal property, but the `bullets` array is *reassigned* every physics
step (`bullets = bullets.filter(...)`), so the exposed reference went stale after the
first frame and always looked empty from outside. Fixed by exposing it as a getter
(`get bullets() { return bullets; }`), matching the existing `gameOver` getter pattern.
This was a test-hook-only bug — internal gameplay logic was unaffected — but it would
have silently broken any external tooling/telemetry reading that hook.

## Test 2 — Extended session (~6s simulated play)
Checks: no errors over a longer session mixing thrust, rotation, and continuous firing
near the star; both ships stay within the wrapped arena bounds throughout.

**Result: PASS**
```
errors: []
p1: crashed into the star mid-run (alive: false, position consistent with
    star-collision radius), confirming the star-collision detection and
    respawn-delay path both fire correctly
p2: alive, position in-bounds
bulletCount at end: 4 (bullets correctly persisting/expiring, not runaway-accumulating)
gameOver: false (win condition correctly not yet triggered at 0-0)
```

## Known limitations / not covered by automated tests
- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`SHIP_THRUST`, `SHIP_DRAG`, `G`, `BULLET_SPEED`) are a first pass and may need
  adjustment for feel — flagged as the top candidate for next cycle's follow-up if this
  concept is revisited.
- **Win-condition end-to-end** (reaching `WIN_SCORE` and seeing the restart overlay,
  then confirming `R` resets state) was not exercised by an automated test in this pass
  — would need scripted precision hits rather than the loose stress-test input pattern
  used above. Logic was verified by code review instead.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually
Open `game/index.html` directly in a browser (double-click, or `file://` URL) — no
server or build step required. Two players share one keyboard.
