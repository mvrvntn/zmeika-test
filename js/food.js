// food.js — Food manager
import { COLS, ROWS } from './config.js';
export const FoodType = { NORMAL:0, GOLD:1, SLOW:2 };

export class FoodManager {
  constructor() { this.foods = []; this._nextId = 0; }
  spawn(snakes, count=1) {
    for (let i=0; i<count; i++) {
      const r = Math.random();
      let type = r < 0.1 ? FoodType.SLOW : r < 0.3 ? FoodType.GOLD : FoodType.NORMAL;
      const occupied = new Set();
      snakes.forEach(s => s.segments.forEach(seg => occupied.add(`${seg.x},${seg.y}`)));
      this.foods.forEach(f => f.active && occupied.add(`${f.position.x},${f.position.y}`));
      let pos;
      let attempts=0;
      do {
        pos = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
        attempts++;
      } while (occupied.has(`${pos.x},${pos.y}`) && attempts<200);
      this.foods.push({ id:this._nextId++, type, position:pos, active:true, spawnTime:Date.now() });
    }
  }
  checkEat(snake) {
    const h = snake.head();
    for (let i=this.foods.length-1; i>=0; i--) {
      const f = this.foods[i];
      if (!f.active) continue;
      if (f.position.x===h.x && f.position.y===h.y) {
        f.active = false;
        return f;
      }
    }
    return null;
  }
  cleanup() {
    this.foods = this.foods.filter(f => f.active);
    const now = Date.now();
    this.foods = this.foods.map(f => {
      if (f.type === FoodType.GOLD && now - f.spawnTime > 5000) return {...f, active:false};
      return f;
    }).filter(f => f.active && (f.type!==FoodType.GOLD || now-f.spawnTime<5000));
  }
  getAlivePositions() { return this.foods.filter(f=>f.active).map(f=>f.position); }
  getNearest(snake) {
    const h = snake.head(); let best=null, bestDist=Infinity;
    this.foods.forEach(f => {
      if(!f.active) return;
      const d = Math.abs(h.x-f.position.x)+Math.abs(h.y-f.position.y);
      if(d<bestDist){bestDist=d;best=f;}
    });
    return best;
  }
}
