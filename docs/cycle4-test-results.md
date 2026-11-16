# Orbit Duel: Wellwright — Test Results

Date: 2026-11-16
Phase: testing
Method: `node scripts/orbit-duel-test.js 200` (Playwright + headless Chromium against
`game/orbit-duel.html` over `file://`). No human playtest was performed.

## Result: 30 / 30 assertions pass, no console or page errors

| Area | Checks |
|---|---|
| Load / menu / modes | Loads at menu; key 2 starts a match against the AI; stock starts at 2 |
| Well physics | Bullet with no well drifts 0.13 px sideways in 1 s; with an armed well 36 px off its path it is pulled 23.78 px toward the well; bent flag set only for the deflected bullet |
| Arming and lifetime | Pull is exactly star-only before 0.35 s; +203.7 px/s² after arming; well gone after 4.0 s |
| Escape invariant | Well 203.7 + star 13.8 = 217.5 px/s² < thrust 260 |
| Deployment rules | Spends one charge; spawns 24 px behind the ship; refused during cooldown or with a well active; recharges to 2 and never above; rejected near spawn, star and edge with the charge kept |
| Death | Own wells removed, stock not refilled, respawn works on the game clock |
| Keyboard | Idle match deploys nothing; holding S for 2.2 s deploys exactly one well |
| Inherited behaviour | 5 kills ends the match; R restarts with score and stock reset |
| Determinism | `simulate(42)` twice is identical; 10 seeds give 10 distinct outcomes; live game is at the menu afterwards and starts cleanly |
| AI | Uses wells; no timeouts |

Regression: the four Drift Maze suites (`solve-levels`, `test-slide-rules`,
`test-generator`, `browser-test`) were rerun and still pass.

## Balance numbers (AI vs AI, 200 seeded matches per row, 8 s wall time in total)

| | P1 win share | Timeouts | Median match | p90 match | Star deaths / match | Wells / match | Kills by bent bullets | Shots / kill |
|---|---|---|---|---|---|---|---|---|
| With wells | 48.5% | 0% | 56.3 s | 83.6 s | 0.98 | 16.5 | 18.9% | 3.3 |
| Without wells | 55.0% | 0% | 65.2 s | 105.2 s | 2.27 | 0 | 0% | 3.5 |

What these do and do not show:
- Wells change outcomes: about one kill in five involves a bullet a well pulled on, and
  matches are about 9 s shorter at the median.
- Sides are even with wells. The 55% without wells is inside sampling noise for 200
  matches (roughly ±7 points), though P1 is processed first each tick, so a small
  ordering bias is not ruled out.
- Star deaths fall by more than half with wells. The cause was not isolated; the AI's
  burn-away-from-well behaviour keeping ships moving is one candidate.
- These are two copies of one AI. They say nothing about how the mechanic feels to a
  person, or whether a human can exploit the AI.

## Issues found during testing
- The first version of the keyboard test thrust P1 straight from spawn, which flew it
  into the star before the well key was pressed (0 wells). This was a test error, not a
  game bug; the test now positions the ship first.
- Fixed while importing the Rival AI: `startGame()` did not reset `respawnAt`,
  `cooldown`, `thrusting` or P1's AI state, and timers mixed rAF time with
  `performance.now()`. All timers now run on one game clock.

## Known limitations
- The AI spends a charge whenever its stock is full (16.5 wells per match), which is
  more reflex than tactic. Its shield rule uses a straight-line closest-approach
  estimate, not the two-simulation comparison in the original plan.
- A ship that drops a well while stationary is pulled back onto it (the owner is not
  immune). Intended as a trade-off, but untested with people.
- Gravity does not wrap at screen edges; wells are simply barred from the outer 40 px.
- Chromium only.

## How to run
Open `game/orbit-duel.html` in a browser. Press 2 for a match against the AI (W/A/D,
Space to fire, S to drop a well) or 1 for two players on one keyboard.
In the console, `__orbitDuel.simulate(seed)` runs one headless AI-vs-AI match.
