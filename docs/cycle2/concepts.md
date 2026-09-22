# Cycle 002 — Concept Exploration

Date: 2026-09-22
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one focused session under a strict usage budget, then select one for design +
implementation. Per Cycle 1's `resumeInstructions`, prior concepts (Gravity Flip Runner,
Chrono Loop, Color Bind, Signal Weaver, Orbit Duel) are not re-proposed verbatim; a
genuine evolution of one is allowed as a candidate.

## Candidate Concepts

### 1. Orbit Duel: AI Rival (evolution of Cycle 1's Orbit Duel)
Adds a single-player mode against a scripted AI ship (predicts star gravity, orbits for
slingshot shots, retreats at low health) to the existing local-2-player game. Directly
addresses two Cycle 1 follow-ups: gives a solo-playable mode and forces a scripted,
deterministic opponent that makes the win condition exercisable by an automated test
(script the AI to always win/lose to check both branches).
- **Feasibility:** High — physics/rendering are already built and tested; only need
  input-generation logic for the second ship.
- **Novelty:** Low-medium — extends existing work rather than exploring new design space.
- **Scope:** Small (one new subsystem in an existing file).

### 2. Photon Reflect
Grid-based laser puzzle. Rotate mirror/splitter tiles so a fixed light source's beam
hits all target cells within a limited number of tile placements. Procedurally generated
boards with a solvability check (simulate the beam from the generated solution before
presenting the puzzle).
- **Feasibility:** High — deterministic grid logic, no physics engine, canvas is just a
  grid renderer.
- **Novelty:** Medium — laser-reflection puzzles exist, but combining splitters +
  a move-limit + generated (not hand-authored) levels is a reasonable fresh angle.
- **Scope:** Small-medium. Core risk is the level generator/solver, not the game itself.
- **Testability:** High — pure deterministic state transitions are trivial to unit-test
  exhaustively (every rotation, every win/lose path), unlike Cycle 1's real-time physics
  game where the win condition needed precision-scripted input and was flagged as an
  automated-testing gap.

### 3. Word Drift
Letters drift downward across several lanes; the player types words that appear on
screen to clear the matching letters before they reach the bottom. Speed ramps with
score.
- **Feasibility:** High — text/DOM-driven, minimal math.
- **Novelty:** Low — typing-game genre is well-worn.
- **Scope:** Small.

### 4. Echo Maze
Top-down maze explored in near-total darkness. Pressing a key emits a sound pulse that
briefly reveals nearby walls (rendered as an expanding ring) and also alerts any enemy
within range, which then paths toward the player's last-known position. Reach the exit
without being caught.
- **Feasibility:** Medium — needs maze generation, a lit "reveal" render pass, and
  simple enemy pathfinding (BFS on a grid is enough).
- **Novelty:** Medium-high — turning the player's only sensing tool into the thing that
  also endangers them is a distinctive risk/reward loop for a small prototype.
- **Scope:** Medium — pathfinding + fog-of-war rendering is more moving parts than the
  other candidates.

### 5. Stack Defense
Minimal tower-defense: enemies walk a fixed path across a small grid; the player spends
earned currency to place defenders in adjacent cells between waves. A handful of enemy
and defender types.
- **Feasibility:** Medium — wave/economy balancing and pathing along a fixed route are
  straightforward, but there are more tunable systems (currency, wave curve, unit
  stats) than a one-session budget comfortably covers to a polished state.
- **Novelty:** Low — extremely well-worn genre.
- **Scope:** Medium-large for a genuinely satisfying loop; easy to ship a shallow,
  unbalanced-feeling MVP instead.

## Evaluation

| Concept | Feasibility (1 session) | Novelty | Scope fit | Testability | Total |
|---|---|---|---|---|---|
| Orbit Duel: AI Rival | 5 | 2 | 5 | 4 | 16 |
| **Photon Reflect** | **5** | **3** | **5** | **5** | **18** |
| Word Drift | 5 | 1 | 5 | 3 | 14 |
| Echo Maze | 3 | 4 | 3 | 3 | 13 |
| Stack Defense | 3 | 1 | 2 | 3 | 9 |

Scoring: 1 (worst) – 5 (best) per column, unweighted sum. Testability was added this
cycle (weighted equally with the others) specifically because Cycle 1's retrospective
flagged win-condition end-to-end testing as a gap for a real-time physics game; picking
a concept with deterministic, easily-scriptable state is a direct mitigation.

## Selection: Photon Reflect

Chosen for the strongest combination of feasibility, scope fit, and — decisively —
testability: a deterministic grid-logic puzzle can have its full win/lose/generation
logic exercised by automated tests within this same session, closing the exact gap
Cycle 1 left open (manual/human playtesting required to confirm the win condition).
It is also a genuinely new design space rather than an Orbit Duel variant, satisfying
the "avoid re-proposing prior concepts verbatim" guidance while still being buildable
as a single self-contained HTML file with no external assets or build step.

Runner-up: Orbit Duel: AI Rival — kept as a strong candidate for a future cycle
(addresses the "AI opponent" follow-up directly) if Photon Reflect's generator/solver
proves harder to tune than expected.
