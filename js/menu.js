// menu.js — Menu and UI renderer
import { CONFIG } from './config.js';
import { SKINS } from './skins.js';

export class MenuManager {
  constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); }

  showDifficultySelect(level) {
    this._renderSelect('SELECT DIFFICULTY', Object.entries(CONFIG.levels).map(([k,v])=>({id:k,label:`${v.label} (${v.ms}ms)`,selected:k===level})), (id)=>window.__startGame && window.__startGame(id));
  }

  showModeSelect(mode) {
    const modes=[{id:'1p',label:'1 PLAYER',icon:'🐍'},{id:'2p',label:'2 PLAYERS',icon:'🐍🐍'},{id:'vsbot',label:'VS BOT',icon:'🤖'}];
    this._renderSelect('MODE', modes.map(m=>({id:m.id,label:`${m.icon} ${m.label}`,selected:m.id===mode})), (id)=>window.__selectMode && window.__selectMode(id));
  }

  showSkinSelect(current) {
    const items=Object.entries(SKINS).map(([k,v])=>({id:k,label:v.name,color:v.text,preview:v.snakeHead,selected:k===current}));
    this._renderSelect('SKIN', items, (id)=>window.__selectSkin && window.__selectSkin(id));
  }

  showAchievements(progress) {
    const ctx=this.ctx;
    ctx.clearRect(0,0,400,400);
    ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,400,400);
    ctx.fillStyle='#00ff41'; ctx.font='bold 14px Orbitron,monospace';
    ctx.textAlign='center';
    ctx.fillText(`ACHIEVEMENTS (${progress.unlocked}/${progress.total})`,200,30);
    progress.list.forEach((a,i)=>{
      ctx.fillStyle=a.unlocked?'#ffd700':'rgba(255,255,255,0.2)';
      ctx.font='10px Orbitron,monospace';
      ctx.textAlign='left';
      ctx.fillText(`${a.unlocked?a.icon:'🔒'} ${a.name}${a.unlocked?' ✅':''} — ${a.desc}`,20,55+i*24);
    });
    ctx.fillStyle='rgba(0,255,65,0.4)'; ctx.font='9px Orbitron,monospace'; ctx.textAlign='center';
    ctx.fillText('press ENTER to go back',200,380);
  }

  _renderSelect(title, items, onSelect) {
    const wrap = this.canvas.parentElement;
    let overlay = wrap.querySelector('.snake-menu-overlay');
    if(!overlay){
      overlay=document.createElement('div');
      overlay.className='snake-menu-overlay';
      overlay.style.cssText='position:absolute;inset:0;z-index:20;background:rgba(0,0,0,0.85);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;';
      wrap.appendChild(overlay);
    }
    overlay.innerHTML=`<div style="color:#00ff41;font-family:Orbitron,monospace;font-size:12px;letter-spacing:3px;margin-bottom:4px;text-shadow:0 0 15px rgba(0,255,65,0.5)">▶ ${title}</div>
      ${items.map((it,i)=>`<button class="snake-menu-btn ${it.selected?'selected':''}" data-id="${it.id}" style="width:200px;padding:8px 12px;border:1px solid ${it.selected?'#00ff41':'rgba(0,255,65,0.3)'};background:${it.selected?'rgba(0,255,65,0.15)':'rgba(0,255,65,0.05)'};color:${it.color||'#00ff41'};font-family:Orbitron,monospace;font-size:11px;letter-spacing:1px;cursor:pointer;border-radius:4px;transition:0.2s;text-align:center;${it.selected?'box-shadow:0 0 15px rgba(0,255,65,0.2)':''}">${it.label}</button>`).join('')}
      <div style="margin-top:6px;font-size:9px;color:rgba(0,255,65,0.3);font-family:Orbitron,monospace">press ENTER to select</div>`;
    overlay.querySelectorAll('.snake-menu-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{overlay.remove();onSelect(btn.dataset.id);});
      btn.addEventListener('mouseenter',()=>{btn.style.borderColor='#00ff41';btn.style.background='rgba(0,255,65,0.15)';});
      btn.addEventListener('mouseleave',()=>{btn.style.borderColor=btn.classList.contains('selected')?'#00ff41':'rgba(0,255,65,0.3)';btn.style.background=btn.classList.contains('selected')?'rgba(0,255,65,0.15)':'rgba(0,255,65,0.05)';});
    });
    overlay.querySelector('.snake-menu-btn.selected')?.focus();
    return overlay;
  }
}
