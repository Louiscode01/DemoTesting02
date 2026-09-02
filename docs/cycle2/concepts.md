# Cycle 002 — Concept Exploration

Date: 2026-09-02
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation.

Prior art (Cycle 1, see `../concepts.md`): Gravity Flip Runner, Chrono Loop, Color
Bind, Signal Weaver, Orbit Duel (selected & shipped, see `../design.md` and
`../test-results.md`). This cycle's candidates are deliberately distinct concepts
rather than re-proposing those.

## Candidate Concepts

### 1. Echo Maze
Single-player stealth-puzzle. The maze is invisible by default; pressing "ping" emits
a sonar pulse that briefly reveals nearby walls (and is audible to patrolling guards
within range — pinging too often or too close to a guard gets the player caught).
Goal: navigate blind from start to exit using as few, well-placed pings as possible
while avoiding patrolling guards.
- **Feasibility:** High — single canvas, grid-based maze + radius reveal + simple
  waypoint-patrol AI. No external assets, no audio required for the core loop.
- **Novelty:** High — "reveal by pinging, but pinging has a cost/risk" is an underused
  mechanic in lightweight browser prototypes; distinct from Cycle 1's physics-arcade
  concept.
- **Scope:** Small — one screen, one maze layout, deterministic guard patrols,
  win/lose states, no meta-progression needed for a playable demo.

### 2. Tether Tag
Local 2-player game: the two players are connected by an elastic tether with a max
length. One player is "it" and must touch the other to win; both players must manage
tether tension — stretching it too far snaps both players back toward each other,
which can be used offensively (fling the runner into a wall) or defensively.
- **Feasibility:** High — constraint/spring physics between two points, similar in
  kind to Cycle 1's vector math but a fresh mechanic (tag, not shooting).
- **Novelty:** Medium-high — shared-tether tag is a distinctive twist on a familiar
  format.
- **Scope:** Small-medium — one arena, one win condition, but needs careful tuning of
  tether spring constants to feel good.

### 3. Pulse Runner
Endless runner where obstacle timing is synced to a musical beat generated live via
the Web Audio API (oscillator-based, no audio files). The player jumps/ducks in time
with the beat; near-beat-perfect actions award bonus score, encouraging a rhythm-game
feel layered on a runner.
- **Feasibility:** Medium — Web Audio scheduling adds timing-precision risk not
  present in Cycle 1's prototype; needs a lookahead scheduler to avoid drift.
- **Novelty:** Medium — rhythm + runner is a known combo, but doing it with a fully
  synthesized, dependency-free beat is a nice self-contained twist.
- **Scope:** Medium — audio scheduling code plus pattern generation adds real risk of
  running over a tight budget.

### 4. Stack Attack
Single-player tower-building game: shapes fall one at a time; the player positions and
drops them to build the tallest stable stack. Simple physics (no real engine) checks
each block's support and topples the stack (game over) if the center of mass drifts
off the base.
- **Feasibility:** Medium-high — needs a lightweight stability/toppling
  approximation, but no full rigid-body engine is required for a convincing demo.
- **Novelty:** Low-medium — stacking games are a known genre (cf. mobile "Stack").
- **Scope:** Small — one mechanic, one loop, easy to bound.

### 5. Mirror Duel
Local 2-player race/duel: Player 2's ship is a mirrored reflection of Player 1's
controls (left/right and thrust are inverted and rendered as a reflection across the
arena's centerline), and both must navigate to opposite goals without colliding with
the other's mirrored trail. Requires players to think in both their own and their
opponent's inverted frame.
- **Feasibility:** Medium — the core inversion logic is simple, but making the
  "read your opponent's mirrored moves" idea legible/fun needs careful visual design.
- **Novelty:** High — distinctive mechanic, not seen in Cycle 1's lineup.
- **Scope:** Medium — trail-collision bookkeeping and mirrored-input clarity add
  more surface area than a single-player concept.

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Echo Maze** | **5** | **4** | **5** | **14** |
| Tether Tag | 4 | 4 | 3 | 11 |
| Pulse Runner | 3 | 3 | 3 | 9 |
| Stack Attack | 4 | 2 | 4 | 10 |
| Mirror Duel | 3 | 5 | 2 | 10 |

## Selection: Echo Maze

Chosen for the best balance of technical feasibility (grid maze + radius-reveal +
simple patrol AI, all self-contained in one HTML5 canvas file, no external
assets/dependencies), strong novelty relative to implementation cost (the
ping-reveals-but-also-alerts-guards risk/reward loop is the core hook), and a scope
that fits comfortably in one implementation pass. It's also a deliberate change of
pace from Cycle 1's 2-player real-time physics arcade game, exercising a different
part of the design space (single-player stealth-puzzle, discrete grid, AI patrol
logic) — useful variety for this weekly-cycle program.

Runner-up: Tether Tag (safest fallback if Echo Maze's guard-AI/detection tuning
proves too fiddly to make fun; reuses vector-physics experience from Cycle 1).
