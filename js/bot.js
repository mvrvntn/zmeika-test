// bot.js — AI Bot player (greedy food seeker)
import { DIR, COLS, ROWS } from './config.js';
export class BotBrain {
  constructor() { this.target = null; }
  getDirection(snake, foods) {
    if (!snake.alive) return snake.direction;
    // Find nearest food
    const h = snake.head();
    let best=null, bestDist=Infinity;
    foods.forEach(f=>{
      if(!f.active) return;
      const d=Math.abs(h.x-f.position.x)+Math.abs(h.y-f.position.y);
      if(d<bestDist){bestDist=d;best=f;}
    });
    if(!best) return snake.direction;
    // Choose direction toward food, avoid walls/self
    const candidates = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT].filter(d => {
      const nx=h.x+d.x, ny=h.y+d.y;
      if(nx<0||nx>=COLS||ny<0||ny>=ROWS) return false;
      return !snake.segments.slice(0,-1).some(s=>s.x===nx&&s.y===ny);
    });
    if(candidates.length===0) return snake.direction;
    return candidates.reduce((best,d)=>{
      const nx=h.x+d.x, ny=h.y+d.y;
      const dist=Math.abs(nx-best.position.x)+Math.abs(ny-best.position.y);
      return dist<best.dist ? {dir:d,dist} : best;
    }, {dir:candidates[0],dist:Infinity}).dir;
  }
}
