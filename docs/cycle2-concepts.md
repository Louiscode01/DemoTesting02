# Cycle 002 — Concept Exploration

Date: 2026-10-13
Phase: research
Prior art (not re-proposed): Orbit Duel, Gravity Flip Runner, Color Bind, Signal Weaver, Chrono Loop.

## Candidates

### 1. Lantern Flock (boids shepherd)
Single-player. Guide a flock of glowing fireflies (boids: separation/alignment/cohesion)
through a dark cave to an exit using a lantern that attracts them; hazards (shadow
wisps) devour stragglers. Score = fireflies saved.
- Feasibility 5 (boids is ~40 lines, canvas only) | Novelty 4 (indirect control) | Scope 5

### 2. Orbit Duel Solo (evolution of Cycle 1)
Add AI opponent + survival waves to Orbit Duel.
- Feasibility 5 | Novelty 2 (iteration) | Scope 5

### 3. Tide Tiles
Grid puzzle where rising/falling water flips tile states; plan routes across a tidal cycle.
- Feasibility 3 (level design + solvability) | Novelty 4 | Scope 3

### 4. Rhythm Rail
Auto-scrolling rail grinder; switch tracks on the beat generated from WebAudio.
- Feasibility 3 (audio sync tuning) | Novelty 3 | Scope 3

### 5. Pheromone Trails
Draw trails for an ant colony to route food home while avoiding rain/predators.
- Feasibility 4 | Novelty 4 | Scope 3 (pathing/balance)

## Evaluation
| Concept | Feas | Novel | Scope | Total |
|---|---|---|---|---|
| **Lantern Flock** | 5 | 4 | 5 | **14** |
| Orbit Duel Solo | 5 | 2 | 5 | 12 |
| Tide Tiles | 3 | 4 | 3 | 10 |
| Rhythm Rail | 3 | 3 | 3 | 9 |
| Pheromone Trails | 4 | 4 | 3 | 11 |

## Selection: Lantern Flock
Best feasibility/novelty balance; emergent flocking gives depth for little code,
single HTML file, no assets. Runner-up: Orbit Duel Solo.
