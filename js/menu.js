// menu.js — MenuManager for mode select, skin select, achievements

import { listSkins, getSkin } from './skins.js';

export class MenuManager {
  /**
   * @param {HTMLElement} container
   * @param {object} callbacks - { onStart, onModeChange, onSkinChange, onDifficultyChange, onWallsChange, onShowAchievements, onBackToMenu }
   */
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentScreen = 'mode'; // mode | skin | achievements | gameOver | paused

    // State
    this.mode = '1p'; // 1p | 2p | bot
    this.skinId = 'neon';
    this.difficulty = 'medium';
    this.wallMode = 'normal';
  }

  /**
   * Show the main menu with mode selection
   */
  showModeSelect() {
    this.currentScreen = 'mode';
    const c = this.container;
    c.innerHTML = '';
    c.style.display = 'flex';

    const wrapper = document.createElement('div');
    wrapper.className = 'menu-wrapper';
    wrapper.innerHTML = `
      <h1 class="menu-title">⏵ SNAKE V3.0</h1>

      <div class="menu-section">
        <h3>Mode</h3>
        <div class="menu-options">
          <label class="menu-option ${this.mode === '1p' ? 'active' : ''}" data-mode="1p">
            <span class="radio ${this.mode === '1p' ? 'radio-active' : ''}"></span>
            <span class="option-label">1 Player</span>
            <span class="option-hint">[WASD]</span>
          </label>
          <label class="menu-option ${this.mode === '2p' ? 'active' : ''}" data-mode="2p">
            <span class="radio ${this.mode === '2p' ? 'radio-active' : ''}"></span>
            <span class="option-label">2 Players (PvP)</span>
            <span class="option-hint">[WASD] [↑↓←→]</span>
          </label>
          <label class="menu-option ${this.mode === 'bot' ? 'active' : ''}" data-mode="bot">
            <span class="radio ${this.mode === 'bot' ? 'radio-active' : ''}"></span>
            <span class="option-label">vs Bot</span>
            <span class="option-hint">[WASD]</span>
          </label>
        </div>
      </div>

      <div class="menu-section">
        <h3>Difficulty</h3>
        <div class="menu-options menu-options-row">
          ${['easy', 'medium', 'hard', 'insane'].map(d =>
            `<label class="menu-option-sm ${this.difficulty === d ? 'active' : ''}" data-difficulty="${d}">
              <span class="radio-sm ${this.difficulty === d ? 'radio-active' : ''}"></span>
              <span>${d.charAt(0).toUpperCase() + d.slice(1)}</span>
            </label>`
          ).join('')}
        </div>
      </div>

      <div class="menu-section">
        <h3>Walls</h3>
        <div class="menu-options menu-options-row">
          <label class="menu-option-sm ${this.wallMode === 'normal' ? 'active' : ''}" data-walls="normal">
            <span class="radio-sm ${this.wallMode === 'normal' ? 'radio-active' : ''}"></span>
            <span>Normal</span>
          </label>
          <label class="menu-option-sm ${this.wallMode === 'no_walls' ? 'active' : ''}" data-walls="no_walls">
            <span class="radio-sm ${this.wallMode === 'no_walls' ? 'radio-active' : ''}"></span>
            <span>No Walls</span>
          </label>
        </div>
      </div>

      <div class="menu-actions">
        <button class="btn-cta" id="btn-start">▸ START GAME</button>
        <button class="btn-secondary" id="btn-skins">SELECT SKIN</button>
        <button class="btn-secondary" id="btn-achievements">ДОСТИЖЕНИЯ</button>
      </div>
    `;

    c.appendChild(wrapper);
    this._bindModeEvents(wrapper);
  }

  _bindModeEvents(wrapper) {
    // Mode selection
    wrapper.querySelectorAll('.menu-option[data-mode]').forEach(el => {
      el.addEventListener('click', () => {
        const mode = el.dataset.mode;
        this.mode = mode;
        wrapper.querySelectorAll('.menu-option[data-mode]').forEach(o => {
          o.classList.toggle('active', o.dataset.mode === mode);
          o.querySelector('.radio').classList.toggle('radio-active', o.dataset.mode === mode);
        });
        if (this.callbacks.onModeChange) this.callbacks.onModeChange(mode);
      });
    });

    // Difficulty
    wrapper.querySelectorAll('[data-difficulty]').forEach(el => {
      el.addEventListener('click', () => {
        const d = el.dataset.difficulty;
        this.difficulty = d;
        wrapper.querySelectorAll('[data-difficulty]').forEach(o => {
          o.classList.toggle('active', o.dataset.difficulty === d);
          o.querySelector('.radio-sm').classList.toggle('radio-active', o.dataset.difficulty === d);
        });
        if (this.callbacks.onDifficultyChange) this.callbacks.onDifficultyChange(d);
      });
    });

    // Walls
    wrapper.querySelectorAll('[data-walls]').forEach(el => {
      el.addEventListener('click', () => {
        const w = el.dataset.walls;
        this.wallMode = w;
        wrapper.querySelectorAll('[data-walls]').forEach(o => {
          o.classList.toggle('active', o.dataset.walls === w);
          o.querySelector('.radio-sm').classList.toggle('radio-active', o.dataset.walls === w);
        });
        if (this.callbacks.onWallsChange) this.callbacks.onWallsChange(w);
      });
    });

    wrapper.querySelector('#btn-start').addEventListener('click', () => {
      if (this.callbacks.onStart) this.callbacks.onStart({
        mode: this.mode,
        skinId: this.skinId,
        difficulty: this.difficulty,
        wallMode: this.wallMode,
      });
    });

    wrapper.querySelector('#btn-skins').addEventListener('click', () => {
      this.showSkinSelect();
    });

    wrapper.querySelector('#btn-achievements').addEventListener('click', () => {
      if (this.callbacks.onShowAchievements) this.callbacks.onShowAchievements();
    });
  }

  /**
   * Show skin selection screen
   */
  showSkinSelect(achievementsManager) {
    this.currentScreen = 'skin';
    const c = this.container;
    c.innerHTML = '';
    c.style.display = 'flex';

    const wrapper = document.createElement('div');
    wrapper.className = 'menu-wrapper';
    wrapper.innerHTML = `
      <h2 class="menu-title">SELECT SKIN</h2>
      <div class="skin-grid"></div>
      <div class="menu-actions">
        <button class="btn-cta" id="btn-confirm-skin">▸ CONFIRM</button>
        <button class="btn-secondary" id="btn-back-mode">BACK TO MENU</button>
      </div>
    `;

    const grid = wrapper.querySelector('.skin-grid');
    const skins = listSkins();

    skins.forEach(skin => {
      const card = document.createElement('div');
      card.className = `skin-card ${skin.id === this.skinId ? 'skin-card-active' : ''}`;
      card.dataset.skinId = skin.id;

      // Preview snake
      const preview = document.createElement('div');
      preview.className = 'skin-preview';
      for (let i = 0; i < 4; i++) {
        const dot = document.createElement('span');
        dot.className = 'skin-segment';
        const t = i / 3;
        const hexToRgb = (h) => {
          const r = parseInt(h.slice(1, 3), 16);
          const g = parseInt(h.slice(3, 5), 16);
          const b = parseInt(h.slice(5, 7), 16);
          return { r, g, b };
        };
        const c1 = hexToRgb(skin.headColor);
        const c2 = hexToRgb(skin.bodyGradientEnd);
        const color = `rgb(${Math.round(c1.r + (c2.r - c1.r) * t)}, ${Math.round(c1.g + (c2.g - c1.g) * t)}, ${Math.round(c1.b + (c2.b - c1.b) * t)})`;
        dot.style.background = i === 3 ? skin.headColor : color;
        if (i === 3) {
          dot.style.borderRadius = '50%';
          dot.style.width = '12px';
          dot.style.height = '12px';
          dot.innerHTML = `<span style="display:inline-block;width:3px;height:3px;background:${skin.eyeColor};border-radius:50%;margin-top:2px;"></span>`;
        }
        preview.appendChild(dot);
      }
      card.appendChild(preview);

      const name = document.createElement('div');
      name.className = 'skin-name';
      name.textContent = skin.name;
      card.appendChild(name);

      if (skin.id === this.skinId) {
        const check = document.createElement('div');
        check.className = 'skin-check';
        check.textContent = '✓';
        card.appendChild(check);
      }

      card.addEventListener('click', () => {
        this.skinId = skin.id;
        wrapper.querySelectorAll('.skin-card').forEach(c => c.classList.remove('skin-card-active'));
        card.classList.add('skin-card-active');
        wrapper.querySelectorAll('.skin-check').forEach(c => c.remove());
        const ch = document.createElement('div');
        ch.className = 'skin-check';
        ch.textContent = '✓';
        card.appendChild(ch);
        if (this.callbacks.onSkinChange) this.callbacks.onSkinChange(skin.id);
      });

      grid.appendChild(card);
    });

    c.appendChild(wrapper);

    wrapper.querySelector('#btn-confirm-skin').addEventListener('click', () => {
      this.showModeSelect();
    });

    wrapper.querySelector('#btn-back-mode').addEventListener('click', () => {
      this.showModeSelect();
    });
  }

  /**
   * Show achievements screen
   */
  showAchievements(achievementManager) {
    this.currentScreen = 'achievements';
    const c = this.container;
    c.innerHTML = '';
    c.style.display = 'flex';

    const all = achievementManager.getAll();
    const unlocked = achievementManager.getUnlocked();
    const progress = achievementManager.getProgressFraction();

    const wrapper = document.createElement('div');
    wrapper.className = 'menu-wrapper';
    wrapper.innerHTML = `
      <h2 class="menu-title">ДОСТИЖЕНИЯ <span class="progress-text">${progress}</span></h2>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width:${achievementManager.getProgressPercent()}%"></div>
      </div>
      <div class="achievements-list"></div>
      <div class="menu-actions">
        <button class="btn-cta" id="btn-back-menu">▸ BACK TO MENU</button>
      </div>
    `;

    const list = wrapper.querySelector('.achievements-list');

    all.forEach(ach => {
      const isUnlocked = ach.unlocked;
      const isHidden = ach.hidden && !isUnlocked;
      const row = document.createElement('div');
      row.className = `achievement-row ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}`;

      const icon = document.createElement('span');
      icon.className = 'achievement-icon';
      icon.textContent = isUnlocked ? ach.icon : (ach.hidden ? '❓' : '⬜');
      row.appendChild(icon);

      const info = document.createElement('div');
      info.className = 'achievement-info';
      const title = document.createElement('div');
      title.className = 'achievement-title';
      title.textContent = isHidden ? '???' : ach.title;
      info.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'achievement-desc';
      desc.textContent = isHidden ? '???' : ach.description;
      info.appendChild(desc);
      row.appendChild(info);

      const status = document.createElement('span');
      status.className = 'achievement-status';
      status.textContent = isUnlocked ? '✅' : '⬜';
      row.appendChild(status);

      list.appendChild(row);
    });

    c.appendChild(wrapper);

    wrapper.querySelector('#btn-back-menu').addEventListener('click', () => {
      this.showModeSelect();
    });
  }

  /**
   * Show game over screen
   */
  showGameOver(snapshot, achievementManager) {
    this.currentScreen = 'gameOver';
    const c = this.container;
    c.innerHTML = '';
    c.style.display = 'flex';

    const entities = snapshot.entities || [];
    const p1 = entities[0] || { score: 0, segments: [] };

    const wrapper = document.createElement('div');
    wrapper.className = 'menu-wrapper gameover-wrapper';
    wrapper.innerHTML = `
      <h1 class="menu-title gameover-title" id="gameOverTitle">ИГРА ОКОНЧЕНА</h1>
      <div class="gameover-score">${p1.score}</div>
      <div class="gameover-stats">
        <div>🐍 Length: ${p1.segments?.length || 0}</div>
        <div>🍎 Eaten: ${snapshot.foodEaten || 0}</div>
        <div>⏱ Ticks: ${snapshot.ticks || 0}</div>
      </div>
      <div class="menu-actions">
        <button class="btn-cta" id="btn-restart">▸ NEW GAME</button>
        <button class="btn-secondary" id="btn-menu">MAIN MENU</button>
      </div>
    `;

    c.appendChild(wrapper);

    wrapper.querySelector('#btn-restart').addEventListener('click', () => {
      if (this.callbacks.onStart) this.callbacks.onStart({
        mode: this.mode,
        skinId: this.skinId,
        difficulty: this.difficulty,
        wallMode: this.wallMode,
      });
    });

    wrapper.querySelector('#btn-menu').addEventListener('click', () => {
      this.showModeSelect();
    });
  }

  /**
   * Show pause overlay
   */
  showPause() {
    this.currentScreen = 'paused';
    const c = this.container;
    c.innerHTML = '';
    c.style.display = 'flex';

    const overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    overlay.innerHTML = `
      <h2 class="pause-title">ПАУЗА</h2>
      <div class="pause-actions">
        <button class="btn-cta" id="btn-resume">▸ RESUME</button>
        <button class="btn-secondary" id="btn-restart-pause">RESTART</button>
        <button class="btn-secondary" id="btn-quit">QUIT TO MENU</button>
      </div>
    `;

    c.appendChild(overlay);

    overlay.querySelector('#btn-resume').addEventListener('click', () => {
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    overlay.querySelector('#btn-restart-pause').addEventListener('click', () => {
      if (this.callbacks.onStart) this.callbacks.onStart({
        mode: this.mode,
        skinId: this.skinId,
        difficulty: this.difficulty,
        wallMode: this.wallMode,
      });
    });

    overlay.querySelector('#btn-quit').addEventListener('click', () => {
      this.showModeSelect();
    });
  }

  hide() {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
