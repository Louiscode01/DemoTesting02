const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + __dirname + '/index.html');
  const k = async s => { for (const c of s) await p.keyboard.press(c); };
  for (let i=0;i<4;i++) await p.keyboard.press('ArrowRight');
  let h = await p.textContent('#hud'); if(!h.includes('SOLVED')) errs.push('L1 not solved: '+h);
  await p.keyboard.press('n'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
  for (let i=0;i<5;i++) await p.keyboard.press('ArrowRight');
  h = await p.textContent('#hud'); if(!h.includes('SOLVED')) errs.push('L2 not solved: '+h);
  console.log(h); console.log(errs.length? 'FAIL '+errs.join('|') : 'PASS browser test');
  await b.close(); process.exit(errs.length?1:0);
})();
