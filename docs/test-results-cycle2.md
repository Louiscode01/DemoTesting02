# Cycle 2 Test Results — Tether Swing (2026-11-10)

Run: `node tests/tether-swing.test.js` (Playwright, headless Chromium). **PASS**.

Covered: loads with no console/page errors; title state; deterministic peg generation by seed; Space grapples/releases; scripted bot climbs (score 13 on seed 7); lava death -> game over; Space restarts.
Exploratory (not committed) naive-bot runs over 8 seeds: scores 13–220 (survival 13–46s), showing climbing is feasible.

## Issues found and fixed during testing
- Player hung motionless below first peg and died to lava -> added initial sideways velocity, farther lava start (260).
- Continuous rope reel-in drained swing energy -> removed.
- Pendulum could not gain energy -> added SWING_ASSIST (tangential boost while holding).

## Not covered / follow-ups
- Human playtest for feel/balance (SWING_ASSIST, lava speed, peg spacing).
- Touch/mobile input untested; audio/juice absent; no visual screenshot check.
- Best-score persistence only sanity-guarded, not tested.
