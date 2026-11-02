# Cycle 002 — Concept Exploration

Date: 2026-11-02 | Phase: research

Prior art avoided: Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop (see docs/concepts.md).

## Candidates
1. **Prism Path** — Grid puzzle: rotate mirrors/splitters so a laser hits every target. Levels generated
   by building a valid beam path first, then scrambling mirror rotations (solvable by construction).
   Feasibility 5, Novelty 3, Scope 5.
2. **Tether Swing** — Physics grapple-hook platformer with rope constraints. Feasibility 3 (rope tuning), Novelty 4, Scope 3.
3. **Orbit Duel: Solo** — Add AI opponent/modes to cycle-1 game (follow-up). Feasibility 4, Novelty 2, Scope 4.
4. **Tide Pool Tactics** — Turn-based water-flow tactics on a heightmap. Feasibility 3, Novelty 4, Scope 2.
5. **Echo Sweep** — Stealth game where the player sees only sonar pulses that reflect off walls. Feasibility 4, Novelty 4, Scope 4.

| Concept | Feas | Nov | Scope | Total |
|---|---|---|---|---|
| Prism Path | 5 | 3 | 5 | 13 |
| Tether Swing | 3 | 4 | 3 | 10 |
| Orbit Duel: Solo | 4 | 2 | 4 | 10 |
| Tide Pool Tactics | 3 | 4 | 2 | 9 |
| Echo Sweep | 4 | 4 | 4 | 12 |

## Selection: Prism Path (runner-up: Echo Sweep)
Highest feasibility/scope fit; solvable-by-construction generation removes the main puzzle-game risk;
single HTML file, no assets, and the beam tracer is deterministic and unit-testable headlessly.
