# Echo Vault — Design (Cycle 2)

Single self-contained `game2/index.html` (canvas, no deps, no build).

**Rules:** grid levels. `#` wall, `S` start, `E` exit, `a-c` pressure plates, `A-C` doors. A door is open during a tick if any actor stood on its plate at the end of the previous tick. Actors don't block each other. One action per tick (move/wait). Pressing Enter commits the current loop as a ghost; a new clone spawns at S while all ghosts replay from tick 0 (ghosts stay put after their recording ends). Reaching E with the live clone wins the level.

**Architecture:** `simulate(level, ghostMoves[], liveMoves[])` is a pure function returning positions/doors/won, recomputed from scratch on every input (gives free undo via Backspace). Rendering and input are thin layers. Test hook: `window.__echo`.

**Controls:** arrows/WASD move, Space wait, Enter commit loop, Backspace undo, R restart level, N/P next/prev level.

**Levels:** 1 one plate/door; 2 two doors in series (2 ghosts); 3 three doors (3 ghosts).

**Tests:** headless Chromium: load, scripted solution for each level must win; check unsolved state doesn't win.
