# Cycle 002 — Design: Magnet Mason

Files: game2/sim.js (pure, UMD, no DOM), game2/levels.js (data), game2/index.html (render + input),
tests/solve.js (Node brute-force solvability + sim unit tests). No build step, no deps.

Sim: fixed dt=1/60, ball (x,y,vx,vy), drag 0.6/s. Each magnet {x,y,s:+1|-1}: force = s*K*dir/(d^2+SOFT^2).
Fail: touch hazard rect, leave arena, or timeout (20s). Win: within goal radius. Magnets can't overlap hazards.
Level: {name, start, goal, hazards[], maxMagnets}. Player places magnets (click=attract, shift/right-click=repel,
click magnet=remove), Space=launch, R=reset. 6 levels, progress via level select keys.
Test plan: (1) determinism, (2) per-level brute-force search over grid placements finds >=1 solution
and no level is solved with 0 magnets, (3) headless browser smoke test.
