# Cycle 002 — Concept Exploration

Date: 2026-08-31
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Concepts below are new for cycle 2 — none
duplicate cycle 1's five (Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver,
Orbit Duel). Cycle 1's `followUps` (AI opponent, win-condition e2e test, additional
modes for Orbit Duel) were considered as a possible "iterate instead of explore"
option, but are deprioritized this cycle in favor of a fresh prototype, since the
program's goal is a *portfolio* of lightweight prototypes; the win-condition e2e test
lesson from cycle 1 is carried forward into this cycle's own testing approach instead.

## Candidate Concepts

### 1. Tether Duel
Local 2-player arena game: two ships are connected by an elastic tether. Drifting
too far apart builds spring tension that snaps players back together; a short-cooldown
"yank" ability lets a player forcibly reel the opponent toward themselves — into
static hazard zones scattered around the arena. First to lose 3 lives (hazard hits)
loses.
- **Feasibility:** High — vector physics + spring force, reuses proven patterns from
  cycle 1's Orbit Duel (canvas render loop, two-player local keyboard input) but with
  a distinct core mechanic (tether tension/yank vs. gravity well).
- **Novelty:** Medium-high — elastic-tether local dueling is an underused mechanic in
  lightweight browser prototypes.
- **Scope:** Small-medium, boundable to a single HTML file.

### 2. Glyph Rush
Typing-reflex arcade game: glyphs (short letter sequences) fall from the top of the
screen at increasing speed; the player types them before they reach the bottom to
score points and build a combo multiplier. Missed glyphs cost a life.
- **Feasibility:** Very high — text objects, a falling-speed timer, and keyboard input
  matching; no physics needed.
- **Novelty:** Low — typing/falling-word games are a well-worn genre.
- **Scope:** Very small.

### 3. Pulse Grid
Single-player top-down stealth-puzzle: the player navigates a dark procedurally
generated room to reach an exit while patrolling "sentries" roam in the dark. The
player can emit a sonar-style pulse (limited uses, recharges over time) that briefly
lights up walls, hazards, and nearby sentries. Getting spotted mid-pulse ends the run.
- **Feasibility:** Medium — needs simple patrol AI, a lightweight fog-of-war/visibility
  reveal effect, and a solvable procedural layout.
- **Novelty:** High — few lightweight browser prototypes combine sonar-reveal
  visibility with stealth-patrol AI.
- **Scope:** Medium — biggest scope risk of the five (AI + procedural generation).

### 4. Salvage Run
Single-player Asteroids-style pilot game: fly a small ship through a drifting debris
field, collecting salvage pieces and ferrying them back to a home station before a
fuel timer runs out. Colliding with large debris destroys held salvage; returning to
station banks it. Risk/reward: venture farther for rarer salvage vs. conserving fuel.
- **Feasibility:** High — reuses simple 2D vector movement/collision, no exotic
  systems.
- **Novelty:** Medium — risk/reward salvage-and-return loop is a reasonable twist on
  the classic asteroid-field format.
- **Scope:** Small-medium.

### 5. Split Second
Single-player puzzle-platformer: the player controls two characters at once with one
input scheme — one character mirrors input normally, the other receives inverted
input — and must guide both to their separate goal tiles simultaneously without
either touching a hazard. Distinct from cycle 1's Chrono Loop (no recording/ghost
playback; both characters are live and simultaneous).
- **Feasibility:** Medium — needs careful level layout to keep mirrored-control
  puzzles solvable and fun, plus dual-character collision/goal logic.
- **Novelty:** High — simultaneous dual-character mirrored control is a distinctive,
  underused single-player mechanic.
- **Scope:** Medium.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Tether Duel** | **5** | **4** | **5** | **14** |
| Glyph Rush | 5 | 1 | 5 | 11 |
| Pulse Grid | 3 | 5 | 3 | 11 |
| Salvage Run | 4 | 3 | 4 | 11 |
| Split Second | 3 | 4 | 3 | 10 |

## Selection: Tether Duel

Chosen for the same reasons Orbit Duel won cycle 1's evaluation: it reuses a proven,
low-risk technical pattern (single-file HTML5 canvas, vector physics, local two-player
keyboard input, no external assets/build step) while introducing a genuinely different
core mechanic (elastic tether tension + yank ability, rather than a gravity well) —
keeping the prototype fresh rather than a re-skin of cycle 1's game. Its scope fits
comfortably within the session budget.

Runner-up: Salvage Run (safest single-player fallback if tether-tension tuning proves
too fiddly to make fun within budget).
