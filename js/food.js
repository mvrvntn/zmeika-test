// food.js — Food and FoodManager

import { FOOD_TYPE, CONFIG } from './config.js';

export class Food {
  constructor(type, position) {
    this.type = type;
    this.position = position;
    this.active = true;
    this.spawnedAt = performance.now();
  }

  get points() {
    switch (this.type) {
      case FOOD_TYPE.GOLD: return CONFIG.foodGoldPoints;
      case FOOD_TYPE.SLOW: return CONFIG.foodSlowPoints;
      default: return 1;
    }
  }

  get ttl() {
    switch (this.type) {
      case FOOD_TYPE.GOLD: return CONFIG.foodGoldTTL;
      case FOOD_TYPE.SLOW: return CONFIG.foodSlowTTL;
      default: return Infinity;
    }
  }

  get remainingTtlMs() {
    if (this.ttl === Infinity) return Infinity;
    const elapsed = performance.now() - this.spawnedAt;
    return Math.max(0, this.ttl - elapsed);
  }

  get expired() {
    if (this.ttl === Infinity) return false;
    return this.remainingTtlMs <= 0;
  }
}

export class FoodManager {
  constructor(config = {}) {
    this.items = [];
    this.gridCols = config.gridCols || CONFIG.gridCols;
    this.gridRows = config.gridRows || CONFIG.gridRows;
    this.maxFood = config.maxFood || 3;
    this.normalWeight = config.normalWeight || CONFIG.foodNormalWeight;
    this.goldWeight = config.goldWeight || CONFIG.foodGoldWeight;
    this.slowWeight = config.slowWeight || CONFIG.foodSlowWeight;
  }

  getActive() {
    return this.items.filter(f => f.active && !f.expired);
  }

  /**
   * Pick a random food type based on weights
   */
  pickType() {
    const total = this.normalWeight + this.goldWeight + this.slowWeight;
    const roll = Math.random() * total;
    if (roll < this.normalWeight) return FOOD_TYPE.NORMAL;
    if (roll < this.normalWeight + this.goldWeight) return FOOD_TYPE.GOLD;
    return FOOD_TYPE.SLOW;
  }

  /**
   * Find a free position not occupied by any snake segments
   * @param {Array} snakes - array of Snake instances
   * @returns {{x:number, y:number}}
   */
  findFreePosition(snakes) {
    const occupied = new Set();
    for (const snake of snakes) {
      for (const seg of snake.segments) {
        occupied.add(`${seg.x},${seg.y}`);
      }
    }
    for (const food of this.items) {
      if (food.active) {
        occupied.add(`${food.position.x},${food.position.y}`);
      }
    }

    const free = [];
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridCols; x++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }

    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  /**
   * Spawn food if below max
   * @param {Array} snakes
   * @returns {Food|null} newly spawned food, or null
   */
  spawn(snakes) {
    const active = this.getActive();
    if (active.length >= this.maxFood) return null;

    const pos = this.findFreePosition(snakes);
    if (!pos) return null;

    const type = this.pickType();
    const food = new Food(type, pos);
    this.items.push(food);
    return food;
  }

  /**
   * Remove a food item
   * @param {Food} food
   */
  remove(food) {
    food.active = false;
  }

  /**
   * Clean up expired food
   */
  cleanup() {
    this.items = this.items.filter(f => f.active || !f.expired);
  }

  /**
   * Check if a snake's head eats any food
   * @param {Snake} snake
   * @returns {Food|null}
   */
  checkEat(snake) {
    if (!snake.alive) return null;

    const head = snake.headPosition();
    for (const food of this.getActive()) {
      if (food.position.x === head.x && food.position.y === head.y) {
        return food;
      }
    }
    return null;
  }

  reset() {
    this.items = [];
  }
}
