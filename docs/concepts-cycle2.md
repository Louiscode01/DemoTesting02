# Cycle 002 — Concept Exploration

Date: 2026-10-14
Phase: research

Prior art (cycle 1, not re-proposed): Orbit Duel, Gravity Flip Runner, Chrono Loop,
Color Bind, Signal Weaver. Cycle 1 follow-ups (Orbit Duel tuning / AI / win-flow test)
were considered as candidate #5 below.

## Candidates

### 1. Slingshot Courier
Single-player aim-and-launch puzzle. Fire a parcel from a launch pad past planets whose
gravity bends its path, to land in the delivery ring. A live dotted trajectory preview
shows only the first part of the path (so planning is still required). Levels are
procedurally generated from a seed, and the generator *proves* each level solvable by
brute-force simulating launches.
- Feasibility: High. 2D N-body-lite physics, no assets, deterministic sim.
- Novelty: Medium-high. Gravity-puzzle with generator-verified solvability and seeded
  daily-style levels.
- Scope: Small-medium; sim core is pure and unit-testable in Node.

### 2. Pheromone Trails
Draw scent paths so an ant colony ferries food while avoiding predators.
- Feasibility: Medium (many-agent steering). Novelty: Medium. Scope: Medium; tuning-heavy.

### 3. Tether Tow
Co-op: two ships joined by an elastic rope tow cargo through an asteroid field.
- Feasibility: Medium (rope constraint stability). Novelty: Medium-high. Scope: Medium.
  Needs two players or good AI to be meaningful.

### 4. Echo Garden
Rhythm-ish idle toy: plant tiles that emit patterned pulses; combos grow the garden.
- Feasibility: High. Novelty: Low-medium. Scope: Small, but weak "game" loop.

### 5. Orbit Duel II (evolution of cycle 1)
Add AI opponent, multiple wells, win-flow test.
- Feasibility: High. Novelty: Low (iteration). Scope: Small. Good fallback.

## Evaluation (1-5)

| Concept | Feasibility | Novelty | Scope fit | Testability | Total |
|---|---|---|---|---|---|
| Slingshot Courier | 5 | 4 | 4 | 5 | **18** |
| Pheromone Trails | 3 | 3 | 3 | 2 | 11 |
| Tether Tow | 3 | 4 | 3 | 3 | 13 |
| Echo Garden | 5 | 2 | 5 | 3 | 15 |
| Orbit Duel II | 5 | 2 | 5 | 3 | 15 |

## Selection: Slingshot Courier
Highest total; uniquely lets us close cycle 1's biggest gap (end-to-end win-condition
testing) because the sim is deterministic and headless-testable. Fallback: Orbit Duel II.
