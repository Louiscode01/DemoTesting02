# Echo Cavern — Design

Single file `game2/index.html`, canvas 2D, no deps/assets/build.

- **Maze**: DFS recursive-backtracker on an NxM cell grid (perfect maze => solvable). Level n grows grid size (min 8x6, +1 col/row every 2 levels, capped). Remove a few extra walls for loops. Walls stored as grid of cells with 4 wall flags; rendered as segments.
- **Player**: circle, WASD/arrows, wall collision via per-axis cell-wall segment tests. Start top-left cell, exit bottom-right cell.
- **Sonar**: Space spawns a ring (radius grows at PING_SPEED to PING_MAX). Wall segments within ring band get `revealT = REVEAL_TIME`; fade out. Cooldown PING_COOLDOWN. Each ping increments the ping counter.
- **Hunters**: count = 1 + floor(level/2). Spawn far from player. Wander when idle; on a ping (within HEAR_RADIUS of the ping, ignoring walls) they set a target = ping origin and pathfind (BFS over maze grid) to it, moving at HUNTER_SPEED. Visible only when a ping ring touches them. Touching player => lose life/restart level (3 lives).
- **Scoring**: level clear gives max(0, 1000 - 50*pings - time); total shown. Game over after 3 lives; R restarts.
- **Hooks**: `window.__echo` exposes state and `newGame(seed)`, seeded RNG for testing.
- **Tests (Playwright)**: no console errors; maze solvable (BFS from start to exit using exposed grid); ping reveals walls; moving changes position; hunter reacts to ping (target set); reaching exit advances level; hunter touch costs a life.
