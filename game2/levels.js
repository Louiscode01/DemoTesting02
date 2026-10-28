(function (root) {
  const levels = [
    { name: 'First Pull', start: { x: 100, y: 250 }, goal: { x: 700, y: 250 }, hazards: [], maxMagnets: 1 },
    { name: 'Around the Wall', start: { x: 100, y: 250 }, goal: { x: 700, y: 250 },
      hazards: [{ x: 380, y: 120, w: 40, h: 260 }], maxMagnets: 2 },
    { name: 'Push Off', start: { x: 100, y: 100 }, goal: { x: 700, y: 400 },
      hazards: [{ x: 300, y: 0, w: 40, h: 220 }, { x: 500, y: 280, w: 40, h: 220 }], maxMagnets: 3 },
    { name: 'The Gap', start: { x: 80, y: 250 }, goal: { x: 720, y: 250 },
      hazards: [{ x: 360, y: 0, w: 80, h: 210 }, { x: 360, y: 290, w: 80, h: 210 }], maxMagnets: 2 },
    { name: 'Slalom', start: { x: 80, y: 80 }, goal: { x: 720, y: 420 },
      hazards: [{ x: 220, y: 0, w: 30, h: 200 }, { x: 420, y: 300, w: 30, h: 200 }, { x: 600, y: 0, w: 30, h: 200 }],
      maxMagnets: 4 },
    { name: 'Tight Squeeze', start: { x: 80, y: 420 }, goal: { x: 720, y: 80 },
      hazards: [{ x: 200, y: 300, w: 400, h: 30 }, { x: 200, y: 170, w: 400, h: 30 }], maxMagnets: 4 },
  ];
  if (typeof module !== 'undefined') module.exports = levels; else root.LEVELS = levels;
})(typeof window !== 'undefined' ? window : globalThis);
