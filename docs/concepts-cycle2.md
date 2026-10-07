# Cycle 002 — Concept Exploration

Date: 2026-10-07
Phase: research

Prior art (cycle 1, not re-proposed verbatim): Orbit Duel, Gravity Flip Runner,
Chrono Loop, Color Bind, Signal Weaver.

## Candidates

### 1. Echo Vault (sonar stealth maze)
Top-down procedurally generated maze, drawn in darkness. The player emits sonar pings
that briefly reveal nearby walls, but pings also alert patrolling guards, who investigate
the ping origin. Reach the exit, with a limited number of pings per level.
- Feasibility: High (grid maze via DFS, simple guard AI, canvas fade-out reveal).
- Novelty: Medium-high (information-vs-risk tradeoff as core verb).
- Scope: Small, single HTML file.

### 2. Orbit Duel: Solo (evolution of cycle 1)
Add AI opponent and wave mode to Orbit Duel.
- Feasibility: High. Novelty: Low-medium (iteration, not new). Scope: Small.

### 3. Tether Swing
Physics grappling-rope platformer; swing between anchors to cross gaps.
- Feasibility: Medium (rope constraint tuning). Novelty: Medium. Scope: Medium.

### 4. Ghost Relay (reduced Chrono Loop)
Record a run, ghost replays while you act as second actor to hold switches.
- Feasibility: Medium. Novelty: High. Scope: Medium (level design burden).

### 5. Tide Garden
Idle/puzzle: rearrange tiles so water flow reaches plants; flow simulation.
- Feasibility: Medium. Novelty: Medium. Scope: Medium.

## Evaluation (1-5, higher better)

| Concept | Feasibility | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Echo Vault** | 5 | 4 | 5 | **14** |
| Orbit Duel: Solo | 5 | 2 | 5 | 12 |
| Tether Swing | 3 | 3 | 3 | 9 |
| Ghost Relay | 3 | 5 | 3 | 11 |
| Tide Garden | 3 | 3 | 3 | 9 |

## Selection: Echo Vault
Best novelty-per-implementation-cost; single file, no assets, procedural content means
no level-design burden. Runner-up: Orbit Duel: Solo.
