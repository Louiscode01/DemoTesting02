# Echo Heist — Design

Phase: design. Single file `game/echo-heist.html`, canvas 2D, no deps, no build.

## Rules
- Fixed 60Hz simulation. Player moves 3px/tick (WASD/arrows) in a tile map (40px tiles).
- Tiles: `#` wall, `.` floor, `S` start, `E` exit, lowercase letter = pressure plate, uppercase = door of same letter.
- A door is open while any actor (player or echo) stands on its plate. Closed doors are solid for the player.
- A loop lasts up to 900 ticks. `R` (or timeout) ends it: the recorded positions become an echo, replayed from tick 0
  in every later loop; after its recording ends the echo stays put at its last position (can hold a plate).
- Max 3 echoes (oldest dropped). `Backspace` resets the level. Reaching `E` in the live loop clears the level.

## Architecture
- Pure sim: `createSim(levelIdx)`, `step(sim, input)`, `endLoop(sim)` — DOM-free, deterministic, exposed on `window.EchoHeist` for tests.
- Rendering + input + rAF accumulator loop separate from sim.

## Test plan
Headless Chromium: (1) load without errors, (2) scripted solutions of all 3 levels through the sim API (with unsolvability
sanity check: level 1 cannot be cleared with zero echoes), (3) keyboard-driven smoke test.
