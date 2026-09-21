# Cycle 002 — Concept Exploration

Date: 2026-09-21
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Cycle 1 produced: Gravity Flip Runner, Chrono
Loop, Color Bind, Signal Weaver, and (selected) Orbit Duel — see
`docs/concepts.md`. This cycle avoids re-proposing those verbatim.

## Candidate Concepts

### 1. Tether Twins
Single-player physics puzzler: two orbs connected by an elastic tether are controlled
simultaneously (WASD for one, arrow keys for the other). The player must stretch,
compress, and swing the tether to pass both orbs through gaps, around hazards, and
onto goal pads. Both orbs must reach their goals to clear a level.
- **Feasibility:** High — spring/verlet physics between two points is simple math;
  no external assets, single canvas.
- **Novelty:** Medium-high — dual-body simultaneous control with a physical
  constraint is an underused mechanic in lightweight browser prototypes.
- **Scope:** Small-medium — a handful of hand-authored levels (arrays of static
  rects for walls/hazards/goals) keeps content risk low.

### 2. Pulse Grid
Rhythm/reflex precision game: grid nodes light up in an expanding pulse pattern from
a source; the player clicks/taps nodes exactly as the pulse reaches them. Combo
streak and score multiplier reward timing accuracy; tempo increases over time.
- **Feasibility:** High — timer-driven state machine, no physics.
- **Novelty:** Medium — rhythm-grid games exist, but pulse-propagation-as-timing-cue
  is a fresh presentation.
- **Scope:** Small — easiest of the candidates, lowest implementation risk.

### 3. Block Foundry
Physics stacking game: blocks of varying size/weight drop from above; the player
nudges them left/right and rotates before they land, trying to build the tallest
stable tower while periodic "wind gusts" apply lateral force. Game ends when the
tower topples past a tilt threshold.
- **Feasibility:** Medium — needs basic rigid-body stacking (AABB collision +
  simple rotational torque) without a full physics engine; stability tuning is
  fiddly.
- **Novelty:** Low-medium — stacking games are a known genre.
- **Scope:** Medium — collision/torque edge cases add implementation risk.

### 4. Echo Chamber
Top-down stealth puzzle in darkness: the player emits sonar pings that briefly
reveal walls and patrolling guards; moving makes noise that attracts nearby guards.
Reach the exit without being caught.
- **Feasibility:** Medium — needs guard patrol AI, line-of-sight/noise radius
  logic, and a fog-of-war rendering approach.
- **Novelty:** Medium-high — sound-based visibility instead of light-based is a
  distinctive twist on stealth.
- **Scope:** Medium — AI + level design content is the main risk to a one-session
  build.

### 5. Orbit Duel: AI Opponent (follow-up)
Extends Cycle 1's Orbit Duel with a single-player mode against a scripted AI ship
(basic steering toward orbital firing positions + reactive dodging), addressing a
Cycle 1 follow-up item.
- **Feasibility:** High — physics/engine already exist and are tested; only AI
  decision logic is new.
- **Novelty:** Low as a *new* concept — it is an iteration, not a fresh idea.
- **Scope:** Small, but constrained to extending existing code rather than
  exploring new game-design space, which is less in the spirit of "3–5 new
  concepts" for this phase.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Tether Twins** | **4** | **4** | **4** | **12** |
| Pulse Grid | 5 | 2 | 5 | 12 |
| Block Foundry | 3 | 3 | 2 | 8 |
| Echo Chamber | 3 | 4 | 2 | 9 |
| Orbit Duel: AI Opponent | 5 | 1 | 5 | 11 |

## Selection: Tether Twins

Tether Twins and Pulse Grid tie on raw score, but Tether Twins is chosen: it offers
materially more novelty than Pulse Grid for only a small increase in implementation
risk, the physics involved (a single spring constraint between two points, plus
static-rect collision) is well within what was already proven feasible in Cycle 1's
gravity simulation, and dual-body simultaneous control is a distinctive, demoable
hook. Content risk is bounded by hand-authoring 3 short levels rather than building
a level-format/editor.

Runner-up: Pulse Grid (safest fallback — pure timer/state-machine logic, no physics
or collision to tune, if Tether Twins' constraint physics or dual-input handling
proves too time-consuming to make feel good).

Orbit Duel: AI Opponent remains a good candidate for a *future* cycle focused on
iterating existing concepts rather than exploring new ones (see Cycle 1 follow-ups).
