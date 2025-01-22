// Game Configuration
const CONFIG = {
    // Game Modes
    GAME_MODES: {
        CLASSIC: 'classic',
        ENDLESS: 'endless',
        BOSS: 'boss'
    },

    // Game States
    STATES: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver'
    },

    // Difficulty Settings
    DIFFICULTY: {
        SPAWN_RATE: {
            INITIAL: 1000,
            DECREASE_PER_LEVEL: 50,
            MINIMUM: 400
        },
        SPEED: {
            INITIAL: 2,
            INCREASE_PER_LEVEL: 0.2,
            MAXIMUM: 5
        }
    },

    // Power-up Settings
    POWERUPS: {
        SLOW_MOTION: {
            DURATION: 5000,
            COOLDOWN: 15000,
            SLOW_FACTOR: 0.5
        },
        MAGNET: {
            DURATION: 5000,
            COOLDOWN: 20000,
            ATTRACTION_FORCE: 2
        },
        SHIELD: {
            DURATION: 10000,
            COOLDOWN: 30000
        }
    },

    // Scoring System
    SCORING: {
        BASE_POINTS: {
            NORMAL: 10,
            GOLDEN: 50,
            BOSS_HIT: 100
        },
        COMBO: {
            MULTIPLIER: 1.5,
            DECAY_TIME: 2000
        }
    },

    // Objects
    OBJECTS: {
        TYPES: {
            NORMAL: ['book', 'lightBulb', 'coffeeMug'],
            SPECIAL: ['golden_book', 'golden_lightBulb', 'golden_coffeeMug'],
            HAZARD: ['bomb'],
            POWERUP: ['slowMotion', 'magnet', 'shield']
        },
        SPAWN_CHANCES: {
            NORMAL: 0.7,
            SPECIAL: 0.15,
            HAZARD: 0.1,
            POWERUP: 0.05
        },
        SIZE: {
            WIDTH: 60,
            HEIGHT: 60
        }
    },

    // Visual Effects
    EFFECTS: {
        SLICE: {
            TRAIL_LENGTH: 10,
            TRAIL_FADE_SPEED: 0.1,
            COLOR: '#ffffff'
        },
        PARTICLES: {
            COUNT: {
                NORMAL: 10,
                SPECIAL: 20
            },
            LIFETIME: 1000,
            COLORS: {
                NORMAL: '#ffffff',
                GOLDEN: '#ffd700',
                POWERUP: '#00ff00'
            }
        }
    },

    // Audio
    AUDIO: {
        MUSIC: {
            MENU: 'assets/sounds/menu.mp3',
            GAME: 'assets/sounds/background.mp3',
            BOSS: 'assets/sounds/boss.mp3'
        },
        SOUNDS: {
            SLICE: 'assets/sounds/slice.mp3',
            POWERUP: 'assets/sounds/powerup.mp3',
            LEVEL_UP: 'assets/sounds/levelup.mp3',
            GAME_OVER: 'assets/sounds/gameover.mp3'
        },
        DEFAULT_VOLUME: {
            MUSIC: 0.5,
            SOUND: 0.75
        }
    },

    // Boss Mode
    BOSS: {
        LEVELS: [
            {
                name: 'Paper Monster',
                health: 100,
                speed: 1.5,
                attack_patterns: ['sweep', 'rain', 'spiral'],
                sprite: 'boss_paper'
            },
            {
                name: 'Ink Demon',
                health: 150,
                speed: 2,
                attack_patterns: ['burst', 'cross', 'chase'],
                sprite: 'boss_ink'
            },
            {
                name: 'Digital Overlord',
                health: 200,
                speed: 2.5,
                attack_patterns: ['grid', 'laser', 'teleport'],
                sprite: 'boss_digital'
            }
        ],
        PHASE_THRESHOLD: 0.3 // Boss enters rage mode at 30% health
    },

    // Achievement Definitions
    ACHIEVEMENTS: {
        SCORE_MASTER: {
            id: 'score_master',
            name: 'Score Master',
            description: 'Reach 10,000 points in Classic mode',
            condition: score => score >= 10000
        },
        COMBO_KING: {
            id: 'combo_king',
            name: 'Combo King',
            description: 'Achieve a 50x combo',
            condition: combo => combo >= 50
        },
        SURVIVOR: {
            id: 'survivor',
            name: 'Ultimate Survivor',
            description: 'Reach level 10 in Endless mode',
            condition: level => level >= 10
        }
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    SETTINGS: 'sliceit_settings',
    HIGHSCORES: {
        CLASSIC: 'sliceit_highscores_classic',
        ENDLESS: 'sliceit_highscores_endless',
        BOSS: 'sliceit_highscores_boss'
    },
    ACHIEVEMENTS: 'sliceit_achievements'
};

// Default Settings
const DEFAULT_SETTINGS = {
    audio: {
        musicVolume: CONFIG.AUDIO.DEFAULT_VOLUME.MUSIC,
        soundVolume: CONFIG.AUDIO.DEFAULT_VOLUME.SOUND
    },
    graphics: {
        showParticles: true,
        showHitEffects: true,
        showSliceTrail: true
    }
};