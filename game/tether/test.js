// Run: node game/tether/test.js  (needs playwright + chromium)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
  const pg = await b.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('file://' + path.resolve(__dirname, 'index.html'));
  const r = {};
  r.loaded = await pg.evaluate(() => !!window.__tether);
  // rope-length conservation
  r.rope = await pg.evaluate(() => { const t = window.__tether; t.reset(1); t.step(30); t.press();
    const rp = t.state.rope; if (!rp) return {attached:false};
    const len0 = rp.len; let maxErr = 0;
    for (let i=0;i<200;i++){ t.step(1); const s=t.state; if(!s.rope)break; maxErr=Math.max(maxErr,Math.abs(Math.hypot(s.p.x-s.rope.a.x,s.p.y-s.rope.a.y)-len0)); }
    return {attached:true,maxErr}; });
  r.dies = await pg.evaluate(() => { const t=window.__tether; t.reset(2); t.release(); t.step(120*60); return t.state.over; });
  r.restart = await pg.evaluate(() => { const t=window.__tether; t.press(); return !t.state.over; });
  r.errs = errs;
  console.log(JSON.stringify(r));
  const ok = r.loaded && r.rope.attached && r.rope.maxErr < 1 && r.dies && r.restart && !errs.length;
  console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok?0:1);
})();
