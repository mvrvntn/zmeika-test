// bot.js — BotBrain (greedy AI)

import { DIR, CELL_BY_DIR, CONFIG } from './config.js';

export class BotBrain {
  /**
   * @param {string} difficulty - easy|medium|hard|insane
   */
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.randomChance = CONFIG.difficulties[difficulty]?.aiRandomChance || 0.15;
    this.stuckCounter = 0;
  }

  setDifficulty(d) {
    this.difficulty = d;
    this.randomChance = CONFIG.difficulties[d]?.aiRandomChance || 0.15;
  }

  /**
   * Decide which direction to move
   * @param {Snake} snake
   * @param {Array} foods - active food items
   * @param {number} gridCols
   * @param {number} gridRows
   * @param {Array} opponents - other snakes
   * @returns {string} direction
   */
  decide(snake, foods, gridCols, gridRows, opponents = []) {
    // Random move chance
    if (Math.random() < this.randomChance) {
      const safe = this.#getSafeDirections(snake, gridCols, gridRows, opponents);
      if (safe.length > 0) {
        return safe[Math.floor(Math.random() * safe.length)];
      }
    }

    // Find nearest food
    let target = null;
    let minDist = Infinity;
    const head = snake.headPosition();

    for (const food of foods) {
      if (!food.active) continue;
      const dist = Math.abs(food.position.x - head.x) + Math.abs(food.position.y - head.y);
      if (dist < minDist) {
        minDist = dist;
        target = food;
      }
    }

    if (target) {
      const dir = this.#chaseDirection(snake, target.position, gridCols, gridRows, opponents);
      if (dir) return dir;
    }

    // Fallback: safe random
    const safe = this.#getSafeDirections(snake, gridCols, gridRows, opponents);
    if (safe.length > 0) {
      return safe[Math.floor(Math.random() * safe.length)];
    }

    // Totally stuck — just go current direction
    this.stuckCounter++;
    return snake.direction;
  }

  /**
   * Chase direction towards target
   */
  #chaseDirection(snake, target, gridCols, gridRows, opponents) {
    const head = snake.headPosition();
    const dx = target.x - head.x;
    const dy = target.y - head.y;

    // Prefer horizontal or vertical based on distance
    const candidates = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      candidates.push(dx > 0 ? DIR.RIGHT : DIR.LEFT);
      candidates.push(dy > 0 ? DIR.DOWN : DIR.UP);
    } else {
      candidates.push(dy > 0 ? DIR.DOWN : DIR.UP);
      candidates.push(dx > 0 ? DIR.RIGHT : DIR.LEFT);
    }

    // Try candidates, return first safe one
    for (const dir of candidates) {
      const cell = CELL_BY_DIR[dir];
      const nextPos = { x: head.x + cell.x, y: head.y + cell.y };
      if (this.#isSafe(snake, nextPos, gridCols, gridRows, opponents)) {
        return dir;
      }
    }

    return null;
  }

  /**
   * Get all safe directions
   */
  #getSafeDirections(snake, gridCols, gridRows, opponents) {
    const head = snake.headPosition();
    const safe = [];

    for (const [dir, cell] of Object.entries(CELL_BY_DIR)) {
      const nextPos = { x: head.x + cell.x, y: head.y + cell.y };
      if (this.#isSafe(snake, nextPos, gridCols, gridRows, opponents)) {
        safe.push(dir);
      }
    }

    return safe;
  }

  /**
   * Check if a position is safe
   */
  #isSafe(snake, pos, gridCols, gridRows, opponents) {
    // Wall check
    if (pos.x < 0 || pos.x >= gridCols || pos.y < 0 || pos.y >= gridRows) {
      return false;
    }

    // Self collision (check against current body, excluding the tail that will move)
    for (let i = 0; i < snake.segments.length - 1; i++) {
      if (snake.segments[i].x === pos.x && snake.segments[i].y === pos.y) {
        return false;
      }
    }

    // Opponent collision
    for (const opp of opponents) {
      if (!opp.alive) continue;
      for (const seg of opp.segments) {
        if (seg.x === pos.x && seg.y === pos.y) {
          return false;
        }
      }
    }

    return true;
  }
}
