# Tether Duel — Design & Implementation Plan

Date: 2026-08-31
Phase: design

## Concept Summary
Local 2-player arena game. Two ships are connected by an elastic tether: drifting
farther apart than a rest length builds spring tension that pulls both ships back
together, and a short-cooldown "yank" lets a player forcibly reel the opponent toward
themselves. Static hazard zones are scattered around a bounded (non-wrapping) arena;
getting pulled or flown into one costs a life. First to lose 3 lives loses.

This intentionally reuses cycle 1's proven technical shell (single-file canvas game,
vector physics, local two-player keyboard input, exposed test hooks) while swapping the
core mechanic (elastic tether tension + yank vs. a central gravity well + bullets), so
the prototype is fresh rather than a re-skin.

## Architecture

Single self-contained file: `game/tether-duel.html` (cycle 1's `game/index.html` is
left untouched). No build step, no external dependencies, no assets — inline `<style>`
and `<script>`, HTML5 Canvas 2D rendering, `requestAnimationFrame` game loop.

### Core modules (all inline, organized by section comments in one script)
1. **Vector helpers** — same `{x, y}` + add/sub/scale/len/norm pattern as cycle 1.
2. **World state** — bounded arena (no screen-wrap, unlike Orbit Duel — wrap would make
   "which side of the wrap is the tether shorter through" ambiguous, so this pass keeps
   the arena a simple bounded box with wall clamping), two `Ship` objects, a static
   `hazards` array (fixed-position circular hazard zones), game phase
   (`playing` | `roundEnd`).
3. **Input** — same key layout as cycle 1 for muscle-memory consistency: P1 `A`/`D`
   rotate, `W` thrust, `Space` = yank. P2 `ArrowLeft`/`ArrowRight` rotate, `ArrowUp`
   thrust, `Enter` = yank. Yank is rate-limited per-ship (cooldown timer), no bullets
   this time.
4. **Physics step** (fixed-ish `dt` from `requestAnimationFrame` delta, clamped):
   - Ship thrust adds acceleration along facing angle; linear velocity damping
     (space-drag), same arcade-feel approach as cycle 1.
   - **Tether spring force:** if distance between ships > `TETHER_L_REST`, apply a
     Hooke's-law force (`k * (dist - L_REST)`, clamped to `TETHER_MAX_FORCE`) pulling
     each ship toward the other along the line between them. No force below rest length
     (tether can go slack).
   - **Yank:** on cooldown-gated input, apply an instant velocity impulse to the
     *opponent* directed toward the yanking player, scaled by current tether stretch
     (more effective at range — rewards baiting the opponent out), plus a smaller
     recoil impulse on the yanking player themselves (Newton's-third-law feel).
   - Arena bounds: clamp ship position to the canvas box (soft push-back near edges)
     instead of wrapping.
   - **Hazard collision:** circle-circle check between ship and each static hazard;
     on hit, ship loses a life, gets knocked back away from the hazard center, and
     becomes briefly invulnerable (`INVULN_TIME`) with a visual flicker; if lives reach
     0, the round ends and the other player wins.
5. **Render step** — draw arena background/border, hazards (spike-styled circles),
   the tether as a line between ships (color/thickness shifts with tension), ships as
   triangles oriented by facing angle + thrust flame, HUD (lives as pips per player,
   yank-cooldown indicator), and a win overlay with restart prompt.
6. **Game loop** — `requestAnimationFrame` driving input resolution -> physics step ->
   collision resolution -> render, plus a round/win-state machine (`R` key restarts).

## Tunable constants (top of script, single source of truth)
`SHIP_THRUST`, `SHIP_ROT_SPEED`, `SHIP_DRAG`, `TETHER_L_REST`, `TETHER_L_MAX_VISUAL`,
`TETHER_K`, `TETHER_MAX_FORCE`, `YANK_COOLDOWN`, `YANK_IMPULSE`, `YANK_RECOIL`,
`HAZARD_RADIUS`, `SHIP_RADIUS`, `LIVES_START`, `INVULN_TIME`.

## Testing plan
Carrying forward cycle 1's explicit follow-up ("automated end-to-end test of the win
condition + restart flow was not covered"), this cycle's test pass adds that coverage
from the start rather than deferring it:
1. **Load & interaction smoke test** (headless Chromium via Playwright): no console
   errors on load, canvas renders non-trivial pixel content, holding P1 thrust
   measurably changes ship position, and pressing yank while in range measurably
   changes the opponent's velocity (confirms the tether/yank physics path runs, not
   just that the page parses).
2. **Extended session stress test** (~6s simulated mixed input): no errors, both ships
   stay within arena bounds, tether distance stays within a sane range (never balloons
   to an unstable value), lives never go negative.
3. **Scripted win-condition + restart e2e test (new this cycle):** drive one player's
   lives down via the exposed test hook / a scripted hazard collision until
   `gameOver` flips true and `winner` is set to the correct player id, then simulate
   pressing `R` and assert state resets (lives back to `LIVES_START`, `gameOver` false).
- No human playtest is performed (unattended automated run) — fun/balance tuning is
  reasoned about, not hand-tuned, and flagged as a follow-up as in cycle 1.

## Out of scope for this pass (documented as future work)
- Sound effects/music.
- More than 2 players / AI opponent.
- Persistent match history or menu screens beyond the in-canvas HUD.
- Mobile/touch controls.
- Moving/dynamic hazards (this pass uses static hazard zones only).
