# Drift Maze: Deep Drift — Test Results

Date: 2026-11-11
Phase: testing (Cycle 3)
Method: Node scripts plus headless Chromium (Playwright). No human playtest.

## How to run
```
node scripts/test-slide-rules.js
node scripts/solve-levels.js
node scripts/test-generator.js          # optional arg: seeds per tier (default 150)
NODE_PATH=$(npm root -g) node scripts/browser-test.js
```
Play: open `game/drift-maze.html` in a browser. No server or build step.
Endless mode: press `M`, or open `game/drift-maze.html?mode=endless&seed=4242`.

## Results

| Suite | Result |
|---|---|
| Slide rules and solver (`test-slide-rules.js`) | 20 / 20 pass |
| Campaign validation (`solve-levels.js`) | 10 / 10 levels solvable, declared mechanics used |
| Generator (`test-generator.js`) | 600 levels (150 seeds x 4 tiers), all checks pass |
| Browser (`browser-test.js`) | 20 / 20 assertions pass |

### Generator: measured difficulty by tier (150 seeds each)

| Tier | Par min / median / max | Target | In band | Routes using cracked / gate / teleport | Slowest generation |
|---|---|---|---|---|---|
| Breeze | 5 / 6 / 6 | 4-6 | 150/150 | 0 / 0 / 0 | 18 ms |
| Current | 6 / 7 / 8 | 6-8 | 150/150 | 149 / 91 / 0 | 16 ms |
| Riptide | 8 / 9 / 11 | 8-11 | 150/150 | 146 / 90 / 110 | 26 ms |
| Maelstrom | 10 / 12 / 16 | 10-16 | 150/150 | 149 / 77 / 137 | 40 ms |

Every generated level was deterministic for its seed, had a sealed border and exactly
one start and exit, was solved by its stored solution, and had a par matching an
independent re-solve.

### Campaign pars under the new cracked-wall rule
3, 5, 5, 8, 3, 4, 1, 2, 6, 6 (was 3, 5, 4, 6, 3, 4, 1, 2, 5, 5). All ten levels remain
solvable with no level edits.

### Browser test coverage added this cycle
Par shown in the HUD; a cracked wall shatters during play; undo restores move count and
the wall; the hint matches the solver's next optimal move; a seeded endless run produces
the same level in the browser as in Node; four endless levels are solved from their
generated solutions across the Breeze to Current tier boundary; run totals are correct;
no console errors in the session. Screenshot: `docs/cycle3-endless-screenshot.png`.

## Issues found during this cycle
- The first teleport-loop unit test used a board that cannot loop (`.12`). Replaced with
  one that does (`2..1`, starting between the pads), which confirmed the `overflow` flag.
- Maelstrom's first target band (11-16) was met by only 34 of 60 seeds at 160 attempts.
  Raising attempts to 400 and the band floor to 10 brought it to 150 of 150.

## Known limitations
- Par length is the only difficulty measure. A long solution is not always a hard one;
  whether the tiers *feel* progressively harder still needs a human playtest.
- Campaign levels 7 and 8 are still one- and two-move levels. They were left unchanged;
  Endless mode is now where the difficulty is.
- A mid-level reset or undo is free; there is no penalty in the run score.
- Chromium only.
