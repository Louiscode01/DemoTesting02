# Cycle 002 — Concept Exploration

Date: 2026-09-16
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation.

Prior art (Cycle 1, see `docs/cycle1-concepts.md`): Gravity Flip Runner, Chrono Loop,
Color Bind, Signal Weaver, Orbit Duel (selected/shipped, see `game/orbit-duel.html`).
This cycle avoids re-proposing those verbatim.

## Candidate Concepts

### 1. Orbit Duel: Rival AI (evolution)
Add a single-player mode to the existing Orbit Duel prototype: a scripted AI pilot that
thrusts/rotates/fires using simple heuristics (aim lead, avoid star, retreat when low on
"health" if that's added). Reuses the existing gravity/ship/bullet code almost entirely.
- **Feasibility:** Very high — builds on tested, working code.
- **Novelty:** Low — incremental feature on a shipped prototype, not a new game.
- **Scope:** Small.
- **Note:** Directly addresses a Cycle 1 follow-up ("consider a simple AI opponent"),
  but produces the least new design/research value of the options considered.

### 2. Stack the Deck
Physics-lite block stacker: blocks fall and land on a growing tower; player nudges the
active block left/right before it locks in place. Tower sways more as it grows taller;
score = height reached before the tower topples past a stability threshold.
- **Feasibility:** Medium — needs a simplified stacking/toppling model (can avoid a full
  physics engine with a "center of mass drift" approximation) but tuning that to feel
  fair is fiddly without a human playtester in the loop.
- **Novelty:** Medium.
- **Scope:** Medium, with real risk of the toppling model feeling unfair or exploitable.

### 3. Pulse Runner
Lane-dodge rhythm game: obstacles spawn in time with a metronome click (Web Audio API
oscillator, no external audio assets); dodging exactly on-beat scores bonus points.
- **Feasibility:** Medium — no external assets needed, but audio-timing sync (avoiding
  drift between the audio clock and `requestAnimationFrame`) is a known trouble spot for
  small prototypes and is hard to verify automatically without a human's ear.
- **Novelty:** Medium-high.
- **Scope:** Medium; timing-correctness risk is the main concern.

### 4. Drift Maze
Grid puzzle in the "ice sliding" family: the player slides in a chosen direction and
keeps moving until hitting a wall or obstacle (no stopping mid-tile), similar to classic
ice-cave puzzles. Goal: reach the marked exit tile. Extra tile types (breakable walls,
one-way gates, teleport pads) raise the ceiling on later levels. Level set is hand
-authored (8–12 levels) rather than procedurally generated, to keep scope bounded and
avoid solvability-checking complexity.
- **Feasibility:** High — pure grid logic, no continuous physics or timing to tune, no
  external assets. Deterministic rules make correctness easy to verify with automated
  simulation (this game genuinely doesn't need a human playtester to confirm each level
  is solvable and reachable — a scripted solver can do it).
- **Novelty:** Medium — the slide-until-blocked mechanic is a known but underused pattern
  in lightweight browser prototypes, and combining it with teleport/one-way tiles gives
  room for a few genuinely tricky levels.
- **Scope:** Small-medium, cleanly boundable to a single HTML file with an in-script
  level-data array.

### 5. Tidal Push
Grid puzzle where pressing a direction slides *every* movable piece (player + crates) on
the board simultaneously one full slide, not just the player. The twist: a "goal crate"
also slides with the tide, so the player must use walls/other crates to stop the goal
crate on the target tile while also positioning themselves to trigger the next move.
- **Feasibility:** Medium — the "everything slides at once" rule multiplies interaction
  cases (crate-crate collisions mid-slide, order-of-resolution edge cases) versus Drift
  Maze's single-actor sliding, raising both implementation and level-design difficulty.
- **Novelty:** Medium-high — distinct from Signal Weaver's wire-connection puzzle and
  from Drift Maze's single-actor sliding.
- **Scope:** Medium, with the highest edge-case risk of the five.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Testability w/o human | Total |
|---|---|---|---|---|---|
| Orbit Duel: Rival AI | 5 | 1 | 5 | 4 | 15 |
| Stack the Deck | 3 | 3 | 3 | 2 | 11 |
| Pulse Runner | 3 | 4 | 3 | 1 | 11 |
| **Drift Maze** | **5** | **3** | **5** | **5** | **18** |
| Tidal Push | 3 | 4 | 3 | 2 | 12 |

(Testability w/o human is weighted deliberately: this agent runs unattended with no
human playtester in the loop this cycle, so a concept whose correctness and fun-critical
balance can be verified by a scripted check rather than "feels right by inspection" is
worth more in practice, not just in principle.)

## Selection: Drift Maze

Chosen over the incremental Orbit Duel AI option (highest score, but the lowest-novelty,
least-new-design-value choice — a good candidate for a *future* cycle if this cycle's
new prototype proves out well) and over Tidal Push (higher novelty ceiling but
meaningfully higher implementation risk for a single unattended session).

Drift Maze is fully deterministic grid logic: no physics tuning, no audio-timing sync,
no continuous-simulation balance concerns. That means level solvability and correct
mechanics can be verified with an automated BFS-based solver script as part of testing,
rather than relying on subjective "does this feel fun" judgment this agent cannot make
reliably alone. It's also cleanly scoped to a single self-contained HTML file, matching
the architecture pattern that worked well in Cycle 1.

Runner-up: Orbit Duel: Rival AI — flagged as a strong candidate for a future cycle,
since it's low-risk and directly answers a Cycle 1 follow-up item.
