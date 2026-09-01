# Cycle 002 — Concept Exploration

Date: 2026-09-01
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Per Cycle 1's `resumeInstructions`, prior
concepts (Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver, Orbit Duel) are
not re-proposed verbatim; a genuine evolution of one is allowed and considered below
alongside new ideas.

## Candidate Concepts

### 1. Orbit Duel: AI Opponent
Evolution of Cycle 1's Orbit Duel — add a single-player mode where P2 is a simple
steering AI (aims lead/gravity-compensated shots, thrusts toward safe orbits), directly
addressing a Cycle 1 follow-up.
- **Feasibility:** High — reuses tested physics/render code, only adds an AI controller.
- **Novelty:** Low — the underlying game is a rerun; only the AI is new.
- **Scope:** Small, but low incremental value as a "new prototype" for the week.

### 2. Glyph Rush
Single-player reflex/typing arcade: glyphs fall from the top of the screen, player types
the matching key before each one reaches the bottom; speed and spawn rate ramp up,
combo multiplier for consecutive hits, lives lost on misses.
- **Feasibility:** High — simple spawner + input matching, no physics.
- **Novelty:** Low — well-worn typing-game genre.
- **Scope:** Small, safe MVP.

### 3. Tether Tag
Local 2-player arcade: two players share an elastic tether with a fixed maximum length
— once stretched taut it hard-constrains further separation, so escaping or chasing
means swinging around the arena and using the tether's pull rather than moving freely.
One player starts "it"; touching the other transfers the role (with a brief immunity
cooldown to prevent instant tag-back). First to N tags-as-chaser wins.
- **Feasibility:** High — the tether is a simple positional distance constraint (no
  spring/verlet integration needed), tag detection is a circle-overlap check, movement
  is basic accelerate/damp — all patterns already proven in Cycle 1.
- **Novelty:** Medium-high — a hard-tether pursuit constraint (rope-swing tag) is an
  underused mechanic in lightweight browser prototypes, and it's mechanically distinct
  from Cycle 1's orbit/shooting game.
- **Scope:** Small-medium, cleanly boundable to a single HTML file.

### 4. Mine Sweep Duel
Two mirrored Minesweeper-style boards raced side by side; first player to fully clear
their board (or flag all mines) without detonating one wins.
- **Feasibility:** Medium — needs a solvable-board generator (flood-fill reveal is easy,
  but guaranteeing a board is solvable without guessing adds real risk within budget).
- **Novelty:** Medium.
- **Scope:** Medium; solver/generator risk could blow the session budget.

### 5. Echo Maze
Single-player stealth-lite: navigate a dark procedurally-generated maze using sound
pulses (each pulse briefly reveals nearby walls) to reach the exit before a wandering
hunter — drawn toward the player's own pulses — finds them.
- **Feasibility:** Medium-low — maze generation + fog-of-war reveal + hunter pathfinding
  (needs at least a basic maze-solver/BFS for the hunter) is meaningfully more moving
  parts than the other candidates.
- **Novelty:** High.
- **Scope:** Medium-large; pathfinding + procedural generation together are the riskiest
  combination here for a single-session budget.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| Orbit Duel: AI Opponent | 5 | 2 | 3 | 10 |
| Glyph Rush | 5 | 2 | 5 | 12 |
| **Tether Tag** | **5** | **4** | **5** | **14** |
| Mine Sweep Duel | 3 | 3 | 3 | 9 |
| Echo Maze | 3 | 5 | 2 | 10 |

## Selection: Tether Tag

Chosen for the same reasons Orbit Duel won Cycle 1's evaluation: it's the best balance
of technical feasibility (plain vector math + a positional distance constraint, zero
external assets/dependencies, single `index.html`), the highest novelty-to-cost ratio
of the candidates, and a scope that fits comfortably in one implementation pass. It is
also a mechanically distinct prototype from Cycle 1's Orbit Duel (pursuit/constraint
rather than orbital gravity/shooting), which better serves the goal of producing a
*new* prototype each week rather than iterating on the same one.

Runner-up: Glyph Rush (safest fallback — trivial physics, if the tether constraint
proves harder to make feel good than expected).

Deferred: "Orbit Duel: AI Opponent" remains a valid follow-up item (see Cycle 1's
`followUps`) but is not this cycle's main deliverable, since it would mostly be a
rerun of an already-shipped prototype rather than a new one.
