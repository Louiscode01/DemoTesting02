# Drift Maze: Cartographer — Design & Implementation Plan

Date: 2026-11-17
Phase: design

## Goals
1. Measure how hard a level is to solve, not only how long its solution is.
2. Replace the weak hand-authored campaign with levels chosen by that measure.
3. Give the player a reason to return: a daily puzzle, stars, saved bests.

## 1. Difficulty analysis (`game/drift-maze-logic.js`)

`analyzeDifficulty(level)` explores the whole state graph. A state is
(resting cell, set of shattered cracked walls); an edge is a move that acts.

- Forward BFS from the start collects every reachable state and its edges.
- Backward BFS from the exit gives each state its exact distance to the exit.
- Reported values:
  - `par`: distance from the start.
  - `states`: reachable states.
  - `trapStates` / `trapRatio`: reachable states from which the exit can no longer be
    reached (the player must undo or reset).
  - `optimalRoutes`: number of distinct shortest solutions.
  - `bits`: walking one optimal route, the sum of log2(acting moves / moves that stay
    optimal) at each step. This is the information a player needs to stay on a
    shortest route; a corridor scores 0.
  - `score` = `bits + par / 2 + 3 * trapRatio`, rounded to one decimal.

`mechanicNecessity(level)` answers "can this tile type be ignored?" exactly: it rebuilds
the level with that tile type neutralised (cracked walls and gates become solid walls,
pads become floor) and re-solves. A mechanic is necessary when the altered level is
unsolvable or needs more moves. This replaces the old one-route check.

The score is a model, not a measurement of people. It is used to order levels, and the
doc and HUD label it as an estimate.

## 2. Curated campaign (`scripts/curate-campaign.js` → `game/drift-maze-levels.js`)

- The generator exports `buildCandidate` and gains `generateSpec`, so the script can
  describe a slot ("pads only, 8x7, par 4–6") without a new tier.
- 12 slots. Slots 1–3 keep the hand-made tutorials (First Slide, Corridors, Brittle
  Wall). Slots 4–12 are generated:

  | Slot | Mechanics that must be necessary | Par band |
  |---|---|---|
  | 4 | cracked | 6–7 |
  | 5 | gate | 4–6 |
  | 6 | gate | 6–8 |
  | 7 | teleport | 4–6 |
  | 8 | teleport | 6–8 |
  | 9 | cracked + gate | 7–9 |
  | 10 | cracked + gate + teleport | 8–10 |
  | 11 | cracked + gate + teleport | 10–12 |
  | 12 | cracked + gate + teleport | 12–16 |

- For each slot the script draws a fixed number of seeded candidates, keeps those in
  the par band whose required mechanics are all necessary, and picks the one with the
  lowest score that still exceeds the running maximum of earlier *same-family* slots
  (so each mechanic's introduction may dip, then the curve climbs). The final three
  slots must each exceed everything before them.
- The script is deterministic and writes the level file, including each level's
  `source` (slot and candidate index). A test reruns the curation in memory and compares.

## 3. Play features (`game/drift-maze.html`)

- **Daily puzzle**: key `T`, or `?mode=daily` (optionally `&date=YYYYMMDD`). Level is
  `generate(date, Riptide)`, the same for everyone on a UTC date.
- **Stars**: 3 at par, 2 within two moves of par, otherwise 1. A solve that used a hint
  earns at most 1 star.
- **Saved bests**: `localStorage` key `driftMaze.v1` holds best moves and stars per
  campaign level and per daily date, plus the deepest endless depth. All access is
  wrapped so the game works when storage is unavailable.
- **Level select**: `[` and `]` step through campaign levels up to the furthest unlocked.
- **HUD**: shows the estimated difficulty score, best result and star total.

## Testing plan
- `scripts/test-difficulty.js`: hand-built boards with known answers (corridor has 0
  bits; a board with a one-way pocket has the expected trap count; necessity true and
  false cases; distances agree with `solveLevel` on 200 generated boards).
- `scripts/solve-levels.js`: every campaign level solvable, required mechanics
  necessary, no level under par 3, generated slots match a fresh curation run, final
  three scores strictly rising.
- `scripts/browser-test.js`: existing assertions plus daily mode determinism, stars,
  hint penalty, persistence across reload, level select bounds.
- Orbit Duel suite rerun as regression.

## Out of scope
- Human-validated difficulty. Touch controls. Online leaderboards.
