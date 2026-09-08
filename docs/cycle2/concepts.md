# Cycle 002 — Concept Exploration

Date: 2026-09-08
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Reviewed Cycle 1's `docs/concepts.md` first to
avoid re-proposing Gravity Flip Runner / Chrono Loop / Color Bind / Signal Weaver /
Orbit Duel verbatim; a genuine evolution of a prior concept is allowed per the
resume instructions left in `state.json`.

## Candidate Concepts

### 1. Orbit Duel: AI Rival (evolution of Cycle 1's Orbit Duel)
Adds a single-player mode to the existing Orbit Duel prototype: Player 1 (human) faces
a simple AI-controlled ship (basic steering-behavior bot: seeks a firing angle on the
human, thrusts to manage orbital distance from the star, fires on a cooldown when
roughly aimed). Local 2-player mode is preserved as a menu option.
- **Feasibility:** High — reuses the tested physics/render engine from Cycle 1 nearly
  unchanged; only adds an AI input source and a mode-select screen.
- **Novelty:** Medium — the AI opponent itself is a fairly standard steering bot, but
  directly resolves Cycle 1's top follow-up item ("consider a simple AI opponent").
- **Scope:** Small — bounded addition to a known-working codebase.

### 2. Echo Maze
Top-down maze exploration game. The player has no persistent vision; pressing a
"ping" key emits a sound pulse that briefly illuminates nearby walls/exits on a fading
radius, while a patrolling enemy is drawn permanently (visible) so the risk/reward is
navigating blind versus revealing your own position to the patroller via the ping's
light. Reach the exit without being caught.
- **Feasibility:** Medium — needs procedural or hand-authored maze generation, a
  fog-of-war/reveal-radius render mode, and basic patrol-path AI.
- **Novelty:** High — "risk-to-see" mechanic (revealing the maze also reveals you) is
  distinctive versus typical maze/stealth games.
- **Scope:** Medium — maze generation + patrol AI + reveal rendering is more surface
  area than a one-session budget comfortably covers well.

### 3. Stack Attack Lite
Minimal tower-defense: enemies walk a fixed path across the screen in waves; the
player places a small number of elemental blocks (fire/ice/shock) adjacent to the path,
and blocks of different types combine for bonus effects when placed next to each other.
- **Feasibility:** Medium-high — path-following enemies and placement logic are simple;
  combo-effect balancing adds some risk.
- **Novelty:** Low-medium — combo mechanic is a nice touch on a very familiar genre.
- **Scope:** Medium — wave/economy tuning tends to expand scope quickly.

### 4. Tether Tag
Local 2-player game: the two players are connected by a stretchy tether (spring
physics) in a small arena. One player is "it" and must tag the other, but the tether
constrains both players' momentum — leading to slingshot and counter-pull dynamics.
- **Feasibility:** Medium — spring-constraint physics between two bodies is a new
  physics model, not reused from Cycle 1.
- **Novelty:** High — tether-constrained tag is an underused local-multiplayer hook.
- **Scope:** Medium-high — physics tuning for "fun" tether tension is unpredictable
  without human playtesting, which this unattended run cannot do live.

### 5. Word Drift
Falling-word typing game: words fall from the top of the screen at increasing speed;
typing a word exactly (shown as you type, letter-by-letter highlight) destroys it
before it reaches the bottom. Score and speed ramp over time.
- **Feasibility:** High — simple spawner + text input matching, no physics.
- **Novelty:** Low — well-established typing-game genre.
- **Scope:** Small.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Orbit Duel: AI Rival** | **5** | **3** | **5** | **13** |
| Echo Maze | 3 | 5 | 3 | 11 |
| Stack Attack Lite | 4 | 2 | 4 | 10 |
| Tether Tag | 3 | 4 | 2 | 9 |
| Word Drift | 5 | 1 | 5 | 11 |

## Selection: Orbit Duel: AI Rival

Chosen for the best balance of feasibility and scope fit within the budget, while
directly resolving a real, previously-identified follow-up (a simple AI opponent for
Orbit Duel) rather than leaving that backlog item to accumulate. It reuses Cycle 1's
already-tested physics/collision/render code (lower implementation risk this pass),
and adds genuinely new, testable surface area: an AI decision loop and a mode-select
screen, plus the automated win-condition end-to-end test that Cycle 1 flagged as
untested.

Runner-up: Echo Maze (highest novelty; deferred because its maze-generation +
fog-of-war + patrol-AI surface area is a poorer fit for a single-session budget than
building on already-working code). Kept as a candidate for a future cycle.
