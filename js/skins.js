// skins.js — 5 тематических скинов
export const SKINS = {
  neon: {
    name: 'Neon',
    bg: '#0a0e14', bgGrad1: '#111827', bgGrad2: '#060a12',
    snakeHead: '#00ff41', snakeBody: '#00cc33', shadow: '#00ff41',
    foodNormal: ['#ff4466', '#aa0022'], foodGold: ['#ffd700', '#b8860b'],
    foodSlow: ['#00d4ff', '#0088cc'],
    grid: 'rgba(0,255,65,0.04)', text: '#00ff41',
    accent: '#00d4ff', frame: '#00ff41', gameOver: '#ff0040'
  },
  classic: {
    name: 'Classic',
    bg: '#1a1a2e', bgGrad1: '#16213e', bgGrad2: '#0f0f23',
    snakeHead: '#4ade80', snakeBody: '#22c55e', shadow: '#4ade80',
    foodNormal: ['#f87171', '#dc2626'], foodGold: ['#fbbf24', '#d97706'],
    foodSlow: ['#60a5fa', '#2563eb'],
    grid: 'rgba(74,222,128,0.04)', text: '#4ade80',
    accent: '#60a5fa', frame: '#4ade80', gameOver: '#f87171'
  },
  fire: {
    name: 'Fire',
    bg: '#1c0a0a', bgGrad1: '#2d0f0f', bgGrad2: '#0a0000',
    snakeHead: '#ff6b35', snakeBody: '#ef4444', shadow: '#ff6b35',
    foodNormal: ['#ffd700', '#f59e0b'], foodGold: ['#ff0000', '#dc2626'],
    foodSlow: ['#ffffff', '#e5e7eb'],
    grid: 'rgba(255,107,53,0.04)', text: '#ff6b35',
    accent: '#f59e0b', frame: '#ff6b35', gameOver: '#ef4444'
  },
  ice: {
    name: 'Ice',
    bg: '#0a1628', bgGrad1: '#0f1f3d', bgGrad2: '#050e1a',
    snakeHead: '#00d4ff', snakeBody: '#38bdf8', shadow: '#00d4ff',
    foodNormal: ['#e0e7ff', '#a5b4fc'], foodGold: ['#fde047', '#facc15'],
    foodSlow: ['#ffffff', '#cbd5e1'],
    grid: 'rgba(0,212,255,0.04)', text: '#00d4ff',
    accent: '#e0e7ff', frame: '#00d4ff', gameOver: '#fde047'
  },
  gold: {
    name: 'Gold',
    bg: '#1a1200', bgGrad1: '#2a1f00', bgGrad2: '#0f0a00',
    snakeHead: '#ffd700', snakeBody: '#f59e0b', shadow: '#ffd700',
    foodNormal: ['#ff6b6b', '#dc2626'], foodGold: ['#ffffff', '#e5e7eb'],
    foodSlow: ['#a855f7', '#7c3aed'],
    grid: 'rgba(255,215,0,0.04)', text: '#ffd700',
    accent: '#fbbf24', frame: '#ffd700', gameOver: '#ff6b6b'
  }
};

export function getSkin(name) { return SKINS[name] || SKINS.neon; }
