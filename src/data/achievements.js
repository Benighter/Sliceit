class AchievementSystem {
    constructor() {
        this.achievements = CONFIG.ACHIEVEMENTS;
        this.unlockedAchievements = this.loadUnlockedAchievements();
        this.listeners = new Set();
    }

    loadUnlockedAchievements() {
        return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) || []);
    }

    saveUnlockedAchievements() {
        localStorage.setItem(
            STORAGE_KEYS.ACHIEVEMENTS,
            JSON.stringify([...this.unlockedAchievements])
        );
    }

    checkAchievement(type, value) {
        Object.values(this.achievements).forEach(achievement => {
            if (!this.unlockedAchievements.has(achievement.id) && 
                achievement.condition(value)) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        if (this.unlockedAchievements.has(achievement.id)) return;

        this.unlockedAchievements.add(achievement.id);
        this.saveUnlockedAchievements();
        this.notifyListeners(achievement);

        // Show achievement notification
        ui.showAchievement(achievement);
        soundManager.playSound('ACHIEVEMENT_UNLOCKED');
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(achievement) {
        this.listeners.forEach(callback => callback(achievement));
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    getProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return 0;

        return this.isUnlocked(achievementId) ? 1 : 0;
    }

    getAllAchievements() {
        return Object.values(this.achievements).map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id),
            progress: this.getProgress(achievement.id)
        }));
    }
}

// Level system
class LevelSystem {
    constructor() {
        this.currentLevel = 1;
        this.currentXP = 0;
        this.listeners = new Set();
        
        // Level configuration
        this.config = {
            baseXP: 100,
            xpMultiplier: 1.5,
            levelUpBonuses: {
                score: 1000,
                combo: 2
            }
        };
    }

    getRequiredXP(level) {
        return Math.floor(
            this.config.baseXP * Math.pow(this.config.xpMultiplier, level - 1)
        );
    }

    getCurrentProgress() {
        const requiredXP = this.getRequiredXP(this.currentLevel);
        return this.currentXP / requiredXP;
    }

    addXP(amount) {
        this.currentXP += amount;
        const requiredXP = this.getRequiredXP(this.currentLevel);

        while (this.currentXP >= requiredXP) {
            this.currentXP -= requiredXP;
            this.levelUp();
        }
    }

    levelUp() {
        this.currentLevel++;
        
        // Apply level-up bonuses
        game.score += this.config.levelUpBonuses.score * this.currentLevel;
        game.combo *= this.config.levelUpBonuses.combo;
        
        // Update game difficulty
        this.updateDifficulty();
        
        // Notify listeners
        this.notifyListeners();
        
        // Show level up notification
        ui.showLevelUp(this.currentLevel);
        soundManager.playLevelUpSound();

        // Check for level-based achievements
        achievementSystem.checkAchievement('level', this.currentLevel);
    }

    updateDifficulty() {
        // Increase spawn rate
        const newSpawnRate = Math.max(
            CONFIG.DIFFICULTY.SPAWN_RATE.INITIAL - 
            (this.currentLevel * CONFIG.DIFFICULTY.SPAWN_RATE.DECREASE_PER_LEVEL),
            CONFIG.DIFFICULTY.SPAWN_RATE.MINIMUM
        );

        // Increase object speed
        const newSpeed = Math.min(
            CONFIG.DIFFICULTY.SPEED.INITIAL +
            (this.currentLevel * CONFIG.DIFFICULTY.SPEED.INCREASE_PER_LEVEL),
            CONFIG.DIFFICULTY.SPEED.MAXIMUM
        );

        // Add special objects more frequently
        const specialChance = Math.min(0.05 + (this.currentLevel * 0.01), 0.3);
        const hazardChance = Math.min(0.1 + (this.currentLevel * 0.005), 0.2);

        // Update game configuration
        Object.assign(CONFIG.OBJECTS.SPAWN_CHANCES, {
            SPECIAL: specialChance,
            HAZARD: hazardChance
        });
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => 
            callback(this.currentLevel, this.currentXP, this.getRequiredXP(this.currentLevel))
        );
    }

    // Special level rewards
    getLevelRewards(level) {
        const rewards = [];

        // Every 5 levels: New powerup
        if (level % 5 === 0) {
            rewards.push({
                type: 'powerup',
                name: `Level ${level} Power-up`,
                effect: 'Unlocks a new power-up ability'
            });
        }

        // Every 10 levels: Special achievement
        if (level % 10 === 0) {
            rewards.push({
                type: 'achievement',
                name: `Level ${level} Master`,
                description: `Reached level ${level}`
            });
        }

        // Every 3 levels: Score multiplier
        if (level % 3 === 0) {
            rewards.push({
                type: 'multiplier',
                value: 1.5,
                duration: 30000
            });
        }

        return rewards;
    }

    // Boss levels
    isBossLevel(level) {
        return level % 10 === 0;
    }

    getBossConfig(level) {
        if (!this.isBossLevel(level)) return null;

        const bossIndex = (level / 10 - 1) % CONFIG.BOSS.LEVELS.length;
        return CONFIG.BOSS.LEVELS[bossIndex];
    }
}

// Create global instances
const achievementSystem = new AchievementSystem();
const levelSystem = new LevelSystem();