// Run: NODE_PATH=$(npm root -g) node tests/echo-heist.browser.test.js  (needs playwright + Chromium)
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const p = await b.newPage(), errors = [];
  p.on("pageerror", e => errors.push(e.message)); p.on("console", m => m.type() === "error" && errors.push(m.text()));
  await p.goto("file://" + path.join(__dirname, "../game/echo-heist.html"));
  await p.waitForTimeout(300);
  const x0 = await p.evaluate(() => window.EchoHeist.sim.pos.x);
  await p.keyboard.down("d"); await p.waitForTimeout(500); await p.keyboard.up("d");
  const x1 = await p.evaluate(() => window.EchoHeist.sim.pos.x);
  await p.keyboard.press("r");
  const s = await p.evaluate(() => ({ loops: window.EchoHeist.sim.loops, echoes: window.EchoHeist.sim.echoes.length }));
  const px = await p.evaluate(() => { const d = document.getElementById("c").getContext("2d").getImageData(0, 0, 640, 320).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 100) n++; return n; });
  console.log(JSON.stringify({ errors, moved: x1 - x0, ...s, brightPixels: px }));
  await b.close();
  process.exit(errors.length || x1 <= x0 || s.echoes !== 1 || px < 500 ? 1 : 0);
})();
