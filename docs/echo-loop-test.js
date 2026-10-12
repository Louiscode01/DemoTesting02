const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();const errs=[];
pg.on('pageerror',e=>errs.push(String(e)));
await pg.goto('file:///home/user/DemoTesting02/game/echo-loop/index.html');
const res=await pg.evaluate(()=>{
 const E=window.__echo,out={};
 const clr=()=>{for(const k in E.keys)E.keys[k]=0};
 const run=(n,k)=>{clr();Object.assign(E.keys,k);for(let i=0;i<n;i++)E.update();};
 E.loadLevel(0);run(300,{ArrowRight:1});out.l1=E.S.won;
 E.loadLevel(1);
 clr();E.keys.ArrowRight=1;while(E.S.player.x<215)E.update();clr();
 run(30,{});E.endRecording();out.echoes=E.S.echoes.length;
 out.doorClosedAtStart=!E.S.doorOpen;
 run(400,{ArrowRight:1});out.l2=E.S.won;
 // negative: without echo, door blocks
 E.loadLevel(1);run(400,{ArrowRight:1});out.l2NoEcho=E.S.won;
 return out;});
console.log(res,errs);
await pg.screenshot({path:'/tmp/claude-0/shot.png'});
await b.close();
process.exit(res.l1&&res.l2&&!res.l2NoEcho&&!errs.length?0:1);})();
