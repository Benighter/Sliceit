class LevelData {
    static get BOSS_PATTERNS() {
        return {
            // Simple patterns
            SWEEP: {
                name: 'Sweep Attack',
                duration: 3000,
                projectiles: 8,
                speed: 5,
                pattern: (index, total) => ({
                    x: canvas.width * (index / (total - 1)),
                    y: -50,
                    velocityX: 0,
                    velocityY: 5
                })
            },
            SPIRAL: {
                name: 'Spiral Attack',
                duration: 4000,
                projectiles: 12,
                speed: 4,
                pattern: (index, total) => {
                    const angle = (index / total) * Math.PI * 2;
                    return {
                        x: canvas.width / 2,
                        y: canvas.height / 2,
                        velocityX: Math.cos(angle) * 4,
                        velocityY: Math.sin(angle) * 4
                    };
                }
            },
            
            // Complex patterns
            GRID: {
                name: 'Grid Attack',
                duration: 5000,
                projectiles: 16,
                speed: 3,
                pattern: (index, total) => {
                    const cols = 4;
                    const rows = total / cols;
                    const col = index % cols;
                    const row = Math.floor(index / cols);
                    return {
                        x: (canvas.width * (col + 1)) / (cols + 1),
                        y: -50 - (row * 100),
                        velocityX: 0,
                        velocityY: 3
                    };
                }
            },
            CROSS: {
                name: 'Cross Attack',
                duration: 4000,
                projectiles: 12,
                speed: 4,
                pattern: (index, total) => {
                    const angle = (index / (total / 4)) * Math.PI / 2;
                    return {
                        x: canvas.width / 2,
                        y: canvas.height / 2,
                        velocityX: Math.cos(angle) * 4,
                        velocityY: Math.sin(angle) * 4
                    };
                }
            }
        };
    }

    static get BOSS_PHASES() {
        return {
            PAPER_MONSTER: [
                {
                    name: 'Paper Storm',
                    health: 100,
                    patterns: ['SWEEP', 'GRID'],
                    duration: 20000,
                    specialAbility: {
                        name: 'Paper Shield',
                        cooldown: 10000,
                        duration: 3000,
                        effect: 'invulnerable'
                    }
                },
                {
                    name: 'Origami Fury',
                    health: 150,
                    patterns: ['SPIRAL', 'CROSS'],
                    duration: 25000,
                    specialAbility: {
                        name: 'Paper Clone',
                        cooldown: 15000,
                        duration: 5000,
                        effect: 'spawn_copies'
                    }
                }
            ],
            INK_DEMON: [
                {
                    name: 'Ink Splash',
                    health: 120,
                    patterns: ['GRID', 'SWEEP'],
                    duration: 22000,
                    specialAbility: {
                        name: 'Ink Pool',
                        cooldown: 12000,
                        duration: 4000,
                        effect: 'create_hazard_zone'
                    }
                },
                {
                    name: 'Ink Storm',
                    health: 180,
                    patterns: ['CROSS', 'SPIRAL'],
                    duration: 28000,
                    specialAbility: {
                        name: 'Ink Tsunami',
                        cooldown: 18000,
                        duration: 6000,
                        effect: 'screen_wide_attack'
                    }
                }
            ]
        };
    }

    static get LEVEL_REWARDS() {
        return {
            MILESTONES: [
                {
                    level: 5,
                    reward: {
                        type: 'powerup',
                        name: 'Time Freeze',
                        description: 'Temporarily stops all objects',
                        duration: 5000,
                        cooldown: 20000
                    }
                },
                {
                    level: 10,
                    reward: {
                        type: 'powerup',
                        name: 'Multi-Slice',
                        description: 'Creates multiple slice trails',
                        duration: 8000,
                        cooldown: 25000
                    }
                },
                {
                    level: 15,
                    reward: {
                        type: 'powerup',
                        name: 'Golden Touch',
                        description: 'All objects become golden temporarily',
                        duration: 6000,
                        cooldown: 30000
                    }
                }
            ],
            REGULAR: {
                SCORE_MULTIPLIER: {
                    base: 1.1,
                    increment: 0.1,
                    max: 2.0
                },
                COMBO_BONUS: {
                    base: 1.2,
                    increment: 0.1,
                    max: 3.0
                },
                POWERUP_DURATION: {
                    base: 1000,
                    increment: 500,
                    max: 8000
                }
            }
        };
    }

    static get DIFFICULTY_SCALING() {
        return {
            OBJECT_SPEED: {
                base: 2,
                increment: 0.2,
                max: 8
            },
            SPAWN_RATE: {
                base: 1000,
                decrement: 50,
                min: 300
            },
            HAZARD_CHANCE: {
                base: 0.1,
                increment: 0.01,
                max: 0.3
            },
            SPECIAL_CHANCE: {
                base: 0.05,
                increment: 0.01,
                max: 0.25
            }
        };
    }

    static calculateDifficulty(level) {
        const scaling = this.DIFFICULTY_SCALING;
        return {
            objectSpeed: Math.min(
                scaling.OBJECT_SPEED.base + (level * scaling.OBJECT_SPEED.increment),
                scaling.OBJECT_SPEED.max
            ),
            spawnRate: Math.max(
                scaling.SPAWN_RATE.base - (level * scaling.SPAWN_RATE.decrement),
                scaling.SPAWN_RATE.min
            ),
            hazardChance: Math.min(
                scaling.HAZARD_CHANCE.base + (level * scaling.HAZARD_CHANCE.increment),
                scaling.HAZARD_CHANCE.max
            ),
            specialChance: Math.min(
                scaling.SPECIAL_CHANCE.base + (level * scaling.SPECIAL_CHANCE.increment),
                scaling.SPECIAL_CHANCE.max
            )
        };
    }

    static getLevelRewards(level) {
        const rewards = [];
        
        // Check milestones
        this.LEVEL_REWARDS.MILESTONES.forEach(milestone => {
            if (milestone.level === level) {
                rewards.push(milestone.reward);
            }
        });

        // Calculate regular rewards
        const regular = this.LEVEL_REWARDS.REGULAR;
        rewards.push({
            type: 'passive',
            effects: {
                scoreMultiplier: Math.min(
                    regular.SCORE_MULTIPLIER.base + 
                    (level * regular.SCORE_MULTIPLIER.increment),
                    regular.SCORE_MULTIPLIER.max
                ),
                comboBonus: Math.min(
                    regular.COMBO_BONUS.base + 
                    (level * regular.COMBO_BONUS.increment),
                    regular.COMBO_BONUS.max
                ),
                powerupDuration: Math.min(
                    regular.POWERUP_DURATION.base + 
                    (level * regular.POWERUP_DURATION.increment),
                    regular.POWERUP_DURATION.max
                )
            }
        });

        return rewards;
    }
}