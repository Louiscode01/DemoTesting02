# Orbit Duel: Wellwright — Design & Implementation Plan

Date: 2026-11-16
Phase: design (plan produced by an Opus planning subagent, edited down here)

## Summary
`game/orbit-duel.html` is replaced by the Rival AI version from unmerged branch
`claude/magical-turing-560d4n` (menu, AI pilot, `awardKill` test hook), then extended
with deployable micro-wells and a deterministic headless simulation mode.

## Key finding that shapes the numbers
Star gravity is weak: at most `G / GRAV_MIN_R² = 22000 / 40² = 13.75 px/s²`. A bullet at
340 px/s barely bends. A well must therefore be much heavier than the star to be visible
at all, but must never out-pull a ship's engine.

## Well rules

| Constant | Value | Reason |
|---|---|---|
| `WELL_MASS` | 12 (× star) | Pull at clamp ≈ 204 px/s²: bends a bullet ~0.13 rad at 36 px |
| `WELL_MIN_R` | 36 px | Clamp radius |
| `WELL_LIFE` | 4.0 s | Temporary terrain, not permanent |
| `WELL_ARM_DELAY` | 0.35 s | No pull while fading in; readable, no instant traps |
| `WELL_STOCK_MAX` | 2 | |
| `WELL_RECHARGE` | 6.0 s per charge | |
| `WELL_COOLDOWN` | 1.5 s | |
| Active wells per ship | 1 | At most 2 on screen |

- **Invariant (tested):** well pull at clamp + star pull at clamp < `SHIP_THRUST` (260),
  so any ship can always thrust free.
- Spawns stationary 24 px **behind** the ship so it does not bend the owner's own
  outgoing shots at the muzzle.
- The owner is affected like everyone else. No immunity.
- Wells never kill on contact.
- Drop rejected (stock kept) within 130 px of either spawn point, 70 px of the star, or
  40 px of a screen edge (gravity does not wrap, so edge wells would behave oddly).
- A ship's wells vanish when it dies. Stock is not refilled on respawn (star deaths cost
  no score, so a refill would reward suicide).

## Controls
P1 `S`, P2 `ArrowDown`. Intent becomes `{left, right, thrust, fire, well}`; deploy is
edge-triggered so holding the key does not spam.

## AI changes
- `gravityAccel()` sums armed wells, so the existing aim search accounts for them with
  no further change.
- Deploy rule A (shield): an enemy bullet within 220 px whose straight-line closest
  approach is under 26 px. *Simplified from the plan's two-simulation comparison.*
- Deploy rule B (use it or lose it): engaging, stock full, target in range.
- Star-escape look-ahead integrates through gravity (6 sub-steps) instead of a straight
  line, so a well flinging the ship starward is caught.
- New danger case: inside 60 px of an armed well, thrust directly away.

## Determinism
- Game clock `clock += dt` inside `step()`; all timers (`respawnAt`, `retargetAt`,
  `awardKill`) use it instead of rAF time / `performance.now()`.
- `rng` indirection; `simulate()` swaps in mulberry32. Only AI aim jitter uses it
  (plus a seeded spawn perturbation, since mirror-image spawns with fixed logic would
  otherwise give every seed the same match). Particles are skipped when headless.
- `__orbitDuel.simulate(seed, maxSeconds = 180, opts)` runs both ships as AI
  synchronously at fixed `dt = 1/60` and returns
  `{winner | 'timeout', duration, score, kills: {bullet, bulletBent}, starDeaths,
  wellsDeployed, shotsFired}`; `opts.wells = false` disables wells for a baseline.
  A bullet is "bent" if an armed well ever pulled on it at > 50 px/s².
- `startGame()` now resets `cooldown`, `respawnAt`, `thrusting`, both `ai` states, wells
  and the clock (the old version left these stale, which would strand respawns).

## Rendering / HUD
Well: dark core plus ring in owner colour, radius shrinking with remaining life, 0.3
alpha until armed. Stock shown as pips beside each score.

## Test plan (`scripts/orbit-duel-test.js`, Playwright)
1. Physics: armed well 36 px beside a bullet's path deflects it > 15 px toward the well
   in 1 s; < 3 px without the well.
2. Escape invariant: max well pull + max star pull < `SHIP_THRUST`.
3. Deploy lowers stock; second deploy inside cooldown fails; stock never exceeds max.
4. Drop near a spawn point or the star is rejected, stock unchanged.
5. Well exerts no pull before arming and is removed after its lifetime.
6. Death removes the ship's wells and does not refill stock.
7. `simulate(42)` twice is deep-equal.
8. Different seeds give different outcomes.
9. Existing hooks: page loads with no errors, `awardKill` × 5 reaches game over, R
   restarts, M returns to menu; idle local mode never deploys a well.
10. After `simulate()` the live game is back at the menu and starts cleanly.

Balance report over N seeded matches, with and without wells: P1 win share, timeout
rate, median / p90 duration, star deaths per match, wells per match, share of kills made
by bent bullets, shots per kill.

## Risks
1. Mixed clocks in the inherited code (fixed by the game clock).
2. Gravity ignores screen wrap; zero-distance pull is zero (hence edge exclusion and
   behind-ship spawn).
3. AI-vs-AI matches can stall, since star deaths score nothing; `maxSeconds` and a
   `timeout` result are mandatory.
