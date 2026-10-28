# Cycle 002 — Concept Exploration

Date: 2026-10-28 | Phase: research
Prior art avoided: Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop (see concepts.md).

## Candidates
1. **Magnet Mason** — top-down physics puzzle. Place attract/repel magnets, then launch a steel ball
   to the goal without touching hazards. Deterministic sim => levels can be auto-verified solvable.
   Feasibility 5, Novelty 3, Scope 5, Testability 5 = 18
2. **Orbit Duel 2** — add AI opponent + win-condition e2e test (addresses cycle-1 follow-ups).
   Feasibility 4, Novelty 2 (iteration), Scope 4, Testability 3 = 13
3. **Tide Tiles** — grid puzzle where rows shift like tides; match patterns.
   Feasibility 3, Novelty 3, Scope 3, Testability 3 = 12
4. **Echo Sweep** — stealth game using sonar pulses that reveal walls briefly.
   Feasibility 3, Novelty 4, Scope 3, Testability 2 = 12
5. **Sand Scribe** — falling-sand sandbox with goal-based challenges.
   Feasibility 4, Novelty 3, Scope 3, Testability 2 = 12

## Selection: Magnet Mason
Best total; pure deterministic sim in a separate module enables headless solvability search,
which also gives a concrete, automatable quality bar (unlike cycle 1's manual-only balance).
Fallback: Orbit Duel 2.
