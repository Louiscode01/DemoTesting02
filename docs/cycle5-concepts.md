# Cycle 005 — Concept Exploration

Date: 2026-11-17
Phase: research

## Starting point for this cycle

This run again started on the default branch's stale state ("Cycle 1 done"). Following
the `branchNote` in `state.json`, the working branch was fast-forwarded onto
`claude/magical-turing-w4mvue` (Cycles 1–4) before any new work.

User direction recorded on 2026-09-19 still applies: **deepen Orbit Duel and Drift Maze
rather than start brand-new concepts**. Cycle 3 deepened Drift Maze, Cycle 4 deepened
Orbit Duel, so this cycle's candidates lean back toward Drift Maze.

A Sonnet subagent was asked for fresh concepts before the stale state was noticed. Its
five ideas are kept below as a pool only; the evolution candidates were drawn from the
open follow-ups in `state.json`.

## Candidate Concepts

### 1. Drift Maze: Cartographer (evolution)
Rebuild the campaign on measured difficulty instead of hand-authoring. A new analysis
pass walks the full state graph of a level and reports how hard it is to *find* the
route (not only how long the route is): choice bits along the optimal path, the share
of reachable positions that are traps, and whether each special tile is truly necessary.
A curation script uses that to pick a 12-level campaign with a rising curve. Adds a
date-seeded daily puzzle, star ratings and saved bests so there is a reason to replay.
- **Fixes known defects:** campaign levels 7 and 8 are 1- and 2-move levels; par is the
  only difficulty measure; "mechanic required" is only checked on one optimal route.
- **Feasibility:** Very high. **Novelty:** Medium (the metric is the new part).
- **Scope:** Small-medium. Fully testable unattended.

### 2. Orbit Duel: Gauntlet (evolution, runner-up in Cycles 3 and 4)
Solo score attack against waves of gravity-affected drones.
- **Feasibility:** Medium. **Novelty:** Medium. **Scope:** Medium.
- Still depends on feel, and Orbit Duel has had no human playtest yet.

### 3. Orbit Duel: Tactician (evolution)
Replace the AI's reflex well use with a two-simulation rule (does a well turn a miss
into a hit, or a hit into a miss), add difficulty levels, and settle the P1 tick-order
question with a larger seeded sample.
- **Feasibility:** High. **Novelty:** Low. **Scope:** Small.
- Worth doing, but Orbit Duel was last cycle's subject and the change is invisible
  without playing against the AI.

### 4. Tidewright (fresh)
Aim a lighthouse beam to steer AI ships past rocks; beam width trades against range.
- **Feasibility:** 4. **Novelty:** 4. **Scope:** 5. Against user direction.

### 5. Parity Dash (fresh)
Grid trail game where pickups append instructions that a delayed second agent replays.
- **Feasibility:** 5. **Novelty:** 3. **Scope:** 5. Against user direction.

Also returned by research and set aside: Echo Smith (ghost-layering survival; ghost
replay has been built many times on unmerged branches), Silt & Spore (cellular-automaton
fungus gardening), Slingweave (rope-wrap combat; physics risk too high for one session).

## Evaluation

| Concept | Feasibility | Novelty | Scope fit | Testable unattended | Fits user direction | Total |
|---|---|---|---|---|---|---|
| **Drift Maze: Cartographer** | 5 | 3 | 5 | 5 | 5 | **23** |
| Orbit Duel: Gauntlet | 3 | 3 | 3 | 3 | 5 | 17 |
| Orbit Duel: Tactician | 4 | 2 | 5 | 4 | 5 | 20 |
| Tidewright | 4 | 4 | 5 | 4 | 1 | 18 |
| Parity Dash | 5 | 3 | 5 | 5 | 1 | 19 |

## Selection: Drift Maze: Cartographer

It closes the two oldest Drift Maze follow-ups (weak campaign levels, par as the only
difficulty measure), alternates attention back to Drift Maze after an Orbit Duel cycle,
and everything in it can be verified by the solver without a human playtester.

Runner-up: Orbit Duel: Tactician.
