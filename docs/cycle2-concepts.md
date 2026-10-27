# Cycle 002 — Concept Exploration

Date: 2026-10-27 · Phase: research

Prior art (cycle 1, not re-proposed): Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop (as a real-time platformer).

## Candidates
1. **Echo Vault** — evolution of Chrono Loop, made *turn-based on a grid*. Each loop you record moves; earlier loops replay as ghosts that hold pressure plates for your next self. Deterministic, so state = pure function of move lists. Feasibility 5, novelty 4, scope 5.
2. **Tidal Tiles** — grid puzzle where a rising/falling tide flips which tiles are walkable on a timer. F4 / N3 / S4.
3. **Tether Pair** — control two blobs joined by an elastic rope in physics mazes. F3 / N3 / S3 (rope tuning risk).
4. **Mirror Mason** — place mirrors to route a laser to targets; grid + ray casting. F4 / N2 / S4.
5. **Orbit Duel+ (AI opponent)** — add single-player AI to cycle-1 game. F4 / N1 / S5.

| Concept | Feas | Nov | Scope | Total |
|---|---|---|---|---|
| **Echo Vault** | 5 | 4 | 5 | **14** |
| Tidal Tiles | 4 | 3 | 4 | 11 |
| Tether Pair | 3 | 3 | 3 | 9 |
| Mirror Mason | 4 | 2 | 4 | 10 |
| Orbit Duel+ | 4 | 1 | 5 | 10 |

## Selection: Echo Vault
Turning Chrono Loop turn-based removes its main risks (real-time recording edge cases, platformer physics) while keeping the distinctive "cooperate with your past self" hook. Runner-up: Tidal Tiles.
