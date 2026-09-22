# Photon Reflect — Test Results

Date: 2026-09-22
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium), run
against `game/cycle2/index.html` directly via `file://`. No human playtest was
performed (unattended automated run) — see "Known limitations" below.

## Test 1 — Load & basic render smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content.

**Result: PASS**
```
consoleErrors: []
nonBackgroundPixels: 200000
```

## Test 2 — `simulate()` unit tests
Pure-function tests of the core beam-physics algorithm, isolated from rendering/DOM:
straight pass-through, `/` mirror reflection (E→N), `\` mirror reflection (E→S),
splitter fan-out (E→N+S, no straight continuation), wall blocking, and an infinite-loop
guard (four mirrors forming a closed reflection loop).

**Result: PASS (6/6)**
```
straightPass: PASS
mirrorFS: PASS
mirrorBS: PASS
splitter: PASS
wallBlocks: PASS
loopTerminated: PASS (terminated in <2s, did not hang)
```

## Test 3 — `generateLevel()` solvability sanity (25 seeds, in-test run)
For each seed: (a) the generated puzzle grid must NOT already be solved with no
placements, (b) restoring the generator's own recorded solution onto the grid MUST
solve it, (c) `maxPlacements` must equal the recorded solution's size.

**Result: PASS (25/25 seeds)**

### Extended stress run (300 seeds, follow-up check beyond the design doc's plan)
Same three checks repeated across seeds 1–300 to get higher confidence than the
original 25-seed plan before shipping.
```
fails: 0 / 300
maxPlacements range observed: 2-4
target count range observed: 2-4
```
Also re-verified the hand-authored fallback level (`handAuthoredFallback()`, used only
if the generator exhausts its 200-attempt retry budget — never actually triggered in
this run) in isolation: empty grid unsolved, solution grid solved. **PASS.**

## Test 4 — End-to-end WIN via scripted solution replay
Loads a level (seed 777), reads back the generator's own solution via the test-only
hook (`window.__photonReflect`, not exposed to the player as a hint), replays it as
clicks through the same `cycleCell()` path the UI uses, and asserts the win flag flips.
This directly closes the gap Cycle 1 flagged: "win-condition end-to-end... was not
exercised by an automated test... verified by code review instead."

**Result: PASS**
```
solved: true
placementsUsed: 2
maxPlacements: 2
```

## Test 5 — End-to-end LOSE state + reset
Exhausts `maxPlacements` on cells known to be wrong (editable but not part of the
solution), asserts the game reaches a failed state without being solved, then calls
reset and asserts placements return to 0.

**Result: PASS**
```
failedState: true
solvedWhileFailed: false
afterReset: { solved: false, placementsUsed: 0 }
```

## Known limitations / not covered by automated tests
- **Fun/difficulty tuning** of generated levels (are they satisfying to solve, not just
  solvable) was reasoned about, not human-playtested — same category of gap Cycle 1
  flagged for its physics feel-tuning. Flagged in `docs/cycle2/design.md` up front as
  out of scope for this pass.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).
- The generator's retry-exhaustion fallback path (`handAuthoredFallback()`) was
  verified in isolation by reconstructing its exact grid in a test, not by actually
  driving the real generator to exhaust 200 attempts (not practically triggerable with
  current constants — 0/300 stress-test seeds needed it).

## How to run manually
Open `game/cycle2/index.html` directly in a browser (double-click, or `file://` URL) —
no server or build step required. Click editable (dashed-border) cells to cycle
empty → `/` mirror → `\` mirror → splitter → empty, aiming to light every ringed target
cell within the placement budget shown in the HUD.
