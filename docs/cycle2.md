# Cycle 002 — Echo Vault

## Research (concepts)
1. **Echo Vault** — evolution of Cycle 1's "Chrono Loop": turn-based ghost-cooperation puzzle; each recorded run replays as an echo that holds plates/doors. (selected: high novelty, deterministic, tiny scope)
2. **Orbit Duel AI** — solo mode for Cycle 1 prototype (safe, low novelty).
3. **Tether Climb** — physics rope-swing climber (tuning risk).
4. **Tide Tiles** — grid puzzle where a rising water line reshapes the board (needs level generator).
5. **Pulse Garden** — rhythm-based plant defense (audio timing risk in headless tests).

## Design
- Single file `game/echo-vault/index.html`; pure logic object `EV` (load/move/endLoop/reset) separated from canvas UI so it is testable in Node.
- Turn-based, simultaneous stepping: echoes replay attempted inputs in lockstep; blocked moves act as waits; echoes hold their final tile.
- Plates/doors by channel letter (lowercase plate, uppercase door); a door is open when all plates of its channel are occupied (start-of-step state).
- Win: player reaches E. 3 levels, max 1–2 echoes.
- Known quirk: later echoes can change door timing for earlier ones, so replay may diverge from the original recording (arguably a puzzle feature).

## Test results
- `node game/echo-vault/test.js`: solutions for all 3 levels PASS; no-shortcut negative check PASS.
- Playwright headless smoke (load, key input, echo, win on L1, no page errors): PASS.
- Not covered: manual feel, level-progress (N key) UI flow, more levels.

## Run
Open `game/echo-vault/index.html` in a browser.
