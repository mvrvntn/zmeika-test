// game.js — Game state machine and main loop

import { CONFIG, DIR, FOOD_TYPE } from './config.js';
import { Snake } from './snake.js';
import { FoodManager } from './food.js';
import { BotBrain } from './bot.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { AchievementManager } from './achievements.js';
import { Renderer } from './renderer.js';
import { MenuManager } from './menu.js';
import { getSkin } from './skins.js';

const STATE = {
  MENU: 'MENU',
  MODE_SELECT: 'MODE_SELECT',
  SKIN_SELECT: 'SKIN_SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DYING: 'DYING',
  GAME_OVER: 'GAME_OVER',
};

export class Game {
  constructor(canvas, menuContainer) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.achievements = new AchievementManager();
    this.menu = new MenuManager(menuContainer, {
      onStart: (config) => this.startGame(config),
      onModeChange: (mode) => {},
      onSkinChange: (skinId) => {},
      onDifficultyChange: (diff) => {},
      onWallsChange: (walls) => {},
      onShowAchievements: () => this.showAchievements(),
      onResume: () => this.resumeGame(),
    });

    this.state = STATE.MENU;
    this.gameState = {
      ticks: 0,
      tickMs: CONFIG.initialSpeed,
      gridWidth: CONFIG.gridCols,
      gridHeight: CONFIG.gridRows,
      wallMode: 'normal',
      difficulty: 'medium',
      entities: [],
      foods: [],
      foodEaten: 0,
      goldEaten: 0,
      wallsHit: 0,
      selfHits: 0,
      ticksSurvived: 0,
      roundsPlayed: 0,
      skinId: CONFIG.defaultSkin,
      players: [],
    };

    /** @type {Snake[]} */
    this.snakes = [];
    /** @type {FoodManager} */
    this.foodManager = null;
    /** @type {BotBrain[]} */
    this.bots = [];

    this.gameConfig = {
      mode: '1p',
      skinId: CONFIG.defaultSkin,
      difficulty: 'medium',
      wallMode: 'normal',
    };

    this.tickTimer = null;
    this.rAFId = null;
    this.lastTickTime = 0;
    this.tickAccumulator = 0;

    // Keyboard shortcuts
    this.onKeyDownBound = this._onKeyDown.bind(this);
    window.addEventListener('keydown', this.onKeyDownBound);

    this.audio.init();
  }

  start() {
    this.menu.showModeSelect();
  }

  /**
   * Start a new game with given config
   */
  startGame(config) {
    this.audio.resume();

    this.gameConfig = {
      mode: config.mode || '1p',
      skinId: config.skinId || CONFIG.defaultSkin,
      difficulty: config.difficulty || 'medium',
      wallMode: config.wallMode || 'normal',
    };

    // Reset game state
    this.gameState = {
      ticks: 0,
      tickMs: CONFIG.difficulties[this.gameConfig.difficulty]?.speed || CONFIG.initialSpeed,
      gridWidth: CONFIG.gridCols,
      gridHeight: CONFIG.gridRows,
      wallMode: this.gameConfig.wallMode,
      difficulty: this.gameConfig.difficulty,
      entities: [],
      foods: [],
      foodEaten: 0,
      goldEaten: 0,
      wallsHit: 0,
      selfHits: 0,
      ticksSurvived: 0,
      roundsPlayed: 0,
      skinId: this.gameConfig.skinId,
      players: [],
    };

    this.state = STATE.PLAYING;
    this.menu.hide();

    // Create snakes
    this.snakes = [];
    this.bots = [];
    const midX = Math.floor(CONFIG.gridCols / 2);
    const midY = Math.floor(CONFIG.gridRows / 2);

    // Player 1 (always present)
    const p1 = new Snake('player1', { x: 3, y: midY }, DIR.RIGHT, this.gameConfig.skinId);
    p1.isBot = false;
    this.snakes.push(p1);

    if (this.gameConfig.mode === '2p') {
      const p2 = new Snake('player2', { x: CONFIG.gridCols - 4, y: midY }, DIR.LEFT, 'fire');
      p2.isBot = false;
      this.snakes.push(p2);
    } else if (this.gameConfig.mode === 'bot') {
      const botSnake = new Snake('bot', { x: CONFIG.gridCols - 4, y: midY }, DIR.LEFT, 'gold');
      botSnake.isBot = true;
      this.snakes.push(botSnake);
      const bot = new BotBrain(this.gameConfig.difficulty);
      this.bots.push(bot);
    }

    // Bind input
    this.input.unbindAll();
    this.input.bindForPlayer('player1', {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    });
    this.input.bindForPlayer('player1_wasd', {
      up: 'w',
      down: 's',
      left: 'a',
      right: 'd',
    });
    // Listen for WASD on player1 as well
    this.input.bindForPlayer('player2', {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    });

    // Enable swipe for touch
    this.input.enableSwipe(this.canvas);

    // Create food manager
    this.foodManager = new FoodManager({
      gridCols: CONFIG.gridCols,
      gridRows: CONFIG.gridRows,
    });
    this.foodManager.reset();

    // Spawn initial food
    for (let i = 0; i < 3; i++) {
      this.foodManager.spawn(this.snakes);
    }

    // Start game loop (requestAnimationFrame-based)
    this.lastTickTime = performance.now();
    this.tickAccumulator = 0;
    this._gameLoop();
  }

  _gameLoop() {
    if (this.state === STATE.GAME_OVER || this.state === STATE.MENU) return;

    const now = performance.now();
    const delta = now - this.lastTickTime;
    this.lastTickTime = now;

    if (this.state === STATE.PLAYING) {
      this.tickAccumulator += delta;

      while (this.tickAccumulator >= this.gameState.tickMs) {
        this.tickAccumulator -= this.gameState.tickMs;
        this._tick();
      }
    }

    this._render();
    this.rAFId = requestAnimationFrame(() => this._gameLoop());
  }

  _tick() {
    this.gameState.ticks++;
    this.gameState.ticksSurvived++;
    this.gameState.tickMs = Math.max(
      CONFIG.minSpeed,
      CONFIG.initialSpeed - this.gameState.foodEaten * CONFIG.speedIncrement
    );

    // Process input
    for (const snake of this.snakes) {
      if (!snake.alive) continue;

      if (snake.isBot) {
        const bot = this.bots[0]; // only one bot for now
        const dir = bot.decide(
          snake,
          this.foodManager.getActive(),
          CONFIG.gridCols,
          CONFIG.gridRows,
          this.snakes.filter(s => s !== snake && s.alive)
        );
        snake.setDirection(dir);
      } else {
        // Check input from both key sets
        const dir1 = this.input.getCurrentInput('player1');
        const dirWASD = this.input.getCurrentInput('player1_wasd');
        const dir = dir1 || dirWASD;
        if (dir) {
          snake.setDirection(dir);
        }
      }
    }

    // Move all snakes
    for (const snake of this.snakes) {
      if (!snake.alive) continue;
      snake.move();
    }

    // Check collisions
    for (const snake of this.snakes) {
      if (!snake.alive) continue;

      // Wall collision
      if (this.gameConfig.wallMode === 'normal' && snake.collidesWall(CONFIG.gridCols, CONFIG.gridRows)) {
        snake.alive = false;
        this.gameState.wallsHit++;
        this._handleDeath(snake);
        continue;
      }

      // Self collision
      if (snake.collidesSelf()) {
        snake.alive = false;
        this.gameState.selfHits++;
        this._handleDeath(snake);
        continue;
      }

      // Snake-to-snake collision
      for (const other of this.snakes) {
        if (other === snake || !other.alive) continue;
        if (snake.collidesWith(other)) {
          snake.alive = false;
          this.gameState.wallsHit++;
          this._handleDeath(snake);
          break;
        }
      }
    }

    // Check food eating
    for (const snake of this.snakes) {
      if (!snake.alive) continue;

      const food = this.foodManager.checkEat(snake);
      if (food) {
        snake.foodEaten++;
        this.gameState.foodEaten++;

        if (food.type === FOOD_TYPE.GOLD) {
          snake.score += CONFIG.foodGoldPoints;
          snake.goldEaten++;
          this.gameState.goldEaten++;
          this.audio.playGold();
        } else if (food.type === FOOD_TYPE.SLOW) {
          snake.score += CONFIG.foodSlowPoints;
          snake.segments.pop(); // shrink instead of grow
          this.audio.playSlow();
        } else {
          snake.score += 1;
          snake.grow();
          this.audio.playEat();
        }

        snake.grow(); // all food makes snake grow (slow also grows but we shrunk first)
        this.foodManager.remove(food);

        // Check achievements after eating
        const snapshot = this._buildSnapshot();
        const newAch = this.achievements.check(snapshot);
        for (const ach of newAch) {
          this.renderer.showAchievementPopup(ach);
          this.audio.playAchievement();
        }
      }
    }

    // Clean up expired food and spawn new
    this.foodManager.cleanup();
    this.foodManager.spawn(this.snakes);

    // Check if all snakes dead
    const aliveCount = this.snakes.filter(s => s.alive).length;
    if (aliveCount === 0) {
      this._gameOver();
    }
  }

  _handleDeath(snake) {
    // Start death animation
    const entity = snake.getState();
    this.state = STATE.DYING;
    this.audio.playGameOver();

    // Render one frame with death particles, then transition
    this.renderer.startDeathAnimation(entity).then(() => {
      // Check if all dead
      const aliveCount = this.snakes.filter(s => s.alive).length;
      if (aliveCount === 0) {
        this._gameOver();
      } else {
        this.state = STATE.PLAYING; // Continue with remaining snakes
      }
    });
  }

  _gameOver() {
    this.state = STATE.GAME_OVER;
    if (this.rAFId) {
      cancelAnimationFrame(this.rAFId);
      this.rAFId = null;
    }

    const snapshot = this._buildSnapshot();
    snapshot.gameState = 'GAME_OVER';

    const newAch = this.achievements.check(snapshot);
    for (const ach of newAch) {
      this.renderer.showAchievementPopup(ach);
    }

    this.input.unbindAll();
    this.menu.showGameOver(snapshot, this.achievements);
  }

  _buildSnapshot() {
    return {
      gameState: this.state,
      ticks: this.gameState.ticks,
      tickMs: this.gameState.tickMs,
      gridWidth: this.gameState.gridWidth,
      gridHeight: this.gameState.gridHeight,
      wallMode: this.gameConfig.wallMode,
      difficulty: this.gameConfig.difficulty,
      entities: this.snakes.map(s => s.getState()),
      foods: this.foodManager ? this.foodManager.getActive().map(f => ({
        type: f.type,
        position: f.position,
        active: f.active,
        remainingTtlMs: f.remainingTtlMs,
      })) : [],
      foodEaten: this.gameState.foodEaten,
      goldEaten: this.gameState.goldEaten,
      wallsHit: this.gameState.wallsHit,
      selfHits: this.gameState.selfHits,
      ticksSurvived: this.gameState.ticksSurvived,
      roundsPlayed: this.gameState.roundsPlayed,
      skinId: this.gameConfig.skinId,
      players: this.snakes.map(s => ({
        id: s.id,
        score: s.score,
        alive: s.alive,
        length: s.length(),
        isBot: s.isBot,
      })),
    };
  }

  _render() {
    const snapshot = this._buildSnapshot();
    this.renderer.draw(snapshot);
  }

  pauseGame() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      this.menu.showPause();
    }
  }

  resumeGame() {
    if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.menu.hide();
      this.lastTickTime = performance.now();
      this._gameLoop();
    }
  }

  showAchievements() {
    this.menu.showAchievements(this.achievements);
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.state === STATE.PLAYING) {
        this.pauseGame();
      } else if (this.state === STATE.PAUSED) {
        this.resumeGame();
      }
    }

    if (e.key === 'Enter') {
      if (this.state === STATE.GAME_OVER) {
        // Handled by menu buttons
      }
    }
  }
}
