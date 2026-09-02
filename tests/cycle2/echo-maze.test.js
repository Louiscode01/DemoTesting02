// Automated headless smoke + end-to-end test for Echo Maze (Cycle 2).
//
// Run with: node tests/cycle2/echo-maze.test.js
// Requires Playwright + a Chromium build. This dev environment has both
// pre-installed globally rather than as a project dependency, hence the
// absolute require() path below -- swap it for require("playwright") and
// drop the explicit executablePath in chromium.launch() in an environment
// where "playwright" is an installed project dependency instead.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const FILE_URL = "file://" + require("path").resolve(__dirname, "../../game/cycle2/index.html");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
}

// Holds `key` until the player's cell first reaches the target, then keeps
// holding a bit longer (capped by the timeout) so the player settles well
// into the cell -- either flush against a wall, or centered enough in an
// open corridor -- rather than releasing the instant it merely touches the
// cell boundary. Releasing too early left the player hugging an edge, which
// then blocked passage through the next single-cell-wide connector.
// Default dwell suits legs that end by hitting a wall (the corridor's own
// wall pins the player, so any reasonable dwell just settles flush against
// it). A leg that stops mid-corridor with no wall (e.g. a timed stop partway
// up an open channel) needs a much shorter dwell -- the target cell is only
// transited, not rested in, so a long dwell would carry the player straight
// through it and past the intended stop.
const SETTLE_DWELL_MS = 350;
async function moveUntilCell(page, key, targetCol, targetRow, timeoutMs, label, dwellMs = SETTLE_DWELL_MS) {
  await page.keyboard.down(key);
  const start = Date.now();
  let last = null;
  let matchedAt = null;
  while (Date.now() - start < timeoutMs) {
    const cell = await page.evaluate(() => window.__echoMaze.getPlayerCell());
    last = cell;
    const matches = cell[0] === targetCol && cell[1] === targetRow;
    if (matches && matchedAt === null) matchedAt = Date.now();
    if (matchedAt !== null && Date.now() - matchedAt >= dwellMs) break;
    if (!matches) matchedAt = null; // moved back out (e.g. caught mid-transition); keep waiting
    await page.waitForTimeout(40);
  }
  await page.keyboard.up(key);
  if (label) console.log(`  leg ${label}: target=[${targetCol},${targetRow}] got=${JSON.stringify(last)}`);
  return last;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto(FILE_URL);
  await page.waitForTimeout(300);

  record("no console errors on load", consoleErrors.length === 0, consoleErrors.join(" | "));

  // Canvas renders non-trivial pixel content.
  const nonBlackPixels = await page.evaluate(() => {
    const c = document.getElementById("c");
    const ctx = c.getContext("2d");
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] || data[i + 1] || data[i + 2]) count++;
    }
    return count;
  });
  record("canvas has non-trivial pixel content", nonBlackPixels > 50, `nonBlackPixels=${nonBlackPixels}`);

  // Basic movement sanity: holding Up from the start cell measurably changes position.
  const startCell = await page.evaluate(() => window.__echoMaze.getPlayerCell());
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowUp");
  const movedCell = await page.evaluate(() => window.__echoMaze.getPlayerCell());
  record(
    "player position changes on movement input",
    movedCell[0] === startCell[0] && movedCell[1] < startCell[1],
    `start=${JSON.stringify(startCell)} moved=${JSON.stringify(movedCell)}`
  );

  // Ping reveal sanity: a cell a few cells ahead (outside ambient radius, inside
  // ping radius) is dark before the ping and revealed just after it.
  const preCell = await page.evaluate(() => window.__echoMaze.getPlayerCell());
  const farCell = [preCell[0], Math.max(1, preCell[1] - 3)];
  const revealedBefore = await page.evaluate(
    (c) => window.__echoMaze.isCellRevealed(c[0], c[1]),
    farCell
  );
  await page.keyboard.press(" ");
  await page.waitForTimeout(150);
  const revealedAfter = await page.evaluate(
    (c) => window.__echoMaze.isCellRevealed(c[0], c[1]),
    farCell
  );
  record(
    "ping reveals previously-dark cells",
    revealedBefore === false && revealedAfter === true,
    `before=${revealedBefore} after=${revealedAfter}`
  );

  // Finish the Up leg to (1,1), then walk the full known-solvable serpentine
  // path to the exit, avoiding the guard room entirely -> deterministic win.
  const winLegs = [
    ["ArrowUp", 1, 1],
    ["ArrowRight", 3, 1],
    ["ArrowDown", 3, 9],
    ["ArrowRight", 5, 9],
    ["ArrowUp", 5, 1],
    ["ArrowRight", 7, 1],
    ["ArrowDown", 7, 9],
    ["ArrowRight", 9, 9],
    ["ArrowUp", 9, 1],
  ];
  let lastCell = null;
  let legNum = 0;
  for (const [key, c, r] of winLegs) {
    legNum++;
    lastCell = await moveUntilCell(page, key, c, r, 7000, `W${legNum}`);
  }
  const wonPhase = await page.evaluate(() => window.__echoMaze.getPhase());
  record(
    "win path reaches exit without guard contact",
    wonPhase === "won",
    `finalCell=${JSON.stringify(lastCell)} phase=${wonPhase}`
  );

  // Restart and drive the player deliberately into the guard's room -> lose.
  await page.keyboard.press("r");
  await page.waitForTimeout(150);
  const loseLegs = [
    ["ArrowUp", 1, 1],
    ["ArrowRight", 3, 1],
    ["ArrowDown", 3, 9],
    ["ArrowRight", 5, 9],
    ["ArrowUp", 5, 1],
    ["ArrowRight", 7, 1],
    ["ArrowDown", 7, 9],
    ["ArrowRight", 9, 9],
  ];
  legNum = 0;
  for (const [key, c, r] of loseLegs) {
    legNum++;
    await moveUntilCell(page, key, c, r, 7000, `L${legNum}`);
  }
  // Go partway up col 9 to row 5 -- a pure mid-corridor transit with no wall
  // to stop against, so use a short dwell to avoid sailing straight through
  // row 5 -- then into the guard room via the doorway.
  await moveUntilCell(page, "ArrowUp", 9, 5, 3000, "L9", 80);
  await moveUntilCell(page, "ArrowRight", 11, 5, 3000, "L10");

  const lostStart = Date.now();
  let lostPhase = "playing";
  while (Date.now() - lostStart < 8000) {
    lostPhase = await page.evaluate(() => window.__echoMaze.getPhase());
    if (lostPhase === "lost") break;
    await page.waitForTimeout(100);
  }
  record("parking in the guard room triggers a catch", lostPhase === "lost", `phase=${lostPhase}`);

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error("Test run threw:", err);
  process.exit(1);
});
