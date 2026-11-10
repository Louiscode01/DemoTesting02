// Run: node tests/tether-swing.test.js  (needs playwright)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, '../game/tether-swing.html'));
  const res = {};
  res.title = await p.evaluate(() => __tether.state.state);
  // determinism
  res.det = await p.evaluate(() => { __tether.newGame(42); const a = JSON.stringify(__tether.state.pegs.slice(0,8)); __tether.newGame(42); return a === JSON.stringify(__tether.state.pegs.slice(0,8)); });
  // start + grapple via keyboard
  await p.evaluate(() => { __tether.newGame(7); __tether.state.state = 'title'; });
  await p.keyboard.down('Space');
  res.attached = await p.evaluate(() => [__tether.state.state, !!__tether.state.peg]);
  await p.keyboard.up('Space');
  res.released = await p.evaluate(() => !__tether.state.peg);
  // bot: grapple when falling/moving toward a peg above; release when moving up fast
  res.bot = await p.evaluate(() => {
    const T = __tether; T.newGame(7); const S = T.state; S.state = 'play';
    let peakScore = 0;
    for (let i = 0; i < 120*90 && S.state === 'play'; i++) {
      if (!S.peg && S.vy > -50) T.grapple();
      else if (S.peg && S.vy < -130 && S.pegs.some(q => q !== S.peg && q.y < S.y-60 && q.y > S.y-200 && Math.abs(q.x-S.x) < 120)) T.release();
      T.step(T.constants.DT); peakScore = Math.max(peakScore, T.score());
    }
    return { peakScore, endState: S.state, t: +S.t.toFixed(1) };
  });
  // lava death + restart
  res.death = await p.evaluate(() => { const T = __tether; T.newGame(1); const S = T.state; S.state='play'; for (let i=0;i<120*60&&S.state==='play';i++) T.step(T.constants.DT); return S.state; });
  await p.keyboard.press('Space');
  res.restart = await p.evaluate(() => __tether.state.state);
  res.errors = errs;
  console.log(JSON.stringify(res, null, 2));
  const ok = res.title==='title' && res.det && res.attached[0]==='play' && res.attached[1] && res.released && res.bot.peakScore>=10 && res.death==='over' && res.restart==='play' && !errs.length;
  console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok?0:1);
})();
