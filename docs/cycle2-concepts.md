# Cycle 002 — Concept Exploration

Date: 2026-09-14
Phase: research

Goal: identify 3–5 new, lightweight, locally-runnable game concepts feasible to
prototype within one week (in practice, one focused session under a strict usage
budget), then select one for design + implementation. Concepts already used in
Cycle 1 (Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver, Orbit Duel)
are not re-proposed verbatim; a genuine evolution of one is allowed per the Cycle 1
follow-ups and is included below as an option.

## Candidate Concepts

### 1. Ink Territory
Local 2-player top-down arena game (Splatoon/Qix-style area control). Each player
drives a small vehicle that permanently paints the grid tiles it drives over in its
own color. Driving over an opponent's fresh trail (before it "sets") eliminates
them and sends them to a short respawn; driving over already-set tiles is safe.
When the timer expires, whoever owns more tiles wins.
- **Feasibility:** High — a fixed-size 2D grid, simple trail/paint bookkeeping, and
  axis-aligned or free movement with basic collision. No physics simulation needed.
- **Novelty:** Medium-high — area-control-via-trail is a different core loop from
  every Cycle 1 concept (no combat projectiles, no falling blocks, no puzzle logic).
- **Scope:** Small-medium, cleanly boundable to a single HTML file; win condition
  (tile count at timer end) is trivial to compute and to automate-test.

### 2. Echo Maze
Single-player stealth/navigation game in a dark maze. The player has no default
vision; pressing a key emits a sound pulse that briefly reveals nearby walls
(expanding ring, fades after ~1s). A patrolling "listener" enemy is drawn toward
recent pulses and catches the player on contact. Goal: reach the exit tile without
being caught, using as few pulses as possible (fewer pulses = higher score).
- **Feasibility:** Medium — needs maze generation (recursive backtracker is simple
  and well-understood), a fade-based reveal/fog-of-war render pass, and basic
  enemy pathing (move toward last-known pulse origin).
- **Novelty:** High — echolocation-as-visibility-mechanic is distinctive and not
  covered by any Cycle 1 concept.
- **Scope:** Medium — maze generation + enemy AI + fog rendering is more moving
  parts than Ink Territory; higher risk of the week's time being eaten by tuning
  the enemy's pathing so it's fair rather than instant-death or trivial.

### 3. Tether Duel
Local 2-player arena game: each player has a grappling hook that can latch onto
one of several fixed anchor points scattered around the arena, letting them swing
in an arc (pendulum physics). The goal is to swing into the opponent to knock them
into a shrinking "void" ring at the arena edge. No projectiles — pure momentum and
positioning.
- **Feasibility:** Medium — pendulum/rope-constraint physics (fixed-length swing
  around an anchor point) is more fiddly to get feeling good than free 2D vector
  motion; getting the "grab and release" timing to feel responsive typically
  needs iteration a single automated pass can't fully validate.
- **Novelty:** Medium-high — swing-combat is a different feel from Orbit Duel's
  thrust-and-shoot, but shares the "local 2-player arena" shape.
- **Scope:** Medium-large — rope physics + knockback + shrinking-ring timer is
  more surface area than fits comfortably alongside solid automated testing in
  one session.

### 4. Pulse Runner
Endless runner where obstacle spawns are locked to a procedurally generated beat
grid (e.g. a spawn every 500ms, with some beats skipped for variety) rather than
continuous/random spacing. The player jumps or ducks; hitting the action within a
timing window around the beat gives bonus score ("perfect"), acting on-beat but
outside the window is a normal pass, and missing entirely is a hit. No audio
required — a visual beat indicator (pulsing ring) carries the rhythm cue, keeping
the prototype fully functional and testable in a headless/muted environment.
- **Feasibility:** High — reuses the well-understood endless-runner shape from
  Cycle 1's Gravity Flip Runner concept (not implemented last cycle) but adds a
  genuinely new scoring dimension (beat-accuracy) on top of a simple spawn timer.
- **Novelty:** Medium — rhythm-accuracy scoring on an endless runner is a modest
  but real twist; not groundbreaking.
- **Scope:** Small — single mechanic, single score formula, easy to automate-test
  (can script inputs at exact simulated-time offsets and assert perfect/normal/miss
  classification deterministically).

### 5. Orbit Duel: Refined (Cycle 1 follow-up)
Not a new concept — revisits Cycle 1's Orbit Duel to close out its documented
follow-ups: tune `SHIP_THRUST`/`SHIP_DRAG`/`G`/`BULLET_SPEED` for feel, add an
automated end-to-end win-condition + restart test, and optionally a simple AI
opponent for single-player use.
- **Feasibility:** High — the hard part (core physics/render loop) already exists
  and is tested; this is refinement, not new-system risk.
- **Novelty:** None (by definition — it's iteration, not a new concept).
- **Scope:** Small, but produces no *new* prototype, which cuts against the
  program's weekly "produce a prototype" goal. Best treated as a backlog item
  layered onto a future cycle rather than that cycle's sole output.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Testability | Total |
|---|---|---|---|---|---|
| **Ink Territory** | **5** | **4** | **5** | **5** | **19** |
| Pulse Runner | 5 | 3 | 5 | 5 | 18 |
| Echo Maze | 3 | 5 | 3 | 3 | 14 |
| Tether Duel | 2 | 4 | 2 | 2 | 10 |
| Orbit Duel: Refined | 5 | 1 | 4 | 4 | 14 (but zero new-prototype value) |

## Selection: Ink Territory

Chosen for the best overall balance: it is fully novel relative to every Cycle 1
concept (no gravity, no projectiles, no puzzle-solving — pure territory control via
movement and trails), fits comfortably in a single self-contained HTML5 canvas file
with no external assets or build step, and its win condition (tile ownership count
at a fixed timer) is simple to compute deterministically, which makes it easy to
verify with automated headless tests — directly addressing Cycle 1's flagged gap
around win-condition test coverage, but for a new game rather than retrofitting
the old one.

Runner-up: Pulse Runner (safest fallback — lower novelty but very low implementation
risk, and its deterministic beat-timing model is arguably even easier to test than
Ink Territory's).

Deferred: Orbit Duel's Cycle 1 follow-ups (manual playtest, win-condition e2e test,
AI opponent) remain open and are carried forward as backlog rather than blocking
this cycle's new prototype.
