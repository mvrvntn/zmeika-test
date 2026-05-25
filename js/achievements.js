// achievements.js — AchievementManager

const ACHIEVEMENTS_DATA = [
  {
    id: 'first_meal',
    title: 'Первая еда',
    description: 'Съешь своё первое яблоко',
    icon: '🍎',
    hidden: false,
    condition: (snapshot) => snapshot.foodEaten >= 1,
  },
  {
    id: 'score_10',
    title: 'Десяточка',
    description: 'Набери 10 очков',
    icon: '🔟',
    hidden: false,
    condition: (snapshot) => snapshot.players.some(p => p.score >= 10),
  },
  {
    id: 'no_walls_round',
    title: 'Свобода',
    description: 'Заверши раунд без столкновения со стеной (режим Normal)',
    icon: '🌊',
    hidden: false,
    condition: (snapshot) =>
      snapshot.gameState === 'GAME_OVER' &&
      snapshot.wallsHit === 0 &&
      snapshot.wallMode === 'normal',
  },
  {
    id: 'score_20',
    title: 'Ветеран',
    description: 'Набери 20 очков',
    icon: '🏅',
    hidden: false,
    condition: (snapshot) => snapshot.players.some(p => p.score >= 20),
  },
  {
    id: 'gold_rush',
    title: 'Золотая лихорадка',
    description: 'Съешь 5 золотых яблок за одну игру',
    icon: '⭐',
    hidden: true,
    condition: (snapshot) => snapshot.goldEaten >= 5,
  },
  {
    id: 'long_boi',
    title: 'Длинный',
    description: 'Вырасти до длины 10 сегментов',
    icon: '🐍',
    hidden: false,
    condition: (snapshot) => snapshot.players.some(p => p.length >= 10),
  },
  {
    id: 'survivor',
    title: 'Выживальщик',
    description: 'Протяни 100 тиков без смерти',
    icon: '🛡️',
    hidden: false,
    condition: (snapshot) => snapshot.ticksSurvived >= 100,
  },
  {
    id: 'perfect_round',
    title: 'Идеальный раунд',
    description: 'Заверши раунд без единой ошибки',
    icon: '💎',
    hidden: true,
    condition: (snapshot) =>
      snapshot.gameState === 'GAME_OVER' &&
      snapshot.wallsHit === 0 &&
      snapshot.selfHits === 0,
  },
  {
    id: 'pvp_winner',
    title: 'Победитель PvP',
    description: 'Победи в режиме 2 игроков',
    icon: '🏆',
    hidden: true,
    condition: (snapshot) =>
      snapshot.gameState === 'GAME_OVER' &&
      snapshot.players.length >= 2 &&
      snapshot.players[0].score > snapshot.players[1].score,
  },
  {
    id: 'collector',
    title: 'Коллекционер',
    description: 'Разблокируй 5 достижений',
    icon: '🎯',
    hidden: false,
    condition: () => false, // checked externally
  },
];

export class AchievementManager {
  constructor(storageKey = 'snake_v3_achievements') {
    this.storageKey = storageKey;
    this.achievements = ACHIEVEMENTS_DATA.map(a => ({
      ...a,
      unlocked: false,
      unlockedAt: null,
    }));
    this.load();
  }

  /**
   * Check all achievements against current snapshot
   * @param {object} snapshot - game snapshot
   * @returns {Array} newly unlocked achievements
   */
  check(snapshot) {
    const newlyUnlocked = [];

    for (const ach of this.achievements) {
      if (ach.unlocked) continue;

      // Special case: collector
      if (ach.id === 'collector') {
        const unlockedCount = this.achievements.filter(a => a.unlocked && a.id !== 'collector').length;
        if (unlockedCount >= 5) {
          ach.unlocked = true;
          ach.unlockedAt = Date.now();
          newlyUnlocked.push(ach);
          continue;
        }
      }

      try {
        if (ach.condition(snapshot)) {
          ach.unlocked = true;
          ach.unlockedAt = Date.now();
          newlyUnlocked.push(ach);
        }
      } catch (e) {
        // Silently ignore condition errors
      }
    }

    if (newlyUnlocked.length > 0) {
      this.save();
    }

    return newlyUnlocked;
  }

  getUnlocked() {
    return this.achievements.filter(a => a.unlocked);
  }

  getAll() {
    return this.achievements;
  }

  getProgressPercent() {
    const nonCollector = this.achievements.filter(a => a.id !== 'collector');
    const unlocked = nonCollector.filter(a => a.unlocked).length;
    return Math.round((unlocked / nonCollector.length) * 100);
  }

  getProgressFraction() {
    const nonCollector = this.achievements.filter(a => a.id !== 'collector');
    const unlocked = nonCollector.filter(a => a.unlocked).length;
    return `${unlocked}/${nonCollector.length}`;
  }

  reset() {
    this.achievements.forEach(a => {
      a.unlocked = false;
      a.unlockedAt = null;
    });
    this.save();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        for (const saved of parsed) {
          const ach = this.achievements.find(a => a.id === saved.id);
          if (ach && saved.unlocked) {
            ach.unlocked = true;
            ach.unlockedAt = saved.unlockedAt;
          }
        }
      }
    } catch (e) {
      // Storage unavailable or corrupted — use defaults
    }
  }

  save() {
    try {
      const data = this.achievements
        .filter(a => a.unlocked)
        .map(a => ({ id: a.id, unlockedAt: a.unlockedAt }));
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      // Storage full or unavailable
    }
  }
}
