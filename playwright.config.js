// Minimal config: tests load game/index.html directly via a file:// URL (no dev
// server, no build step), matching how the game itself is meant to be run --
// double-click the file, or open it directly in a browser.
module.exports = {
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    headless: true
  }
};
