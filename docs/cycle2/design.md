# Orbit Duel: AI Rival — Design & Implementation Plan

Date: 2026-09-08
Cycle: 002
Phase: design
Selected concept: **Orbit Duel: AI Rival** (see `docs/cycle2/concepts.md`)
Implementation target: **`game/cycle2/index.html`** (new file)
Baseline: `game/index.html` (Cycle 1) — **must remain byte-for-byte untouched** for audit.

---

## 1. Concept Summary

Cycle 1 shipped *Orbit Duel*: a local 2-player arcade duel in a wrapped arena around a
central star whose gravity bends both ships and bullets. First to `WIN_SCORE` (5) kills
wins; `R` restarts.

Cycle 2 adds a **single-player mode**. Player 1 (human) faces an AI-controlled rival
ship that flies the *same* ship with the *same* physics and the *same* action set —
rotate, thrust, fire — differing only in where its inputs come from. A **mode-select
screen** now precedes play, offering **1P vs AI** and **2P local**. The existing
2-player local mode is preserved unchanged in behavior.

Two secondary goals, both carried forward from Cycle 1's `docs/test-results.md`:

- Close the **win-condition end-to-end test gap** (top-priority follow-up).
- Keep the AI **deterministic and inspectable**, so it can be unit-tested rather than
  eyeballed — this cycle again has no human playtester.

Design principle for the whole cycle: **the AI is an input source, not a special kind of
ship.** Every rule that constrains a human (rotation speed, thrust magnitude, fire
cooldown, star collision, respawn delay) constrains the AI identically. No aim-assist,
no extra speed, no ignoring gravity. This keeps the physics/collision code single-path
and makes "is the AI cheating?" a question the code answers structurally.

---

## 2. Architecture

### 2.1 File layout

```
game/index.html            # Cycle 1 — FROZEN, do not edit
game/cycle2/index.html     # Cycle 2 — copy of Cycle 1, evolved (this cycle's deliverable)
docs/cycle2/design.md      # this document
docs/cycle2/test-results.md   # testing phase output
tests/cycle2/*.mjs         # Playwright test scripts (committed, see §6)
```

`game/cycle2/index.html` stays a **single self-contained file**: no build step, no
dependencies, no assets, inline `<style>` + `<script>`, Canvas 2D, `requestAnimationFrame`.
It opens from `file://`. That constraint is what made Cycle 1 cheap to test, so it holds.

The Cycle 2 file starts as a verbatim copy of Cycle 1 and is then modified. The diff
should be reviewable in one sitting; anything that would balloon it belongs in §7
(out of scope).

### 2.2 Where the new code goes

Cycle 1's script is one IIFE organized by section comments. Cycle 2 keeps that shape and
adds two new sections, plus targeted edits to three existing ones:

| Section | Change |
|---|---|
| Tunable constants | **+** AI constants block (§5) |
| Vector helpers | **+** `angleWrap(a)` → normalize to `(-π, π]` |
| Entities (`makeShip`) | **+** `controller` (`'human'` \| `'ai'`), `intent` object, `ai` sub-state |
| **Input** | keys now fill an `intent` for human ships only; new menu key handling |
| **AI controller** (new) | `updateAI(ship, target, dt, now)` → writes `ship.intent` |
| **Phase / mode state machine** (new) | `phase`, `mode`, `startMatch(mode)`, `toMenu()` |
| Physics `step()` | reads `ship.intent` instead of `keysDown`; gated by `phase` |
| Render | **+** `drawMenu()`; HUD labels become mode-aware |
| Test hooks | expanded `window.__orbitDuel` (§6.1) |

### 2.3 The intent layer (the key structural change)

Cycle 1's `step()` reads global input directly inside the per-ship loop:

```js
if (keysDown.has(k.left))  ship.angle -= SHIP_ROT_SPEED * dt;
...
if (keysDown.has(k.fire) && ship.cooldown <= 0) { ... }
```

That hard-wires "a ship is driven by a keyboard." Cycle 2 inserts one indirection.
Each ship carries:

```js
ship.intent = { left: false, right: false, thrust: false, fire: false };
```

and `step()` becomes:

```js
// Phase A — fill intents
for (const ship of players) {
  if (!ship.alive) continue;
  if (ship.controller === 'human') readHumanIntent(ship);   // keysDown -> intent
  else                             updateAI(ship, otherShip(ship), dt, now);
}
// Phase B — apply intents (physics, unchanged from Cycle 1 apart from the source)
for (const ship of players) { ...if (ship.intent.left) ship.angle -= ... }
```

Why this shape:

- **One physics path.** The AI cannot accidentally acquire abilities a human lacks,
  because it never touches `angle`, `vel`, `cooldown`, or `bullets` — only four booleans.
- **Testable in isolation.** A test can call `updateAI` on a synthetic world state and
  assert the four booleans, with no rendering, no rAF, and no physics involved.
- **Small diff.** The existing physics block changes only in the condition expressions.
- **Symmetric replay.** A recorded intent stream replays identically regardless of who
  produced it — useful if a future cycle wants demo playback.

Intents are recomputed each tick and are *not* sticky across the intent/apply boundary,
with the deliberate exception of the AI's reaction latch (§3.4).

### 2.4 Phase and mode state

Cycle 1 had a single boolean `gameOver`. Cycle 2 replaces it with an explicit phase:

```js
let phase  = 'menu';   // 'menu' | 'playing' | 'gameover'
let mode   = null;     // '1p' | '2p'  (null while in menu)
let winner = null;
```

`gameOver` is removed as a variable but **retained as a derived getter on the test hook**
(`get gameOver() { return phase === 'gameover'; }`) so Cycle 1's existing smoke tests
keep working against the Cycle 2 file without modification. That backwards-compatible
hook is cheap and preserves regression coverage.

`step()` early-returns unless `phase === 'playing'`. `render()` dispatches on phase:
`menu` → `drawMenu()`; `playing` / `gameover` → the Cycle 1 render path (the win overlay
is drawn when `phase === 'gameover'`, exactly as Cycle 1 drew it when `gameOver`).

The rAF loop itself keeps running in all phases — the menu is drawn on the same canvas
with the same starfield and star, so the star's glow animates behind the menu and there
is no second DOM surface to manage.

---

## 3. AI Decision Loop

The bot is a **priority-arbitrated steering behavior with a reaction latch**. It is
deliberately not a planner, not a search, and not stochastic. Roughly 60–80 lines.

### 3.1 Inputs and outputs

Pure-ish function of world state:

```
updateAI(self, target, dt, now)
  reads:  self.pos/.vel/.angle/.cooldown, target.pos/.vel/.alive, CENTER, constants
  writes: self.intent {left,right,thrust,fire}, self.ai {mode, timer, desiredAngle}
```

No `Math.random()` anywhere in the AI. No wall-clock reads other than the `now` passed
in. Given identical inputs it produces identical outputs — this is what makes §6.4
testable.

### 3.2 Behavior arbitration (strict priority — first match wins)

Let `r = |self.pos - CENTER|` (distance to the star) and
`d = |target.pos - self.pos|`.

**Priority 1 — EVADE (`ai.mode = 'evade'`)** — triggered when `r < AI_STAR_DANGER_R`.
The star kills; nothing else matters. Desired heading = radially **outward**
(`self.pos - CENTER`). Thrust is requested whenever the heading error is within
`AI_THRUST_TOLERANCE`. Fire is suppressed. This is the behavior that prevents the
embarrassing failure mode of an AI that flies into the sun on loop.

**Priority 2 — ORBIT (`ai.mode = 'orbit'`)** — triggered when `r` is outside the
band `[AI_ORBIT_MIN, AI_ORBIT_MAX]`. Desired heading is the tangent to the star,
biased radially toward the band:

```
tangent = perpendicular of (self.pos - CENTER), chosen to match current angular direction
radial  = outward if r < AI_ORBIT_MIN, inward if r > AI_ORBIT_MAX
desired = angleOf( normalize(tangent) + AI_ORBIT_BIAS * normalize(radial) )
```

Thrust when aimed within `AI_THRUST_TOLERANCE` **and** `|self.vel| < AI_MAX_SPEED`.
The speed clamp is what stops the bot from accelerating into an unrecoverable escape
trajectory; note it reads the ship's own velocity, an ability the human has visually.
Fire is allowed if the target happens to fall inside the firing gate (§3.3) — the bot
does not refuse a free shot while repositioning.

**Priority 3 — ENGAGE (`ai.mode = 'engage'`)** — the default. Lead-aim at where the
target will be when a bullet would arrive:

```
tof     = d / BULLET_SPEED                       // time of flight, first-order
aimPt   = target.pos + target.vel * tof * AI_LEAD_FACTOR
desired = atan2(aimPt.y - self.pos.y, aimPt.x - self.pos.x)
```

This ignores gravitational curvature of the bullet **on purpose**. Accounting for it
would require iterating the bullet integrator every tick and would make the bot both
slower to reason about and harder to beat. Ignoring it means the AI misses more the
closer the shot passes to the star — which is thematically right, gives the human a
readable exploit (fight across the star), and is a one-constant tuning knob
(`AI_LEAD_FACTOR`) rather than a rewrite.

Thrust in ENGAGE is requested when `d > AI_ENGAGE_RANGE` (close the gap) and the
heading error is within `AI_THRUST_TOLERANCE` and `|self.vel| < AI_MAX_SPEED`.
Otherwise the bot coasts and rotates — a stationary-ish gun platform, which is the
correct arcade behavior given drag exists.

If `target.alive === false` (it is in respawn delay), the bot falls through to ORBIT
behavior and holds fire.

### 3.3 Rotation and firing gates

Given `desiredAngle`, with `err = angleWrap(desired - self.angle)`:

```
intent.left  = err < -AI_AIM_TOLERANCE
intent.right = err >  AI_AIM_TOLERANCE
intent.fire  = |err| <= AI_AIM_TOLERANCE
               && d   <= AI_FIRE_RANGE
               && self.cooldown <= 0
               && ai.mode !== 'evade'
               && target.alive
```

Note `intent.left/right` are the same booleans a human's `A`/`D` produce, so the bot
turns at exactly `SHIP_ROT_SPEED` and can overshoot. The `AI_AIM_TOLERANCE` deadband
prevents left/right chatter around the target angle.

`intent.fire` is a *request*; the existing cooldown logic in `step()` remains the sole
authority on whether a bullet is actually created. The `cooldown <= 0` term in the gate
is only an optimization for readability — removing it would not let the AI fire faster.

Effective AI rate of fire is therefore `max(FIRE_COOLDOWN, AI_FIRE_COOLDOWN)`;
`AI_FIRE_COOLDOWN` (§5) exists so the bot can be *handicapped* below the human rate
without touching shared physics, by adding a separate `ship.aiFireTimer` checked in the
gate. It never permits a faster rate.

### 3.4 Reaction latch (the difficulty knob)

Recomputing a perfect aim 60×/sec makes an unbeatable bot. Instead:

```js
ship.ai.timer -= dt;
if (ship.ai.timer <= 0) {
  ship.ai.timer = AI_REACTION_DELAY;
  recomputeDecision();          // sets ai.mode, ai.desiredAngle
}
// gates in §3.3 are re-evaluated every tick against the LATCHED ai.desiredAngle
```

So the bot's *perception* updates at `1 / AI_REACTION_DELAY` Hz while its *actuation*
stays smooth at frame rate. Consequences, all desirable:

- It leads a maneuvering target imperfectly — dodging works.
- Higher `AI_REACTION_DELAY` = easier bot, one number, no other coupling.
- Frame-rate independence: behavior is a function of accumulated `dt`, not frame count.

**Exception:** the EVADE trigger is evaluated **every tick**, bypassing the latch.
A latched bot that only notices the star every 180 ms dies to it, and "the AI keeps
suiciding" is the single most likely visible failure of this design. Survival is not a
difficulty knob.

### 3.5 Determinism note

The AI reads no RNG. The game does call `Math.random()` in `spawnExplosion()` and in the
thrust-flame render — both **visual-only**, touching neither ship nor bullet state.
Therefore, for a fixed `dt` sequence and fixed initial conditions, all gameplay state
(positions, velocities, scores, phase) is reproducible. §6.4 asserts this.

---

## 4. Mode-Select Screen

### 4.1 State machine

```
        ┌──────── R ────────┐
        v                   │
   ┌────────┐  1 / 2   ┌─────────┐  score >= WIN_SCORE   ┌──────────┐
   │  menu  │─────────>│ playing │──────────────────────>│ gameover │
   └────────┘          └─────────┘                        └──────────┘
        ^                   │                                  │
        └───── Esc / M ─────┴──────────── Esc / M ─────────────┘
```

Transitions:

| From | Input | To | Action |
|---|---|---|---|
| `menu` | `Digit1` / `Numpad1` | `playing` | `startMatch('1p')` |
| `menu` | `Digit2` / `Numpad2` | `playing` | `startMatch('2p')` |
| `menu` | `ArrowUp`/`ArrowDown`/`W`/`S` | `menu` | move highlight |
| `menu` | `Enter` / `Space` | `playing` | `startMatch(highlighted)` |
| `playing` | `Escape` / `KeyM` | `menu` | `toMenu()` |
| `playing` | score reaches `WIN_SCORE` | `gameover` | set `winner` |
| `gameover` | `KeyR` | `playing` | `startMatch(mode)` — same mode, Cycle 1 behavior |
| `gameover` | `Escape` / `KeyM` | `menu` | `toMenu()` |

Two selection idioms are supported on purpose: **direct number keys** (fast, and trivially
scriptable in a Playwright test) and **arrow + Enter** (discoverable, matches the
highlight the screen draws). Both routes call the same `startMatch(mode)`.

`R` restarting into the **same mode** rather than the menu preserves Cycle 1's muscle
memory and keeps the win-condition E2E test (§6.2) a clean state-reset assertion rather
than a navigation test.

### 4.2 `startMatch(mode)` — replaces Cycle 1's `resetGame()`

Cycle 1's `resetGame()` reset both ships field-by-field, duplicating the spawn constants.
Cycle 2 refactors it into a loop over `players` calling a `resetShip(ship)` helper
(spawn pos, zero velocity, spawn angle, `alive = true`, `score = 0`, `cooldown = 0`,
`intent` cleared, `ai` sub-state cleared), then:

```js
function startMatch(m) {
  mode = m;
  players[0].controller = 'human';
  players[1].controller = (m === '1p') ? 'ai' : 'human';
  players.forEach(resetShip);
  bullets = []; particles = []; winner = null;
  phase = 'playing';
}
```

`toMenu()` is `startMatch`-without-the-phase: it clears the world and sets
`phase = 'menu'`, `mode = null`, so the menu never renders a stale scoreboard.

This refactor is also what makes the restart half of §6.2 meaningful: there is exactly
one code path that establishes a fresh match, so testing `R` tests the menu path too.

### 4.3 Menu rendering and input plumbing

`drawMenu()` draws on the same canvas over the existing starfield + star:

- Title `ORBIT DUEL` with subtitle `AI RIVAL`.
- Two options: `[1]  1P  vs  AI` / `[2]  2P  LOCAL`, the highlighted one drawn in the
  P1 color with a `>` caret, the other dimmed.
- A control legend below, and `Esc — menu` hinted during play.

Input plumbing detail: Cycle 1 wires one global `keydown` listener that both records into
`keysDown` and handles `R`. Cycle 2 keeps the single listener but branches on `phase`
for the *discrete* keys (menu selection, `R`, `Esc`), while `keysDown` continues to serve
*continuous* keys for `readHumanIntent`. The existing `preventDefault` list must gain
`Enter` — currently `Enter` is P2's fire key and is not prevented; once `Enter` also
confirms a menu choice, letting the browser act on it is a latent focus/scroll bug.

The `#hint` div below the canvas becomes **mode-aware**: in `1p` it shows only P1's
controls plus "P2 is AI-controlled"; in `2p` it shows Cycle 1's text; in `menu` it shows
the selection keys. One `updateHint()` called on every phase/mode transition.

---

## 5. Tunable Constants

Existing Cycle 1 constants are **unchanged** — no re-balancing this pass (see §7). They
remain the single source of truth at the top of the script:

`G`, `STAR_MASS`, `STAR_RADIUS`, `GRAV_MIN_R`, `SHIP_RADIUS`, `SHIP_THRUST`,
`SHIP_ROT_SPEED`, `SHIP_DRAG`, `BULLET_SPEED`, `BULLET_TTL`, `FIRE_COOLDOWN`,
`WIN_SCORE`, `RESPAWN_DELAY`.

New block, added directly beneath them:

```js
// ---------- AI tunables ----------
const AI_REACTION_DELAY  = 0.18;   // s between decision recomputes (higher = easier)
const AI_AIM_TOLERANCE   = 0.12;   // rad; deadband for "aimed enough" + rotation chatter
const AI_THRUST_TOLERANCE= 0.45;   // rad; heading error under which thrusting is useful
const AI_FIRE_COOLDOWN   = 0.34;   // s; AI-only floor, >= FIRE_COOLDOWN (0.28) = handicap
const AI_FIRE_RANGE      = 420;    // px; don't waste shots across the arena
const AI_ENGAGE_RANGE    = 260;    // px; closer than this, stop closing and just shoot
const AI_STAR_DANGER_R   = 95;     // px from star center -> EVADE overrides everything
const AI_ORBIT_MIN       = 120;    // px; preferred standoff band, inner edge
const AI_ORBIT_MAX       = 260;    // px; preferred standoff band, outer edge
const AI_ORBIT_BIAS      = 0.6;    // 0..1 blend of radial correction into the tangent
const AI_LEAD_FACTOR     = 0.9;    // 0=no lead, 1=full first-order lead (<1 = beatable)
const AI_MAX_SPEED       = 210;    // px/s; above this the AI coasts instead of thrusting
```

Sanity relationships the implementation should hold (worth asserting in a test, §6.4):

- `AI_STAR_DANGER_R > STAR_RADIUS + SHIP_RADIUS` by a wide margin — the bot must react
  well before contact. With `STAR_RADIUS + SHIP_RADIUS = 28`, a danger radius of 95 gives
  roughly 0.3 s of reaction room at typical speeds.
- `AI_STAR_DANGER_R < AI_ORBIT_MIN` — otherwise ORBIT would park the bot permanently
  inside its own panic radius and it would thrash between behaviors.
- `AI_FIRE_COOLDOWN >= FIRE_COOLDOWN` — the AI must never out-shoot a human.
- `AI_AIM_TOLERANCE < AI_THRUST_TOLERANCE` — aim is stricter than "worth accelerating."
- `AI_ENGAGE_RANGE < AI_FIRE_RANGE` — there is a band where it shoots without closing.

All twelve are grouped, commented with units, and documented here so the testing phase
can adjust difficulty by editing exactly one block.

---

## 6. Testing Plan

Same method as Cycle 1: **Playwright + the pre-installed Chromium**, driving
`game/cycle2/index.html` over `file://`. Scripts committed under `tests/cycle2/` so the
next cycle can re-run them. Results written to `docs/cycle2/test-results.md`.

Priority order is deliberate: **T2 is the top-priority gap from Cycle 1 and must be
written first**, before AI polish, so that a budget overrun cannot cause it to slip a
second cycle.

### 6.1 Test hooks required in the implementation

Cycle 1 exposed `players`, `get bullets()`, `get gameOver()`. Cycle 2 extends
`window.__orbitDuel` — note Cycle 1's hard-won lesson (documented in its
test-results.md) that **anything reassigned must be a getter, never a snapshot**:

```js
window.__orbitDuel = {
  players,                                   // stable array identity - plain ref is fine
  get bullets()   { return bullets; },       // reassigned by .filter() - getter required
  get particles() { return particles; },     // reassigned - getter required
  get phase()     { return phase; },
  get mode()      { return mode; },
  get winner()    { return winner; },
  get gameOver()  { return phase === 'gameover'; },   // Cycle 1 compatibility
  constants: { WIN_SCORE, FIRE_COOLDOWN, AI_REACTION_DELAY, /* ...all tunables */ },
  test: {
    setPaused(p)          { paused = p; },   // suspends rAF-driven stepping
    step(dt, now)         { step(dt, now); render(); },   // deterministic manual tick
    updateAI(self, target, dt, now),         // AI in isolation, no physics
    registerHit(shooterId, victimId, now),   // THE scoring path (see below)
    startMatch(m), toMenu()
  }
};
```

`registerHit` is the load-bearing one. Cycle 1 inlined kill scoring inside the
bullet-collision double loop. Cycle 2 **extracts that block verbatim into a named
function**:

```js
function registerHit(shooter, victim, now) {
  spawnExplosion(victim.pos, victim.color);
  victim.alive = false;
  victim.respawnAt = now + RESPAWN_DELAY;
  shooter.score += 1;
  if (shooter.score >= WIN_SCORE) { phase = 'gameover'; winner = shooter.id; }
}
```

The collision loop then calls it, and so does the test hook. This matters: the win test
exercises **the real scoring and win-detection code**, not a reimplementation of it, and
not a `score = 5` assignment that would bypass the threshold check entirely. Setting
scores directly would produce a test that passes while the win condition is broken —
precisely the failure Cycle 1 asked us to rule out.

`paused` is a new module-level boolean checked at the top of `frame()`; it exists so
tests can step time deterministically instead of racing the rAF clock.

### 6.2 T2 — Win condition end-to-end **(TOP PRIORITY — closes Cycle 1's gap)**

Full flow, no mocked overlay, no direct score writes:

1. Load `game/cycle2/index.html`; assert `phase === 'menu'`, zero console/page errors.
2. Press `Digit1`; assert `phase === 'playing'`, `mode === '1p'`,
   `players[1].controller === 'ai'`.
3. `test.setPaused(true)` to remove timing flake.
4. Loop `i` from 1 to `WIN_SCORE`: call `test.registerHit('P1','P2', t)`, advancing `t`
   past `RESPAWN_DELAY` and calling `test.step(1/60, t)` between hits so the victim
   actually respawns through the normal path. After each hit assert
   `players[0].score === i`, and assert `phase === 'playing'` for every `i < WIN_SCORE`
   — i.e. the game does **not** end early.
5. After the `WIN_SCORE`-th hit assert: `phase === 'gameover'`, `winner === 'P1'`,
   `players[0].score === WIN_SCORE`.
6. **Overlay is actually drawn** (state alone is not proof the player sees anything).
   Two independent checks:
   a. Sample canvas pixels via `ctx.getImageData` at several points; the Cycle 1 overlay
      fills the screen with `rgba(0,0,0,0.55)`, so mean luminance must drop measurably
      versus a sample captured immediately before the final hit.
   b. Sample the pixel band where `'P1 WINS'` is drawn (centered, `H/2 - 10`) and assert
      non-background pixels in P1's color are present.
7. Dispatch `keydown` `KeyR`.
8. Assert full reset through the real restart path: `phase === 'playing'`,
   `mode === '1p'` (mode preserved), both scores `0`, `winner === null`,
   `bullets.length === 0`, `particles.length === 0`, both ships `alive === true` and at
   their spawn positions with zero velocity, and the overlay pixels back to normal
   luminance.
9. Repeat steps 2–8 once for `Digit2` / `mode === '2p'` with `P2` as the winner, to prove
   the win path is mode-independent and that the `winner === 'P2'` color branch in
   `drawHUD` is exercised.

Explicit anti-goals for this test: it must not assert on `score` having been set
directly, must not call internal render functions to "make" the overlay appear, and must
not depend on wall-clock timing (hence `setPaused`).

### 6.3 T1 — Regression: Cycle 1 behavior still intact

Re-run Cycle 1's two passing tests against `game/cycle2/index.html`, adapted only by
pressing `Digit2` first to enter 2P local mode:

- Load with zero console errors; canvas has non-trivial pixel content.
- Held P1 thrust moves the ship measurably (Cycle 1 measured ~32.8 px over ~0.5 s;
  assert the same order of magnitude — physics constants are unchanged, so a large
  deviation means the intent layer broke something).
- Firing increases `bullets.length`.
- ~6 s mixed-input session near the star: no errors, ships in-bounds, bullet count
  bounded (no runaway accumulation), star-collision + respawn still observed.
- Both P1 **and** P2 human controls respond in 2P mode — the intent refactor's most
  likely regression is wiring one ship's intent to the wrong key set.

Also assert `game/index.html` is unmodified (`git diff --quiet -- game/index.html`) as a
guard on the audit requirement.

### 6.4 T3 — AI behavior (deterministic, hook-driven)

Each runs with `setPaused(true)` and explicit `test.step(dt, now)` ticks:

1. **Aim convergence.** Place the AI at a fixed position, a stationary human at another,
   both far from the star. Step 60 ticks at `dt = 1/60`. Assert `|angleWrap(desired -
   angle)|` ends `<= AI_AIM_TOLERANCE` and decreased monotonically-ish (allow overshoot,
   assert final < initial and final within tolerance).
2. **It shoots.** Same setup, step 2 s. Assert at least one bullet with `owner === 'P2'`
   was created, and that AI shot spacing is `>= AI_FIRE_COOLDOWN` (no cheating rate).
3. **Star evasion.** Place the AI just inside `AI_STAR_DANGER_R` moving toward the star.
   Assert `ai.mode === 'evade'` on the very next tick (proving the latch bypass) and that
   `r` is strictly larger after 1.5 s, and the ship is still `alive`.
4. **Survivability soak.** 1P mode, human ship stationary and never firing, 30 s of
   simulated time. Assert AI deaths-by-star `<= 1` and that `r` stays within
   `[AI_STAR_DANGER_R, arena diagonal]` for at least 90% of sampled ticks. This is the
   regression test for the "AI flies into the sun" failure mode.
5. **It is a real opponent.** Same soak. Assert the AI scores `>= 1` against a stationary
   target within 30 s. Marked **soft** — a failure means tune `AI_LEAD_FACTOR` /
   `AI_FIRE_RANGE`, not that the build is broken; recorded as such in test-results.
6. **It is beatable.** Assert the AI's effective fire rate `<= 1/FIRE_COOLDOWN` and that
   `AI_REACTION_DELAY > 0`, plus the §5 constant-relationship invariants as literal
   assertions. Cheap structural guarantees of fairness.
7. **Determinism.** Run the same fixed-`dt` scripted sequence twice in two fresh page
   loads; assert identical AI intent traces and identical final ship positions
   (within float epsilon). Guards against RNG or wall-clock creeping into the AI.

### 6.5 T4 — Mode select and navigation

- Fresh load → `phase === 'menu'`, `mode === null`, and no ship movement over 1 s
  (the world must be frozen behind the menu).
- `Digit1` → `'playing'` / `'1p'` / `players[1].controller === 'ai'`.
- Fresh load, `Digit2` → `'playing'` / `'2p'` / `players[1].controller === 'human'`.
- Fresh load, `ArrowDown` then `Enter` → `'2p'` (arrow + Enter path reaches the same
  `startMatch`), and `Enter` did not scroll/blur the page.
- `Escape` from `playing` → `'menu'`; scores and bullets cleared; then start a new match
  and confirm no state leaked from the previous one.
- Menu renders non-trivial pixel content (the screen is not blank).

### 6.6 Manual/human testing

Still **not** performed — this remains an unattended run. Feel and difficulty tuning of
the AI constants is reasoned about, not playtested, and must be recorded in
`docs/cycle2/test-results.md` as a known limitation and carried into `state.json`
follow-ups alongside Cycle 1's still-open balance item.

---

## 7. Out of Scope (this pass)

Deliberately excluded; recorded so the boundary is a decision, not an oversight.

**Not doing, by design:**
- **Multiple difficulty levels / difficulty select.** One constant block, one bot. The
  knobs exist (`AI_REACTION_DELAY`, `AI_LEAD_FACTOR`); exposing them in UI is future work.
- **Gravity-aware AI aiming.** The bot uses first-order linear lead and misses around the
  star on purpose (§3.2) — that is a feature and a human-exploitable weakness.
- **AI pathfinding, tactical memory, or learning.** Stateless-per-decision steering only.
- **AI vs AI mode, or 3+ ships.** The `players` array is hardcoded to two.
- **Re-balancing Cycle 1's physics constants.** They stay frozen so any behavioral
  difference observed this cycle is attributable to the new code, not to retuning. Cycle
  1's open human-playtest follow-up stays open.
- **Modifying `game/index.html`.** Frozen for audit; asserted in T1.

**Deferred to a future cycle:**
- Sound effects and music.
- Mobile/touch controls; gamepad support.
- Persistent stats, match history, or high scores (no storage this cycle).
- Networked/online multiplayer.
- Pause during play (only `Esc` → menu, which abandons the match).
- Cross-browser testing beyond Chromium (matches the environment's available browser).
- Visual polish beyond the menu screen: ship trails, screen shake, animated transitions.
- Extracting the game into modules or adding a build step — the single-file constraint is
  what keeps this prototype cheap to run and test.

---

## 8. Implementation Order (for the next phase)

1. Copy `game/index.html` → `game/cycle2/index.html`, verify it runs unchanged.
2. Add AI constant block + `angleWrap` helper.
3. Refactor to the intent layer (§2.3); confirm 2P still plays identically (T1).
4. Extract `registerHit` + expand test hooks (§6.1).
5. **Write and pass T2, the win-condition E2E test** — before any AI work, so the
   Cycle 1 gap is closed even if the budget runs short.
6. Add `phase` / `mode` state machine + `drawMenu()` + mode-aware hint (T4).
7. Implement `updateAI` (T3).
8. Tune the AI constant block against T3's soft assertions; record results.
9. Write `docs/cycle2/test-results.md`; checkpoint `state.json`.
