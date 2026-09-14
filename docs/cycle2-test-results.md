# Ink Territory — Test Results

Date: 2026-09-14
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium),
run against `game/ink-territory.html` directly via `file://`. No human playtest
was performed (unattended automated run) — see "Known limitations" below.

## Testability fix found & applied during testing

The prototype auto-moves each player forward every tick (Tron/light-cycle style —
matches the design's "always advancing" grid-movement model) on a real-time tick
clock. That made test scripts nondeterministic: real wall-clock time elapses
between Playwright's `page.evaluate()` round-trips, so the game kept advancing
itself between scripted moves, and a fixed script (assume player starts at the
spawn cell, make N moves, assert exact resulting cell) produced different
positions/trail lengths run to run.

Fix: added a `paused` flag with `window.__inkTerritory.setPaused(bool)` /
`.paused`. When paused, the automatic per-frame timer countdown and forward tick
are both skipped, but a manually invoked `tick()` still runs unconditionally —
so tests can drive fully deterministic movement sequences while normal
(unpaused) play is completely unaffected. This is the same category of gap Cycle
1 hit with the stale `bullets` reference, caught the same way: writing the actual
test surfaced it immediately.

## Test suite (8 checks, run via a Playwright script)

All tests below reset to a known board (`api.reset()`) and pause auto-play
(`api.setPaused(true)`) before driving scripted `tick()` sequences, except Test 6
which intentionally unpauses to exercise the real-time round-end path end-to-end.

| # | Test | Result |
|---|---|---|
| 1 | Load smoke test: page loads with zero console/page errors; both players' starting territory = `START_BLOCK²` = 9 tiles each; `gameOver` false. | **PASS** |
| 2 | Movement creates a wet trail once a player steps outside their home block (trail length and `wet` ownership tracked correctly). | **PASS** |
| 3 | Returning home seals the open trail into permanent owned territory (P1's tile count grew from 9 to 13 after a 5-cell loop). | **PASS** |
| 4 | Driving into an opponent's wet trail kills the mover (P2 died, `deaths` incremented) while the trail-owner (P1) was unaffected. | **PASS** |
| 5 | Driving into your *own* wet trail is also fatal (confirms the "any wet trail, including your own" rule, not just enemy trails). | **PASS** |
| 6a | Win-condition end-to-end: forcing `timeRemaining` near 0 (via `setTimeRemaining`) and letting the real render loop cross the threshold triggers `gameOver`, shows the overlay, and picks the `winner` matching the actual tile tally (11 vs 9 → P1). | **PASS** |
| 6b | Restart end-to-end: pressing `R` after game-over resets scores to 9/9, clears `gameOver`, and hides the overlay. | **PASS** |
| — | Zero console/page errors across the entire run. | **PASS** |

**Result: 8/8 PASS.**

This closes the exact gap Cycle 1 flagged in its own follow-ups list ("automated
end-to-end test of the win condition + restart flow") — for the new prototype,
by building the debug hooks needed for it (`setTimeRemaining`, `tick()`,
`setPaused`) into the design from the start rather than retrofitting them.

## Visual smoke check

Loaded the page, let it auto-play briefly, and captured a screenshot. Both
players' starting 3×3 territory blocks render in distinct colors (blue / orange),
and the lighter-shade wet-trail rendering is visually distinguishable from solid
owned territory, confirming the design's rendering split works as intended. The
screenshot also surfaced an easy-to-miss emergent behavior worth noting: since
players auto-advance every tick and the arena wall *blocks* movement rather than
killing the player (a deliberate design choice — see `docs/cycle2-design.md`),
a player who reaches a wall with no player input simply stops there, trail left
open/unsealed indefinitely, until a new direction is given. This is intended
(forgiving wall behavior) but is worth surfacing to a human playtester as
something that may feel odd without a key press.

## Known limitations / not covered by automated tests

- **Fun/balance tuning** was reasoned about, not human-playtested. `TICK_MS`
  (move speed) and `RESPAWN_MS` are a first pass and may need adjustment for
  feel — same category of follow-up Cycle 1 flagged for Orbit Duel's constants.
- **Head-on collision** (both players landing on the same cell in the same tick)
  is implemented per the design but not covered by an automated test in this
  pass — verified by code review only.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually

Open `game/ink-territory.html` directly in a browser (double-click, or `file://`
URL) — no server or build step required. Two players share one keyboard
(P1: WASD, P2: Arrow keys). Press `R` to restart at any time.
