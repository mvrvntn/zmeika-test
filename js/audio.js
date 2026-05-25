// audio.js — AudioManager using Web Audio API

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.initialized = false;
  }

  /**
   * Initialize AudioContext (must be called from user gesture)
   */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  /**
   * Resume context if suspended (browser autoplay policy)
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Play a tone
   * @param {number} freq - frequency in Hz
   * @param {number} duration - duration in seconds
   * @param {string} type - oscillator type
   * @param {number} volume - 0..1
   */
  #playTone(freq, duration, type = 'sine', volume = 0.15) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Play sound for eating normal food
   */
  playEat() {
    this.#playTone(520, 0.1, 'sine', 0.12);
    setTimeout(() => this.#playTone(660, 0.08, 'sine', 0.08), 50);
  }

  /**
   * Play sound for eating gold food
   */
  playGold() {
    this.#playTone(880, 0.12, 'sine', 0.15);
    setTimeout(() => this.#playTone(1100, 0.1, 'sine', 0.12), 60);
    setTimeout(() => this.#playTone(1320, 0.15, 'sine', 0.1), 120);
  }

  /**
   * Play game over sound
   */
  playGameOver() {
    this.#playTone(440, 0.2, 'sawtooth', 0.12);
    setTimeout(() => this.#playTone(330, 0.2, 'sawtooth', 0.1), 150);
    setTimeout(() => this.#playTone(220, 0.4, 'sawtooth', 0.08), 300);
  }

  /**
   * Play achievement unlocked sound
   */
  playAchievement() {
    this.#playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.#playTone(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => this.#playTone(784, 0.1, 'sine', 0.12), 160);
    setTimeout(() => this.#playTone(1047, 0.2, 'sine', 0.15), 240);
  }

  /**
   * Play move sound (very subtle)
   */
  playMove() {
    this.#playTone(200, 0.02, 'sine', 0.02);
  }

  /**
   * Play slow food sound
   */
  playSlow() {
    this.#playTone(300, 0.15, 'triangle', 0.1);
    setTimeout(() => this.#playTone(250, 0.2, 'triangle', 0.08), 100);
  }
}
