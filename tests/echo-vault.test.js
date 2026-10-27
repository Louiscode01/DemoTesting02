const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();const p=await b.newPage();const errs=[];
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/user/DemoTesting02/game2/index.html');
const run=async(i,loops)=>{
  await p.evaluate(i=>__echo.load(i),i);
  // premature walk without ghosts must not win
  for(let k=0;k<loops.length;k++){
    for(const m of loops[k])await p.keyboard.press(m);
    if(k<loops.length-1)await p.keyboard.press('Enter');
  }
  return p.evaluate(()=>__echo.state.won);
};
const K={U:'ArrowUp',D:'ArrowDown',L:'ArrowLeft',R:'ArrowRight'};
const mv=s=>[...s].map(c=>c==='W'?' ':K[c]);
const r={};
r.l1_no_ghost=await run(0,[mv('DDRRUUDR')]);
r.l1=await run(0,[mv('DD'),mv('RDRRUR')]);
r.l2=await run(1,[mv('RD'),mv('RRRRD'),mv('RRRRRRRRR')]);
r.l2_missing_ghost=await run(1,[mv('RD'),mv('RRRRRRRRR')]);
r.l3=await run(2,[mv('RD'),mv('WRRRD'),mv('WWRRRRRRD'),mv('WRRRRRRRRRRRR')]);
r.l3_no_wait=await run(2,[mv('RD'),mv('RRRD'),mv('RRRRRRD'),mv('RRRRRRRRRRRR')]);
console.log(JSON.stringify(r),errs);
await b.close();})();
