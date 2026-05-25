// input.js — InputManager (keyboard + touch/swipe)

import { DIR, CONFIG } from './config.js';

export class InputManager {
  constructor() {
    this.listeners = new Map(); // playerId -> { keys, callback }
    this.lastDirection = new Map(); // playerId -> Direction
    this.onKeyDownBound = this.#onKeyDown.bind(this);
    this.onTouchStartBound = this.#onTouchStart.bind(this);
    this.onTouchEndBound = this.#onTouchEnd.bind(this);
    this.touchStartPos = null;
    this.swipeEnabled = false;
    this.canvas = null;
  }

  /**
   * Bind keyboard keys to a player
   * @param {string} playerId
   * @param {{up:string, down:string, left:string, right:string}} keys
   */
  bindForPlayer(playerId, keys) {
    this.listeners.set(playerId, {
      keys,
      pressed: new Set(),
    });
    this.lastDirection.set(playerId, null);

    if (this.listeners.size === 1) {
      window.addEventListener('keydown', this.onKeyDownBound);
    }
  }

  /**
   * Enable swipe input on a canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {number} threshold
   */
  enableSwipe(canvas, threshold) {
    this.canvas = canvas;
    this.swipeThreshold = threshold || CONFIG.swipeThreshold;
    this.swipeEnabled = true;
    canvas.addEventListener('touchstart', this.onTouchStartBound, { passive: true });
    canvas.addEventListener('touchend', this.onTouchEndBound, { passive: true });
  }

  disableSwipe() {
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.onTouchStartBound);
      this.canvas.removeEventListener('touchend', this.onTouchEndBound);
    }
    this.swipeEnabled = false;
  }

  #onKeyDown(e) {
    const key = e.key;
    for (const [playerId, { keys }] of this.listeners) {
      let dir = null;
      if (key === keys.up) dir = DIR.UP;
      else if (key === keys.down) dir = DIR.DOWN;
      else if (key === keys.left) dir = DIR.LEFT;
      else if (key === keys.right) dir = DIR.RIGHT;

      if (dir) {
        e.preventDefault();
        this.lastDirection.set(playerId, dir);
      }
    }
  }

  #onTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };
  }

  #onTouchEnd(e) {
    if (!this.touchStartPos) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartPos.x;
    const dy = touch.clientY - this.touchStartPos.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < this.swipeThreshold) return;

    let dir;
    if (absDx > absDy) {
      dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      dir = dy > 0 ? DIR.DOWN : DIR.UP;
    }

    // Send swipe to player1 (default)
    const firstPlayer = this.listeners.keys().next().value;
    if (firstPlayer) {
      this.lastDirection.set(firstPlayer, dir);
    }

    this.touchStartPos = null;
  }

  /**
   * Get the current direction for a player, then clear it
   * @param {string} playerId
   * @returns {string|null}
   */
  getCurrentInput(playerId) {
    const dir = this.lastDirection.get(playerId);
    if (dir) {
      this.lastDirection.set(playerId, null);
    }
    return dir || null;
  }

  /**
   * Register callback when direction changes
   * @param {string} playerId
   * @param {function} callback
   */
  onDirectionChange(playerId, callback) {
    // Immediately check each frame — not event-based, but we expose a poll API
    this._changeCallbacks = this._changeCallbacks || new Map();
    this._changeCallbacks.set(playerId, callback);
  }

  unbindAll() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    this.disableSwipe();
    this.listeners.clear();
    this.lastDirection.clear();
  }
}
