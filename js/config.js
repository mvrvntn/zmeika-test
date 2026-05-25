// config.js — Snake v3.0 Configuration
export const CONFIG = {
  grid: 20, cols: 20, rows: 20,
  levels: {
    easy: { label: 'EASY', ms: 200 },
    medium: { label: 'MEDIUM', ms: 150, default: true },
    hard: { label: 'HARD', ms: 100 },
    insane: { label: 'INSANE', ms: 60 }
  },
  wallMode: 'normal',
  soundEnabled: true,
  currentSkin: 'neon',
  gameMode: '1p', // 1p, 2p, vsbot
  foodWeights: { normal: 0.7, gold: 0.2, slow: 0.1 }
};

export const DIR = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }
};

export function isOpposite(d1, d2) { return d1.x + d2.x === 0 && d1.y + d2.y === 0; }
export const GRID = 20; export const COLS = 20; export const ROWS = 20;
