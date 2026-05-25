// renderer.js — Canvas renderer
import { GRID, COLS, ROWS } from './config.js';
import { getSkin } from './skins.js';
export class Renderer {
  constructor(canvas) { this.ctx=canvas.getContext('2d'); this.stars=Array.from({length:40},()=>({x:Math.random()*400,y:Math.random()*400,size:Math.random()*1.5+0.5,speed:Math.random()*0.3+0.1})); }
  clear(skin) {
    const s=getSkin(skin); const ctx=this.ctx;
    ctx.clearRect(0,0,400,400);
    const g=ctx.createRadialGradient(200,200,50,200,200,300);
    g.addColorStop(0,s.bgGrad1); g.addColorStop(1,s.bgGrad2);
    ctx.fillStyle=g; ctx.fillRect(0,0,400,400);
    this._stars(s);
    // Grid
    ctx.strokeStyle=s.grid; ctx.lineWidth=0.5;
    for(let i=0;i<=COLS;i++){ctx.beginPath();ctx.moveTo(i*GRID,0);ctx.lineTo(i*GRID,400);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*GRID);ctx.lineTo(400,i*GRID);ctx.stroke();}
  }
  _stars(skin) {
    const ctx=this.ctx; const now=Date.now();
    this.stars.forEach(st=>{
      st.y+=st.speed; if(st.y>400){st.y=-2;st.x=Math.random()*400;}
      ctx.fillStyle=`rgba(255,255,255,${0.2+Math.sin(now*0.001+st.x)*0.15})`;
      ctx.beginPath(); ctx.arc(st.x,st.y,st.size,0,Math.PI*2); ctx.fill();
    });
  }
  drawFood(foods, skin) {
    const s=getSkin(skin); const ctx=this.ctx; const now=Date.now();
    foods.forEach(f=>{
      if(!f.active) return;
      const ax=f.position.x*GRID+GRID/2, ay=f.position.y*GRID+GRID/2;
      if(f.type===1&&now-f.spawnTime>4000&&Math.floor((now-f.spawnTime)/120)%2===0) return;
      let c1,c2,sh;
      if(f.type===1){c1=s.foodGold[0];c2=s.foodGold[1];sh=s.foodGold[0];}
      else if(f.type===2){c1=s.foodSlow[0];c2=s.foodSlow[1];sh=s.foodSlow[0];}
      else{c1=s.foodNormal[0];c2=s.foodNormal[1];sh=s.foodNormal[0];}
      ctx.shadowColor=sh; ctx.shadowBlur=18;
      const fg=ctx.createRadialGradient(ax-3,ay-3,2,ax,ay,10);
      fg.addColorStop(0,c1); fg.addColorStop(1,c2);
      ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(ax,ay,7,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0; ctx.fillStyle='rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.arc(ax-3,ay-3,2,0,Math.PI*2); ctx.fill();
    });
  }
  drawSnake(snake, skin, dir) {
    const s=getSkin(skin); const ctx=this.ctx;
    if(!snake||!snake.segments) return;
    snake.segments.forEach((seg,i)=>{
      const isHead=i===0; const t=i/snake.segments.length;
      ctx.shadowColor=s.shadow; ctx.shadowBlur=isHead?20:8;
      const gr=isHead?255:Math.round(255-t*120);
      const bl=isHead?65:Math.round(65-t*40);
      ctx.fillStyle=isHead?s.snakeHead:`rgb(0,${gr},${bl})`;
      const pad=isHead?0:2;
      ctx.fillRect(seg.x*GRID+pad, seg.y*GRID+pad, GRID-pad*2, GRID-pad*2);
      if(isHead){
        ctx.fillStyle='white';ctx.shadowBlur=4;
        let ex1,ey1,ex2,ey2;
        if(dir.x===1){ex1=seg.x*GRID+14;ey1=seg.y*GRID+5;ex2=seg.x*GRID+14;ey2=seg.y*GRID+13;}
        else if(dir.x===-1){ex1=seg.x*GRID+6;ey1=seg.y*GRID+5;ex2=seg.x*GRID+6;ey2=seg.y*GRID+13;}
        else if(dir.y===-1){ex1=seg.x*GRID+5;ey1=seg.y*GRID+6;ex2=seg.x*GRID+13;ey2=seg.y*GRID+6;}
        else{ex1=seg.x*GRID+5;ey1=seg.y*GRID+14;ex2=seg.x*GRID+13;ey2=seg.y*GRID+14;}
        ctx.beginPath();ctx.arc(ex1,ey1,2,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(ex2,ey2,2,0,Math.PI*2);ctx.fill();
      }
    });
    ctx.shadowBlur=0;
  }
  drawSnakeBySkin(snake, skin) { this.drawSnake(snake, skin, snake.direction); }
  overlay(text, subtext, style={}) {
    const ctx=this.ctx; const t=style;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,400,400);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(t.color){ctx.shadowColor=t.color;ctx.shadowBlur=30;}
    ctx.fillStyle=t.color||'#00ff41';
    ctx.font=`bold ${t.fontSize||28}px Orbitron,monospace`;
    ctx.fillText(text,200,160);
    ctx.shadowBlur=0;
    ctx.fillStyle=subtext?'rgba(255,255,255,0.5)':'transparent';
    ctx.font='12px Orbitron,monospace';
    if(subtext) ctx.fillText(subtext,200,230);
  }
}
