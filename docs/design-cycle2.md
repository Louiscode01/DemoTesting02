# Echo Steps — Design (cycle 2)

Single file `game2/index.html`, canvas 2D, no deps. Pure logic in `Echo` object (exposed as `window.Echo`)
so tests drive it without rendering.

## Rules
- Grid levels as ASCII: `#` wall, `.` floor, `S` start, `E` exit, lowercase `a-c` plates, uppercase `A-C` doors.
- Turn-based: each action (move or wait) advances time `t` by 1. MAX_STEPS = 40 per loop.
- A door is open while any entity (player or ghost) stands on the same-letter plate (state at time t, before the move).
- **Enter**: finish the loop. The recorded path becomes a ghost that replays from t=0 and rests on its final cell
  forever. Player returns to S. Max 3 ghosts (oldest dropped).
- **Z** restart current loop (keep ghosts) · **X** restart level · reaching E completes the level.
- Controls: arrows/WASD move, Space wait, Enter finish loop.

## Test plan
Headless Chromium via Playwright: load all levels, run scripted solutions through `Echo`, assert level
completion, check wall/door blocking, ghost replay, and no console errors.
