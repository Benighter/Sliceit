class UIManager {
    constructor() {
        this.currentScreen = 'mainMenu';
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            settings: document.getElementById('settingsMenu'),
            leaderboard: document.getElementById('leaderboardScreen'),
            pause: document.getElementById('pauseMenu'),
            gameOver: document.getElementById('gameOver')
        };
        
        this.notifications = {
            achievement: document.getElementById('achievementPopup'),
            levelUp: document.getElementById('levelUpNotification')
        };

        // Initialize UI event listeners
        this.initializeEventListeners();
        
        // Initialize settings
        this.loadSettings();
    }

    initializeEventListeners() {
        // Volume sliders
        const musicSlider = document.getElementById('musicVolume');
        const sfxSlider = document.getElementById('sfxVolume');
        
        musicSlider.addEventListener('input', (e) => {
            soundManager.setMusicVolume(e.target.value / 100);
        });
        
        sfxSlider.addEventListener('input', (e) => {
            soundManager.setSoundVolume(e.target.value / 100);
        });

        // Graphics toggles
        const particlesToggle = document.getElementById('showParticles');
        const hitEffectsToggle = document.getElementById('showHitEffects');
        const sliceTrailToggle = document.getElementById('showSliceTrail');
        
        particlesToggle.addEventListener('change', (e) => {
            this.updateSetting('graphics.showParticles', e.target.checked);
        });
        
        hitEffectsToggle.addEventListener('change', (e) => {
            this.updateSetting('graphics.showHitEffects', e.target.checked);
        });
        
        sliceTrailToggle.addEventListener('change', (e) => {
            this.updateSetting('graphics.showSliceTrail', e.target.checked);
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && game.state === CONFIG.STATES.PLAYING) {
                this.togglePause();
            }
        });
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.style.display = 'none';
        });

        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'block';
            this.currentScreen = screenName;

            // Special handling for specific screens
            if (screenName === 'mainMenu') {
                soundManager.playMenuMusic();
            } else if (screenName === 'leaderboard') {
                this.updateLeaderboard();
            }
        }
    }

    togglePause() {
        if (game.state === CONFIG.STATES.PLAYING) {
            game.pauseGame();
            this.showScreen('pause');
        } else if (game.state === CONFIG.STATES.PAUSED) {
            game.resumeGame();
            this.hideAllScreens();
        }
    }

    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.style.display = 'none';
        });
    }

    showGameHUD() {
        document.getElementById('gameHud').style.display = 'flex';
        document.getElementById('powerupContainer').style.display = 'flex';
    }

    hideGameHUD() {
        document.getElementById('gameHud').style.display = 'none';
        document.getElementById('powerupContainer').style.display = 'none';
    }

    updateLeaderboard(mode = 'classic') {
        const leaderboardList = document.getElementById('leaderboardList');
        const highScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.HIGHSCORES[mode.toUpperCase()])) || [];
        
        leaderboardList.innerHTML = '';
        
        highScores.forEach((score, index) => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item';
            
            const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '🏅';
            
            li.innerHTML = `
                <div class="rank">${medal} ${index + 1}</div>
                <div class="score-details">
                    <div class="main-score">${score.score}</div>
                    <div class="sub-details">
                        Level ${score.level} • ${new Date(score.date).toLocaleDateString()}
                    </div>
                </div>
            `;
            
            leaderboardList.appendChild(li);
        });
    }

    showGameOver(score, combo, level) {
        document.getElementById('finalScoreValue').textContent = score;
        document.getElementById('finalComboValue').textContent = combo;
        document.getElementById('finalLevelValue').textContent = level;
        this.showScreen('gameOver');
    }

    showAchievement(achievement) {
        const popup = this.notifications.achievement;
        const text = document.getElementById('achievementText');
        
        text.textContent = `🏆 ${achievement.name}`;
        popup.style.display = 'block';
        popup.style.animation = 'none';
        popup.offsetHeight; // Trigger reflow
        popup.style.animation = 'slideIn 0.5s ease-out';
        
        setTimeout(() => {
            popup.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 500);
        }, 3000);
    }

    showLevelUp(level) {
        const notification = this.notifications.levelUp;
        const levelText = document.getElementById('newLevel');
        
        levelText.textContent = level;
        notification.style.display = 'block';
        notification.style.animation = 'none';
        notification.offsetHeight; // Trigger reflow
        notification.style.animation = 'fadeInOut 2s ease-in-out';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2000);
    }

    updatePowerupUI(type) {
        const powerupElement = document.getElementById(type);
        if (!powerupElement) return;

        const cooldownOverlay = powerupElement.querySelector('.powerup-cooldown');
        
        if (game.powerups[type].active) {
            powerupElement.classList.add('active');
            this.animatePowerupCooldown(cooldownOverlay, CONFIG.POWERUPS[type.toUpperCase()].DURATION);
        } else {
            powerupElement.classList.remove('active');
        }

        if (game.powerups[type].cooldown) {
            powerupElement.classList.add('cooldown');
            this.animatePowerupCooldown(cooldownOverlay, CONFIG.POWERUPS[type.toUpperCase()].COOLDOWN);
        } else {
            powerupElement.classList.remove('cooldown');
        }
    }

    animatePowerupCooldown(element, duration) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = `cooldown ${duration}ms linear`;
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        
        // Update UI elements
        document.getElementById('musicVolume').value = settings.audio.musicVolume * 100;
        document.getElementById('sfxVolume').value = settings.audio.soundVolume * 100;
        document.getElementById('showParticles').checked = settings.graphics.showParticles;
        document.getElementById('showHitEffects').checked = settings.graphics.showHitEffects;
        document.getElementById('showSliceTrail').checked = settings.graphics.showSliceTrail;
    }

    updateSetting(path, value) {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        const parts = path.split('.');
        let current = settings;
        
        // Navigate to the correct setting
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        
        // Update the setting
        current[parts[parts.length - 1]] = value;
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
}

// Create global UI manager instance
const ui = new UIManager();

// Global UI functions
function showScreen(screenName) {
    ui.showScreen(screenName);
}

function startGameMode(mode) {
    ui.hideAllScreens();
    ui.showGameHUD();
    game.startGame(mode);
}

function resumeGame() {
    game.resumeGame();
    ui.hideAllScreens();
}

function restartGame() {
    game.startGame(game.mode);
    ui.hideAllScreens();
    ui.showGameHUD();
}

function showSettings() {
    ui.showScreen('settings');
}

function saveSettings() {
    ui.loadSettings();
    showScreen('main');
}

function switchLeaderboard(mode) {
    ui.updateLeaderboard(mode);
}

function showLevelUpNotification(level) {
    ui.showLevelUp(level);
}

function showGameOver(score, combo, level) {
    ui.showGameOver(score, combo, level);
}