# Territory Ink — Test Results

Date: 2026-09-09
Phase: testing
Method: automated headless-browser tests (Playwright + pre-installed Chromium,
`/opt/pw-browsers/chromium-1194`), run against `game/territory-ink.html` directly via
`file://`. No human playtest was performed (unattended automated run) — see "Known
limitations" below. Test script: `tests/cycle2-territory-ink.test.js`
(`node tests/cycle2-territory-ink.test.js`).

## Result: ALL 6 TESTS PASS (19 assertions)

### Test 1 — Load & smoke test
Checks: zero console/page errors, both players start with 3 lives, game not over at
start, both 4x4 home bases pre-filled with the correct territory value (16 cells each).
**PASS** on all four assertions.

### Test 2 — Movement & trail test
Drives P1 out of its base via `setDir`; confirms trail cells accumulate once it leaves
its own territory and that it stays alive on a straight run. **PASS.**

### Test 3 — Self-crash test
Scripts a path that exits the base entirely (avoiding it for the rest of the loop) and
turns back onto its own earlier trail cell. Confirms exactly one life is lost, the
player is marked dead pending respawn, and the trail is reverted to empty. **PASS.**

**Bug found and fixed during this test:** the first version of this test routed the
loop back *through* the player's own base on the way to closing the loop. Because
re-entering owned territory is always safe (rule 5 in the design), that path triggered
a *capture* instead of a *self-crash* — the assertion (`lives did not increase`) still
passed trivially since lives never decreased, giving a false sense that self-crash was
verified when it never actually fired. This is the same category of issue Cycle 1
found (a test that looks like it exercises a code path but doesn't): fixed by hand-tracing
head positions tick-by-tick to build a path that stays outside the base's 4x4 bounding
box until it deliberately re-crosses its own trail, and by asserting an exact
`lives === before - 1` instead of a non-strict `<=` comparison.

### Test 4 — Capture test (flood-fill)
Scripts a large rectangular loop starting and ending in P1's base. Confirms P1's
territory grows beyond the initial 16 base cells (62 cells after this loop), that the
trail is cleared on successful capture, and that the player survives the maneuver.
**PASS** — confirms the BFS flood-fill correctly identifies and claims the neutral
region enclosed by trail + territory.

### Test 5 — Trail-cut test
Sends P1 out to lay a trail, then steers P2 to cross it. Confirms P1 (the trail owner)
loses a life while P2 (the cutter) is unaffected, matching the designed asymmetric rule
(mover unaffected, trail owner dies). **PASS.**

### Test 6 — Win condition & restart test
Confirms one real, organically-scripted out-of-bounds death correctly costs exactly one
life (proving the normal death path), then uses a test-only `forceDie()` hook to bring
P1's lives to 0 deterministically. Confirms: game-over state and correct winner (P2),
the game-over overlay becomes visible, and pressing `R` resets `gameOver` and both
players' lives back to 3. **PASS** on all six assertions.

**Issue found and fixed during this test:** the original version tried to reach 0 lives
purely through repeated real-time scripted deaths (walking into the wall three times,
waiting out the respawn delay each time). This was unreliable in the headless
environment — `tick()` intentionally halts `tickCount` once `gameOver` flips true (so
the simulation stops cleanly), and the test's wait logic didn't account for that,
causing indefinite timeouts once the third death coincided with game-over. Fixed by
adding a test-only `forceDie(playerIndex)` hook to `window.__territoryInk` (mirroring
the already-planned `setDir`/`restart`/`forceCapture` test hooks) so the win-condition
path can be driven deterministically after proving one real death works normally. This
was a test-determinism issue, not a gameplay bug — the underlying death/game-over logic
was correct throughout.

## Known limitations / not covered by automated tests
- **Fun/balance tuning** was reasoned about, not human-playtested. Constants
  (`TICK_MS`, `START_LIVES`, `RESPAWN_TICKS`, grid size) are a first pass and may need
  adjustment for feel.
- **Head-on collision** (both players moving into the same cell on the same tick) is
  implemented and reasoned about via code review but not exercised by a scripted
  automated test in this pass — would need two precisely-timed simultaneous paths.
- **Capturing enemy territory** is explicitly out of scope for this cycle (see
  `docs/cycle2-design.md`'s "Scope cut") — only neutral cells are ever captured, so
  there's nothing to test here yet.
- No cross-browser testing beyond Chromium (matches the environment's available
  browser).

## How to run manually
Open `game/territory-ink.html` directly in a browser (double-click, or `file://` URL) —
no server or build step required. P1 uses WASD, P2 uses Arrow keys, both on one
keyboard. Press `R` to restart at any time.

## How to re-run the automated tests
```
node tests/cycle2-territory-ink.test.js
```
Requires Playwright (this environment has it globally installed at
`/opt/node22/lib/node_modules/playwright`, not in a local `package.json`).
