# Cycle 003 — Concept Exploration

Date: 2026-11-11
Phase: research

## Starting point for this cycle

This cycle resumes from the state on branch `claude/magical-turing-nlpcnj` (Cycle 1
Orbit Duel + Cycle 2 Drift Maze), because that is the only branch carrying the user's
direction of 2026-09-19: **deepen the two existing prototypes rather than start another
brand-new concept**. Candidates are therefore biased toward evolutions, with one fresh
concept kept for comparison.

Prior art not to be re-proposed verbatim (`docs/cycle1-concepts.md`,
`docs/cycle2-concepts.md`): Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver,
Orbit Duel, Stack the Deck, Pulse Runner, Drift Maze, Tidal Push.

### Findings from reviewing the shipped prototypes

Reading the Cycle 2 code before proposing anything turned up three concrete weaknesses
in Drift Maze that shape the candidates below:

1. **Breakable walls are mechanically decorative.** `slide()` clears a `B` tile and
   keeps sliding, so a `B` behaves exactly like floor. Cycle 2's "mechanic is not
   bypassable" check passes only because the optimal path crosses the tile, not because
   the tile changes any decision.
2. **The campaign is very short and very easy.** BFS pars for the 10 hand-authored
   levels are 3, 5, 4, 6, 3, 4, 1, 2, 5, 5 moves. Level 7 is solved by one keypress.
3. **Par is never shown.** Every level ships with `par: null`, so the HUD's par display
   is dead code.

## Candidate Concepts

### 1. Drift Maze: Deep Drift (evolution)
Seeded procedural level generation with an exact solver, giving an endless mode whose
difficulty escalates by tier. Includes making breakable walls a real mechanic (the first
hit stops you and shatters the wall), computed pars, undo, and a solver-backed hint.
- **Feasibility:** High. The grid engine is pure and already Node-testable; generation
  is generate-and-test against the solver.
- **Novelty:** Medium. Procedural ice-slide puzzles with solver-rated difficulty are
  uncommon in small browser prototypes.
- **Scope:** Medium, bounded by reusing the existing engine and renderer.
- **Addresses:** all three findings above plus Cycle 2's "difficulty curve" follow-up
  (difficulty becomes a measured quantity instead of a hand-authored guess).

### 2. Orbit Duel: Rival AI (evolution)
Single-player mode with a heuristic AI pilot, plus the still-missing win-condition test.
- **Feasibility:** Very high.
- **Novelty:** Low.
- **Scope:** Small.
- **Note:** Already implemented twice on unmerged branches
  (`claude/magical-turing-jfrd8s`, `claude/magical-turing-560d4n`). Building it a third
  time would add nothing; merging one of those is the cheaper route.

### 3. Drift Maze: Level Pack II (evolution)
Thirty more hand-authored levels with new tile types (keys and doors, pushable crates).
- **Feasibility:** Medium. Hand-authoring good slide puzzles unattended is slow, and
  Cycle 2 already had to fix bypassable levels.
- **Novelty:** Low-medium.
- **Scope:** Medium-large; content quantity is the risk.

### 4. Orbit Duel: Gauntlet (evolution)
Solo score-attack: survive waves of gravity-affected drones around the star.
- **Feasibility:** Medium. Balance needs a human playtest, which Cycle 1 already flagged
  as missing for the base game.
- **Novelty:** Medium.
- **Scope:** Medium.

### 5. Ricochet Relay (fresh, for comparison)
Aim-and-bounce puzzle: one shot must touch every relay node, with limited bounces.
- **Feasibility:** Medium-high.
- **Novelty:** Medium.
- **Scope:** Medium.
- **Note:** Overlaps with mirror/reflection puzzles built on other unmerged branches
  (Photon Reflect, Prism Path) and runs against the user's "deepen, not new" direction.

## Evaluation

| Concept | Feasibility | Novelty | Scope fit | Testable unattended | Fits user direction | Total |
|---|---|---|---|---|---|---|
| **Drift Maze: Deep Drift** | 4 | 3 | 4 | 5 | 5 | **21** |
| Orbit Duel: Rival AI | 5 | 1 | 5 | 4 | 5 | 20 |
| Drift Maze: Level Pack II | 3 | 2 | 2 | 4 | 5 | 16 |
| Orbit Duel: Gauntlet | 3 | 3 | 3 | 2 | 5 | 16 |
| Ricochet Relay | 4 | 3 | 3 | 4 | 1 | 15 |

## Selection: Drift Maze: Deep Drift

It fixes real defects found in the shipped prototype, turns "is the difficulty curve
right?" into something a script can measure, and gives the game replay value without
hand-authoring content. Orbit Duel: Rival AI scores almost as high but already exists
on two unmerged branches, so it is recorded as a merge candidate, not as work to redo.

Runner-up for a future cycle: Orbit Duel: Gauntlet, once a human has playtested the
base game's feel.
