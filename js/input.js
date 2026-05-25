// input.js — Input manager (keyboard + touch)
import { DIR, isOpposite, CONFIG } from './config.js';
export class InputManager {
  constructor() {
    this.p1Dir = null; this.p2Dir = null; this.keys = {};
    this.touchStartX = 0; this.touchStartY = 0;
    this.onPause = null; this.onEnter = null;
    this._onKey = this._onKey.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
  }
  attach(canvas) {
    document.addEventListener('keydown', this._onKey);
    canvas.addEventListener('touchstart', this._onTouchStart, {passive:true});
    canvas.addEventListener('touchend', this._onTouchEnd, {passive:true});
  }
  detach() {
    document.removeEventListener('keydown', this._onKey);
  }
  _onKey(e) {
    const k = e.key;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D',' ','Escape','Enter'].includes(k)) e.preventDefault();
    if (k===' '||k==='Escape') { if(this.onPause) this.onPause(); return; }
    if (k==='Enter') { if(this.onEnter) this.onEnter(); return; }
    this.keys[k] = true;
    // Player 1: arrows
    if (k==='ArrowUp' && CONFIG.gameMode!=='2p') this.p1Dir = DIR.UP;
    else if (k==='ArrowDown' && CONFIG.gameMode!=='2p') this.p1Dir = DIR.DOWN;
    else if (k==='ArrowLeft') this.p1Dir = DIR.LEFT;
    else if (k==='ArrowRight') this.p1Dir = DIR.RIGHT;
    // Player 2: WASD
    if (k==='w'||k==='W') this.p2Dir = DIR.UP;
    else if (k==='s'||k==='S') this.p2Dir = DIR.DOWN;
    else if (k==='a'||k==='A') this.p2Dir = DIR.LEFT;
    else if (k==='d'||k==='D') this.p2Dir = DIR.RIGHT;
  }
  getP1Direction(current) { const d=this.p1Dir; this.p1Dir=null; return d && !isOpposite(d,current) ? d : null; }
  getP2Direction(current) { const d=this.p2Dir; this.p2Dir=null; return d && !isOpposite(d,current) ? d : null; }
  _onTouchStart(e) { const t=e.touches[0]; this.touchStartX=t.clientX; this.touchStartY=t.clientY; }
  _onTouchEnd(e) {
    const t=e.changedTouches[0];
    const dx=t.clientX-this.touchStartX, dy=t.clientY-this.touchStartY;
    if (Math.max(Math.abs(dx),Math.abs(dy))<20) return;
    if (Math.abs(dx)>Math.abs(dy)) this.p1Dir = dx>0 ? DIR.RIGHT : DIR.LEFT;
    else this.p1Dir = dy>0 ? DIR.DOWN : DIR.UP;
  }
}
