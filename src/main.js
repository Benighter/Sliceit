document.addEventListener('DOMContentLoaded', function() {
    // Initialize game when sprites are loaded
    Promise.all(Object.values(sprites).map(img => {
        if (img instanceof HTMLImageElement && !img.complete) {
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = reject;
            });
        }
        return Promise.resolve();
    })).then(() => {
        // Show main menu
        document.getElementById('startScreen').style.display = 'flex';
        
        // Initialize event listeners
        setupEventListeners();
    }).catch(error => {
        console.error('Error loading game assets:', error);
    });
});

function setupEventListeners() {
    // Window resize handler
    window.addEventListener('resize', () => {
        if (game) {
            game.resizeCanvas();
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && game.gameRunning) {
            game.gameOver();
        }
    });

    // Prevent context menu on right-click during game
    document.addEventListener('contextmenu', (e) => {
        if (game.gameRunning) {
            e.preventDefault();
        }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.gameRunning) {
            game.gameOver();
        }
    });

    // Touch support for mobile
    const canvas = document.getElementById('gameCanvas');

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!game.gameRunning) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        game.startSlice(x, y);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!game.gameRunning) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        game.updateSlice(x, y);
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!game.gameRunning) return;
        
        game.endSlice();
    });

    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        if (!game.gameRunning) return;
        
        game.endSlice();
    });
}

// Expose debug functions in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.game = game;
    window.DEBUG = {
        spawnObject: (type) => {
            if (game.gameRunning) {
                const x = Math.random() * (game.canvas.width - 60);
                game.objects.push(new GameObject(x, -60, type));
            }
        },
        togglePowerup: (type) => {
            if (game.gameRunning) {
                game.powerups[type].active = !game.powerups[type].active;
            }
        }
    };
}