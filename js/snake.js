// snake.js — Snake class
import { DIR, GRID, COLS, ROWS, CONFIG } from './config.js';
export class Snake {
  constructor(id, startX, startY) {
    this.id = id;
    this.segments = [{x: startX, y: startY}, {x: startX-1, y: startY}, {x: startX-2, y: startY}];
    this.direction = DIR.RIGHT;
    this.nextDirection = DIR.RIGHT;
    this.growPending = false;
    this.alive = true;
    this.score = 0;
  }
  head() { return this.segments[0]; }
  move(dir) {
    this.direction = dir;
    const h = this.head();
    let head = {x: h.x + dir.x, y: h.y + dir.y};
    if (CONFIG.wallMode === 'no_walls') {
      if (head.x < 0) head.x = COLS - 1;
      if (head.x >= COLS) head.x = 0;
      if (head.y < 0) head.y = ROWS - 1;
      if (head.y >= ROWS) head.y = 0;
    }
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { this.alive = false; return head; }
    if (this.growPending) { this.segments.unshift(head); this.growPending = false; }
    else { this.segments.unshift(head); this.segments.pop(); }
    if (this.collidesSelf()) { this.alive = false; }
    return head;
  }
  grow() { this.growPending = true; }
  collidesSelf() { const h = this.head(); return this.segments.slice(1).some(s => s.x === h.x && s.y === h.y); }
  collidesWith(snake) { const h = this.head(); return snake.segments.some(s => s.x === h.x && s.y === h.y); }
  reset(x, y) {
    this.segments = [{x:x,y:y},{x:x-1,y:y},{x:x-2,y:y}];
    this.direction = DIR.RIGHT; this.nextDirection = DIR.RIGHT;
    this.growPending = false; this.alive = true; this.score = 0;
  }
}
