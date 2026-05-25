// snake.js — Snake entity class

import { DIR, CELL_BY_DIR, isOpposite, CONFIG } from './config.js';

export class Snake {
  /**
   * @param {string} id
   * @param {{x:number, y:number}} startPos
   * @param {string} initialDir
   * @param {string} skinId
   */
  constructor(id, startPos, initialDir = DIR.RIGHT, skinId = CONFIG.defaultSkin) {
    this.id = id;
    this.skinId = skinId;
    this.direction = initialDir;
    this.nextDirection = initialDir;
    this.alive = true;
    this.score = 0;
    this.foodEaten = 0;
    this.goldEaten = 0;
    this.isBot = false;

    // Initialize with 3 segments
    this.segments = [];
    const cell = CELL_BY_DIR[initialDir];
    for (let i = 2; i >= 0; i--) {
      this.segments.push({
        x: startPos.x - cell.x * i,
        y: startPos.y - cell.y * i,
      });
    }
  }

  headPosition() {
    return this.segments[this.segments.length - 1];
  }

  bodyPositions() {
    return this.segments.slice(0, -1);
  }

  length() {
    return this.segments.length;
  }

  occupies(point) {
    return this.segments.some(s => s.x === point.x && s.y === point.y);
  }

  setDirection(dir) {
    if (!isOpposite(dir, this.direction)) {
      this.nextDirection = dir;
    }
  }

  move() {
    if (!this.alive) return null;

    this.direction = this.nextDirection;
    const cell = CELL_BY_DIR[this.direction];
    const head = this.headPosition();
    const newHead = {
      x: head.x + cell.x,
      y: head.y + cell.y,
    };
    this.segments.push(newHead);
    this.segments.shift(); // remove tail
    return newHead;
  }

  grow() {
    // Duplicate the last segment (tail) to grow
    const tail = this.segments[0];
    this.segments.unshift({ ...tail });
  }

  shrink() {
    // Remove tail segment (when eating slow food effect)
    if (this.segments.length > 2) {
      this.segments.shift();
    }
  }

  collidesSelf() {
    const head = this.headPosition();
    return this.bodyPositions().some(s => s.x === head.x && s.y === head.y);
  }

  collidesWall(gridCols, gridRows) {
    const head = this.headPosition();
    return head.x < 0 || head.x >= gridCols || head.y < 0 || head.y >= gridRows;
  }

  collidesWith(otherSnake) {
    const head = this.headPosition();
    return otherSnake.segments.some(s => s.x === head.x && s.y === head.y);
  }

  reset(startPos, initialDir = DIR.RIGHT) {
    this.direction = initialDir;
    this.nextDirection = initialDir;
    this.alive = true;
    this.score = 0;
    this.foodEaten = 0;
    this.goldEaten = 0;
    this.segments = [];
    const cell = CELL_BY_DIR[initialDir];
    for (let i = 2; i >= 0; i--) {
      this.segments.push({
        x: startPos.x - cell.x * i,
        y: startPos.y - cell.y * i,
      });
    }
  }

  getState() {
    return {
      id: this.id,
      isBot: this.isBot,
      alive: this.alive,
      score: this.score,
      skinId: this.skinId,
      segments: this.segments.map(s => ({ x: s.x, y: s.y })),
      direction: this.direction,
    };
  }
}
