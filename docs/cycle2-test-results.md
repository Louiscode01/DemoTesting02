# Echo Vault — Test Results (Cycle 2)
Headless Chromium via Playwright (`NODE_PATH=$(npm root -g) node tests/echo-vault.test.js`), real keyboard input.

| Case | Expected | Result |
|---|---|---|
| L1 solo walk, no ghost | not won | PASS |
| L1 with ghost | won | PASS |
| L2 with 2 ghosts / missing ghost | won / not won | PASS / PASS |
| L3 with 3 ghosts incl. required waits / without waits | won / not won | PASS / PASS |
| Page errors | none | none |

Finding: door state uses end-of-previous-tick positions, so ghosts must be timed (waits) in L3 — intended, makes puzzle more interesting.
Not covered: visual/feel playtest, undo/restart/next-level key paths, mobile input.
