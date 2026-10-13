import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH || 'playwright');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage(); const errs = [];
p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type()==='error' && errs.push(m.text()));
await p.goto('file://' + process.cwd() + '/game/lantern-flock.html');
await p.waitForTimeout(500);
const px = await p.evaluate(() => { const c=document.getElementById('c'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>120)n++;return n;});
console.log('errors',errs,'brightPixels',px);
// Test 2: flock follows lantern & gets saved (wisps removed for determinism)
const r = await p.evaluate(() => { const f=window.__flock; f.reset(); f.setWisps(0);
  for (let t=0;t<4000 && f.phase==='playing';t++){ const l=f.lantern; const tx=880,ty=270;
    const dx=tx-l.x; l.x+=Math.sign(dx)*Math.min(Math.abs(dx),1.2); l.y=ty; f.step(1/60);} 
  return {phase:f.phase,saved:f.saved,lost:f.lost}; });
console.log('guided run (no wisps)', r);
// Test 3: unguided run with wisps -> flock loses some
const u = await p.evaluate(() => { const f=window.__flock; f.reset(); for(let t=0;t<3600&&f.phase==='playing';t++){f.lantern.x=5;f.lantern.y=5;f.step(1/60);} return {phase:f.phase,saved:f.saved,lost:f.lost}; });
console.log('unguided run', u);
// Test 4: restart
await p.keyboard.press('r');
const rs = await p.evaluate(() => ({phase:__flock.phase,saved:__flock.saved,lost:__flock.lost}));
console.log('after restart', rs);
const ok = !errs.length && px>200 && r.saved>=30 && r.phase==='over' && u.lost>0 && rs.saved===0 && rs.phase==='playing';
console.log(ok ? 'ALL PASS' : 'FAIL'); await b.close(); process.exit(ok?0:1);
