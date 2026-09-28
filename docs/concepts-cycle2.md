# Cycle 002 — Concept Exploration

Date: 2026-09-28
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Prior art from Cycle 1 (`docs/concepts.md`):
Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver, and the selected concept,
Orbit Duel (a local 2-player gravity-well arcade duel). This cycle proposes fresh
concepts rather than re-pitching those verbatim.

## Candidate Concepts

### 1. Mirror Maze
Single-player grid puzzle. The player directly controls a "Blue" character; a linked
"Twin" character mirrors every move across a vertical axis (left/right inputs are
flipped, up/down inputs match). Both characters move in lockstep each turn, and a move
is only legal if *both* characters can make their respective (possibly mirrored) step
without hitting a wall. The level is solved when both characters simultaneously occupy
their goal tiles. Levels are small ASCII-defined grids of increasing complexity.
- **Feasibility:** High — deterministic turn-based grid logic, no physics tuning,
  trivially unit-testable (a solved level is a simple boolean check on state).
- **Novelty:** Medium-high — the "shared-fate twin" constraint produces genuinely
  different puzzle-solving from typical block-pushing puzzles.
- **Scope:** Small — one HTML file, an array of level layouts, deterministic testing.

### 2. Echo Chamber
Top-down stealth-lite navigation game in a dark maze. The player has no ambient light
and must emit sonar "pulses" (space bar) to briefly reveal nearby walls and enemies.
Enemies are sound-sensitive: a pulse used too close to one alerts it. Goal: reach the
exit using as few pulses as possible without being caught.
- **Feasibility:** Medium — needs a simple grid-based visibility/raycast reveal and
  basic enemy patrol/alert AI.
- **Novelty:** High — pulse-based limited-information navigation is distinctive for a
  lightweight browser prototype.
- **Scope:** Medium — enemy AI and "fun" tuning (pulse cooldown, alert radius) add
  playtesting risk similar to Cycle 1's Orbit Duel feel-tuning follow-up.

### 3. Pulse Runner
Endless rhythm-runner: obstacles spawn on the beat of a simple procedural metronome:
the player must jump/dash exactly on-beat to pass through gates, with off-beat attempts
failing even if the timing looks close on screen.
- **Feasibility:** Medium — requires stable audio/visual beat-sync using
  `AudioContext` or a manual timing loop.
- **Novelty:** Medium — rhythm-gating is a known genre but is rarely combined with
  endless-runner obstacle spawning in tiny prototypes.
- **Scope:** Medium — timing-feel tuning is a playtesting-heavy risk (same category
  flagged as a Cycle 1 follow-up for Orbit Duel).

### 4. Orbit Duel: Rogue Gauntlet (evolution)
Directly addresses a Cycle 1 follow-up ("consider a simple AI opponent... if this
concept is revisited"): reuse the existing Orbit Duel physics engine, add a single-
player mode against a scripted AI ship of increasing difficulty across waves.
- **Feasibility:** High — physics/rendering code already exists and is tested.
- **Novelty:** Low for this cycle — it is an iteration on an already-shipped concept
  rather than new creative ground.
- **Scope:** Small — mostly AI behavior + wave/scoring logic.

### 5. Signal Relay
Real-time (not turn-based) puzzle: rotate rotatable pipe segments on a grid to route a
continuously flowing signal from source to sink before a timer expires; multiple
sources/sinks and pipe types (straight, elbow, splitter) raise difficulty.
- **Feasibility:** Medium — needs a flow-solver plus real-time rotation input handling.
- **Novelty:** Medium — similar in spirit to Cycle 1's Signal Weaver but real-time
  instead of turn-based; close enough to prior art to be a weaker pick this cycle.
- **Scope:** Medium.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Mirror Maze** | **5** | **4** | **5** | **14** |
| Echo Chamber | 3 | 5 | 3 | 11 |
| Pulse Runner | 3 | 3 | 3 | 9 |
| Orbit Duel: Rogue Gauntlet | 5 | 2 | 5 | 12 |
| Signal Relay | 3 | 3 | 3 | 9 |

## Selection: Mirror Maze

Chosen for the best balance of feasibility and scope fit while still being a genuinely
new mechanic for this project (not a re-skin of any Cycle 1 concept). Critically, its
turn-based/deterministic nature avoids the "needs human feel/balance playtesting"
follow-up risk that was explicitly flagged against Orbit Duel in Cycle 1 — solved/
unsolved state, legal moves, and level completion are all exactly and automatically
testable in headless mode, which fits this project's strict, mostly-unattended usage
budget better than a physics- or rhythm-feel game would.

Runner-up: Echo Chamber (highest novelty, but enemy-AI and pulse-cooldown tuning carry
real playtesting risk within a single-session budget — good candidate for a future
cycle with more time available).
