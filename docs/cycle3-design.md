# Drift Maze: Deep Drift — Design & Implementation Plan

Date: 2026-11-11
Phase: design (Cycle 3)

## Goal
Deepen the Cycle 2 Drift Maze prototype, per the user's 2026-09-19 direction, by fixing
the three weaknesses found in review (`docs/cycle3-concepts.md`) and adding replay value
through seeded procedural levels.

## Changes

### 1. Cracked walls become a real mechanic (`game/drift-maze-logic.js`)
Before: a `B` tile cleared and the slide carried on, so it behaved like floor.
Now: the wall absorbs the hit. It shatters to floor, and the player stops in front of
it. Breaking a wall costs a move and changes where later slides stop, so wall state is
part of the puzzle. `slide()` gains two result fields: `acted` (moved, or shattered a
wall without moving) and `overflow` (teleport pads feeding each other).

### 2. Exact solver
The Cycle 2 solver searched positions only, sharing one mutated grid. That is no longer
valid once wall state matters. `solveLevel()` is now a BFS over
`(position, bitmask of shattered walls)`, returns the optimal move list and the number
of states explored, and can start from any mid-game grid and position (used for hints).
`analyzeRoute()` replays a route and reports which special tiles it really used.

### 3. Seeded generator (`game/drift-maze-gen.js`, new)
Generate-and-test: for a `(seed, tier)` pair, build 400 random boards from a mulberry32
PRNG, solve each exactly, and keep the best-scoring one. Score rewards an optimal
solution length inside the tier's target band (longer is better inside the band) and
routes that use cracked walls, gates or teleports. The attempt count is fixed, so the
result is a pure function of the seed and identical in Node and the browser.

| Tier | Board | Special tiles | Target par |
|---|---|---|---|
| Breeze | 7-8 x 6-7 | none | 4-6 |
| Current | 8-10 x 7-8 | 1-2 cracked, 0-1 gates | 6-8 |
| Riptide | 10-12 x 8-9 | 1-3 cracked, 1-2 gates, pads 50% | 8-11 |
| Maelstrom | 12-13 x 9-10 | 2-4 cracked, 1-3 gates, pads | 10-16 |

Endless mode plays three levels per tier, then stays on Maelstrom.

### 4. UI (`game/drift-maze.html`)
- Campaign / Endless modes (`M` to switch, `N` for a new run).
- `?mode=endless&seed=N` reproduces a run exactly; the seed is shown in the HUD.
- Par is computed by the solver at level load and always displayed.
- Undo (`U`), restoring position, move count and shattered walls.
- Hint (`H`): draws the solver's best next move from the current position, or reports
  that the position is a dead end.
- Run score: moves over par across cleared levels.
- Tile size scales down so the largest boards fit.

## Testing plan
- `scripts/test-slide-rules.js`: new cracked-wall, solver and teleport-loop cases.
- `scripts/solve-levels.js`: re-validate the 10 campaign levels under the new rule.
- `scripts/test-generator.js` (new): determinism, well-formedness, replay of the stored
  solution, par re-solve, par band and a rising median par per tier, over many seeds.
- `scripts/browser-test.js`: par in HUD, undo, hint, seeded endless run played through
  a tier boundary using the generated solutions.

## Out of scope
- Rebuilding Orbit Duel: Rival AI (exists on unmerged branches; see state.json).
- New tile types, sound, touch controls, saved best scores.
