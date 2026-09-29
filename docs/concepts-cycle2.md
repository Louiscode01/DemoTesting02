# Cycle 002 — Concept Exploration
Date: 2026-09-29 | Phase: research

Prior art avoided: Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver (Chrono Loop is evolved, not repeated).

## Candidates
1. **Echo Vault** (evolution of Chrono Loop) — grid puzzle. Each round you record up to N moves; the recording then replays as a ghost while you play the next "loop". Ghosts hold pressure plates so doors stay open for the live you. Deterministic turn-based grid = tiny scope, no physics. Feasibility 5, Novelty 4, Scope 5 = 14.
2. **Tidebound** — top-down boat game where the tide rises/falls on a timer, changing which tiles are water. Feasibility 4, Novelty 3, Scope 3 = 10.
3. **Sparkline Siege** — tower-defence where towers are drawn as freehand strokes; stroke shape sets fire pattern. Feasibility 3, Novelty 5, Scope 2 = 10.
4. **Mirror Maze Golf** — putt a ball through rooms with placeable mirrors/bumpers. Feasibility 4, Novelty 3, Scope 4 = 11.
5. **Lantern Drift** — stealth-light game: carry a lantern whose radius shrinks when moving. Feasibility 4, Novelty 3, Scope 3 = 10.

## Selection
**Echo Vault** — highest score; turn-based determinism makes it fully unit-testable headlessly (unlike Orbit Duel's balance/feel gaps), and the ghost mechanic is distinctive.
Fallback: Mirror Maze Golf.
