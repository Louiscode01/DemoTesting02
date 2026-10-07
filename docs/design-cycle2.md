# Echo Vault — Design & Implementation Plan

Date: 2026-10-07
Phase: design

## Summary
Dark maze stealth. Player (WASD/arrows) moves; Space pings. A ping expands a ring for
~1.2s revealing walls within radius ~170px (reveal fades over ~2.5s). Each ping creates a
"noise" event; guards within hearing radius (~340px) switch to INVESTIGATE and walk to the
noise origin. Guards otherwise patrol random waypoints. Touching a guard (or being within
catch radius) = caught -> level restarts (new attempt, same maze). Reaching the exit
advances a level (bigger maze, more guards, fewer pings). Pings are limited per level
and regenerate nothing: scarcity is the tension.

## Architecture
Single file `game/echo-vault/index.html`, canvas 2D, no deps/assets/build step.
1. Maze: DFS recursive-backtracker on a W x H cell grid, plus a few extra openings
   (braiding) so guards can't trap the player. Walls stored as per-cell bit flags.
2. Reveal map: per-wall `seen` timestamp (wall segments list); a wall is drawn with alpha
   from (now - seenAt). Ping ring sets seenAt for segments within the ring radius as it
   expands.
3. Guards: BFS pathfinding on the cell grid toward a target cell; states PATROL /
   INVESTIGATE / (back to PATROL). Visible only when within a small radius of player or
   while pinged ring passes them (echo shows guard blips).
4. Player: continuous movement with circle-vs-wall-segment collision (axis-separated).
5. Levels: size = 7+2*level capped; guards = level; pings = max(4, 10 - level).
6. Test hook: `window.__echoVault` (getters) + `?seed=N` for deterministic mazes.
7. Controls: WASD/arrows, Space ping, R restart.

## Tunables (top of script)
PLAYER_SPEED, PING_RADIUS, PING_SPEED, REVEAL_FADE, HEAR_RADIUS, GUARD_SPEED, CATCH_RADIUS.

## Test plan
Playwright headless: load w/o errors; render non-blank after ping; pathfind-solve a maze
using the exposed grid and drive the player to the exit (end-to-end level advance);
verify guard investigate on ping; verify caught -> restart.
