# Cycle 002 — Concept Exploration

Date: 2026-09-23
Phase: research

Goal: identify 3–5 lightweight, locally-runnable game concepts feasible to prototype
within one week (in practice, one focused session under a strict usage budget), then
select one for design + implementation. Candidates are checked against Cycle 001's
concepts (Gravity Flip Runner, Chrono Loop, Color Bind, Signal Weaver, Orbit Duel) to
avoid re-proposing the same idea verbatim.

## Candidate Concepts

### 1. Tether Duel
Local 2-player arena game: the two players are connected by an elastic tether/rope.
Pulling away builds tension; releasing thrust or letting the tether snap taut flings a
player forward. Goal: fling your opponent into one of the hazard zones ringing the
arena (or off the edge) without getting flung in yourself. No central gravity well
(unlike Orbit Duel) — the whole tactical layer comes from tension management and
timing, so it's a distinct feel despite also being 2-player local arcade combat.
- **Feasibility:** High — spring-force physics (`F = -k * (dist - restLength)`) is
  simple and well-understood; circle-circle hazard collision; no assets.
- **Novelty:** High — tension-based tether combat is an underused mechanic in
  lightweight browser prototypes, and distinct from Cycle 001's gravity-well concept.
- **Scope:** Small-medium, cleanly boundable to a single HTML file.

### 2. Pulse Runner
One-button endless runner: player taps in rhythm with a pulsing on-screen beat to jump
over obstacles; obstacle spacing and beat tempo gradually increase. Score = beats
survived.
- **Feasibility:** High — single input, simple timing window logic.
- **Novelty:** Low-medium — close to Cycle 001's Gravity Flip Runner in genre (endless
  reflex runner), with rhythm-timing as the main differentiator.
- **Scope:** Small.

### 3. Bomb Pit Arena
Local 2-player Bomberman-lite: small grid arena, players place timed bombs that
destroy soft terrain and any player caught in the blast radius. Last player standing
wins.
- **Feasibility:** Medium-high — grid logic, timers, and blast-radius checks are
  straightforward, but destructible terrain plus chained bomb explosions adds edge
  cases.
- **Novelty:** Low — a well-known genre archetype.
- **Scope:** Medium (terrain generation + destruction adds surface area).

### 4. Drift King
Single-player top-down car time trial: tune a drift/traction model (grip vs. slide)
and race a simple procedurally-varied track, scoring on drift angle and lap time.
- **Feasibility:** Medium — a believable drift feel needs iterative tuning of a
  slip-angle/traction model, which is harder to get "right" sight-unseen than
  spring/gravity physics.
- **Novelty:** Medium — drift-scoring mechanic adds some freshness to a familiar
  top-down racer.
- **Scope:** Medium.

### 5. Echo Chamber
Single-player stealth-in-the-dark puzzle: the arena is black except for expanding
"ping" rings the player emits, which briefly reveal walls and a patrolling enemy that
also reacts to sound. Reach the exit without the enemy reaching you first.
- **Feasibility:** Medium — sound-reveal rendering and enemy sound-reaction AI are
  both doable, but tuning "fair but tense" felt difficult to validate without a human
  playtest.
- **Novelty:** High — sound-based visibility is a distinctive mechanic for a small
  browser prototype.
- **Scope:** Medium (needs at least a couple of hand/procedurally built rooms to read
  as a real level rather than a tech demo).

## Evaluation

| Concept | Feasibility (1 wk) | Novelty | Scope fit | Total |
|---|---|---|---|---|
| **Tether Duel** | **4** | **5** | **4** | **13** |
| Pulse Runner | 5 | 2 | 5 | 12 |
| Bomb Pit Arena | 4 | 2 | 3 | 9 |
| Drift King | 3 | 3 | 3 | 9 |
| Echo Chamber | 3 | 5 | 3 | 11 |

## Selection: Tether Duel

Chosen for the best balance of feasibility (spring-force physics is simple, no
external assets/dependencies, single `index.html`), the highest novelty relative to
implementation cost, and a scope that fits one implementation pass. It also gives
Cycle 002 a genuinely different feel from Cycle 001's Orbit Duel (tension/timing-based
tether combat vs. orbital-mechanics gravity combat) rather than iterating the same
mechanic twice in a row.

Runner-up: Pulse Runner (safest fallback — trivial to implement — if Tether Duel's
physics tuning proves too time-consuming to make fun within budget).

Not carried forward as this cycle's follow-up (deferred, not abandoned): Cycle 001's
`docs/test-results.md` flagged an automated win-condition end-to-end test and a human
playtest for Orbit Duel as outstanding follow-ups. Both remain valid future work on
Orbit Duel specifically and are preserved in this cycle's `followUps` list, but a new
concept was chosen for this cycle's build to keep producing breadth across the
project's prototype library.
