# Lantern Flock — Design & Implementation Plan

Date: 2026-10-13
Phase: design

## Summary
Mouse (or arrow/WASD keys) moves a lantern. 40 fireflies flock and are attracted to the
lantern within a radius. Guide them to the exit zone on the right. Shadow wisps roam and
kill any firefly they touch (wisps are repelled by the lantern's bright core, so the
lantern can also be used defensively). Level ends when all fireflies are saved or dead.
Win = save >= 50%.

## Architecture
Single file `game/lantern-flock.html`; inline CSS/JS; Canvas 2D; rAF loop with clamped dt.
1. Constants block (all tunables): FLOCK_N, SEPARATION/ALIGN/COHESION weights, LANTERN_PULL,
   LANTERN_RADIUS, MAX_SPEED, WISP_N, WISP_SPEED, EXIT rect.
2. State: lantern {x,y}, boids[], wisps[], saved, lost, phase (`playing`|`over`).
3. Input: mousemove sets lantern target; WASD/arrows move it; R restarts.
4. Update: boid rules over neighbours (O(n^2), n=40 fine), lantern attraction,
   wall steering, wisp wander + chase nearest firefly + flee from lantern core;
   collision -> firefly lost; reaching exit -> saved.
5. Render: dark background, radial lantern glow, firefly glows, wisp shadows, HUD.
6. Test hook: `window.__flock` live getters (state, boids, wisps, setLantern, step).

## Testing plan (Playwright + headless Chromium)
- Load with no console errors; canvas has non-trivial pixels.
- Boids cluster/move toward lantern after moving it.
- Deterministic sim: drive lantern to exit via test hook, assert saved > 0 and phase `over` reached.
- Restart resets state.
