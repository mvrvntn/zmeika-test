// audio.js — Web Audio API sound manager
export class AudioManager {
  constructor() { this.ctx = null; this.enabled = true; }
  init() { if(!this.ctx) this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }
  _tone(f, eF, dur, type='square', vol=0.06) {
    if(!this.enabled) return;
    try {
      this.init();
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type=type; o.frequency.setValueAtTime(f, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(eF, this.ctx.currentTime+dur/1000);
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+dur/1000);
      o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+dur/1000);
    } catch(e){}
  }
  eat() { this._tone(400,600,100,'square',0.06); }
  gold() { this._tone(800,800,60,'square',0.05); setTimeout(()=>this._tone(1000,1000,60,'square',0.05),80); }
  slow() { this._tone(300,500,200,'sine',0.06); }
  move() { this._tone(1000,1000,10,'square',0.02); }
  gameOver() { this._tone(300,80,500,'sawtooth',0.07); }
  pause() { this._tone(500,600,80,'sine',0.04); }
  achievement() { this._tone(600,1200,150,'sine',0.07); setTimeout(()=>this._tone(1200,1500,150,'sine',0.07),180); }
  toggle() { this.enabled=!this.enabled; return this.enabled; }
}
