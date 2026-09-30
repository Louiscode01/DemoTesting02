// Run: node game/echo-vault/test.js  — replays a known solution per level.
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const src = html.split("<script>")[1].split("</script>")[0];
const m = { exports: {} }; new Function("module", src)(m);
const { EV } = m.exports;
const sols = [
  ["rr", "rrrrrrrrrr"],                // L1: ghost holds plate a, then walk to exit
  ["lllu"+"u", "rrruu", "dddddddd"], // L2: two ghosts on plates, then descend
  ["rr", "rrrrrr", "rrrrrrrrrr"],      // L3: relay of two ghosts
];
let fail = 0;
sols.forEach((loops, i) => {
  const s = EV.load(i);
  loops.forEach((keys, j) => {
    for (const k of keys) EV.move(s, k);
    if (j < loops.length - 1 && !EV.endLoop(s)) { console.log("L" + (i+1), "endLoop refused"); fail++; }
  });
  console.log("Level", i + 1, s.won ? "PASS" : "FAIL"); if (!s.won) fail++;
});
// negative: walking straight at level 1 must not win (door closed)
const n = EV.load(0); for (let i = 0; i < 12; i++) EV.move(n, "r");
console.log("No-shortcut check", n.won ? "FAIL" : "PASS"); if (n.won) fail++;
process.exit(fail ? 1 : 0);
