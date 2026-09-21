# Tether Twins — Test Results

Date: 2026-09-21
Phase: testing
Method: automated headless-browser smoke tests (Playwright + pre-installed Chromium at
`/opt/pw-browsers/chromium-1194`), run against `game/cycle-2-tether-twins/index.html`
directly via `file://`. No human playtest was performed (unattended automated run) —
see "Known limitations" below. Test script preserved at
`docs/cycle-2/test-tether-twins.spec.js` (run with
`node docs/cycle-2/test-tether-twins.spec.js`, requires the globally-installed
`playwright` package).

## Test 1 — Load & basic state smoke test
Checks: page loads with zero console/page errors, canvas renders non-trivial pixel
content, and the `window.__tetherTwins` test hook exposes `orbA`/`orbB` and starts at
level 0 in the `playing` phase.

**Result: PASS**
```
consoleErrors: []
pageErrors: []
nonBackgroundPixels: ~18000
levelIndex: 0
phase: "playing"
```

## Test 2 — Input isolation (dual simultaneous control)
Checks: holding `KeyD` (orb A right) for 0.5s moves orb A measurably more than orb B
(which only follows via the tether); the mirrored check holds `ArrowLeft` (orb B left)
and asserts the reverse. This is the core mechanic under test — that WASD and arrow
keys drive independent orbs rather than one shared input.

**Result: PASS**
```
KeyD:      orb A moved 108-112px, orb B moved 56-59px (A > 1.15x B)
ArrowLeft: orb B moved 73-74px,  orb A moved 52-53px (B > 1.15x A)
```
Note: orb B/A still move a non-trivial amount in both cases because the tether spring
transmits force to the un-driven orb — expected behavior, not a bug. The design doc's
planned assertion ("A's delta >> B's, not B being frozen") anticipated exactly this;
the threshold used is a >15% margin rather than a stricter ratio, since equal-mass
spring coupling limits how large the gap between the two deltas can get within 0.5s.

## Test 3 — Tether responds as a spring (not a rigid rod)
Checks: driving the orbs apart (vertically, to avoid ambiguity from their existing
horizontal offset in level 1) increases `tetherLength` above its resting value;
driving them back together decreases it again.

**Result: PASS**
```
initial tetherLength: ~71-74px (mid-transition toward TETHER_REST_LENGTH=140 from the
    level's tighter starting gap of 40px)
after driving apart (KeyW + ArrowDown, 0.5s):   ~163px
after driving together (KeyS + ArrowUp, 0.7s):  ~117px
```

## Test 4 — Hazard touch resets the level
Checks: jumping to level 2 (`window.__tetherTwinsDebug.gotoLevel(1)`, its hazard strip
sits at x:300-500,y:220-240, off to the side of orb A's x:100 start), driving orb A
diagonally into the hazard gap increments the `resets` counter and the level reloads
(stays at the same `levelIndex` rather than advancing).

**Result: PASS**
```
resets before: 0
resets after touching hazard: 1
levelIndex after: 1 (unchanged, i.e. reloaded not advanced)
```

## Bugs found and fixed during testing
None — the `window.__tetherTwins` hook was built as a getter-of-getters from the
start (per the design doc's explicit callout of Cycle 1's stale-reference bug), so no
staleness issue occurred. The only iteration needed was on the *test script* itself:
the initial "drive apart/together" assertion picked keys based on the orbs' relative
x-position without accounting for the tether's own settling motion during the first
200ms, and the initial hazard-touch test drove orb A straight down along a column that
was over a wall ledge rather than the gap — both were test-script direction bugs, not
game bugs, fixed by using an unambiguous vertical separation axis and diagonal
targeting respectively.

## Known limitations / not covered by automated tests
- **Level-clear end-to-end** (both orbs settling on their goal pads simultaneously for
  `GOAL_HOLD_FRAMES`, the clear overlay, and progression to the next level) was not
  scripted — matches the design doc's testing plan, which scoped automated coverage to
  the four assertions above rather than a full precision playthrough. Reaching a goal
  requires braking against gravity within a ~50px pad, which needs either finer
  simulated input timing or a debug "teleport to goal" hook beyond this pass's scope.
  Flagged as a follow-up, same as Cycle 1's equivalent win-condition gap.
- **Fun/balance tuning** (spring stiffness/damping feel, whether "Pinch Point"'s
  compression window is actually reachable by a human) was reasoned about from the
  constants, not human-playtested.
- No cross-browser testing beyond Chromium.

## How to run manually
Open `game/cycle-2-tether-twins/index.html` directly in a browser (double-click, or a
`file://` URL) — no server or build step required. Controls: WASD for orb A (cyan),
arrow keys for orb B (magenta), `R` to restart the level, `N` to skip levels (debug).
