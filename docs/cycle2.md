# Cycle 002 — Echo Loop

## Research (concepts, scored)
| Concept | Feas. | Novelty | Scope | Total |
|---|---|---|---|---|
| Orbit Duel v2 (AI opponent) | 5 | 2 | 5 | 12 |
| **Echo Loop** (evolution of Chrono Loop, cut to single-screen) | 4 | 5 | 4 | 13 |
| Tether Swing (rope-physics platformer) | 3 | 4 | 3 | 10 |
| Tide Tiles (flooding grid puzzle) | 4 | 3 | 4 | 11 |
Selected: Echo Loop — cooperating with a replay of your own past run.

## Design
Single HTML canvas file, fixed 60Hz deterministic sim. Each run records per-frame inputs (max 10s).
R ends the run: inputs become an "echo" that replays from the level start while you play again.
Pressure plates stay pressed while any body (player/echo) stands on them; door is open only while all plates are pressed.
Goal: player touches exit. Echo cap per level (oldest is dropped). 4 hand-built levels.

## Implementation
`game/echo-loop/index.html` (open directly in a browser, no deps).

## Testing
`docs/echo-loop-test.js` (Playwright, headless): L1 solvable, L2 solvable with an echo on the plate, L2 NOT solvable without echo, no page errors — PASS.
Not verified: levels 3-4 solvability, feel/jump tuning.
