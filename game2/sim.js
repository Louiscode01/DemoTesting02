(function (root) {
  const W = 800, H = 500, DT = 1 / 60, K = 5000000, SOFT = 30, DRAG = 0.8, MAXT = 20, BALL_R = 8, GOAL_R = 18;

  function hitRect(x, y, r) {
    return x > r.x - BALL_R && x < r.x + r.w + BALL_R && y > r.y - BALL_R && y < r.y + r.h + BALL_R;
  }

  function create(level, magnets) {
    return { x: level.start.x, y: level.start.y, vx: 0, vy: 0, t: 0, status: 'running', level, magnets };
  }

  function step(s) {
    if (s.status !== 'running') return s;
    let ax = 0, ay = 0;
    for (const m of s.magnets) {
      const dx = m.x - s.x, dy = m.y - s.y, d2 = dx * dx + dy * dy, d = Math.sqrt(d2) || 1;
      const f = (m.s * K) / (d2 + SOFT * SOFT);
      ax += (f * dx) / d; ay += (f * dy) / d;
    }
    s.vx += (ax - DRAG * s.vx) * DT; s.vy += (ay - DRAG * s.vy) * DT;
    s.x += s.vx * DT; s.y += s.vy * DT; s.t += DT;
    if (Math.hypot(s.x - s.level.goal.x, s.y - s.level.goal.y) < GOAL_R) s.status = 'won';
    else if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) s.status = 'lost';
    else if (s.level.hazards.some(r => hitRect(s.x, s.y, r))) s.status = 'lost';
    else if (s.t >= MAXT) s.status = 'lost';
    return s;
  }

  function run(level, magnets) {
    const s = create(level, magnets);
    while (s.status === 'running') step(s);
    return s;
  }

  function validPlacement(level, m) {
    return m.x > 0 && m.x < W && m.y > 0 && m.y < H && !level.hazards.some(r =>
      m.x > r.x - 12 && m.x < r.x + r.w + 12 && m.y > r.y - 12 && m.y < r.y + r.h + 12);
  }

  const api = { W, H, DT, BALL_R, GOAL_R, MAXT, create, step, run, validPlacement };
  if (typeof module !== 'undefined') module.exports = api; else root.Sim = api;
})(typeof window !== 'undefined' ? window : globalThis);
