// config.js — Game configuration constants and helpers

export const CONFIG = {
  // Grid
  gridCols: 20,
  gridRows: 20,
  cellSize: 20,

  // Canvas
  canvasWidth: 400,
  canvasHeight: 400,

  // Gameplay
  initialSpeed: 150,        // ms per tick
  minSpeed: 60,
  speedIncrement: 2,        // ms faster per food eaten
  maxPlayers: 2,

  // Food
  foodNormalWeight: 70,
  foodGoldWeight: 20,
  foodSlowWeight: 10,
  foodGoldPoints: 3,
  foodGoldTTL: 5000,        // ms
  foodSlowPoints: 1,
  foodSlowTTL: 5000,        // ms
  foodSlowDuration: 3000,   // ms — slow effect duration

  // Difficulty presets
  difficulties: {
    easy: { speed: 200, aiRandomChance: 0.3 },
    medium: { speed: 150, aiRandomChance: 0.15 },
    hard: { speed: 100, aiRandomChance: 0.05 },
    insane: { speed: 70, aiRandomChance: 0 },
  },

  // Skins
  defaultSkin: 'neon',

  // Achievements
  achievementCheckInterval: 5, // check every N ticks

  // Storage keys
  storageKeyScores: 'snake_v3_highscores',
  storageKeyAchievements: 'snake_v3_achievements',

  // Death animation
  deathParticleCount: 20,
  deathDuration: 800,

  // Stars
  starCount: 50,

  // Touch
  swipeThreshold: 30,
};

export const DIR = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

const opposites = {
  [DIR.UP]: DIR.DOWN,
  [DIR.DOWN]: DIR.UP,
  [DIR.LEFT]: DIR.RIGHT,
  [DIR.RIGHT]: DIR.LEFT,
};

export function isOpposite(a, b) {
  return opposites[a] === b;
}

export const CELL_BY_DIR = {
  [DIR.UP]: { x: 0, y: -1 },
  [DIR.DOWN]: { x: 0, y: 1 },
  [DIR.LEFT]: { x: -1, y: 0 },
  [DIR.RIGHT]: { x: 1, y: 0 },
};

export const FOOD_TYPE = {
  NORMAL: 'NORMAL',
  GOLD: 'GOLD',
  SLOW: 'SLOW',
};
