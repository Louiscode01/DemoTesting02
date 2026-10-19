# Cycle 002 — Concept Exploration

Date: 2026-10-19 | Phase: research

Prior art (cycle 1): Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop.
Follow-ups from cycle 1 (balance tuning, AI opponent) need human playtesting, so cycle 2 explores a fresh concept.

## Candidates
1. **Echo Heist** — evolution of Chrono Loop, scoped down: top-down room puzzles. Each loop you record a run; past runs replay as "echoes" that hold pressure plates so doors open for the current you. 3 hand-built levels. Feasibility 5, novelty 4, scope 4 (=13).
2. **Tide Tiles** — grid puzzle where the water level cycles; push crates to bridge gaps. F4 N3 S3 (=10).
3. **Sonar Sneak** — stealth in darkness, reveal map with limited sonar pings; guards react to pings. F4 N4 S3 (=11).
4. **Rhythm Rampart** — tower defense where towers fire only on the beat. F3 N3 S3 (=9).
5. **Swarm Shepherd** — steer a flock with a cursor lure to herd it through hazards (boids). F4 N4 S3 (=11).

## Selection: Echo Heist
Highest score. Determinism is easy (record positions per tick), the whole game is one HTML file with no assets,
and the core mechanic (cooperate with your past self) is novel relative to cycle 1. Runner-up: Swarm Shepherd.
Scope cut: no ghost collision, no death, 3 levels, max 3 echoes.
