# Cycle 002 — Concept Exploration

Date: 2026-09-09
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation.

Prior art (Cycle 1, see `docs/concepts.md`): Gravity Flip Runner, Chrono Loop, Color
Bind, Signal Weaver, and the selected concept **Orbit Duel** (2-player local gravity-well
arena shooter, `game/index.html`). This cycle avoids re-proposing those verbatim and
aims for genre variety against Orbit Duel (a real-time physics arena duel) rather than
another entry in the same niche.

## Candidate Concepts

### 1. Echo Maze
Single-player stealth puzzle. The maze is dark; the player emits sound "pings" (a
short key press) that briefly reveal nearby walls via a radius/line-of-sight reveal.
A patrolling guard is drawn permanently (not hidden) and reacts to pings within its
hearing range. Reach the exit without being caught.
- **Feasibility:** Medium-high — canvas 2D, grid maze + radius reveal, simple patrol AI.
- **Novelty:** Medium-high — echolocation-as-visibility is uncommon in small browser
  prototypes.
- **Scope:** Medium — maze generation + guard AI + fog-of-war reveal timing is more
  moving parts than a single physics system.

### 2. Stack Attack: Tower Duel
Two-player local: each player stacks falling blocks on their own side while spending
limited "wind gust" charges to destabilize the opponent's tower. Tower that topples
(center of mass leaves its base) loses.
- **Feasibility:** Medium — approximating toppling without a full rigid-body physics
  engine (stability heuristic on stacked block centers) is fiddly to get feeling fair.
- **Novelty:** Medium.
- **Scope:** Medium-large — two synchronized stacks, gust timing/cooldown, toppling
  heuristic all need tuning; highest risk of not feeling fun without playtesting.

### 3. Pulse Runner
Endless side-scrolling runner where obstacle spawns are quantized to a generated beat
(Web Audio API oscillator click track). Timing a jump/dash on-beat grants a score
multiplier; off-beat action still works but scores less.
- **Feasibility:** High — runner mechanics are simple; beat-quantized spawning is a
  straightforward timer.
- **Novelty:** Medium — reuses the runner/dodge genre already noted (and passed over)
  in Cycle 1 as "well-worn"; the rhythm layer helps but doesn't fully offset that.
- **Scope:** Small.

### 4. Territory Ink
Two-player local grid game (Tron/Qix/"paper.io"-style territory capture). Each player
owns a home base square of their color and moves continuously on a grid. Leaving your
own territory draws a trail; crossing back into your territory encloses and claims any
neutral cells cut off by the loop (flood-fill). Crossing an opponent's live trail
destroys that trail and costs them a life; crossing your own trail costs you a life.
Lives-based match (3 lives each), first to zero lives loses.
- **Feasibility:** Medium-high — grid movement + BFS flood-fill for enclosed-area
  capture are well-understood, boundable algorithms; no physics tuning required (unlike
  Orbit Duel's continuous vector forces).
- **Novelty:** Medium-high — territory-capture head-to-head is a different genre
  entirely from Orbit Duel's arena shooter, giving the portfolio real variety, and the
  live-trail-cutting mechanic gives it sharper player-vs-player tension than a
  single-player version of the genre would.
- **Scope:** Small-medium, cleanly boundable to a single HTML file: fixed grid, tick-based
  movement, one flood-fill routine, one collision pass per tick.

### 5. Orbit Duel: Rival Mode (iteration candidate)
Per Cycle 1's follow-up backlog: add a simple AI opponent to Orbit Duel (so it's
playable solo) and a "sudden death" variant where the gravity well strengthens over
time. Reuses the existing, tested codebase.
- **Feasibility:** High — builds on a proven, already-tested physics base; only new
  work is AI decision logic and a difficulty-ramp variable.
- **Novelty:** Low as a *new* concept (it's an iteration, not a new game), though it
  does directly address real backlog debt (solo playability, extra mode).
- **Scope:** Small.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| Echo Maze | 4 | 4 | 3 | 11 |
| Stack Attack: Tower Duel | 3 | 3 | 2 | 8 |
| Pulse Runner | 5 | 3 | 5 | 13 |
| **Territory Ink** | **4** | **4** | **4** | **12** |
| Orbit Duel: Rival Mode | 5 | 2 | 5 | 12 |

## Selection: Territory Ink

Pulse Runner scores highest on raw feasibility/scope but its novelty is capped by
reusing the runner/dodge genre this project already flagged as "well-worn" last cycle.
Orbit Duel: Rival Mode is low-risk and clears real backlog debt, but as an iteration
it doesn't fulfill this cycle's "identify new concepts" research goal on its own — it's
logged below as a good candidate for a *future* cycle instead.

**Territory Ink** is selected: it has the best combination of genuine novelty relative
to the existing portfolio (a completely different genre from Orbit Duel — grid
territory-capture instead of continuous-physics arena combat), a well-understood and
boundable core algorithm (tick-based grid movement + BFS flood-fill, no physics
tuning), and a scope that fits one implementation pass as a single self-contained HTML
file with two local players, one win condition, and no external assets or build
tooling.

Runner-up: Pulse Runner (safest fallback if Territory Ink's flood-fill/collision
interactions prove too fiddly to get right in one pass).

Carried forward (not this cycle): Orbit Duel: Rival Mode remains a good candidate for a
future cycle revisiting Orbit Duel's backlog (AI opponent, sudden-death mode, manual
playtest/tuning pass).
