// game.js — Main Game class (state machine)
import { CONFIG, DIR } from './config.js';
import { Snake } from './snake.js';
import { FoodManager } from './food.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { AchievementManager } from './achievements.js';
import { MenuManager } from './menu.js';
import { BotBrain } from './bot.js';

const State = { MENU:0, MODE_SELECT:1, SKIN_SELECT:2, PLAYING:3, PAUSED:4, DYING:5, GAME_OVER:6, ACHIEVEMENTS:7 };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.achievements = new AchievementManager();
    this.menu = new MenuManager(canvas);
    this.food = new FoodManager();
    this.bot = new BotBrain();
    this.state = State.MENU;
    this.snakes = [];
    this.botSnake = null;
    this.loop = null;
    this.level = 'medium';
    this.dustParticles = [];
    this._achPopup = null;
    this._achTimeout = null;

    // Wire callbacks
    this.input.onPause = () => this.togglePause();
    this.input.onEnter = () => {
      if (this.state === State.GAME_OVER) this.showModeSelect();
      else if (this.state === State.ACHIEVEMENTS) this.showModeSelect();
    };

    // Global for menu callbacks
    window.__startGame = (lvl) => { this.level=lvl; this.showModeSelect(); };
    window.__selectMode = (mode) => { CONFIG.gameMode=mode; this.showSkinSelect(); };
    window.__selectSkin = (skin) => { CONFIG.currentSkin=skin; this.startGame(skin); };
    window.__returnToMenu = () => { this.showModeSelect(); };

    this.input.attach(canvas);
    this.bindDpad();
    this.showModeSelect();
  }

  showModeSelect() {
    if (this.loop) { clearInterval(this.loop); this.loop=null; }
    this.state = State.MODE_SELECT;
    this.renderer.clear(CONFIG.currentSkin);
    this.menu.showModeSelect(CONFIG.gameMode);
  }

  showSkinSelect() {
    this.state = State.SKIN_SELECT;
    this.renderer.clear(CONFIG.currentSkin);
    this.menu.showSkinSelect(CONFIG.currentSkin);
  }

  startGame(skin) {
    CONFIG.currentSkin = skin;
    this.snakes = [];
    // P1
    const p1 = new Snake('p1', 5, 10);
    this.snakes.push(p1);
    // P2 or Bot
    if (CONFIG.gameMode === '2p') {
      const p2 = new Snake('p2', 14, 10);
      this.snakes.push(p2);
    } else if (CONFIG.gameMode === 'vsbot') {
      this.botSnake = new Snake('bot', 14, 10);
      this.snakes.push(this.botSnake);
    }
    this.food = new FoodManager();
    this.food.spawn(this.snakes, 3);
    this.state = State.PLAYING;
    this.dustParticles = [];
    const ms = CONFIG.levels[this.level].ms;
    if (this.loop) clearInterval(this.loop);
    this.loop = setInterval(() => this.update(), ms);
  }

  update() {
    if (this.state === State.PLAYING) {
      this._processInput();
      this._moveSnakes();
      this._checkFood();
      this._checkCollisions();
      this._checkAchievements();
      this._render();
    }
  }

  _processInput() {
    this.snakes.forEach(s => {
      if (!s.alive) return;
      let nd = null;
      if (s.id === 'p1' || CONFIG.gameMode !== '2p') {
        nd = this.input.getP1Direction(s.direction);
      }
      if (s.id === 'p2') {
        nd = this.input.getP2Direction(s.direction);
      }
      if (s.id === 'bot') {
        nd = this.bot.getDirection(s, this.food.foods);
      }
      if (nd) s.nextDirection = nd;
    });
  }

  _moveSnakes() {
    this.snakes.forEach(s => {
      if (!s.alive) return;
      s.move(s.nextDirection || s.direction);
    });
  }

  _checkFood() {
    this.snakes.forEach(s => {
      if (!s.alive) return;
      const eaten = this.food.checkEat(s);
      if (eaten) {
        s.grow();
        let points = 1;
        if (eaten.type === 1) { points = 3; this.audio.gold(); }
        else if (eaten.type === 2) { points = 0; this.audio.slow(); }
        else { this.audio.eat(); }
        s.score += points;
        this.food.spawn(this.snakes, 1);
      }
    });
    this.food.cleanup();
  }

  _checkCollisions() {
    this.snakes.forEach(s => {
      if (!s.alive) return;
      if (CONFIG.wallMode === 'normal') {
        const h = s.head();
        if (h.x < 0 || h.x >= 20 || h.y < 0 || h.y >= 20) { s.alive = false; return; }
      }
      if (s.collidesSelf()) { s.alive = false; return; }
      // Collision with other snakes
      this.snakes.forEach(other => {
        if (other === s || !other.alive) return;
        if (s.collidesWith(other)) s.alive = false;
      });
    });
    // Check if game should end
    const alive = this.snakes.filter(s => s.alive);
    if (alive.length === 0 && !this.state===State.DYING) {
      this.gameOver();
    }
  }

  _checkAchievements() {
    const totalScore = this.snakes.reduce((sum,s) => sum + s.score, 0);
    const s = this.snakes[0];
    if (!s) return;
    const newAch = this.achievements.check(s.score, CONFIG.wallMode, this.level, CONFIG.gameMode);
    newAch.forEach(a => {
      this.audio.achievement();
      this._showAchievementPopup(a);
    });
  }

  _showAchievementPopup(a) {
    if (this._achTimeout) clearTimeout(this._achTimeout);
    this._achPopup = { id:a.id, name:a.name, icon:a.icon };
    this._achTimeout = setTimeout(() => { this._achPopup = null; this._achTimeout = null; }, 2500);
  }

  gameOver() {
    if (this.state === State.DYING || this.state === State.GAME_OVER) return;
    this.state = State.DYING;
    if (this.loop) { clearInterval(this.loop); this.loop = null; }
    this.audio.gameOver();

    // Death animation: explosion particles
    const allSegs = [];
    this.snakes.forEach(s => {
      if (s.segments) s.segments.forEach((seg,i) => {
        allSegs.push({
          x: seg.x*20+10, y: seg.y*20+10,
          vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6 - 3,
          size: 16, alpha:1, rot: Math.random()*Math.PI*2
        });
      });
    });
    this.dustParticles = allSegs;
    let frames = 0;
    const maxFrames = 25;
    const anim = () => {
      frames++;
      this.dustParticles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.4; p.alpha=Math.max(0,1-frames/maxFrames); p.rot+=0.2; });
      // Render particles
      this.renderer.clear(CONFIG.currentSkin);
      const ctx = this.renderer.ctx;
      this.dustParticles.forEach(p => {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
        ctx.globalAlpha=p.alpha; ctx.shadowColor='#00ff41'; ctx.shadowBlur=12;
        ctx.fillStyle='#00ff41'; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
        ctx.restore();
      });
      if (frames<maxFrames) requestAnimationFrame(anim);
      else { this.state = State.GAME_OVER; this._renderGameOver(); }
    };
    anim();
  }

  _renderGameOver() {
    const best = this.highScore();
    this.renderer.clear(CONFIG.currentSkin);
    const ctx = this.renderer.ctx;
    // Scanlines
    for(let sy=0;sy<400;sy+=4){ ctx.fillStyle=`rgba(0,255,65,${0.02+Math.sin(sy*0.3)*0.01})`; ctx.fillRect(0,sy,400,1); }
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='#ff0040'; ctx.shadowBlur=35;
    ctx.fillStyle='#ff0040'; ctx.font='bold 26px Orbitron,monospace';
    ctx.fillText('GAME OVER',200,130);
    ctx.shadowBlur=0;
    let y=180;
    this.snakes.forEach(s => {
      const color = s.id==='bot'?'#ef4444':'#00d4ff';
      ctx.fillStyle=color; ctx.font='12px Orbitron,monospace';
      ctx.fillText(`${s.id==='p1'?'P1':s.id==='p2'?'P2':'BOT'}: ${s.score}`,200,y);
      y+=22;
    });
    ctx.fillStyle='rgba(255,215,0,0.5)'; ctx.font='11px Orbitron,monospace';
    ctx.fillText(`Best: ${best}`,200,y+6);
    ctx.fillStyle='#00ff41'; ctx.font='13px Orbitron,monospace';
    ctx.fillText('▶ PLAY AGAIN',200,260);
    ctx.fillStyle='rgba(0,255,65,0.3)'; ctx.font='9px Orbitron,monospace';
    ctx.fillText('press ENTER',200,295);
  }

  highScore() {
    try{ return JSON.parse(localStorage.getItem('snakeHighScores')||'[]').sort((a,b)=>b-a)[0]||0; }catch(e){return 0;}
  }

  togglePause() {
    if (this.state === State.PLAYING) {
      this.state = State.PAUSED; this.audio.pause(); this._renderPause();
    } else if (this.state === State.PAUSED) {
      this.state = State.PLAYING; this.audio.pause();
    }
  }

  _renderPause() {
    this.renderer.clear(CONFIG.currentSkin);
    const ctx=this.renderer.ctx;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,400,400);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='#00d4ff'; ctx.shadowBlur=25;
    ctx.fillStyle='#00d4ff'; ctx.font='bold 24px Orbitron,monospace';
    ctx.fillText('⏸ PAUSED',200,200);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(0,212,255,0.3)'; ctx.font='10px Orbitron,monospace';
    ctx.fillText('press SPACE or ESC to resume',200,250);
  }

  _render() {
    const s = CONFIG.currentSkin;
    this.renderer.clear(s);
    this.renderer.drawFood(this.food.foods, s);
    this.snakes.forEach(snk => {
      if (!snk.alive) return;
      this.renderer.drawSnake(snk, s, snk.direction);
    });
    // HUD
    const ctx = this.renderer.ctx;
    let xOff = 10;
    this.snakes.forEach(snk => {
      const label = snk.id==='p1'?'P1':snk.id==='p2'?'P2':'BOT';
      ctx.fillStyle=snk.id==='bot'?'#ef4444':'#00d4ff';
      ctx.font='10px Orbitron,monospace'; ctx.textAlign='left';
      ctx.fillText(`${label}: ${snk.score}`, xOff, 14);
      xOff += snk.id==='p1'?0:(CONFIG.gameMode==='2p'?70:55);
    });
    // Achievement popup
    if (this._achPopup) {
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(100,170,200,40);
      ctx.textAlign='center';
      ctx.fillStyle='#ffd700'; ctx.font='11px Orbitron,monospace';
      ctx.fillText(`${this._achPopup.icon} ${this._achPopup.name}`,200,195);
    }
  }

  bindDpad() {
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.state !== State.PLAYING) return;
        const dir = btn.dataset.dir;
        const d = {up:DIR.UP,down:DIR.DOWN,left:DIR.LEFT,right:DIR.RIGHT}[dir];
        if (d) { this.snakes.forEach(s => { if(s.id==='p1'||CONFIG.gameMode!=='2p') s.nextDirection=d; }); this.audio.move(); }
      });
    });
  }
}
