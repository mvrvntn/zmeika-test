// achievements.js — Achievement system
export class AchievementManager {
  constructor() {
    this.achievements = [
      { id:'firstFood', name:'First Bite', icon:'🍎', desc:'Eat your first food', check:s=>s>=1 },
      { id:'score10', name:'Double Digits', icon:'🔟', desc:'Reach score 10', check:s=>s>=10 },
      { id:'score50', name:'Half Century', icon:'🏆', desc:'Reach score 50', check:s=>s>=50 },
      { id:'noWall', name:'Free Spirit', icon:'🌀', desc:'Win without walls', check:(s,wall)=>wall==='no_walls'&&s>=10 },
      { id:'speedRun', name:'Speed Demon', icon:'⚡', desc:'Score 20 on Hard+', check:(s,lvl)=>['hard','insane'].includes(lvl)&&s>=20 },
      { id:'botKiller', name:'Bot Killer', icon:'🤖', desc:'Beat the bot', check:(s,wall,lvl,mode)=>mode==='vsbot'&&s>=5 }
    ];
    this.unlocked = this._load();
  }
  _load() { try{ return JSON.parse(localStorage.getItem('snakeAch')||'[]'); }catch(e){return [];} }
  _save() { localStorage.setItem('snakeAch',JSON.stringify(this.unlocked)); }
  check(score, wallMode, level, mode) {
    const newly = [];
    this.achievements.forEach(a => {
      if (this.unlocked.includes(a.id)) return;
      if (a.check(score, wallMode, level, mode)) { this.unlocked.push(a.id); newly.push(a); }
    });
    if (newly.length) this._save();
    return newly;
  }
  getProgress() { return { unlocked:this.unlocked.length, total:this.achievements.length, list:this.achievements.map(a=>({...a,unlocked:this.unlocked.includes(a.id)})) }; }
}
