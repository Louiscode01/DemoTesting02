const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
 await p.goto('file:///home/user/DemoTesting02/game/prism-path.html');
 const r=await p.evaluate(()=>{
  const P=window.__prism;let bad=[];let n=0;
  for(let l=1;l<=14;l++)for(let s=1;s<=10;s++){
    n++;P.newLevel(s,l);
    if(P.trace().lit)bad.push(['startsSolved',s,l]);
    P.solve();if(!P.trace().lit||!P.won)bad.push(['unsolvable',s,l]);
  }
  // click interaction
  P.newLevel(3,2);const g=P.grid;const m=g.solution[0];const before=g.cells[m.y][m.x].m;
  P.flip(m.x,m.y);const toggled=g.cells[m.y][m.x].m!==before&&P.moves===1;
  // win via clicks
  P.newLevel(3,2);let g2=P.grid;for(const s of g2.solution){if(g2.cells[s.y][s.x].m!==s.m)P.flip(s.x,s.y);}
  return {n,bad,toggled,clickWin:P.won,moves:P.moves};
 });
 const px=await p.evaluate(()=>{const c=document.getElementById('c');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let k=0;for(let i=0;i<d.length;i+=4)if(d[i]>100)k++;return k});
 console.log(JSON.stringify(r),'litPixels',px,'errors',errs);
 await b.close();
})();
