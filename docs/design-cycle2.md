# Echo Vault — Design (Cycle 002)
Single self-contained `game2/index.html` (no deps/build). Logic is a pure, DOM-free core exposed as `window.EchoVault` so it can be tested in Node.

## Rules
- Grid levels: `#` wall, `.` floor, `S` start, `E` exit, `P` plate, `D` door (all doors are open only while EVERY plate is occupied by the player or a ghost).
- Turn-based: each keypress (arrows/WASD, or Space to wait) advances one tick for the player AND all ghosts.
- Loop: press **Enter** to end the current loop: the recorded move list becomes a new ghost (max 3 ghosts), everything resets to start. Press **Backspace** to reset the level and clear ghosts.
- Ghosts replay recorded moves from start; after their list ends they stay put (holding whatever plate they're on).
- Door tile is blocked unless a plate is occupied (by player or ghost) at the start of the tick's resolution. Entities can't move into a closed door or wall; a blocked move = wait.
- Win: player steps on E while E reachable. Loop count is the score (lower is better).

## Architecture
`createLevel(rows)`, `newGame(level)`, `step(game, dir)`, `endLoop(game)`, `resetLevel(game)`; UI renders canvas from state.
Door state computed at start of each tick from end-of-previous-tick occupancy; all entities in that tick use it. Entities may share tiles.

## Tests (Node, `game2/test.js`)
Movement/walls, ghost replay determinism, door blocked without plate, level 1..3 solvable via scripted solutions, ghost cap.
