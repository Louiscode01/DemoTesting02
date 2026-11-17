# Drift Maze: Cartographer — Test Results

Date: 2026-11-17
Phase: testing
Method: Node scripts plus Playwright with headless Chromium against
`game/drift-maze.html` over `file://`. No human playtest was performed.

## Result: every suite passes, no console or page errors

| Suite | Command | Result |
|---|---|---|
| Difficulty analysis | `node scripts/test-difficulty.js` | 14 / 14 |
| Campaign validation | `node scripts/solve-levels.js` | 12 / 12 levels, curve and curation checks pass |
| Slide rules and solver | `node scripts/test-slide-rules.js` | 20 / 20 |
| Generator | `node scripts/test-generator.js` | 600 levels, median par by tier 6 < 7 < 9 < 12 |
| Browser | `node scripts/browser-test.js` | 39 / 39 |
| Orbit Duel regression | `node scripts/orbit-duel-test.js 40` | all pass |

What the new checks cover:
- **Analysis**: hand-built boards with known answers (corridor 0 bits; open room 1 bit and
  2 shortest routes; gate pocket 2 trap states of 3 and log2(3) bits; sealed exit
  unsolvable). Par from the analysis equals par from the solver on 200 generated boards,
  and the median score rises with generator tier (9.6 < 12.9 < 16.3 < 21.2).
- **Necessity**: true for a cracked wall on the only route, false for pads the route
  ignores.
- **Campaign**: stored par and score equal computed values; no level under par 3; every
  listed mechanic is necessary; the level file is byte-identical to a fresh curation run.
- **Browser**: star rule; bests saved and kept across reload; reload resumes at the
  furthest unlocked level; level select bounded by progress; hinted solve earns 1 star and
  does not overwrite a 3-star record; two moves over par earns 2 stars; daily level equals
  the Node level for the same date; daily result saved; `T` opens today's UTC date; a
  corrupt save is ignored; the game plays with storage blocked; **all 12 campaign levels
  are solved at par through real key presses, ending at 36 / 36 stars**.

## The curated campaign

| # | Level | Par | Score | Bits | States | Must use |
|---|---|---|---|---|---|---|
| 1 | First Slide (hand) | 3 | 4.5 | 3.0 | 5 | |
| 2 | Corridors (hand) | 5 | 6.5 | 4.0 | 5 | |
| 3 | Brittle Wall (hand) | 5 | 9.3 | 6.8 | 20 | cracked |
| 4 | Double Break | 7 | 9.5 | 6.0 | 16 | cracked |
| 5 | One Way Out (intro) | 4 | 5.0 | 3.0 | 5 | gate |
| 6 | Gatekeeper | 6 | 9.6 | 6.6 | 17 | gate |
| 7 | Warp Step (intro) | 4 | 4.6 | 2.6 | 6 | teleport |
| 8 | Warp Detour | 6 | 10.2 | 7.2 | 10 | teleport |
| 9 | Crack and Gate | 7 | 10.3 | 6.8 | 23 | cracked + gate |
| 10 | Convergence | 8 | 11.2 | 7.2 | 26 | all three |
| 11 | The Long Drift | 10 | 15.2 | 10.2 | 33 | all three |
| 12 | Maelstrom | 12 | 17.8 | 11.8 | 50 | all three |

Before this cycle the campaign's pars were 3, 5, 5, 8, 3, 4, 1, 2, 6, 6. The two
teleport levels (par 1 and 2) are gone, and the last two levels are now the longest.

Levels that qualify are rare: requiring all three mechanics to be necessary inside a par
band left 13 of 40,000 candidates for slot 10 and 27 of 200,000 for slot 12. Curation
takes about 17 s.

## Issues found during testing
- Three of the first hand-built test boards were wrong (an exit that could not be
  reached, a cracked wall that could not be hit, and a mistaken bit count). The analysis
  code was right; the boards were rebuilt.
- The first curation pass with 2,500 candidates per slot found no level for slot 12.
  Late slots now draw up to 200,000 candidates.

## Known limitations
- **The score is an untested model.** It orders levels by choice bits, par and trap
  share. Nobody has checked that people find a 17.8 harder than a 9.5.
- **No campaign level contains a trap state.** Curation picks the lowest score above the
  running floor, and traps raise the score, so trap-free boards win. Whether traps make
  the game better or just more annoying needs a person; undo makes them cheap either way.
- Levels 3, 4 and 6 sit within 0.3 points of each other, so that stretch is flat.
- A daily result can be improved by retrying; there is no first-attempt lock.
- Hint use is tracked per attempt and is not undone by `U`; `R` clears it.
- Saved data is per browser, and browsers differ in how they scope `file://` storage.
- Chromium only.

## How to run
Open `game/drift-maze.html` in a browser. Arrow keys or WASD to slide. `T` for today's
puzzle, `M` for endless, `[` and `]` to move between unlocked campaign levels, `H` for a
hint, `U` to undo, `R` to reset.
Rebuild the campaign with `node scripts/curate-campaign.js --write`.
