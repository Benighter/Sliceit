class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.isMuted = false;
        
        // Initialize settings from localStorage or use defaults
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        this.musicVolume = settings.audio.musicVolume;
        this.soundVolume = settings.audio.soundVolume;
        
        this.initializeAudio();
    }

    initializeAudio() {
        // Initialize sound effects
        Object.entries(CONFIG.AUDIO.SOUNDS).forEach(([key, path]) => {
            this.sounds[key] = new Audio(path);
            this.sounds[key].volume = this.soundVolume;
        });

        // Initialize background music
        Object.entries(CONFIG.AUDIO.MUSIC).forEach(([key, path]) => {
            this.music[key] = new Audio(path);
            this.music[key].loop = true;
            this.music[key].volume = this.musicVolume;
        });

        // Add error handling for audio loading
        const handleError = (e) => {
            console.warn('Audio loading error:', e);
        };

        Object.values(this.sounds).forEach(sound => {
            sound.addEventListener('error', handleError);
        });

        Object.values(this.music).forEach(music => {
            music.addEventListener('error', handleError);
        });
    }

    playSound(soundKey) {
        if (this.isMuted || !this.sounds[soundKey]) return;

        // Create a new audio instance for overlapping sounds
        const sound = this.sounds[soundKey].cloneNode();
        sound.volume = this.soundVolume;
        
        sound.play().catch(error => {
            console.warn('Error playing sound:', error);
        });

        // Clean up cloned audio element after it finishes playing
        sound.addEventListener('ended', () => {
            sound.remove();
        });
    }

    playMusic(musicKey) {
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic).then(() => {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
            });
        }

        const music = this.music[musicKey];
        if (!music) return;

        music.volume = 0;
        this.fadeIn(music);
        music.play().catch(error => {
            console.warn('Error playing music:', error);
        });
        this.currentMusic = music;
    }

    stopMusic() {
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic).then(() => {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                this.currentMusic = null;
            });
        }
    }

    pauseMusic() {
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic).then(() => {
                this.currentMusic.pause();
            });
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play();
            this.fadeIn(this.currentMusic);
        }
    }

    async fadeOut(audio, duration = 500) {
        const startVolume = audio.volume;
        const steps = 20;
        const volumeStep = startVolume / steps;
        const stepDuration = duration / steps;

        for (let i = steps; i >= 0; i--) {
            audio.volume = volumeStep * i;
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }

    async fadeIn(audio, duration = 500) {
        const targetVolume = audio === this.currentMusic ? this.musicVolume : this.soundVolume;
        const steps = 20;
        const volumeStep = targetVolume / steps;
        const stepDuration = duration / steps;

        for (let i = 0; i <= steps; i++) {
            audio.volume = volumeStep * i;
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.music).forEach(music => {
            music.volume = this.musicVolume;
        });
        
        // Update settings in localStorage
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        settings.audio.musicVolume = this.musicVolume;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.soundVolume;
        });
        
        // Update settings in localStorage
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        settings.audio.soundVolume = this.soundVolume;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }

    mute() {
        this.isMuted = true;
        if (this.currentMusic) {
            this.fadeOut(this.currentMusic);
        }
    }

    unmute() {
        this.isMuted = false;
        if (this.currentMusic) {
            this.fadeIn(this.currentMusic);
        }
    }

    // Special sound effects for game events
    playSliceSound() {
        this.playSound('SLICE');
    }

    playPowerupSound() {
        this.playSound('POWERUP');
    }

    playLevelUpSound() {
        this.playSound('LEVEL_UP');
    }

    playGameOverSound() {
        this.playSound('GAME_OVER');
    }

    // Context-aware music methods
    playMenuMusic() {
        this.playMusic('MENU');
    }

    playGameMusic() {
        this.playMusic('GAME');
    }

    playBossMusic() {
        this.playMusic('BOSS');
    }
}

// Create a global instance of the sound manager
const soundManager = new SoundManager();