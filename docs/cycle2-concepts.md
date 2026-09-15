# Cycle 002 — Concept Exploration

Date: 2026-09-15
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation.

Prior art (Cycle 1, do not re-propose verbatim): Gravity Flip Runner, Chrono Loop,
Color Bind, Signal Weaver, Orbit Duel (shipped as `game/index.html`).

Cycle 1 follow-ups on record:
- Human/manual playtest of Orbit Duel for feel/balance tuning.
- Automated end-to-end test of the win condition + restart flow (flagged gap).
- Consider a simple AI opponent or additional modes if the concept is revisited.

## Candidate Concepts

### 1. Orbit Duel: Rival AI (evolution of Cycle 1's Orbit Duel)
Adds a single-player mode to the existing local-2-player gravity-duel game: a
predictive-targeting AI pilot (leads shots using target velocity + gravity curvature,
throttles thrust toward energy-efficient orbits) as a selectable opponent alongside the
existing 2-player mode. Also closes the Cycle 1 testing gap by adding an automated
end-to-end test of the win condition + restart flow.
- **Feasibility:** High — reuses the existing physics/render loop and entity model;
  the new work is an AI-decision module (~decide thrust/rotate/fire per tick) plus a
  menu/mode-select screen.
- **Novelty:** Medium — AI opponents are common, but a gravity-slingshot AI that has to
  reason about curved trajectories is a more interesting design problem than a
  straight-aim bot.
- **Scope:** Small-medium; bounded because the core sim is already built and tested.
- **Directly addresses two open Cycle 1 follow-ups** (AI opponent, win-condition e2e test).

### 2. Echo Maze
Top-down stealth-lite: the player navigates a procedurally generated maze toward an
exit. Moving emits a sound "ping" (expanding ring) that alerts nearby patrolling guards
within its radius; standing still is silent. Player must balance speed vs. stealth.
- **Feasibility:** Medium — needs maze generation + guard patrol/alert AI + line-of-sound
  radius logic.
- **Novelty:** Medium-high — sound-based (not sight-based) stealth is less common in
  lightweight prototypes.
- **Scope:** Medium; procedural generation + solvability guarantee adds risk of
  under-testing within one session.

### 3. Tile Tactics
Local 2-player turn-based tactics on a small 6x6 grid: 3 units per side (mover,
striker, blocker), simple rock-paper-scissors-flavored combat, win by eliminating the
enemy or capturing their flag tile.
- **Feasibility:** High — turn-based grid logic is simple and deterministic, easy to
  test headlessly (no real-time physics/timing flakiness).
- **Novelty:** Low-medium — genre is well-trodden, though the 3-unit micro-scope is a
  reasonable differentiator for a one-session build.
- **Scope:** Small; easy to bound (fixed board size, fixed unit roster).

### 4. Bounce Forge
Single-player physics puzzle: each level gives the player a small budget of
ramps/bumpers to place; releasing a ball, it must reach a goal using placed pieces plus
gravity/bounce physics. Rube-Goldberg-lite, level-based.
- **Feasibility:** Medium — needs a small 2D physics/collision layer (or a lightweight
  custom one) plus hand-authored levels and placement UI.
- **Novelty:** Medium — sandbox-placement puzzle games exist, but the tight
  piece-budget constraint per level is a decent hook.
- **Scope:** Medium-large; level design + a robust-enough physics/collision system is
  the main risk of overrunning a single session.

### 5. Word Siege
Fast-paced single-player typing/defense game: letter tiles fall toward a tower; typing
the word shown on a tile destroys it before impact, chained correct words build a
combo multiplier and speed up spawn rate.
- **Feasibility:** High — no physics engine needed, just spawn timers, a word list, and
  keyboard input matching.
- **Novelty:** Low — typing-defense is a well-known genre.
- **Scope:** Small; easy to bound and test (deterministic word queue).

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Addresses follow-ups | Total |
|---|---|---|---|---|---|
| **Orbit Duel: Rival AI** | **5** | **3** | **5** | **+2** | **15** |
| Echo Maze | 3 | 4 | 3 | 0 | 10 |
| Tile Tactics | 5 | 2 | 5 | 0 | 12 |
| Bounce Forge | 3 | 3 | 2 | 0 | 8 |
| Word Siege | 5 | 1 | 5 | 0 | 11 |

(Scoring: Feasibility/Novelty/Scope fit on 1–5 as in Cycle 1; +2 bonus for directly
retiring open items from the Cycle 1 follow-up list, since clearing known gaps is
higher-value than a same-cost net-new concept at equal quality.)

## Selection: Orbit Duel — Rival AI

Chosen because it has the best feasibility-to-value ratio of the five: it builds on a
tested, working core (no risk of re-deriving gravity-well vector physics from scratch),
stays small in scope because only the AI-decision module, mode-select UI, and one new
automated test are net-new, and it directly clears two items from Cycle 1's follow-up
list (AI opponent, win-condition e2e test) rather than leaving them to accumulate.

Runner-up: Tile Tactics (safest fallback — fully deterministic, no real-time physics or
timing flakiness, if the AI-targeting work for Orbit Duel proves harder to get "fun"
than expected).
