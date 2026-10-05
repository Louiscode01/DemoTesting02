# Cycle 002 — Concept Exploration

Date: 2026-10-05
Phase: research

Prior art (cycle 1, not re-proposed): Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop.

## Candidates

1. **Tether Swing** — Single-player physics swinger. A rope-hook latches onto the nearest
   anchor above you; swing, release to fling, chain anchors across a procedurally generated
   cavern while a rising tide chases you. Score = distance. Feasibility: high (verlet/pendulum
   constraint). Novelty: medium-high (momentum-conservation "feel" game). Scope: small.
2. **Orbit Duel: Solo** — Evolution of cycle 1: AI opponent + survival waves. Feasibility high,
   novelty low (re-use), addresses follow-up list.
3. **Lantern Drift** — Light-radius stealth: shrinking lantern reveals the map; guards only see
   in light. Feasibility medium (visibility/fog maths), scope medium.
4. **Pulse Garden** — Rhythm tower-defence on a beat grid. Feasibility medium (audio timing), scope medium.
5. **Slide Tiles Heist** — Sokoban-like ice-sliding puzzle with procedural levels. Feasibility
   medium (solvability checker), novelty low-medium.

## Evaluation (1–5)

| Concept | Feasibility | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Tether Swing** | 5 | 4 | 5 | **14** |
| Orbit Duel: Solo | 5 | 2 | 5 | 12 |
| Lantern Drift | 3 | 4 | 3 | 10 |
| Pulse Garden | 3 | 3 | 3 | 9 |
| Slide Tiles Heist | 3 | 3 | 3 | 9 |

## Selection: Tether Swing
Best feasibility/novelty balance; pure 2D physics, single HTML file, no assets, no build step.
Runner-up: Orbit Duel: Solo.
