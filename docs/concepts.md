# Cycle 001 — Concept Exploration

Date: 2026-08-31
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation.

## Candidate Concepts

### 1. Gravity Flip Runner
Endless side-scrolling runner. Player flips gravity (top/bottom of the screen) to dodge
procedurally spawned obstacles. Score = distance survived.
- **Feasibility:** High — single-axis physics, simple obstacle spawner.
- **Novelty:** Low — well-worn genre (Flappy Bird-adjacent).
- **Scope:** Small, safe MVP.

### 2. Chrono Loop
Puzzle-platformer where the player records a short run, then a "ghost" replays that
exact run while the player controls a second character simultaneously, cooperating with
their own past self to reach switches/exits.
- **Feasibility:** Medium — needs input-recording/playback system and puzzle content.
- **Novelty:** High — time-loop co-op mechanic is distinctive.
- **Scope:** Risk of scope creep (level design, recording edge cases).

### 3. Color Bind
Falling-block matching game: sort color-coded blocks into matching bins before the
stack overflows.
- **Feasibility:** High — simple grid + timer logic.
- **Novelty:** Low — close to existing sorting/match games.
- **Scope:** Small.

### 4. Signal Weaver
Grid puzzle: connect power nodes to a source within a limited number of wire pieces,
procedurally generated boards, increasing difficulty.
- **Feasibility:** Medium — procedural generation + solvability checking adds risk.
- **Novelty:** Medium.
- **Scope:** Medium.

### 5. Orbit Duel
Local 2-player arcade game: two ships fly in a shared arena dominated by a central
gravity well. Thrust, rotate, and fire — both ships *and* bullets are pulled by gravity,
so skilled play means using orbital slingshots and curved shots rather than just aiming
directly. First to 5 kills wins.
- **Feasibility:** High — self-contained 2D vector physics, no assets, no build step.
- **Novelty:** Medium-high — gravity-affected bullets + local competitive play is an
  underused combination in lightweight browser prototypes.
- **Scope:** Small-medium, cleanly boundable to a single HTML file.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| Gravity Flip Runner | 5 | 2 | 5 | 12 |
| Chrono Loop | 3 | 5 | 2 | 10 |
| Color Bind | 5 | 1 | 5 | 11 |
| Signal Weaver | 3 | 3 | 3 | 9 |
| **Orbit Duel** | **5** | **4** | **5** | **14** |

## Selection: Orbit Duel

Chosen for the best balance of technical feasibility (pure vector math, zero external
assets/dependencies, runs from a single `index.html`), the most novelty relative to its
implementation cost, and a scope that fits comfortably in one implementation pass:
a single self-contained HTML5 canvas file, two local players, one win condition, no
external assets or build tooling required.

Runner-up: Gravity Flip Runner (safest fallback if Orbit Duel's physics tuning proves
too time-consuming to make fun).
