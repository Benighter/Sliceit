class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Game state
        this.state = 'menu';
        this.mode = 'classic';
        this.score = 0;
        this.combo = 1;
        this.lives = 3;
        this.level = 1;
        this.objects = [];
        this.gameRunning = false;

        // Effects
        this.effects = [];
        this.currentSlashPoints = [];
        this.isSlicing = false;

        // Mouse tracking
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.gameRunning) return;
            this.startSlice(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameRunning || !this.isSlicing) return;
            this.updateSlice(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseup', () => {
            if (!this.gameRunning) return;
            this.endSlice();
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (!this.gameRunning) return;
            this.endSlice();
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startSlice(x, y) {
        this.isSlicing = true;
        this.currentSlashPoints = [{x, y}];
    }

    updateSlice(x, y) {
        this.currentSlashPoints.push({x, y});
        this.checkCollisions(x, y);
    }

    endSlice() {
        if (this.currentSlashPoints.length > 1) {
            // Create general slash effect in white
            this.effects.push(new SlashEffect(
                this.currentSlashPoints.slice(),
                '#ffffff'
            ));
        }
        this.isSlicing = false;
        this.currentSlashPoints = [];
    }

    startGameMode(mode) {
        this.mode = mode;
        this.gameRunning = true;
        this.score = 0;
        this.combo = 1;
        this.lives = 3;
        this.level = 1;
        this.objects = [];
        this.effects = [];

        // Hide all screens
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.style.display = 'none';
        });

        // Update display
        this.updateScore();
        this.updateCombo();
        this.updateLives();

        // Start game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Spawn new objects
        if (Math.random() < 0.02 + (this.level * 0.005)) {
            this.spawnObject();
        }

        // Update and draw objects
        this.objects = this.objects.filter(obj => {
            obj.draw(this.ctx);
            return !obj.update();
        });

        // Update and draw effects
        this.effects = this.effects.filter(effect => {
            effect.draw(this.ctx);
            return effect.update();
        });

        // Draw current slice
        if (this.isSlicing && this.currentSlashPoints.length > 1) {
            this.drawCurrentSlice();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    drawCurrentSlice() {
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 15;

        this.ctx.beginPath();
        this.ctx.moveTo(this.currentSlashPoints[0].x, this.currentSlashPoints[0].y);
        
        for (let i = 1; i < this.currentSlashPoints.length; i++) {
            this.ctx.lineTo(this.currentSlashPoints[i].x, this.currentSlashPoints[i].y);
        }
        
        this.ctx.stroke();
    }

    spawnObject() {
        const x = Math.random() * (this.canvas.width - 60);
        const types = ['book', 'lightBulb', 'coffeeMug', 'bomb'];
        
        if (Math.random() < 0.05) {
            types.push('golden' + types[Math.floor(Math.random() * 3)]);
        }

        const type = types[Math.floor(Math.random() * types.length)];
        this.objects.push(new GameObject(x, -60, type));
    }

    checkCollisions(mouseX, mouseY) {
        this.objects = this.objects.filter(obj => {
            if (mouseX > obj.x && mouseX < obj.x + obj.width &&
                mouseY > obj.y && mouseY < obj.y + obj.height) {
                
                this.handleCollision(obj);
                return false;
            }
            return true;
        });
    }

    handleCollision(obj) {
        // Get the object's color for effects
        const effectColor = obj.glowColor;

        if (obj.type === 'bomb') {
            this.effects.push(new HitEffect(
                obj.x + obj.width/2,
                obj.y + obj.height/2,
                '#e74c3c' // Red explosion
            ));
            this.gameOver();
            return;
        } else {
            this.score += obj.points * this.combo;
            this.combo++;
            this.updateScore();
            this.updateCombo();
            
            // Create hit effect with object's color
            this.effects.push(new HitEffect(
                obj.x + obj.width/2,
                obj.y + obj.height/2,
                effectColor
            ));
        }

        // Create slice effect with object's color
        if (this.currentSlashPoints.length > 1) {
            this.effects.push(new SlashEffect(
                this.currentSlashPoints.slice(),
                effectColor
            ));
        }
    }

    updateScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    updateCombo() {
        document.getElementById('combo').textContent = `Combo: x${this.combo}`;
    }

    updateLives() {
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameOver').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('playerName').value = '';
        document.getElementById('playerName').focus();
    }

    saveScore() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('Please enter your name!');
            return;
        }

        const highScores = JSON.parse(localStorage.getItem(`highScores_${this.mode}`)) || [];
        highScores.push({
            name: playerName,
            score: this.score,
            date: new Date().toISOString()
        });

        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, 10);
        localStorage.setItem(`highScores_${this.mode}`, JSON.stringify(topScores));
        
        showLeaderboard();
    }
}

// Global game instance
const game = new Game();

// Global game functions
window.startGameMode = function(mode) {
    game.startGameMode(mode);
};

window.restartGame = function() {
    game.startGameMode(game.mode);
};

window.saveScore = function() {
    game.saveScore();
};

window.showMainMenu = function() {
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('startScreen').style.display = 'flex';
};

window.showLeaderboard = function() {
    const leaderboardList = document.getElementById('leaderboardList');
    const highScores = JSON.parse(localStorage.getItem(`highScores_${game.mode}`)) || [];
    
    leaderboardList.innerHTML = '';
    highScores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = `rank-${index + 1}`;
        
        const rankCell = document.createElement('td');
        if (index < 3) {
            const medals = ['🥇', '🥈', '🥉'];
            rankCell.textContent = medals[index];
        } else {
            rankCell.textContent = (index + 1);
        }
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.score;
        
        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        leaderboardList.appendChild(row);
    });

    if (highScores.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'No scores yet!';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        leaderboardList.appendChild(row);
    }

    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById('leaderboardScreen').style.display = 'flex';
};

// Handle enter key in name input
document.getElementById('playerName').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        saveScore();
    }
});