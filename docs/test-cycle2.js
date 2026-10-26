const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type()==='error' && errs.push(m.text()));
  await pg.goto('file:///home/user/DemoTesting02/game2/index.html');
  const r = [];
  const ok = (n, c, x='') => r.push(`${c?'PASS':'FAIL'} ${n} ${x}`);
  await pg.waitForTimeout(500);
  ok('canvas renders content', await pg.evaluate(() => { const d=document.getElementById('c').getContext('2d').getImageData(0,0,900,600).data; let n=0; for(let i=0;i<d.length;i+=4) if(d[i]+d[i+1]+d[i+2]>300) n++; return n>50; }));
  // tether: speed preserved, curved path
  const t1 = await pg.evaluate(() => { const T=window.__tether; T.reset(); const S=T.state; S.mines.length=0;
    T.attach(); const a=S.tether&&S.tether.a; const s0=Math.hypot(S.probe.vx,S.probe.vy); const v0=[S.probe.vx,S.probe.vy];
    const len=S.tether.len; for(let i=0;i<30;i++) T.step(1/60);
    const s1=Math.hypot(S.probe.vx,S.probe.vy); const d=Math.hypot(S.probe.x-a.x,S.probe.y-a.y);
    return {att:!!a, s0,s1, turned: Math.abs(S.probe.vx-v0[0])+Math.abs(S.probe.vy-v0[1]), dr:Math.abs(d-len)}; });
  ok('attach finds anchor', t1.att);
  ok('tether keeps speed', Math.abs(t1.s0-t1.s1)<1, JSON.stringify(t1));
  ok('tether turns velocity', t1.turned>10);
  ok('tether keeps radius', t1.dr<5);
  // beacon collection
  const sc = await pg.evaluate(() => { const T=window.__tether; T.reset(); const S=T.state; S.mines.length=0; const p=S.probe; S.beacons[0].x=p.x+3; S.beacons[0].y=p.y; T.step(0.001); return S.score; });
  ok('beacon collected', sc===1, 'score='+sc);
  // game over + restart
  const go = await pg.evaluate(() => { const T=window.__tether; T.reset(); const S=T.state; for(let i=0;i<3;i++){ S.invuln=0; S.mines[0].x=S.probe.x; S.mines[0].y=S.probe.y; T.step(0.001);} const over=S.over; T.reset(); return [over, T.state.over, T.state.lives]; });
  ok('game over after 3 hits', go[0]); ok('restart resets', !go[1] && go[2]===3);
  // keyboard path
  await pg.evaluate(() => window.__tether.reset());
  await pg.keyboard.down('Space'); await pg.waitForTimeout(100);
  const tk = await pg.evaluate(() => !!window.__tether.state.tether); await pg.keyboard.up('Space');
  const tr = await pg.evaluate(() => !window.__tether.state.tether);
  ok('space attaches/releases', tk && tr);
  ok('no console errors', errs.length===0, errs.join(';'));
  console.log(r.join('\n')); await b.close();
})();
