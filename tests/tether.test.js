// Run: node tests/tether.test.js  (needs playwright; uses /opt/pw-browsers/chromium)
const {chromium}=require('playwright');
const path=require('path');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined});
  const pg=await b.newPage();const errs=[];
  pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
  await pg.goto('file://'+path.resolve(__dirname,'../game2/index.html'));
  const res={};
  // 1 render
  await pg.waitForTimeout(300);
  res.nonBlank=await pg.evaluate(()=>{const c=document.getElementById('c').getContext('2d').getImageData(0,0,960,540).data;let n=0;for(let i=0;i<c.length;i+=4)if(Math.abs(c[i]-16)+Math.abs(c[i+1]-23)+Math.abs(c[i+2]-46)>40)n++;return n});
  // 2 idle baseline
  res.idle=await pg.evaluate(()=>{const t=window.__tether;t.reset();t.setHeld(false);t.step(120*30);return{over:t.over,best:t.best}});
  // 3 policy: hold when falling & anchor available; check rope constraint
  res.policy=await pg.evaluate(()=>{const t=window.__tether;t.reset();let maxViol=0,attached=0;
    for(let i=0;i<120*60&&!t.over;i++){
      const p=t.p;t.setHeld(p.vy>-50 || t.rope!=null&&p.x<t.rope.a.x+80);
      t.step(1);
      if(t.rope){attached++;const d=Math.hypot(t.p.x-t.rope.a.x,t.p.y-t.rope.a.y);maxViol=Math.max(maxViol,d-t.rope.L);}
    }t.setHeld(false);return{over:t.over,best:t.best,attached,maxViol}});
  // 4 restart
  res.restart=await pg.evaluate(()=>{const t=window.__tether;t.reset();return{over:t.over,x:t.p.x}});
  res.errs=errs;
  console.log(JSON.stringify(res,null,1));
  const ok=!errs.length&&res.nonBlank>1000&&res.idle.over&&res.policy.maxViol<0.01&&res.policy.attached>0&&res.policy.best>res.idle.best&&!res.restart.over;
  console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1);
})();
