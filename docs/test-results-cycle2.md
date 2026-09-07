# Tether Sumo — Test Results

Date: 2026-09-07
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium,
`/opt/pw-browsers/chromium-1194`), run against `game/tether-sumo/index.html`
directly via `file://`. Script preserved at `tests/test-tether-sumo.js`. No human
playtest was performed (unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic interaction smoke test

Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content, `window.__tetherSumo` test hook exists, and holding P1's thrust key
measurably moves the ship.

**Result: PASS**
```
errors: []
hookExists: true
nonBackgroundPixels: 7914
p1MovedDistance: 21.3px (over ~0.5s of held thrust)
```

## Test 2 — No-input soak test (anti-stalemate drift)

Checks: with zero key input from either player, the round still resolves
(elimination happens) within a bounded wall-clock window (25s), rather than the
tether settling into a permanent, silent stalemate.

**Result: PASS (after a fix)**

Initial run **failed**: the round never resolved within 25s
(`resolvedAfterMs: 25000, resolved: false`). Root cause: the original design used
a constant-magnitude outward drift force (`ARENA_DRIFT`) against the tether's
linear spring. A constant force against a linear (Hookean) spring always finds a
stable equilibrium stretch (`stretch = drift / TETHER_K`, here ≈1.6px) — the ships
simply settled a couple pixels further apart than rest length and sat there
motionless forever, never approaching the arena wall. This is a real design bug in
the anti-stalemate mitigation described in docs/design-cycle2.md, not a test
artifact.

**Fix**: replaced the constant drift with an idle-time-escalating drift
(`ARENA_DRIFT + IDLE_DRIFT_RAMP * idleSeconds^2`), where `idleSeconds` resets to 0
on any movement-key input from either player. Active play is unaffected (the timer
keeps resetting), but true idleness now produces an unbounded outward force that
eventually exceeds the spring's restoring force at any stretch, guaranteeing
termination.

**Result after fix:**
```
errors: []
resolvedAfterMs: 19000
resolved: true
```

## Test 3 — Round/match win-condition + restart end-to-end test

Checks: driving one player's ship to repeatedly stretch and release the tether
into the opponent forces eliminations; round-win counters increment correctly;
the match ends at `WINS_TO_TAKE_MATCH` (3) with the correct winner recorded; and
pressing `R` fully resets match state (round wins back to 0, `matchOver` false).
This directly covers the category of test Cycle 1 flagged as a follow-up gap
(win-condition + restart e2e), built into this cycle's plan from the start.

**Result: PASS**
```
errors: []
finalState: { matchOver: true, matchWinner: "P1", p1Wins: 3, p2Wins: 0 }
afterRestart: { matchOver: false, p1Wins: 0, p2Wins: 0 }
```

## Known limitations / not covered by automated tests

- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`SHIP_THRUST`, `TETHER_K`, `TETHER_DAMPING`, `ARENA_DRIFT`, `IDLE_DRIFT_RAMP`)
  are a first pass and may need adjustment for feel — flagged as a follow-up.
- The simultaneous-double-elimination edge case (both ships cross the boundary in
  the same physics step) has a deterministic tie-break in code (further-out ship
  loses) but was not specifically exercised by an automated test.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually

Open `game/tether-sumo/index.html` directly in a browser (double-click, or
`file://` URL) — no server or build step required. Two players share one
keyboard.

## How to re-run the automated tests

```
node tests/test-tether-sumo.js
```

Requires Playwright (available globally in this environment at
`/opt/node22/lib/node_modules/playwright`) and the pre-installed Chromium at
`/opt/pw-browsers/chromium-1194`. Takes roughly 60–90 seconds (the soak test and
the win-condition test each run for tens of seconds of simulated play).
