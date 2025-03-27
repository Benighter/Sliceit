// Game Canvas Elements
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const bgCanvas = document.getElementById('backgroundCanvas');
const bgCtx = bgCanvas.getContext('2d');

// HUD Elements
const scoreElement = document.getElementById('score').querySelector('span');
const comboElement = document.getElementById('combo').querySelector('span');
const livesContainer = document.getElementById('lives');
const powerupsContainer = document.getElementById('powerups');

// Menu Screens
const menuScreens = {
    gameOver: document.getElementById('gameOver'),
    start: document.getElementById('startScreen'),
    gameMode: document.getElementById('gameModeScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
    achievements: document.getElementById('achievementsScreen'),
    settings: document.getElementById('settingsScreen'),
    credits: document.getElementById('creditsScreen'),
    pause: document.getElementById('pauseMenu'),
    tutorial: document.getElementById('tutorialScreen')
};

// Popup Elements
const achievementPopup = document.getElementById('achievementPopup');
const powerupPopup = document.getElementById('powerupPopup');

// Game Stats Elements
const finalScoreElement = document.getElementById('finalScore');
const objectsSlicedElement = document.getElementById('objectsSliced');
const maxComboElement = document.getElementById('maxCombo');
const timeSurvivedElement = document.getElementById('timeSurvived');

// Canvas Setup
function setupCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    
    // Create gradient background
    createBackgroundEffect();
}

// Game State Variables
const GAME = {
    currentMode: 'classic',
    running: false,
    paused: false,
    score: 0,
    combo: 1,
    maxCombo: 1,
    lives: 3,
    level: 1,
    objectsSliced: 0,
    startTime: 0,
    currentTime: 0,
    timeLimit: 0,
    objects: [],
    particles: [],
    sliceTrail: [],
    slicePoints: [],
    isSlicing: false,
    lastPosition: { x: 0, y: 0 },
    powerups: {
        slowMotion: { active: false, duration: 5000, icon: 'fa-hourglass-half' },
        magnet: { active: false, duration: 7000, icon: 'fa-magnet' },
        bombShield: { active: false, duration: 0, icon: 'fa-shield-alt' },
        doublePoints: { active: false, duration: 10000, icon: 'fa-star' },
        freeze: { active: false, duration: 3000, icon: 'fa-snowflake' }
    },
    settings: {
        musicVolume: 70,
        sfxVolume: 80,
        particleEffects: 'medium',
        trailEffect: 'electric'
    },
    achievements: [],
    highScores: {
        classic: [],
        zen: [],
        arcade: [],
        boss: []
    },
    bosses: [
        { name: 'Paper Shredder', health: 100, attacks: ['paperRain', 'shredderBeam'] },
        { name: 'Scissors King', health: 150, attacks: ['scissorSlash', 'scissorTornado'] },
        { name: 'Stone Golem', health: 200, attacks: ['rockThrow', 'earthquake'] }
    ],
    currentBoss: null,
    audioContext: null,
    sounds: {},
    bgm: null
};

// Game Assets - Sprites and Sounds
const ASSETS = {
    sprites: {},
    sounds: {},
    loadedAssets: 0,
    totalAssets: 0
};

// Game Object Types and Configurations
const OBJECT_TYPES = {
    // Regular items
    book: { points: 5, color: '#8B4513', spawnRate: 30, sizes: { width: 60, height: 60 } },
    lightBulb: { points: 10, color: '#FFD700', spawnRate: 25, sizes: { width: 60, height: 60 } },
    coffeeMug: { points: 15, color: '#4169E1', spawnRate: 20, sizes: { width: 60, height: 60 } },
    
    // Special items
    bomb: { points: 0, color: '#000000', spawnRate: 15, sizes: { width: 60, height: 60 } },
    
    // Golden items (rare)
    goldenBook: { points: 25, color: '#D4AF37', spawnRate: 5, sizes: { width: 70, height: 70 } },
    goldenLightBulb: { points: 50, color: '#D4AF37', spawnRate: 4, sizes: { width: 70, height: 70 } },
    goldenCoffeeMug: { points: 75, color: '#D4AF37', spawnRate: 3, sizes: { width: 70, height: 70 } },
    
    // Power-ups
    slowMotion: { points: 0, color: '#0088FF', spawnRate: 5, sizes: { width: 60, height: 60 } },
    magnet: { points: 0, color: '#FF8800', spawnRate: 4, sizes: { width: 60, height: 60 } },
    bombShield: { points: 0, color: '#00FF88', spawnRate: 3, sizes: { width: 60, height: 60 } },
    doublePoints: { points: 0, color: '#FF00FF', spawnRate: 3, sizes: { width: 60, height: 60 } },
    freeze: { points: 0, color: '#00FFFF', spawnRate: 2, sizes: { width: 60, height: 60 } }
};

// Game Constants
const GAME_MODES = {
    classic: {
        description: 'Slice objects and avoid bombs. 3 lives.',
        lives: 3,
        timeLimit: 0,
        bombsEnabled: true,
        powerupsEnabled: true,
        levelProgression: true
    },
    zen: {
        description: 'Relaxed gameplay. No lives or bombs. Just slice!',
        lives: Infinity,
        timeLimit: 0,
        bombsEnabled: false,
        powerupsEnabled: true,
        levelProgression: false
    },
    arcade: {
        description: 'Time challenge with power-ups. 60 seconds.',
        lives: 1,
        timeLimit: 60000, // 60 seconds
        bombsEnabled: true,
        powerupsEnabled: true,
        levelProgression: true
    },
    boss: {
        description: 'Defeat powerful bosses with strategic slicing.',
        lives: 5,
        timeLimit: 0,
        bombsEnabled: false,
        powerupsEnabled: true,
        levelProgression: false,
        bossFight: true
    }
};

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'firstSlice', name: 'First Slice', description: 'Slice your first object', icon: 'fa-pizza-slice', unlocked: false },
    { id: 'comboMaster', name: 'Combo Master', description: 'Reach a 15x combo', icon: 'fa-fire', unlocked: false },
    { id: 'centuryClub', name: 'Century Club', description: 'Score 100 points in a single game', icon: 'fa-hundred-points', unlocked: false },
    { id: 'bombSquad', name: 'Bomb Squad', description: 'Use 3 bomb shields in one game', icon: 'fa-bomb', unlocked: false },
    { id: 'speedDemon', name: 'Speed Demon', description: 'Slice 10 objects in 5 seconds', icon: 'fa-bolt', unlocked: false },
    { id: 'goldenTouch', name: 'Golden Touch', description: 'Slice all types of golden objects', icon: 'fa-medal', unlocked: false },
    { id: 'zenMaster', name: 'Zen Master', description: 'Play Zen mode for 5 minutes', icon: 'fa-peace', unlocked: false },
    { id: 'arcadeChampion', name: 'Arcade Champion', description: 'Score 500 points in Arcade mode', icon: 'fa-trophy', unlocked: false },
    { id: 'bossSlayer', name: 'Boss Slayer', description: 'Defeat your first boss', icon: 'fa-skull', unlocked: false },
    { id: 'grandMaster', name: 'Grand Master', description: 'Unlock all other achievements', icon: 'fa-crown', unlocked: false }
];

// Initialize the game
window.addEventListener('load', initGame);
window.addEventListener('resize', setupCanvas);

// Initialize game on load
function initGame() {
    // Set up canvas dimensions
    setupCanvas();
    
    // Load saved settings if any
    loadSavedSettings();
    
    // Load saved achievements if any
    loadSavedAchievements();
    
    // Load high scores if any
    loadHighScores();
    
    // Load game assets (sprites, sounds)
    loadGameAssets().then(() => {
        // Set up event listeners
        setupEventListeners();
        
        // Show start screen
        showScreen('start');
    });
}

// Create background effect
function createBackgroundEffect() {
    // Create gradient
    const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
    gradient.addColorStop(0, '#4e54c8');
    gradient.addColorStop(1, '#8f94fb');
    
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    // Add floating bubbles/particles for background effect
    for (let i = 0; i < 50; i++) {
        const size = Math.random() * 50 + 10;
        const x = Math.random() * bgCanvas.width;
        const y = Math.random() * bgCanvas.height;
        const opacity = Math.random() * 0.2;
        
        bgCtx.beginPath();
        bgCtx.arc(x, y, size, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        bgCtx.fill();
    }
}

// Load saved settings from localStorage
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('sliceit_settings');
    if (savedSettings) {
        GAME.settings = JSON.parse(savedSettings);
    }
    
    // Apply settings to UI elements
    document.getElementById('musicVolume').value = GAME.settings.musicVolume;
    document.getElementById('sfxVolume').value = GAME.settings.sfxVolume;
    document.getElementById('particleEffects').value = GAME.settings.particleEffects;
    document.getElementById('trailEffect').value = GAME.settings.trailEffect;
}

// Load saved achievements from localStorage
function loadSavedAchievements() {
    const savedAchievements = localStorage.getItem('sliceit_achievements');
    if (savedAchievements) {
        const unlocked = JSON.parse(savedAchievements);
        
        // Update achievement status
        ACHIEVEMENTS.forEach(achievement => {
            if (unlocked.includes(achievement.id)) {
                achievement.unlocked = true;
            }
        });
        
        GAME.achievements = ACHIEVEMENTS;
    } else {
        GAME.achievements = ACHIEVEMENTS;
    }
}

// Load high scores from localStorage
function loadHighScores() {
    Object.keys(GAME_MODES).forEach(mode => {
        const savedScores = localStorage.getItem(`sliceit_highscores_${mode}`);
        if (savedScores) {
            GAME.highScores[mode] = JSON.parse(savedScores);
        } else {
            GAME.highScores[mode] = [];
        }
    });
}

// Load all game assets (sprites and sounds)
function loadGameAssets() {
    return new Promise((resolve) => {
        // Initialize sprite objects
        loadSprites(resolve);
    });
}

// Function to load sprite assets
function loadSprites(callback) {
    // SVG data URLs for sprites
    const spriteData = {
        book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <rect x="5" y="10" width="70" height="80" fill="#8B4513" />
            <rect x="10" y="15" width="60" height="70" fill="#F4A460" />
            <line x1="40" y1="15" x2="40" y2="85" stroke="#8B4513" stroke-width="2" />
        </svg>`,
        lightBulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <circle cx="40" cy="40" r="30" fill="#FFD700" />
            <path d="M40 70 L40 90 M30 80 H50" stroke="#808080" stroke-width="4" fill="none" />
            <circle cx="40" cy="40" r="15" fill="#FFFFFF" opacity="0.5" />
        </svg>`,
        coffeeMug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M10 30 Q10 10 30 10 H60 Q80 10 80 30 V70 Q80 90 60 90 H30 Q10 90 10 70 Z" fill="#4169E1" />
            <path d="M80 40 H90 Q100 40 100 50 V60 Q100 70 90 70 H80" fill="none" stroke="#4169E1" stroke-width="5" />
        </svg>`,
        bomb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="60" r="35" fill="#000000" />
            <path d="M50 25 Q55 5 70 10 T90 25" fill="none" stroke="#000000" stroke-width="4" />
            <circle cx="90" cy="25" r="8" fill="#FF0000" />
            <circle cx="65" cy="50" r="10" fill="#FFFFFF" opacity="0.3" />
        </svg>`,
        goldenBook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <rect x="5" y="10" width="70" height="80" fill="#D4AF37" />
            <rect x="10" y="15" width="60" height="70" fill="#FFD700" />
            <line x1="40" y1="15" x2="40" y2="85" stroke="#D4AF37" stroke-width="2" />
            <circle cx="40" cy="50" r="20" fill="#FFFFFF" opacity="0.2" />
        </svg>`,
        goldenLightBulb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
            <circle cx="40" cy="40" r="30" fill="#FFD700" />
            <path d="M40 70 L40 90 M30 80 H50" stroke="#D4AF37" stroke-width="4" fill="none" />
            <circle cx="40" cy="40" r="15" fill="#FFFFFF" opacity="0.5" />
            <circle cx="40" cy="40" r="25" fill="none" stroke="#D4AF37" stroke-width="2" stroke-dasharray="5,5" />
        </svg>`,
        goldenCoffeeMug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M10 30 Q10 10 30 10 H60 Q80 10 80 30 V70 Q80 90 60 90 H30 Q10 90 10 70 Z" fill="#FFD700" />
            <path d="M80 40 H90 Q100 40 100 50 V60 Q100 70 90 70 H80" fill="none" stroke="#D4AF37" stroke-width="5" />
            <circle cx="45" cy="50" r="25" fill="#FFFFFF" opacity="0.2" />
        </svg>`,
        slowMotion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#0088FF" />
            <circle cx="50" cy="50" r="30" fill="#FFFFFF" opacity="0.3" />
            <path d="M50 20 V40 M50 50 L70 30" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
            <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
        </svg>`,
        magnet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M30 20 H70 L70 50 C70 70 30 70 30 50 Z" fill="#FF8800" />
            <path d="M30 70 H70" stroke="#FF8800" stroke-width="5" />
            <path d="M40 70 V85 M60 70 V85" stroke="#FF8800" stroke-width="10" stroke-linecap="round" />
            <circle cx="50" cy="40" r="15" fill="#FFFFFF" opacity="0.3" />
        </svg>`,
        bombShield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M50 10 L90 30 V70 L50 90 L10 70 V30 Z" fill="#00FF88" />
            <path d="M50 20 L80 35 V65 L50 80 L20 65 V35 Z" fill="none" stroke="#FFFFFF" stroke-width="2" />
            <circle cx="50" cy="50" r="15" fill="#FFFFFF" opacity="0.3" />
            <path d="M35 50 L45 60 L65 40" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>`,
        doublePoints: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#FF00FF" />
            <text x="50" y="65" text-anchor="middle" font-size="50" font-weight="bold" fill="#FFFFFF">2×</text>
            <circle cx="50" cy="50" r="30" fill="#FFFFFF" opacity="0.1" />
        </svg>`,
        freeze: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="#00FFFF" />
            <path d="M50 20 V80 M30 30 L70 70 M30 70 L70 30 M20 50 H80" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
            <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
        </svg>`
    };
    
    // Create Image objects for each sprite
    ASSETS.totalAssets = Object.keys(spriteData).length;
    
    for (const [name, svg] of Object.entries(spriteData)) {
        const img = new Image();
        img.onload = () => {
            ASSETS.loadedAssets++;
            if (ASSETS.loadedAssets === ASSETS.totalAssets) {
                callback();
            }
        };
        img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
        ASSETS.sprites[name] = img;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mouse and touch events for slicing
    gameCanvas.addEventListener('mousedown', startSlice);
    gameCanvas.addEventListener('mousemove', updateSlice);
    gameCanvas.addEventListener('mouseup', endSlice);
    gameCanvas.addEventListener('mouseleave', endSlice);
    
    gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startSlice({ clientX: touch.clientX, clientY: touch.clientY });
    });
    
    gameCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        updateSlice({ clientX: touch.clientX, clientY: touch.clientY });
    });
    
    gameCanvas.addEventListener('touchend', endSlice);
    gameCanvas.addEventListener('touchcancel', endSlice);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (GAME.running) {
            if (e.key === 'Escape') {
                togglePause();
            }
        }
    });
    
    // Settings events
    document.getElementById('musicVolume').addEventListener('change', updateSettings);
    document.getElementById('sfxVolume').addEventListener('change', updateSettings);
    document.getElementById('particleEffects').addEventListener('change', updateSettings);
    document.getElementById('trailEffect').addEventListener('change', updateSettings);
    
    // Leaderboard tab events
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderLeaderboard(mode);
        });
    });
}

// Game Object Class
class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = OBJECT_TYPES[type].sizes.width;
        this.height = OBJECT_TYPES[type].sizes.height;
        this.speed = Math.random() * 2 + 1 + (GAME.level * 0.5);
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        this.points = OBJECT_TYPES[type].points;
        this.golden = type.startsWith('golden');
        this.alpha = 1;
        this.scale = 1;
        this.sliced = false;
        this.slicedDirection = Math.random() > 0.5 ? 1 : -1;
        this.gravity = 0.2;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // For boss objects
        this.health = type === 'boss' ? 100 : 0;
        this.isVulnerable = type === 'boss' ? false : true;
        
        // Special effects
        if (GAME.powerups.freeze.active) {
            this.speed *= 0.3;
        }
        
        if (GAME.powerups.slowMotion.active) {
            this.speed *= 0.5;
        }
    }
    
    draw() {
        if (this.sliced) {
            this.drawSliced();
            return;
        }
        
        gameCtx.save();
        gameCtx.translate(this.x + this.width / 2, this.y + this.height / 2);
        gameCtx.rotate(this.rotation);
        gameCtx.globalAlpha = this.alpha;
        
        // Add special glow effect for golden items
        if (this.golden) {
            gameCtx.shadowColor = '#FFD700';
            gameCtx.shadowBlur = 15;
        }
        
        // Add powerup indicator effect
        if (this.isPowerup()) {
            gameCtx.shadowColor = OBJECT_TYPES[this.type].color;
            gameCtx.shadowBlur = 10;
            
            // Pulsing effect for powerups
            const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
            gameCtx.scale(pulse, pulse);
        }
        
        // Draw the object sprite
        gameCtx.drawImage(
            ASSETS.sprites[this.type], 
            -this.width / 2, 
            -this.height / 2, 
            this.width, 
            this.height
        );
        
        // Draw a special effect for bomb shield active
        if (this.type === 'bomb' && GAME.powerups.bombShield.active) {
            gameCtx.beginPath();
            gameCtx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
            gameCtx.strokeStyle = 'rgba(0, 255, 136, 0.7)';
            gameCtx.lineWidth = 3;
            gameCtx.stroke();
        }
        
        gameCtx.restore();
    }
    
    drawSliced() {
        // Draw two halves of the sliced object
        gameCtx.save();
        gameCtx.globalAlpha = this.alpha;
        
        // First half
        gameCtx.save();
        gameCtx.translate(
            this.x + this.width / 2 - this.velocityX * 3, 
            this.y + this.height / 2 - this.velocityY * 3
        );
        gameCtx.rotate(this.rotation + this.slicedDirection * 0.5);
        gameCtx.drawImage(
            ASSETS.sprites[this.type], 
            -this.width / 2, 
            -this.height / 2, 
            this.width / 2, 
            this.height
        );
        gameCtx.restore();
        
        // Second half
        gameCtx.save();
        gameCtx.translate(
            this.x + this.width / 2 + this.velocityX * 3, 
            this.y + this.height / 2 + this.velocityY * 3
        );
        gameCtx.rotate(this.rotation - this.slicedDirection * 0.5);
        gameCtx.drawImage(
            ASSETS.sprites[this.type], 
            0, 
            -this.height / 2, 
            this.width / 2, 
            this.height
        );
        gameCtx.restore();
        
        gameCtx.restore();
    }
    
    update() {
        if (this.sliced) {
            // Update sliced object physics
            this.velocityY += this.gravity;
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.rotation += this.rotationSpeed * 2;
            this.alpha -= 0.02;
            
            // Remove when faded out
            return this.alpha <= 0;
        } else {
            // Normal update for unsliced objects
            this.y += this.speed;
            this.rotation += this.rotationSpeed;
            
            // Apply magnet effect
            if (GAME.powerups.magnet.active && this.type !== 'bomb') {
                const centerX = gameCanvas.width / 2;
                const centerY = gameCanvas.height / 2;
                const dx = centerX - (this.x + this.width / 2);
                const dy = centerY - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                this.x += (dx / distance) * 3;
                this.y += (dy / distance) * 3;
            }
            
            // Remove if out of bounds
            if (this.y > gameCanvas.height + this.height) {
                if (this.canCostLife()) {
                    decreaseLives();
                }
                return true;
            }
            
            return false;
        }
    }
    
    slice(sliceDirection) {
        if (this.sliced || !this.isVulnerable) return false;
        
        // Special handling for different object types
        if (this.type === 'bomb') {
            if (GAME.powerups.bombShield.active) {
                // Consume shield
                GAME.powerups.bombShield.active = false;
                updatePowerupIndicators();
                showPowerupPopup('Shield Protected You!');
                this.sliced = true;
                this.velocityX = sliceDirection.x * 5;
                this.velocityY = -5;
                return true;
            } else {
                // Game over if bomb is sliced without shield
                gameOver();
                return true;
            }
        } else if (this.isPowerup()) {
            // Activate the corresponding powerup
            activatePowerup(this.type);
        } else {
            // Regular scoring for normal objects
            let pointsEarned = this.points;
            
            // Apply double points if active
            if (GAME.powerups.doublePoints.active) {
                pointsEarned *= 2;
            }
            
            // Apply combo multiplier
            pointsEarned *= GAME.combo;
            
            // Add points to score
            GAME.score += pointsEarned;
            GAME.objectsSliced++;
            
            // Increment combo
            GAME.combo++;
            if (GAME.combo > GAME.maxCombo) {
                GAME.maxCombo = GAME.combo;
            }
            
            // Show combo text at slice position
            showComboText(this.x + this.width / 2, this.y + this.height / 2, `${pointsEarned}`);
            
            // Check for achievements
            checkAchievements();
            
            // Slice animation setup
            this.sliced = true;
            this.velocityX = sliceDirection.x * 5;
            this.velocityY = -5;
            
            // Create particle effect at slice position
            createSliceEffect(this.x + this.width / 2, this.y + this.height / 2, this.golden);
        }
        
        // Update HUD
        updateHUD();
        
        return true;
    }
    
    contains(x, y) {
        return (
            x > this.x && 
            x < this.x + this.width && 
            y > this.y && 
            y < this.y + this.height
        );
    }
    
    isPowerup() {
        return ['slowMotion', 'magnet', 'bombShield', 'doublePoints', 'freeze'].includes(this.type);
    }
    
    canCostLife() {
        // Only standard objects should cost lives when missed
        return (
            !this.type.startsWith('golden') && 
            !this.isPowerup() && 
            this.type !== 'bomb' && 
            GAME_MODES[GAME.currentMode].lives !== Infinity
        );
    }
}

// Particle Class
class Particle {
    constructor(x, y, color, size = 5, speedFactor = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.baseSize = Math.random() * size + size / 2;
        this.size = this.baseSize;
        this.speedX = (Math.random() * 4 - 2) * speedFactor;
        this.speedY = (Math.random() * 4 - 2) * speedFactor;
        this.gravity = 0.1;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= this.decay;
        this.size = this.baseSize * this.alpha;
        
        return this.alpha > 0;
    }
    
    draw() {
        gameCtx.save();
        gameCtx.globalAlpha = this.alpha;
        gameCtx.beginPath();
        gameCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        gameCtx.fillStyle = this.color;
        gameCtx.fill();
        gameCtx.restore();
    }
}

// Trail Point Class
class TrailPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.alpha = 1;
        this.decay = 0.05;
    }
    
    update() {
        this.alpha -= this.decay;
        this.size -= 0.2;
        return this.alpha > 0 && this.size > 0;
    }
    
    draw() {
        gameCtx.save();
        gameCtx.globalAlpha = this.alpha;
        
        // Different trail effects based on settings
        switch (GAME.settings.trailEffect) {
            case 'rainbow':
                const hue = (Date.now() * 0.1) % 360;
                gameCtx.fillStyle = `hsla(${hue}, 100%, 50%, ${this.alpha})`;
                break;
            case 'fire':
                const gradient = gameCtx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size
                );
                gradient.addColorStop(0, 'rgba(255, 255, 0, ' + this.alpha + ')');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                gameCtx.fillStyle = gradient;
                break;
            case 'electric':
                gameCtx.fillStyle = `rgba(68, 170, 255, ${this.alpha})`;
                gameCtx.shadowColor = '#00BFFF';
                gameCtx.shadowBlur = 10;
                break;
            default:
                gameCtx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        }
        
        gameCtx.beginPath();
        gameCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.restore();
    }
}

// Boss Class
class Boss extends GameObject {
    constructor(bossType, level) {
        super(gameCanvas.width / 2 - 100, 100, 'boss');
        this.bossType = bossType;
        this.width = 200;
        this.height = 200;
        this.health = 100 + (level * 50);
        this.maxHealth = this.health;
        this.attackTimer = 0;
        this.attackInterval = 3000;
        this.phaseTimer = 0;
        this.isVulnerable = false;
        this.vulnerableTime = 2000;
        this.currentAttack = null;
        this.moveSpeed = 1;
        this.targetX = this.x;
    }
    
    update() {
        // Boss movement logic
        if (Math.abs(this.x - this.targetX) > 5) {
            this.x += (this.targetX - this.x) * 0.05;
        } else {
            this.targetX = Math.random() * (gameCanvas.width - this.width);
        }
        
        // Attack timing
        this.attackTimer += 16; // Approx 16ms per frame at 60fps
        
        if (this.attackTimer >= this.attackInterval) {
            this.attack();
            this.attackTimer = 0;
        }
        
        // Vulnerability phase timing
        if (this.isVulnerable) {
            this.phaseTimer += 16;
            if (this.phaseTimer >= this.vulnerableTime) {
                this.isVulnerable = false;
                this.phaseTimer = 0;
            }
        }
        
        return false; // Boss doesn't get removed automatically
    }
    
    draw() {
        gameCtx.save();
        gameCtx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Draw boss based on boss type
        if (this.bossType === 'Paper Shredder') {
            this.drawPaperShredder();
        } else if (this.bossType === 'Scissors King') {
            this.drawScissorsKing();
        } else {
            this.drawStoneGolem();
        }
        
        // Draw health bar
        this.drawHealthBar();
        
        // Vulnerability indicator
        if (this.isVulnerable) {
            gameCtx.beginPath();
            gameCtx.arc(0, 0, this.width / 2 + 20, 0, Math.PI * 2);
            gameCtx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
            gameCtx.lineWidth = 5;
            gameCtx.stroke();
        }
        
        gameCtx.restore();
    }
    
    drawPaperShredder() {
        // Draw basic shredder shape
        gameCtx.fillStyle = '#888888';
        gameCtx.fillRect(-80, -80, 160, 160);
        
        // Draw shredder mouth
        gameCtx.fillStyle = '#333333';
        gameCtx.fillRect(-60, -30, 120, 60);
        
        // Draw teeth
        gameCtx.fillStyle = '#DDDDDD';
        for (let i = -55; i < 60; i += 15) {
            gameCtx.fillRect(i, -30, 10, 60);
        }
        
        // Draw eyes
        gameCtx.fillStyle = this.isVulnerable ? '#00FF00' : '#FF0000';
        gameCtx.beginPath();
        gameCtx.arc(-30, -50, 15, 0, Math.PI * 2);
        gameCtx.arc(30, -50, 15, 0, Math.PI * 2);
        gameCtx.fill();
    }
    
    drawScissorsKing() {
        // Draw crown
        gameCtx.fillStyle = '#FFD700';
        gameCtx.beginPath();
        gameCtx.moveTo(-60, -60);
        gameCtx.lineTo(-40, -100);
        gameCtx.lineTo(-20, -60);
        gameCtx.lineTo(0, -100);
        gameCtx.lineTo(20, -60);
        gameCtx.lineTo(40, -100);
        gameCtx.lineTo(60, -60);
        gameCtx.closePath();
        gameCtx.fill();
        
        // Draw scissors body
        gameCtx.fillStyle = '#CCCCCC';
        gameCtx.beginPath();
        gameCtx.ellipse(0, 0, 80, 50, 0, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw scissor blades
        gameCtx.fillStyle = '#888888';
        gameCtx.beginPath();
        gameCtx.moveTo(-80, -40);
        gameCtx.lineTo(0, 40);
        gameCtx.lineTo(80, -40);
        gameCtx.lineTo(60, -50);
        gameCtx.lineTo(0, 20);
        gameCtx.lineTo(-60, -50);
        gameCtx.closePath();
        gameCtx.fill();
        
        // Draw eyes
        gameCtx.fillStyle = this.isVulnerable ? '#00FF00' : '#FF0000';
        gameCtx.beginPath();
        gameCtx.arc(-30, -10, 15, 0, Math.PI * 2);
        gameCtx.arc(30, -10, 15, 0, Math.PI * 2);
        gameCtx.fill();
    }
    
    drawStoneGolem() {
        // Draw rocky body
        gameCtx.fillStyle = '#777777';
        gameCtx.beginPath();
        gameCtx.arc(0, 0, 80, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw rock texture
        gameCtx.strokeStyle = '#555555';
        gameCtx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const radius = 70 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            gameCtx.beginPath();
            gameCtx.arc(x / 2, y / 2, 15 + Math.random() * 10, 0, Math.PI * 2);
            gameCtx.stroke();
        }
        
        // Draw eyes
        gameCtx.fillStyle = this.isVulnerable ? '#00FF00' : '#FF0000';
        gameCtx.beginPath();
        gameCtx.arc(-30, -20, 15, 0, Math.PI * 2);
        gameCtx.arc(30, -20, 15, 0, Math.PI * 2);
        gameCtx.fill();
    }
    
    drawHealthBar() {
        gameCtx.fillStyle = '#333333';
        gameCtx.fillRect(-80, -100, 160, 15);
        
        const healthPercent = this.health / this.maxHealth;
        const healthBarWidth = 160 * healthPercent;
        
        // Health bar color changes with health level
        if (healthPercent > 0.6) {
            gameCtx.fillStyle = '#00FF00';
        } else if (healthPercent > 0.3) {
            gameCtx.fillStyle = '#FFFF00';
        } else {
            gameCtx.fillStyle = '#FF0000';
        }
        
        gameCtx.fillRect(-80, -100, healthBarWidth, 15);
    }
    
    attack() {
        // Choose a random attack
        const attacks = this.getAttacks();
        this.currentAttack = attacks[Math.floor(Math.random() * attacks.length)];
        
        // Execute the attack
        switch (this.currentAttack) {
            case 'paperRain':
                this.paperRainAttack();
                break;
            case 'shredderBeam':
                this.shredderBeamAttack();
                break;
            case 'scissorSlash':
                this.scissorSlashAttack();
                break;
            case 'scissorTornado':
                this.scissorTornadoAttack();
                break;
            case 'rockThrow':
                this.rockThrowAttack();
                break;
            case 'earthquake':
                this.earthquakeAttack();
                break;
        }
        
        // Make boss vulnerable after attack
        setTimeout(() => {
            this.isVulnerable = true;
            this.phaseTimer = 0;
        }, 1500);
    }
    
    getAttacks() {
        if (this.bossType === 'Paper Shredder') {
            return ['paperRain', 'shredderBeam'];
        } else if (this.bossType === 'Scissors King') {
            return ['scissorSlash', 'scissorTornado'];
        } else {
            return ['rockThrow', 'earthquake'];
        }
    }
    
    paperRainAttack() {
        // Spawn multiple paper objects from top
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const x = Math.random() * gameCanvas.width;
                GAME.objects.push(new GameObject(x, -50, 'book'));
            }, i * 200);
        }
    }
    
    shredderBeamAttack() {
        // Spawn a laser beam that sweeps across the screen
        let beamX = 0;
        const beamInterval = setInterval(() => {
            // Create damaging particles along the beam
            for (let y = 100; y < gameCanvas.height; y += 20) {
                GAME.particles.push(new Particle(beamX, y, '#FF0000', 10, 0.2));
            }
            
            beamX += 40;
            if (beamX > gameCanvas.width) {
                clearInterval(beamInterval);
            }
        }, 100);
    }
    
    scissorSlashAttack() {
        // Create a large scissor object that moves horizontally
        const scissor = new GameObject(0, gameCanvas.height / 2, 'coffeeMug');
        scissor.width = 120;
        scissor.height = 60;
        scissor.speed = 0;
        scissor.velocityX = 10;
        
        GAME.objects.push(scissor);
    }
    
    scissorTornadoAttack() {
        // Create a tornado of spinning scissor particles
        const centerX = gameCanvas.width / 2;
        const centerY = gameCanvas.height / 2;
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 50;
                const x = centerX + Math.cos(angle) * 150;
                const y = centerY + Math.sin(angle) * 150;
                GAME.particles.push(new Particle(x, y, '#CCCCCC', 15, 2));
            }, i * 50);
        }
    }
    
    rockThrowAttack() {
        // Throw large rock objects
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const rock = new GameObject(this.x + this.width / 2, this.y, 'bomb');
                rock.width = 80;
                rock.height = 80;
                rock.velocityX = (Math.random() * 10) - 5;
                rock.velocityY = (Math.random() * 5) + 5;
                GAME.objects.push(rock);
            }, i * 300);
        }
    }
    
    earthquakeAttack() {
        // Screen shake effect
        const duration = 2000;
        const startTime = Date.now();
        
        function shake() {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const intensity = 20 * (1 - (elapsed / duration));
                gameCanvas.style.transform = `translate(${Math.random() * intensity - intensity / 2}px, ${Math.random() * intensity - intensity / 2}px)`;
                requestAnimationFrame(shake);
            } else {
                gameCanvas.style.transform = 'translate(0, 0)';
            }
        }
        
        shake();
    }
    
    takeDamage() {
        if (this.isVulnerable) {
            this.health -= 10;
            
            // Create damage effect
            for (let i = 0; i < 20; i++) {
                GAME.particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    '#FF0000',
                    10,
                    2
                ));
            }
            
            // Check if boss is defeated
            if (this.health <= 0) {
                this.defeat();
                return true;
            }
        }
        return false;
    }
    
    defeat() {
        // Boss defeat explosion effect
        for (let i = 0; i < 100; i++) {
            GAME.particles.push(new Particle(
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                '#FFD700',
                15,
                3
            ));
        }
        
        // Award points and trigger achievement
        GAME.score += 1000;
        unlockAchievement('bossSlayer');
        
        // Advance to next boss or end boss mode
        startNextBossLevel();
    }
}

// GAME CORE FUNCTIONS

// Game Loop
function gameLoop() {
    if (!GAME.running) return;
    
    // Clear canvas
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Calculate delta time since last frame
    const now = Date.now();
    GAME.currentTime = now;
    
    // Spawn objects based on difficulty
    if (Math.random() < getSpawnRate()) {
        spawnObject();
    }
    
    // Update slice trail
    updateSliceTrail();
    
    // Update and draw objects
    GAME.objects = GAME.objects.filter(obj => {
        obj.draw();
        return !obj.update();
    });
    
    // Update and draw particles
    GAME.particles = GAME.particles.filter(particle => {
        particle.draw();
        return particle.update();
    });
    
    // Update boss if in boss mode
    if (GAME_MODES[GAME.currentMode].bossFight && GAME.currentBoss) {
        GAME.currentBoss.update();
        GAME.currentBoss.draw();
    }
    
    // Check for timed mode end
    if (GAME_MODES[GAME.currentMode].timeLimit > 0) {
        const elapsed = now - GAME.startTime;
        if (elapsed >= GAME_MODES[GAME.currentMode].timeLimit) {
            gameOver();
            return;
        }
        
        // Update time display
        const timeLeft = Math.max(0, Math.ceil((GAME_MODES[GAME.currentMode].timeLimit - elapsed) / 1000));
        document.getElementById('timeLeft').textContent = timeLeft;
    }
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Spawn random game object
function spawnObject() {
    // Determine possible object types based on game mode
    let possibleTypes = ['book', 'lightBulb', 'coffeeMug'];
    
    // Add bombs if enabled for this mode
    if (GAME_MODES[GAME.currentMode].bombsEnabled) {
        possibleTypes.push('bomb');
    }
    
    // Add golden objects (rare)
    if (Math.random() < 0.05) {
        possibleTypes.push('goldenBook', 'goldenLightBulb', 'goldenCoffeeMug');
    }
    
    // Add powerups if enabled
    if (GAME_MODES[GAME.currentMode].powerupsEnabled && Math.random() < 0.02) {
        possibleTypes.push('slowMotion', 'magnet', 'bombShield', 'doublePoints', 'freeze');
    }
    
    // Choose a random type based on spawn rates
    const typeWeights = possibleTypes.map(type => OBJECT_TYPES[type].spawnRate);
    const totalWeight = typeWeights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    let chosenType;
    for (let i = 0; i < possibleTypes.length; i++) {
        random -= typeWeights[i];
        if (random <= 0) {
            chosenType = possibleTypes[i];
            break;
        }
    }
    
    // Create object at random position
    const x = Math.random() * (gameCanvas.width - 60);
    const obj = new GameObject(x, -60, chosenType);
    
    // Add some horizontal velocity for more natural movement
    obj.velocityX = Math.random() * 2 - 1;
    
    GAME.objects.push(obj);
}

// Get spawn rate based on level and mode
function getSpawnRate() {
    const baseRate = 0.02;
    const levelMultiplier = GAME.level * 0.005;
    
    // Adjust based on game mode
    let modeMultiplier = 1;
    switch (GAME.currentMode) {
        case 'zen':
            modeMultiplier = 0.8;
            break;
        case 'arcade':
            modeMultiplier = 1.5;
            break;
        case 'boss':
            modeMultiplier = 0.5; // Fewer objects during boss fights
            break;
    }
    
    return (baseRate + levelMultiplier) * modeMultiplier;
}

// Slice effect creation
function createSliceEffect(x, y, isGolden) {
    // Determine particle effect based on object type
    const color = isGolden ? '#FFD700' : '#FFFFFF';
    const particleCount = GAME.settings.particleEffects === 'high' ? 20 : 
                         GAME.settings.particleEffects === 'medium' ? 10 : 5;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        GAME.particles.push(new Particle(x, y, color));
    }
    
    // Create larger explosion for golden objects
    if (isGolden) {
        for (let i = 0; i < particleCount; i++) {
            GAME.particles.push(new Particle(
                x, y, 
                `hsl(${Math.random() * 60 + 30}, 100%, 50%)`, 
                8, 
                1.5
            ));
        }
    }
}

// Show combo text animation
function showComboText(x, y, text) {
    const comboText = document.createElement('div');
    comboText.className = 'combo-text';
    comboText.textContent = text;
    comboText.style.left = `${x}px`;
    comboText.style.top = `${y}px`;
    
    document.body.appendChild(comboText);
    
    // Remove after animation completes
    setTimeout(() => {
        comboText.remove();
    }, 1000);
}

// Update the HUD elements
function updateHUD() {
    // Update score
    scoreElement.textContent = GAME.score;
    
    // Update combo
    comboElement.textContent = `x${GAME.combo}`;
    
    // Update lives display (heart icons)
    updateLivesDisplay();
    
    // Update powerup indicators
    updatePowerupIndicators();
}

// Update lives display
function updateLivesDisplay() {
    livesContainer.innerHTML = '';
    
    // For infinite lives (Zen mode)
    if (GAME_MODES[GAME.currentMode].lives === Infinity) {
        const infiniteIcon = document.createElement('i');
        infiniteIcon.className = 'fas fa-infinity';
        livesContainer.appendChild(infiniteIcon);
        return;
    }
    
    // Regular heart display
    for (let i = 0; i < GAME.lives; i++) {
        const heart = document.createElement('i');
        heart.className = 'fas fa-heart';
        livesContainer.appendChild(heart);
    }
}

// Update powerup indicators
function updatePowerupIndicators() {
    powerupsContainer.innerHTML = '';
    
    for (const [type, powerup] of Object.entries(GAME.powerups)) {
        if (powerup.active) {
            const indicator = document.createElement('div');
            indicator.className = 'powerup-icon';
            
            const icon = document.createElement('i');
            icon.className = `fas ${powerup.icon}`;
            indicator.appendChild(icon);
            
            // Add timer if it's not a permanent powerup
            if (powerup.duration > 0) {
                // Calculate time left and format it
                const endTime = powerup.activatedAt + powerup.duration;
                const timeLeft = Math.ceil((endTime - Date.now()) / 1000);
                
                indicator.setAttribute('data-time', timeLeft);
            }
            
            powerupsContainer.appendChild(indicator);
        }
    }
}

// Decrease lives
function decreaseLives() {
    // Don't decrease lives in Zen mode
    if (GAME_MODES[GAME.currentMode].lives === Infinity) return;
    
    GAME.lives--;
    GAME.combo = 1; // Reset combo
    
    // Create red flash effect for feedback
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.zIndex = '5';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    // Remove flash after animation
    setTimeout(() => {
        flash.remove();
    }, 300);
    
    updateHUD();
    
    // Check for game over
    if (GAME.lives <= 0) {
        gameOver();
    }
}

// Activate powerup
function activatePowerup(type) {
    const powerupType = type;
    let duration = 0;
    let message = '';
    
    switch (powerupType) {
        case 'slowMotion':
            GAME.powerups.slowMotion.active = true;
            duration = GAME.powerups.slowMotion.duration;
            message = 'Slow Motion Activated!';
            
            // Slow down all existing objects
            GAME.objects.forEach(obj => {
                if (!obj.sliced) obj.speed *= 0.5;
            });
            break;
            
        case 'magnet':
            GAME.powerups.magnet.active = true;
            duration = GAME.powerups.magnet.duration;
            message = 'Magnet Activated!';
            break;
            
        case 'bombShield':
            GAME.powerups.bombShield.active = true;
            message = 'Bomb Shield Ready!';
            break;
            
        case 'doublePoints':
            GAME.powerups.doublePoints.active = true;
            duration = GAME.powerups.doublePoints.duration;
            message = 'Double Points Activated!';
            break;
            
        case 'freeze':
            GAME.powerups.freeze.active = true;
            duration = GAME.powerups.freeze.duration;
            message = 'Freeze Activated!';
            
            // Freeze all existing objects
            GAME.objects.forEach(obj => {
                if (!obj.sliced) obj.speed *= 0.3;
            });
            break;
    }
    
    // Set activation time for timed powerups
    if (duration > 0) {
        GAME.powerups[powerupType].activatedAt = Date.now();
        
        // Set timeout to deactivate
        setTimeout(() => {
            GAME.powerups[powerupType].active = false;
            updatePowerupIndicators();
        }, duration);
    }
    
    updatePowerupIndicators();
    showPowerupPopup(message);
}

// Show powerup activation popup
function showPowerupPopup(message) {
    const popupText = document.getElementById('powerupText');
    popupText.textContent = message;
    
    powerupPopup.classList.add('show');
    
    setTimeout(() => {
        powerupPopup.classList.remove('show');
    }, 3000);
}

// Check for achievements
function checkAchievements() {
    // First slice achievement
    if (GAME.objectsSliced === 1) {
        unlockAchievement('firstSlice');
    }
    
    // Combo master achievement
    if (GAME.combo >= 15) {
        unlockAchievement('comboMaster');
    }
    
    // Century club achievement
    if (GAME.score >= 100) {
        unlockAchievement('centuryClub');
    }
    
    // Check for grand master achievement (all others unlocked)
    const allOthers = GAME.achievements.filter(a => a.id !== 'grandMaster').every(a => a.unlocked);
    if (allOthers) {
        unlockAchievement('grandMaster');
    }
}

// Unlock achievement
function unlockAchievement(id) {
    const achievement = GAME.achievements.find(a => a.id === id);
    
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        
        // Save to localStorage
        const unlockedIds = GAME.achievements
            .filter(a => a.unlocked)
            .map(a => a.id);
            
        localStorage.setItem('sliceit_achievements', JSON.stringify(unlockedIds));
        
        // Show achievement popup
        showAchievementPopup(achievement);
    }
}

// Show achievement popup
function showAchievementPopup(achievement) {
    const popupText = document.getElementById('achievementText');
    popupText.textContent = achievement.name;
    
    achievementPopup.classList.add('show');
    
    setTimeout(() => {
        achievementPopup.classList.remove('show');
    }, 3000);
}

// USER INTERACTION FUNCTIONS

// Start slicing action
function startSlice(event) {
    if (!GAME.running || GAME.paused) return;
    
    GAME.isSlicing = true;
    GAME.lastPosition = { x: event.clientX, y: event.clientY };
    GAME.slicePoints = [{ x: event.clientX, y: event.clientY }];
}

// Update slice motion
function updateSlice(event) {
    if (!GAME.isSlicing || !GAME.running || GAME.paused) return;
    
    const currentPos = { x: event.clientX, y: event.clientY };
    
    // Calculate direction of slice
    const direction = {
        x: currentPos.x - GAME.lastPosition.x,
        y: currentPos.y - GAME.lastPosition.y
    };
    
    // Normalize direction
    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (magnitude > 0) {
        direction.x /= magnitude;
        direction.y /= magnitude;
    }
    
    // Add trail points if moved enough
    const distance = Math.sqrt(
        Math.pow(currentPos.x - GAME.lastPosition.x, 2) + 
        Math.pow(currentPos.y - GAME.lastPosition.y, 2)
    );
    
    if (distance > 10) {
        // Add trail point
        GAME.sliceTrail.push(new TrailPoint(currentPos.x, currentPos.y));
        GAME.slicePoints.push({ x: currentPos.x, y: currentPos.y });
        GAME.lastPosition = currentPos;
        
        // Check for collisions with objects
        GAME.objects.forEach(obj => {
            if (obj.contains(currentPos.x, currentPos.y)) {
                obj.slice(direction);
            }
        });
        
        // Check for boss hit
        if (GAME_MODES[GAME.currentMode].bossFight && GAME.currentBoss) {
            if (GAME.currentBoss.contains(currentPos.x, currentPos.y)) {
                GAME.currentBoss.takeDamage();
            }
        }
    }
}

// End slicing action
function endSlice() {
    GAME.isSlicing = false;
    GAME.slicePoints = [];
}

// Update slice trail
function updateSliceTrail() {
    // Update and draw trail points
    GAME.sliceTrail = GAME.sliceTrail.filter(point => {
        point.draw();
        return point.update();
    });
}

// GAME STATE FUNCTIONS

// Start a game
function startGameMode(mode) {
    // Close any open menus
    hideAllScreens();
    
    // Set game mode
    GAME.currentMode = mode;
    
    // Initialize game state
    GAME.running = true;
    GAME.paused = false;
    GAME.score = 0;
    GAME.combo = 1;
    GAME.maxCombo = 1;
    GAME.lives = GAME_MODES[mode].lives;
    GAME.level = 1;
    GAME.objectsSliced = 0;
    GAME.startTime = Date.now();
    GAME.currentTime = GAME.startTime;
    GAME.objects = [];
    GAME.particles = [];
    GAME.sliceTrail = [];
    
    // Reset all powerups
    for (const powerup of Object.values(GAME.powerups)) {
        powerup.active = false;
    }
    
    // Setup for boss mode
    if (mode === 'boss') {
        startBossLevel(0);
    }
    
    // Add timer display for arcade mode
    if (GAME_MODES[mode].timeLimit > 0) {
        const timerDiv = document.createElement('div');
        timerDiv.id = 'timer';
        timerDiv.innerHTML = '<i class="fas fa-clock"></i> <span id="timeLeft"></span>';
        timerDiv.style.position = 'absolute';
        timerDiv.style.top = '10px';
        timerDiv.style.left = '50%';
        timerDiv.style.transform = 'translateX(-50%)';
        timerDiv.style.fontSize = '24px';
        timerDiv.style.fontWeight = 'bold';
        timerDiv.style.color = 'white';
        timerDiv.style.padding = '5px 15px';
        timerDiv.style.borderRadius = '20px';
        timerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        timerDiv.style.zIndex = '5';
        document.body.appendChild(timerDiv);
    }
    
    // Update HUD
    updateHUD();
    
    // Start game loop
    gameLoop();
}

// Start a boss level
function startBossLevel(bossIndex) {
    // Clear existing objects
    GAME.objects = [];
    
    // Create boss
    const bossConfig = GAME.bosses[bossIndex];
    GAME.currentBoss = new Boss(bossConfig.name, GAME.level);
    
    // Show boss intro message
    showMessage(`BOSS BATTLE: ${bossConfig.name}`, 3000);
}

// Start next boss level
function startNextBossLevel() {
    // Find current boss index
    const currentIndex = GAME.bosses.findIndex(b => b.name === GAME.currentBoss.bossType);
    const nextIndex = currentIndex + 1;
    
    // Check if there are more bosses
    if (nextIndex < GAME.bosses.length) {
        GAME.level++;
        startBossLevel(nextIndex);
    } else {
        // All bosses defeated - victory!
        gameOver(true);
    }
}

// Show message overlay
function showMessage(text, duration = 2000) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = text;
    messageDiv.style.position = 'absolute';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.fontSize = '48px';
    messageDiv.style.fontWeight = 'bold';
    messageDiv.style.color = 'white';
    messageDiv.style.textShadow = '0 0 10px #000';
    messageDiv.style.zIndex = '20';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, duration);
}

// Game over
function gameOver(victory = false) {
    GAME.running = false;
    
    // Calculate final statistics
    const timeSurvived = Math.floor((GAME.currentTime - GAME.startTime) / 1000);
    
    // Update game over screen elements
    finalScoreElement.textContent = GAME.score;
    objectsSlicedElement.textContent = GAME.objectsSliced;
    maxComboElement.textContent = `x${GAME.maxCombo}`;
    timeSurvivedElement.textContent = `${timeSurvived}s`;
    
    // Show victory message for boss mode
    if (victory) {
        showMessage('VICTORY!', 3000);
    }
    
    // Remove timer display if it exists
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.remove();
    }
    
    // Show game over screen after a short delay
    setTimeout(() => {
        showScreen('gameOver');
    }, victory ? 3000 : 1000);
}

// Pause/Resume game
function togglePause() {
    if (!GAME.running) return;
    
    GAME.paused = !GAME.paused;
    
    if (GAME.paused) {
        showScreen('pause');
    } else {
        hideAllScreens();
        gameLoop();
    }
}

// Resume game from pause
function resumeGame() {
    if (GAME.paused) {
        GAME.paused = false;
        hideAllScreens();
        gameLoop();
    }
}

// Restart game
function restartGame() {
    startGameMode(GAME.currentMode);
}

// Save high score from game over screen
function saveScore() {
    const input = document.getElementById('playerName');
    let playerName = input.value.trim();
    
    // Use default name if empty
    if (!playerName) {
        playerName = 'Player';
    }
    
    // Create score entry
    const scoreEntry = {
        name: playerName,
        score: GAME.score,
        date: new Date().toLocaleDateString()
    };
    
    // Add to high scores for current mode
    GAME.highScores[GAME.currentMode].push(scoreEntry);
    
    // Sort and limit to top 10
    GAME.highScores[GAME.currentMode].sort((a, b) => b.score - a.score);
    GAME.highScores[GAME.currentMode] = GAME.highScores[GAME.currentMode].slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem(
        `sliceit_highscores_${GAME.currentMode}`, 
        JSON.stringify(GAME.highScores[GAME.currentMode])
    );
    
    // Show confirmation and go to leaderboard
    showMessage('Score Saved!', 1500);
    setTimeout(() => {
        showLeaderboard();
    }, 1500);
}

// Save settings
function saveSettings() {
    GAME.settings.musicVolume = parseInt(document.getElementById('musicVolume').value);
    GAME.settings.sfxVolume = parseInt(document.getElementById('sfxVolume').value);
    GAME.settings.particleEffects = document.getElementById('particleEffects').value;
    GAME.settings.trailEffect = document.getElementById('trailEffect').value;
    
    // Save to localStorage
    localStorage.setItem('sliceit_settings', JSON.stringify(GAME.settings));
    
    // Show confirmation
    showMessage('Settings Saved!', 1500);
}

// Update settings (called on input change)
function updateSettings() {
    // This function can be expanded to apply settings changes in real-time
    // For now, we'll just update when saving
}

// UI SCREEN FUNCTIONS

// Show a specific menu screen
function showScreen(screenId) {
    // Hide all screens first
    hideAllScreens();
    
    // Show the requested screen
    menuScreens[screenId].style.display = 'flex';
    
    // Special handling for certain screens
    if (screenId === 'leaderboard') {
        renderLeaderboard('classic'); // Default to classic mode
    } else if (screenId === 'achievements') {
        renderAchievements();
    }
}

// Hide all menu screens
function hideAllScreens() {
    for (const screen of Object.values(menuScreens)) {
        screen.style.display = 'none';
    }
}

// Show main menu
function showMainMenu() {
    GAME.running = false;
    GAME.paused = false;
    hideAllScreens();
    showScreen('start');
}

// Show game modes screen
function showGameModes() {
    showScreen('gameMode');
}

// Show leaderboard screen
function showLeaderboard() {
    showScreen('leaderboard');
}

// Show achievements screen
function showAchievements() {
    showScreen('achievements');
}

// Show settings screen
function showSettings() {
    showScreen('settings');
}

// Show credits screen
function showCredits() {
    showScreen('credits');
}

// Show tutorial screen
function showTutorial() {
    showScreen('tutorial');
}

// Render leaderboard
function renderLeaderboard(mode) {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    const scores = GAME.highScores[mode] || [];
    
    if (scores.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 4;
        emptyCell.textContent = 'No scores yet. Be the first!';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '20px';
        emptyRow.appendChild(emptyCell);
        leaderboardList.appendChild(emptyRow);
    } else {
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score;
            
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.date;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);
            
            leaderboardList.appendChild(row);
        });
    }
}

// Render achievements
function renderAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    
    GAME.achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        
        if (achievement.unlocked) {
            item.classList.add('unlocked');
        } else {
            item.classList.add('locked');
        }
        
        const icon = document.createElement('i');
        icon.className = `fas ${achievement.icon}`;
        
        const title = document.createElement('h3');
        title.textContent = achievement.name;
        
        const description = document.createElement('p');
        description.textContent = achievement.unlocked ? 
            achievement.description : 
            '???';
        
        item.appendChild(icon);
        item.appendChild(title);
        item.appendChild(description);
        
        achievementsList.appendChild(item);
    });
}