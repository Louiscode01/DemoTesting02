# Cycle 002 — Concept Exploration

Date: 2026-09-02
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Concepts below are new for Cycle 2 — none
repeat Cycle 1's candidates (Orbit Duel, Gravity Flip Runner, Chrono Loop, Color Bind,
Signal Weaver) verbatim; see `docs/concepts.md` for that prior art.

## Candidate Concepts

### 1. Echo Maze
Top-down stealth-exploration game. The player is effectively blind in a dark maze;
pressing a "ping" key emits a sound pulse that reveals nearby open passages (via a
depth-limited flood fill through non-wall cells) and briefly lights up anything —
including patrolling guards — within pulse range. Previously-pinged passages stay
dimly remembered on a fog-of-war map, but guards are only visible while actively lit by
a fresh pulse, so the player must ping strategically (cooldown-limited) to track patrol
patterns and thread through them to the exit without colliding with one.
- **Feasibility:** High — grid-based logic (BFS flood fill, waypoint patrol AI, circle/
  cell collision), no external physics library needed, single canvas file.
- **Novelty:** High — the "sound reveals the world, not just distance" fog-of-war
  mechanic is distinctive for a lightweight browser prototype and creates real
  risk/reward tension (ping often = safe but reveals your position pattern to plan
  around; ping rarely = you're navigating blind).
- **Scope:** Small-medium — one hand-authored maze, 2–3 guards, ping/fog/patrol/exit
  systems, cleanly boundable to a single HTML file.

### 2. Tide Pool
Idle/simulation hybrid. The player seeds a small tidal-pool grid with a handful of
creature types (algae, snails, crabs) that follow simple predator/prey/grazing rules
each tick (a lightweight cellular automaton). The goal is to reach a stable,
biodiverse pool (all species present in a target population band) before a fixed
number of tide cycles elapses, rebalancing by adding/removing creatures between ticks.
- **Feasibility:** Medium — CA rule tuning to reach a *stable, non-trivial* equilibrium
  reliably (not everything dying out or one species dominating) is the main risk and
  hard to guarantee without extensive tuning time.
- **Novelty:** Medium-high — ecosystem-balancing-as-a-puzzle is underused in tiny
  prototypes.
- **Scope:** Medium — CA engine + balance tuning is the riskiest budget item here.

### 3. Rune Duel
Local 2-player turn-based card duel. Each round both players simultaneously draft one
rune from a shared face-up row of 3 (attack/shield/heal/combo effects), then effects
resolve in a fixed priority order; first to reduce the opponent to 0 HP wins. Simple
combo bonuses reward drafting complementary runes across rounds.
- **Feasibility:** High — no physics or rendering complexity, just turn/state-machine
  logic and a small effect-resolution table; easy to reason about and test
  deterministically.
- **Novelty:** Low-medium — simultaneous-draft dueling card games are a known genre,
  though the shared-row-of-3 draft (vs. private hands) is a smaller, tighter variant.
- **Scope:** Small — well-bounded rules, minimal rendering (text/cards, no physics).

### 4. Pulse Runner
Endless side-scrolling runner (evolution of Cycle 1's rejected "Gravity Flip Runner"
idea) with a rhythm twist: obstacles spawn in sync with a background beat, and
jump/dash inputs executed within a tight window around each beat land as "perfect"
for a score multiplier and a short speed-boost, while off-beat inputs still work but
score less — rewarding rhythm mastery on top of raw reaction.
- **Feasibility:** High — reuses simple single-axis runner physics, adds one beat-timer
  system for scoring/spawn-sync.
- **Novelty:** Medium — rhythm-runner hybrids exist but are less common than plain
  runners; the on-beat scoring layer is a meaningful differentiator from Cycle 1's
  rejected plain-runner concept.
- **Scope:** Small — safe MVP, similar risk profile to Cycle 1's Gravity Flip Runner
  but with one added, well-contained system (beat timer).

### 5. Ink Bloom
Local 1-vs-AI territory-control game on a grid canvas. Both the player and a simple AI
drop "bloom" seeds that flood-fill outward into unclaimed cells over time at a fixed
rate; overlapping fronts contest cells (faster/fresher bloom wins the cell). Player
places a limited number of seeds per match; whoever controls more territory when seeds
run out and blooms stop spreading wins.
- **Feasibility:** Medium — flood-fill-with-contested-fronts and a simple AI seed-
  placement heuristic (e.g. greedy largest-open-region) both need care to feel fair.
- **Novelty:** Medium — territory-flood-fill dueling has some prior art (Splatoon-likes,
  Paper.io) but a turn-limited seed-placement variant in a tiny browser prototype is a
  reasonable differentiator.
- **Scope:** Medium — AI heuristic + contested flood-fill rendering is more moving
  parts than the other candidates.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Echo Maze** | **5** | **5** | **5** | **15** |
| Tide Pool | 3 | 4 | 3 | 10 |
| Rune Duel | 5 | 2 | 5 | 12 |
| Pulse Runner | 5 | 3 | 5 | 13 |
| Ink Bloom | 3 | 4 | 3 | 10 |

## Selection: Echo Maze

Chosen for the best overall balance: it is fully feasible within a single implementation
pass (grid logic + BFS flood fill + simple waypoint AI, no external physics/assets/
build step, one HTML file), the mechanic (sound-reveals-the-world fog-of-war paired
with only-briefly-visible guards) is the most novel and distinctive of the five
candidates relative to its implementation cost, and the scope is cleanly bounded — one
hand-authored, guaranteed-solvable maze, a small fixed guard count, and four small
well-separated systems (fog/ping, movement, patrol AI, win/lose detection).

Runner-up: Pulse Runner (safest fallback — reuses well-understood runner physics from
Cycle 1's evaluation, lowest implementation risk if Echo Maze's fog/AI interplay proves
too time-consuming to get right).
