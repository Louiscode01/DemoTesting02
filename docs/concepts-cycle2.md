# Cycle 002 — Concept Exploration

Date: 2026-09-07
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Prior art from Cycle 1 (docs/concepts.md):
Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver, Orbit Duel (built).
Cycle 1 follow-ups considered: manual playtest tuning, win-condition e2e test, and
"a simple AI opponent or additional modes if [Orbit Duel] is revisited."

## Candidate Concepts

### 1. Tether Sumo
Local 2-player arcade game: two ships are connected by an elastic tether in a small
circular arena. Pulling away from your opponent stretches the tether and stores energy;
releasing (or your opponent releasing) snaps both ships toward each other/apart at high
speed. Goal: fling your opponent off the arena edge while staying on yourself — last
ship standing wins the round (best of 5).
- **Feasibility:** High — 2D vector physics (spring force + damping), circular
  boundary check, no assets, single HTML file. Reuses proven canvas-loop patterns from
  Orbit Duel but a genuinely different force model (spring/tether vs. central gravity).
- **Novelty:** High — elastic-tether "sumo" combat is an underused mechanic in
  lightweight browser prototypes; skill comes from timing releases, not aiming.
- **Scope:** Small-medium, cleanly boundable to a single HTML file in one session.

### 2. Comet Sweep
Single-player one-button endless arcade game: a small planet at the bottom of the
screen is bombarded by falling comets; the player taps/holds to fire a rotating
deflector shield that must be angled (via hold-duration or mouse position) to knock
comets away before they hit the planet. Score = comets survived; difficulty ramps over
time.
- **Feasibility:** High — single active entity + spawner + simple collision.
- **Novelty:** Medium — closer to established "defend the base" arcade lineage.
- **Scope:** Small; very low implementation risk, good fallback.

### 3. Orbit Duel: Rival AI (evolution)
Direct evolution of Cycle 1's Orbit Duel: add a selectable single-player mode where
Player 2 is replaced by a lightweight AI pilot (simple heuristic: orbit-match, fire
when aligned, retreat when low "health"/near-death). Also closes the Cycle 1 follow-up
of an automated win-condition + restart end-to-end test.
- **Feasibility:** High — reuses existing, tested physics/render code; only adds an
  input-driver abstraction and an AI decision function.
- **Novelty:** Low-Medium — mechanically identical to Cycle 1's game; novelty is only
  in the AI addition and solo-playability.
- **Scope:** Small — but explicitly *not* a new prototype, more a patch to an existing
  one, which is a weaker fit for "produce a new lightweight prototype this cycle."

### 4. Signal Weaver: Timed Boards (evolution)
Evolution of Cycle 1's Signal Weaver concept: grid puzzle connecting power nodes to a
source within a limited number of wire pieces, but now with procedurally generated
boards *pre-validated for solvability* via a simple flood-fill/backtracking solver run
at generation time, plus a countdown timer per board for arcade pressure.
- **Feasibility:** Medium — procedural generation + solvability checking is the main
  risk; needs a correct-by-construction generator (build a solved path first, then
  scramble/add pieces) to stay low-risk within one session.
- **Novelty:** Medium.
- **Scope:** Medium — solver correctness is the main scope risk.

### 5. Pulse Grid
Rhythm-memory puzzle: a grid of nodes flashes a spreading "pulse" pattern outward from
a source; the player must tap the nodes in the exact order/timing the pulse visited
them, with the pattern growing longer and faster each round (Simon-says crossed with
a physical wave-propagation visual).
- **Feasibility:** High — grid state machine + input matching, no physics needed.
- **Novelty:** Low-Medium — memory-sequence games are a well-worn genre, though the
  wave-propagation visualization is a nice differentiator.
- **Scope:** Small.

## Evaluation

| Concept | Feasibility (1 session) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Tether Sumo** | **5** | **5** | **5** | **15** |
| Comet Sweep | 5 | 3 | 5 | 13 |
| Orbit Duel: Rival AI | 5 | 2 | 4 | 11 |
| Signal Weaver: Timed Boards | 3 | 3 | 3 | 9 |
| Pulse Grid | 5 | 2 | 5 | 12 |

## Selection: Tether Sumo

Chosen as the best-scoring concept: it delivers a genuinely new prototype (distinct
force model and win condition from Cycle 1's Orbit Duel, not a patch to it), is fully
feasible as a single self-contained HTML5 canvas file with zero external
dependencies, and directly reuses proven engineering patterns (fixed-timestep loop,
canvas rendering, local 2-player keyboard input) validated in Cycle 1 to keep
implementation risk low.

Runner-up: Comet Sweep (safest single-player fallback if Tether Sumo's spring-physics
tuning proves too time-consuming to make fun within the session budget).

Deferred (not this cycle, tracked for future consideration): Orbit Duel: Rival AI and
the Cycle 1 follow-ups (manual playtest, win-condition e2e test) remain valuable but
are incremental patches to an existing prototype rather than new exploration — good
candidates if a future cycle is explicitly scoped as a "polish/iterate" cycle rather
than "produce a new prototype."
