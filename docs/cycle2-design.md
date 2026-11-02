# Prism Path — Design

Single file `game/prism-path.html`, canvas 2D, no deps.

## Model
- Grid W x H (cells). Cell types: empty, wall, source (fixed direction), target, mirror (`/` or `\`, rotatable by click).
- `trace(grid)`: pure function; step beam from source cell by direction; mirror `/` maps dir (dx,dy)->(-dy,-dx), `\` maps ->(dy,dx);
  stops on wall/edge/target; loop guard with visited (cell,dir) set. Returns path segments and set of lit targets.
- Win: all targets lit.
## Generation (solvable by construction)
1. Source on left edge going right. Random walk: travel k cells, at random cell place a mirror turning 90 degrees, avoiding
   revisiting cells; end with a target. Repeat for N targets by branching? Keep to single beam through all targets
   placed along the path (targets are pass-through-lit? No: target absorbs) -> use ONE target at path end; difficulty via
   decoy mirrors and walls. Level n: grid grows, more mirrors.
2. Decoy mirrors placed on empty cells not on the path.
3. Scramble: each path mirror gets random orientation. If scrambled state already wins, rescramble.
Solved state exists by construction (original orientations); exposed as `window.__prism.solve()` for tests.
## Controls
Click / tap a mirror to flip orientation (`/`<->`\`). `R` new level, `N` next after win, move counter, level counter.
## Test plan
Playwright: no console errors; for 20 seeds generated levels are unsolved at start, and `solve()` makes trace win;
clicking a mirror toggles it and trace changes; win overlay shows.
