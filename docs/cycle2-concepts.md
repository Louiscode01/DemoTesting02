# Cycle 002 — Concept Exploration

Date: 2026-11-03 · Phase: research
Constraint: avoid re-proposing cycle-1 concepts verbatim (Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop as written). A genuine evolution is fine.

## Candidates

1. **Echo Loop** (evolution of Chrono Loop, deliberately de-scoped) — Turn-based grid puzzle. Each loop you get T turns; when the loop ends your path becomes a *ghost* that replays forever, standing on plates to hold doors open for your next self. Deterministic, discrete, hand-authored levels → small and testable.
2. **Tidebound** — Rising/falling water level on a tile map; the player toggles sluice gates to float or sink crates. Needs fluid-ish rules; medium risk.
3. **Lantern Keeper** — Stealth with a lantern whose light radius shrinks as you move; enemies only move in light. Needs AI + level content; medium scope.
4. **Pulse Bounce** — One-button rhythm/arcade: a ball bounces between moving paddles, the player times phase shifts. Small but low novelty.
5. **Orbit Duel: Solo** — Add AI + survival mode to cycle 1's game. Safe, but incremental rather than new.

## Scoring (feasibility / novelty / one-week scope fit, 1–5)

| Concept | F | N | S | Total |
|---|---|---|---|---|
| Echo Loop | 5 | 4 | 4 | 13 |
| Tidebound | 3 | 4 | 3 | 10 |
| Lantern Keeper | 3 | 3 | 3 | 9 |
| Pulse Bounce | 5 | 2 | 5 | 12 |
| Orbit Duel: Solo | 4 | 2 | 4 | 10 |

## Selection: Echo Loop
Turn-based determinism removes the recording/playback edge cases that made Chrono Loop risky (positions are recorded per turn, not inputs), logic can live in a dependency-free module that is unit-testable in Node, and level content is a few ASCII maps. Runner-up: Pulse Bounce.
