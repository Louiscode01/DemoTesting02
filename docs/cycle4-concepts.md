# Cycle 004 — Concept Exploration

Date: 2026-11-16
Phase: research

## Starting point for this cycle

The run started on a branch whose `state.json` still said "Cycle 1 done" (the repo
default branch has never received any later work). Following the `branchNote` left by
Cycle 3, this cycle was fast-forwarded onto `claude/magical-turing-54jan5` (Cycles 1–3)
instead of redoing Cycle 2 for the 36th time.

User direction recorded on 2026-09-19 still applies: **deepen Orbit Duel and Drift Maze
rather than start brand-new concepts**. Cycle 3 deepened Drift Maze; Orbit Duel has not
been touched on this lineage since Cycle 1, so candidates lean that way.

Research was run on a smaller model (Sonnet) as a subagent, which returned five fresh
concepts including one Orbit Duel evolution ("Hollow King": placeable gravity wells
versus an AI). Four of those are fresh concepts and are listed below only as a pool for
later; they were filtered against the user direction.

Prior art not to re-propose verbatim: everything in `cycle1-concepts.md`,
`cycle2-concepts.md`, `cycle3-concepts.md`.

## Candidate Concepts

### 1. Orbit Duel: Wellwright (evolution)
Single-player duel against the Rival AI where each ship carries a small stock of
deployable **micro-wells**: temporary gravity sources dropped at the ship's position.
Wells bend every bullet and ship nearby, so they work as shields (curve incoming fire
away), as traps, and as slingshots for curved shots.
- **Reuse:** takes the Rival AI already built on unmerged branch
  `claude/magical-turing-560d4n` instead of writing a third AI. Its aim search
  forward-simulates through `gravityAccel()`, so once wells feed that function the AI
  accounts for them automatically.
- **Feasibility:** High. One new entity type, one extra term in the gravity sum.
- **Novelty:** Medium-high. Player-authored gravity changes what the arena *is* mid-round.
- **Scope:** Small-medium.
- **Testability:** Adds a seeded, fixed-step headless mode so AI-vs-AI matches can be
  run in bulk. That gives measured balance data (match length, star deaths, win split),
  the closest unattended substitute for the human playtest flagged since Cycle 1.

### 2. Orbit Duel: Gauntlet (evolution, Cycle 3 runner-up)
Solo score attack against waves of gravity-affected drones.
- **Feasibility:** Medium. **Novelty:** Medium. **Scope:** Medium.
- Balance is the whole game here and still has no playtest behind it.

### 3. Drift Maze: Curated Campaign (evolution)
Replace the weak hand-authored levels (7 and 8 are 1- and 2-move levels) with levels
picked from the Cycle 3 generator by solver-measured par, plus a shareable seed link.
- **Feasibility:** Very high. **Novelty:** Low. **Scope:** Small.
- Good value but thin for a whole cycle; kept as a follow-up.

### 4. Echo Moth (fresh)
Sonar stealth in a dark procedural cave: pings reveal walls but attract hunters.
- **Feasibility:** High. **Novelty:** High. **Scope:** Medium.
- Against user direction, and sonar/echo ideas were already built several times on
  unmerged branches (Echo Vault, Echo Cavern, Echo Maze).

### 5. Lantern Brood (fresh)
Herd a firefly flock with a lantern whose brightness trades control for danger.
- **Feasibility:** High. **Novelty:** High. **Scope:** Small-medium.
- Against user direction; a near-identical Lantern Flock exists on an unmerged branch.

Also returned by research and set aside: Tidewright (tide/sand defence), Braidfield
(rope-flail survival; physics risk too high for one session).

## Evaluation

| Concept | Feasibility | Novelty | Scope fit | Testable unattended | Fits user direction | Total |
|---|---|---|---|---|---|---|
| **Orbit Duel: Wellwright** | 5 | 4 | 4 | 5 | 5 | **23** |
| Orbit Duel: Gauntlet | 3 | 3 | 3 | 3 | 5 | 17 |
| Drift Maze: Curated Campaign | 5 | 2 | 5 | 5 | 5 | 22 |
| Echo Moth | 4 | 4 | 4 | 4 | 1 | 17 |
| Lantern Brood | 4 | 4 | 5 | 3 | 1 | 17 |

## Selection: Orbit Duel: Wellwright

It is the only candidate that adds a genuinely new mechanic while following the
"deepen" direction, it consumes existing unmerged work rather than duplicating it, and
its headless AI-vs-AI harness finally produces balance numbers for Orbit Duel.

Runner-up: Drift Maze: Curated Campaign (small, safe; a good filler for a short cycle).
