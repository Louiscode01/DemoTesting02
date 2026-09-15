# Orbit Duel: Rival AI — Design & Implementation Plan

Date: 2026-09-15
Phase: design
Cycle: 2 (builds on Cycle 1's shipped `game/index.html`)

## Concept Summary
Add a single-player mode to the existing local-2-player gravity duel. Player 2's ship can
be flown by a **Rival AI** pilot: a predictive-targeting bot that aims by forward-
simulating candidate bullet trajectories through the same gravity well the sim applies, so
it deliberately fires curved shots around the star instead of straight-lining at its
target. The player picks 2-player local or vs-AI on a title screen before the match. This
cycle also closes the Cycle 1 testing gap with an automated end-to-end test of the win
condition and restart flow.

## Architecture

**Decision: modify `game/index.html` in place. No second file, no build step, no external
dependencies** — same constraint as Cycle 1.

Justification: the AI needs `gravityAccel()`, `CENTER`, the tunable constants, and the
exact bullet integration order used in `step()`. Splitting it into a second file would
either duplicate that physics (guaranteeing AI and sim drift apart) or require ES modules
/ a bundler, which breaks the "double-click the file, it runs from `file://`" property that
Cycle 1's tests rely on. The net-new code is roughly 120–150 lines in one IIFE; a single
file stays readable with section comments.

### New/changed sections inside the existing script (in order)
1. **Tunable constants** — append an `// --- AI pilot ---` block (see §5). No Cycle 1
   constant values change this pass.
2. **Game state** — replace the `gameOver` boolean with `let phase = 'menu' | 'playing' |
   'gameover'`, plus `let mode = null` (`'local' | 'ai'`). `gameOver` survives only as a
   derived getter on the test hook so Cycle 1 tooling doesn't break.
3. **Ship model** — `makeShip()` gains `isAI: false` and an `ai: null` scratch object
   (per-ship AI memory: cached aim angle, retarget timer, debug counters).
4. **Intent layer (new)** — `readIntent(ship)` returns `{ left, right, thrust, fire }`.
   For a human ship it reads `keysDown`; for an AI ship it calls `aiDecide(ship, target)`.
   `step()`'s per-ship block is rewritten to consume `intent.left` etc. instead of
   `keysDown.has(k.left)` — a ~6-line diff, and the AI is then physically incapable of
   doing anything a human can't.
5. **AI pilot module (new)** — `aiDecide()` + `simulateShot()` helpers (see §3).
6. **Kill bookkeeping (new helper)** — extract `registerKill(shooterId, victim, now)` from
   the bullet-collision loop (score increment, explosion, respawn scheduling, win check,
   `phase = 'gameover'`). Both the collision path and the test hook call it, so the e2e test
   drives the *real* win transition rather than flipping a flag.
7. **Menu render + input** — `drawMenu()` and two key bindings (see §4).

## AI-decision module design

`aiDecide(ship, target)` runs **once per tick**, before physics, and returns the same
`{left, right, thrust, fire}` control surface a human produces. It never writes to
`ship.vel`, `ship.pos`, or `bullets`.

### Aiming: sampled trajectory search through the gravity well

Chosen approach — **fan of candidate firing angles, each forward-simulated with the sim's
own `gravityAccel()`**:

1. Every `AI_RETARGET_INTERVAL` seconds (not every frame — cheaper and stops aim jitter),
   compute the direct bearing from `ship.pos` to `target.pos`.
2. Generate `AI_AIM_SAMPLES` candidate angles evenly spread across `±AI_AIM_SPREAD`
   radians around that bearing.
3. For each candidate, run a throwaway simulation of `AI_SIM_STEPS` steps at a fixed
   `AI_SIM_DT`:
   - **Virtual bullet**: initialized exactly as the real fire code does
     (`vel = ship.vel + dir * BULLET_SPEED`), then integrated with `vel += gravityAccel(pos) * dt;
     pos += vel * dt` — the same two lines, same order as the real bullet loop.
   - **Virtual target**: integrated with gravity + `SHIP_DRAG` only. The AI cannot know
     the target's future thrust input, so it assumes none. This is an honest, bounded
     prediction; it degrades gracefully into "shoot where they're drifting."
   - Abort a candidate if the virtual bullet enters `STAR_RADIUS` (the real sim absorbs
     it) or leaves the arena bounds (wrap is ignored in prediction — see limitations).
4. Score each candidate by the **minimum distance** reached between virtual bullet and
   virtual target over the horizon. Keep the best.
5. If `bestMinDist < AI_AIM_TOLERANCE`, a firing solution exists: cache
   `ship.ai.aimAngle = bestAngle + randomJitter(AI_AIM_JITTER)` and `ship.ai.hasSolution = true`.
   Otherwise `hasSolution = false` and the AI holds fire while it repositions.

Cost: `AI_AIM_SAMPLES (9) × AI_SIM_STEPS (45)` ≈ 400 vector updates, ~10× per second.
Negligible at 60fps, and no allocation if the loop reuses two scratch `{x,y}` objects.

**Why this over a closed-form lead approximation:** a closed-form lead solves
"straight-line bullet vs. moving target," which structurally cannot express the curvature
that *is* the concept — the AI would systematically miss any shot passing near the star,
i.e. the interesting half of the arena. The sampled search needs no new math at all:
`gravityAccel(pos)` is already a pure function of position, so the whole predictor is ~20
lines reusing it, and because it replays the sim's own integration the AI's prediction is
correct by construction rather than by derivation. It is also self-limiting — if it proves
too strong or too slow, `AI_AIM_SAMPLES` / `AI_SIM_STEPS` / `AI_AIM_JITTER` tune it
without restructuring anything.

Known, accepted limitations: screen-wrap is not modeled in prediction (the AI never
attempts a wrap-around trick shot), and it assumes a non-thrusting target. Both are fine
for a prototype and are listed in §7.

### Movement / positioning

Deliberately simple: each tick the AI picks **one `desiredAngle` and a `wantThrust` flag**
by priority, then converts that into rotate/thrust booleans. No pathfinding, no orbital
mechanics solving.

1. **Escape star** (highest priority) — if `dist(ship, CENTER) < AI_DANGER_RADIUS`, or the
   ship's position extrapolated `AI_ESCAPE_LOOKAHEAD` seconds forward (current velocity +
   gravity, one Euler step) lands inside `AI_DANGER_RADIUS`: `desiredAngle` = radially
   outward from the star, `wantThrust = true`. This is the only hard safety behavior and
   it directly prevents the AI from suiciding into the star (which would otherwise hand
   the player free breathing room, though not points).
2. **Reposition** — else if `dist(ship, target)` is outside
   `[AI_RANGE_MIN, AI_RANGE_MAX]`: `desiredAngle` = bearing toward (or directly away from)
   the target, rotated by `AI_ORBIT_BIAS` radians toward the local tangential direction
   around the star, so the AI arcs around the well instead of ploughing through it.
   `wantThrust = true`.
3. **Engage** — else `desiredAngle = ship.ai.aimAngle`, `wantThrust = false` (coast and
   shoot).

Conversion to controls, shared by all three states:
- `d = shortestSignedAngleDelta(ship.angle, desiredAngle)`;
  `left = d < -AI_AIM_DEADZONE`, `right = d > AI_AIM_DEADZONE`.
- `thrust = wantThrust && Math.abs(d) < AI_THRUST_ALIGN_TOL` — no burning in the wrong
  direction while still turning.
- `fire = ship.ai.hasSolution && Math.abs(shortestSignedAngleDelta(ship.angle,
  ship.ai.aimAngle)) < AI_FIRE_ANGLE_TOL`. Cooldown is *not* checked here; the existing
  `ship.cooldown` gate in `step()` handles it, exactly as it does for a human holding the
  fire key.

A useful free consequence: in states 1 and 2 the ship's facing is driven by movement, so it
rarely satisfies the fire tolerance and naturally holds fire while maneuvering.

`ship.ai` also accumulates debug counters (`ticks`, `fires`, `rotateTicks`, `thrustTicks`,
`hasSolution`, `aimAngle`) used by the §6 smoke test.

## Mode-select UI

In-canvas, consistent with Cycle 1's "no DOM chrome beyond the hint line" approach.

- `phase` starts at `'menu'`. `step()` early-returns unless `phase === 'playing'` (one line,
  replacing the existing `if (gameOver) return;`). `render()` draws the normal scene plus
  `drawMenu()` when `phase === 'menu'` — a dimmed overlay with the title, "1 — 2 Players
  (local)", "2 — vs Rival AI", and the control reminders. The physics sim being paused
  behind a static, already-initialized world means no new initialization order to get wrong.
- Keydown additions in the existing listener (no new listeners):
  - `phase === 'menu'` and `Digit1` → `startGame('local')`; `Digit2` → `startGame('ai')`.
  - `phase === 'gameover'` and `KeyR` → `startGame(mode)` (restarts the **same** mode —
    preserves Cycle 1's restart semantics exactly); `KeyM` → `phase = 'menu'`.
- `startGame(m)` = the existing `resetGame()` body, plus `mode = m`,
  `players[1].isAI = (m === 'ai')`, reset `players[1].ai`, `phase = 'playing'`.
- HUD: the right-hand score label reads `AI` instead of `P2` when `mode === 'ai'`; the win
  overlay uses the same label and gains a "M for menu" line under "Press R to restart".
- The `#hint` div below the canvas is updated to mention mode select.

Total state-machine change: one new variable, one early-return condition, two key branches,
one draw function. No rewrite of the loop.

**Gotcha for implementation:** the menu now gates gameplay, so anything that previously
assumed the game was live on load (including Cycle 1's smoke tests) must call
`startGame(...)` first. §6 accounts for this.

## New / changed tunable constants

All ALL_CAPS at the top of the script, matching Cycle 1. **No Cycle 1 constant values are
changed this pass** — physics/feel retuning remains the open follow-up and would invalidate
Cycle 1's test baseline mid-cycle.

Aiming:
- `AI_AIM_SAMPLES = 9` — candidate firing angles per search.
- `AI_AIM_SPREAD = 0.9` — radians, half-width of the candidate fan around direct bearing.
- `AI_SIM_STEPS = 45` — forward-simulation horizon in steps.
- `AI_SIM_DT = 1 / 30` — fixed prediction timestep (frame-rate independent AI).
- `AI_AIM_TOLERANCE = 18` — px; min predicted miss distance that counts as a solution.
- `AI_FIRE_ANGLE_TOL = 0.10` — radians; facing error allowed when pulling the trigger.
- `AI_AIM_DEADZONE = 0.03` — radians; stop rotating inside this, prevents oscillation.
- `AI_RETARGET_INTERVAL = 0.10` — seconds between full aim searches.
- `AI_AIM_JITTER = 0.035` — radians of random aim error; primary difficulty knob.

Movement:
- `AI_DANGER_RADIUS = 90` — px from star center that triggers the escape burn.
- `AI_ESCAPE_LOOKAHEAD = 0.6` — seconds of extrapolation for the danger check.
- `AI_RANGE_MIN = 140` — px; closer than this, back off.
- `AI_RANGE_MAX = 340` — px; farther than this, close in.
- `AI_ORBIT_BIAS = 0.5` — radians of tangential bias applied while repositioning.
- `AI_THRUST_ALIGN_TOL = 0.5` — radians; only thrust when roughly facing the desired heading.

Mode identifiers (not tuning, but named constants for consistency):
- `MODE_LOCAL = 'local'`, `MODE_AI = 'ai'`.

## Testing plan

Deliverables: `tests/e2e.spec.js` and a minimal `playwright.config.js`
(`testDir: './tests'`, headless Chromium project). Tests load `game/index.html` over a
`file://` URL — the same method Cycle 1 used successfully; no server, no `package.json`
required to run `npx playwright test`.

### Extended test hook
`window.__orbitDuel` is extended (existing members kept; `bullets` stays a getter for the
reason documented in Cycle 1's test results):

```
players, get bullets(), get phase(), get mode(), get winner(),
get gameOver()   // derived: phase === 'gameover'  — back-compat for Cycle 1 checks
startGame(mode)  // bypass the menu from a test
awardKill(id)    // calls the SAME registerKill() the bullet-collision path calls
get aiDebug()    // players[1].ai counters: ticks, fires, rotateTicks, thrustTicks, hasSolution
setAimJitter(n)  // force AI_AIM_JITTER to 0 for determinism if flakiness appears
```

`awardKill` deliberately routes through `registerKill()` rather than assigning
`score`/`phase` directly, so the win transition, overlay trigger, and respawn scheduling
are genuinely exercised — the point of closing this gap is testing the *path*, not the flag.

### Test 1 & 2 — port Cycle 1's ad-hoc smoke checks into the suite
Load, zero console/page errors, non-trivial canvas pixel content, held-thrust moves P1,
firing increases bullet count; plus the ~6s mixed-input session. Both must now call
`__orbitDuel.startGame('local')` after load (the menu gates the sim).

### Test 3 — win condition + restart flow (closes the Cycle 1 gap)
1. `page.goto('file://.../game/index.html')`; `page.waitForFunction(() => window.__orbitDuel)`.
2. `startGame('local')`; assert `phase === 'playing'`.
3. Capture a **pre-win pixel baseline**: count pixels in the band `y ∈ [H/2+10, H/2+40]`
   matching near-white UI text (`r > 180 && b > 200`) via `getImageData` inside
   `page.evaluate`. This filter excludes the star (`#ffdc8c`) and its orange glow, whose
   blue channel is low, so the baseline is ~0.
4. Call `awardKill('P1')` `WIN_SCORE` times.
5. Assert state: `players[0].score === 5`, `winner === 'P1'`, `phase === 'gameover'`,
   `gameOver === true`.
6. Assert the overlay is actually **rendered**, not merely flagged: after one
   `requestAnimationFrame`, the same band's near-white pixel count is now > 200 (the
   "Press R to restart" line), and full-canvas mean luma has dropped (the
   `rgba(0,0,0,0.55)` dim).
7. Restart: `page.keyboard.press('r')` (produces `e.code === 'KeyR'`, which the existing
   window-level listener reads).
8. Assert the reset actually took: `phase === 'playing'`, both scores `0`, `winner === null`,
   `bullets.length === 0`, both ships `alive`, and the overlay band's near-white pixel count
   is back to ~0.
9. Zero console errors throughout.

### Test 4 — AI opponent smoke test
1. `startGame('ai')`; assert `players[1].isAI === true` and `mode === 'ai'`.
2. Record `players[1].angle`, `aiDebug.fires`, and the count of bullets with `owner === 'P2'`.
3. Run ~2.5s of real time (`page.waitForTimeout(2500)`) with no player input. P1 sitting
   at spawn is a valid static target and the easiest case — appropriate for a smoke test.
4. Assert **agency, not drift**:
   - `players[1].angle` changed. Gravity never rotates a ship; `angle` only moves via
     rotate input, so this is exact proof the AI issued rotation commands.
   - `aiDebug.fires > 0` **and** at least one bullet with `owner === 'P2'` was observed
     (poll during the window, since bullets expire) — proof it pulled the trigger.
   - `aiDebug.ticks > 60` — the decision function is actually running each tick.
   - `aiDebug.thrustTicks > 0` — it maneuvered at least once.
   - No `NaN` in `players[1].pos`/`vel`/`angle` (catches a divide-by-zero in the
     trajectory search), and zero console errors (catches an exception swallowed by rAF).
5. If the fire assertion proves timing-flaky, call `setAimJitter(0)` at step 1 and extend
   the window to 4s before weakening the assertion.

Results, including any constants tuned in response, go in `docs/cycle2-test-results.md`.

## Out of scope for this pass
- Sound effects / music (still).
- More than 2 ships; AI-vs-AI mode.
- Selectable AI difficulty levels in the UI (`AI_AIM_JITTER` is a code-level knob only).
- Bullet-dodging / threat-evasion AI — the AI avoids the star, not incoming fire.
- Wrap-aware or thrust-predicting trajectory search (documented limitations in §3).
- Retuning Cycle 1 physics constants (`SHIP_THRUST`, `SHIP_DRAG`, `G`, `BULLET_SPEED`) —
  the human playtest follow-up stays open and is not blind-guessed here.
- Persistent stats, match history, or menus beyond the in-canvas overlay.
- Mobile/touch controls; networked play.
- Cross-browser testing beyond headless Chromium (matches available environment).
