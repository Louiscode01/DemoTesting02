# Cycle 002 — Concept Exploration

Date: 2026-11-09 · Phase: research

Prior art avoided: Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver (cycle 1). Chrono Loop was
scored in cycle 1 as high-novelty but scope-risky; cycle 2 revisits it as a *turn-based, grid* evolution
that removes the main risk (real-time recording edge cases).

| # | Concept | Feasibility | Novelty | Scope fit | Total |
|---|---|---|---|---|---|
| 1 | **Echo Steps** — turn-based grid puzzle; each finished loop becomes a deterministic ghost that stands on plates to open doors for the next loop | 5 | 4 | 5 | 14 |
| 2 | Tide Tiles — flood-fill puzzle where water level rises each move, push blocks to build dams | 4 | 3 | 3 | 10 |
| 3 | Pulse Garden — rhythm-based plant growth on a grid, beat-synced input | 3 | 3 | 3 | 9 |
| 4 | Orbit Duel Solo — single-player + AI for cycle-1 game (follow-up) | 3 | 2 | 4 | 9 |

## Selection: Echo Steps
Deterministic (ghosts replay recorded positions, not inputs), so there is no desync risk and the game
is fully testable headlessly by scripting moves. Pure logic separated from rendering; single HTML file,
no assets, no build step. Runner-up: Orbit Duel Solo.
