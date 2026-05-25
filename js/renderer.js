// renderer.js — Canvas renderer

import { CONFIG, FOOD_TYPE } from './config.js';
import { getSkin } from './skins.js';
import { DIR } from './config.js';

/**
 * Lerp between two hex colors
 */
function lerpColor(color1, color2, t) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = CONFIG.cellSize;
    this.gridCols = CONFIG.gridCols;
    this.gridRows = CONFIG.gridRows;
    this.width = this.gridCols * this.cellSize;
    this.height = this.gridRows * this.cellSize;

    canvas.width = this.width;
    canvas.height = this.height;

    /** @type {Array<{x:number, y:number, size:number, phase:number}>} */
    this.stars = [];
    this._generateStars();

    this.deathParticles = [];
    this.deathAnimating = false;

    // Popup state
    this.achievementPopup = null;
  }

  _generateStars() {
    for (let i = 0; i < CONFIG.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Main draw call — renders everything for one frame
   * @param {object} state - game state object
   */
  draw(state) {
    if (!state) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const skin = getSkin(state.skinId || CONFIG.defaultSkin);

    this._drawBackground(skin);
    this._drawStars();
    this._drawGrid(skin);

    // Draw food
    if (state.foods) {
      for (const food of state.foods) {
        if (food.active) {
          this._drawFood(food, skin);
        }
      }
    }

    // Draw snakes
    if (state.entities) {
      for (const entity of state.entities) {
        if (entity.alive) {
          this._drawSnake(entity, skin);
        }
      }
    }

    // Draw death particles
    if (this.deathParticles.length > 0) {
      this._drawDeathParticles();
    }

    // Draw achievement popup
    if (this.achievementPopup) {
      this._drawAchievementPopup();
    }
  }

  _drawBackground(skin) {
    this.ctx.fillStyle = skin.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  _drawStars() {
    const time = performance.now() / 1000;
    for (const star of this.stars) {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * 2 + star.phase));
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  _drawGrid(skin) {
    this.ctx.strokeStyle = skin.gridLine;
    this.ctx.lineWidth = 0.5;

    for (let x = 0; x <= this.gridCols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.gridRows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(this.width, y * this.cellSize);
      this.ctx.stroke();
    }
  }

  _drawSnake(entity, defaultSkin) {
    const skin = getSkin(entity.skinId || defaultSkin.id);
    const ctx = this.ctx;
    const { segments } = entity;
    if (segments.length === 0) return;

    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    const glowAlpha = 0.15 + 0.15 * pulse;
    const cell = this.cellSize;

    // Draw segments (body)
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const t = i / Math.max(segments.length - 1, 1);
      const color = lerpColor(skin.bodyColor, skin.bodyGradientEnd, t);
      const size = cell - 2;

      ctx.shadowColor = skin.glowColor;
      ctx.shadowBlur = 4;

      ctx.fillStyle = color;
      const x = seg.x * cell + 1;
      const y = seg.y * cell + 1;
      ctx.fillRect(x, y, size, size);

      ctx.shadowBlur = 0;
    }

    // Draw head
    const head = segments[segments.length - 1];
    if (head) {
      ctx.shadowColor = skin.glowColor;
      ctx.shadowBlur = 8 + 4 * pulse;
      ctx.fillStyle = skin.headColor;
      const hx = head.x * cell + 1;
      const hy = head.y * cell + 1;
      const hs = cell - 2;
      ctx.fillRect(hx, hy, hs, hs);
      ctx.shadowBlur = 0;

      // Eyes
      const eyeSize = 3;
      const dir = entity.direction || DIR.RIGHT;
      const cx = head.x * cell + cell / 2;
      const cy = head.y * cell + cell / 2;
      let ex1, ey1, ex2, ey2;

      if (dir === DIR.UP) {
        ex1 = cx - 4; ey1 = cy - 1;
        ex2 = cx + 4; ey2 = cy - 1;
      } else if (dir === DIR.DOWN) {
        ex1 = cx - 4; ey1 = cy + 1;
        ex2 = cx + 4; ey2 = cy + 1;
      } else if (dir === DIR.RIGHT) {
        ex1 = cx + 1; ey1 = cy - 4;
        ex2 = cx + 1; ey2 = cy + 4;
      } else {
        ex1 = cx - 1; ey1 = cy - 4;
        ex2 = cx - 1; ey2 = cy + 4;
      }

      ctx.fillStyle = skin.eyeColor;
      ctx.beginPath();
      ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawFood(food, skin) {
    const { x, y } = food.position;
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;
    const time = performance.now() / 1000;

    let color, glowColor, pulseFreq;

    switch (food.type) {
      case 'GOLD':
        color = skin.foodGoldColor;
        glowColor = skin.foodGoldGlow;
        pulseFreq = 4;
        break;
      case 'SLOW':
        color = skin.foodSlowColor;
        glowColor = skin.foodSlowGlow;
        pulseFreq = 2.5;
        break;
      default:
        color = skin.foodColor;
        glowColor = skin.foodGlow;
        pulseFreq = 2;
    }

    const scale = 0.5 + 0.5 * Math.sin(time * pulseFreq);
    const r = (this.cellSize / 2 - 2) * (0.85 + 0.15 * scale);

    // Glow
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 10;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner highlight
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _drawDeathParticles() {
    const particles = this.deathParticles;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.vy += 0.05;

      if (p.alpha <= 0) continue;

      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    this.deathParticles = this.deathParticles.filter(p => p.alpha > 0);
  }

  /**
   * Start death animation for a snake
   * @param {object} entity
   * @returns {Promise<void>}
   */
  startDeathAnimation(entity) {
    return new Promise((resolve) => {
      const skin = getSkin(entity.skinId);
      this.deathParticles = [];

      for (const seg of entity.segments) {
        const cx = seg.x * this.cellSize + this.cellSize / 2;
        const cy = seg.y * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 3;
          this.deathParticles.push({
            x: cx + (Math.random() - 0.5) * 4,
            y: cy + (Math.random() - 0.5) * 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            color: i === 0 ? skin.headColor : skin.bodyColor,
            alpha: 1,
            decay: 0.008 + Math.random() * 0.008,
          });
        }
      }

      setTimeout(() => {
        this.deathAnimating = false;
        this.deathParticles = [];
        resolve();
      }, CONFIG.deathDuration);
    });
  }

  /**
   * Show an achievement popup
   * @param {object} achievement
   */
  showAchievementPopup(achievement) {
    this.achievementPopup = {
      ...achievement,
      startTime: performance.now(),
      duration: 3500,
      slideInTime: 300,
      fadeOutTime: 500,
    };
  }

  _drawAchievementPopup() {
    const popup = this.achievementPopup;
    if (!popup) return;

    const elapsed = performance.now() - popup.startTime;
    const totalDuration = popup.duration;

    if (elapsed > totalDuration) {
      this.achievementPopup = null;
      return;
    }

    let alpha = 1;
    if (elapsed < popup.slideInTime) {
      alpha = elapsed / popup.slideInTime;
    } else if (elapsed > totalDuration - popup.fadeOutTime) {
      alpha = (totalDuration - elapsed) / popup.fadeOutTime;
    }

    const canvas = this.canvas;
    const ctx = this.ctx;
    const popupW = 300;
    const popupH = 60;
    const popupX = (canvas.width - popupW) / 2;
    let popupY = 20;
    if (elapsed < 300) {
      popupY = 20 - 50 * (1 - elapsed / 300);
    }

    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = 'rgba(0, 15, 25, 0.9)';
    ctx.fillRect(popupX, popupY, popupW, popupH);

    // Border glow
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(popupX, popupY, popupW, popupH);

    // Text
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(popup.icon + ' Достижение открыто!', popupX + 12, popupY + 18);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(popup.title, popupX + 12, popupY + 42);

    ctx.globalAlpha = 1;
  }

  /**
   * Draw HUD overlay (score, length, etc.) — draws below the canvas
   * @param {Array} entities
   */
  drawHUD(entities) {
    if (!entities || entities.length === 0) return;

    const ctx = this.ctx;
    const canvas = this.canvas;

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (!e) continue;
      const label = e.isBot ? 'BOT' : `P${i + 1}`;
      const x = i === 0 ? 5 : canvas.width - 150;
      const y = canvas.height + 5;

      ctx.font = '12px monospace';
      ctx.textAlign = i === 0 ? 'left' : 'right';
      ctx.textBaseline = 'top';

      // Status dot
      const statusColor = e.alive ? '#00ff41' : '#ff0040';
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(i === 0 ? x + 8 : x - 8, y + 6, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(`${label} СЧЁТ: ${e.score}`, x, y);
      ctx.fillStyle = '#808080';
      ctx.font = '10px monospace';
      ctx.fillText(`len: ${e.segments?.length || 0}`, x, y + 14);
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
