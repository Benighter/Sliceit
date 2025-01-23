const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const leaderboardList = document.getElementById('leaderboardList');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let combo = 1;
let lives = 3;
let gameRunning = false;
let level = 1;
let objectsFallen = 0;
let objects = [];
let particles = [];
let activeSlowMotion = false;
let activeMagnet = false;
let activeBombShield = false;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Load SVG sprites
const sprites = {
    book: new Image(),
    lightBulb: new Image(),
    coffeeMug: new Image(),
    bomb: new Image(),
    goldenBook: new Image(),
    goldenLightBulb: new Image(),
    goldenCoffeeMug: new Image(),
    slowMotion: new Image(),
    magnet: new Image(),
    bombShield: new Image()
};

// SVG data URLs for sprites
sprites.book.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
        <rect x="5" y="10" width="70" height="80" fill="#8B4513" />
        <rect x="10" y="15" width="60" height="70" fill="#F4A460" />
        <line x1="40" y1="15" x2="40" y2="85" stroke="#8B4513" stroke-width="2" />
    </svg>
`);
sprites.lightBulb.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100">
        <circle cx="40" cy="40" r="30" fill="#FFD700" />
        <path d="M40 70 L40 90 M30 80 H50" stroke="#808080" stroke-width="4" fill="none" />
        <circle cx="40" cy="40" r="15" fill="#FFFFFF" opacity="0.5" />
    </svg>
`);
sprites.coffeeMug.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 30 Q10 10 30 10 H60 Q80 10 80 30 V70 Q80 90 60 90 H30 Q10 90 10 70 Z" fill="#4169E1" />
        <path d="M80 40 H90 Q100 40 100 50 V60 Q100 70 90 70 H80" fill="none" stroke="#4169E1" stroke-width="5" />
    </svg>
`);
sprites.bomb.src = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="60" r="35" fill="#000000" />
        <path d="M50 25 Q55 5 70 10 T90 25" fill="none" stroke="#000000" stroke-width="4" />
        <circle cx="90" cy="25" r="8" fill="#FF0000" />
        <circle cx="65" cy="50" r="10" fill="#FFFFFF" opacity="0.3" />
    </svg>
`);

// For simplicity, we'll use the same sprites for golden versions and power-ups
sprites.goldenBook.src = sprites.book.src;
sprites.goldenLightBulb.src = sprites.lightBulb.src;
sprites.goldenCoffeeMug.src = sprites.coffeeMug.src;
sprites.slowMotion.src = sprites.lightBulb.src;
sprites.magnet.src = sprites.coffeeMug.src;
sprites.bombShield.src = sprites.book.src;

// Wait for all images to load before starting the game
Promise.all(Object.values(sprites).map(img => new Promise(resolve => img.onload = resolve)))
    .then(() => {
        showMainMenu();
    });

class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 60;
        this.height = 60;
        this.speed = Math.random() * 2 + 1 + (level * 0.5);
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        this.points = this.getPoints();
        this.golden = type.startsWith('golden');
    }

    getPoints() {
        const basePoints = {
            book: 5,
            lightBulb: 10,
            coffeeMug: 15,
            goldenBook: 25,
            goldenLightBulb: 50,
            goldenCoffeeMug: 75
        };
        return basePoints[this.type] || 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
if (sprites[this.type] instanceof HTMLImageElement) {
ctx.drawImage(sprites[this.type], -this.width / 2, -this.height / 2, this.width, this.height);
} else {
console.error('Invalid image type:', sprites[this.type]);
}
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height + this.height) {
            if (this.type !== 'bomb' && !this.type.startsWith('golden') && !['slowMotion', 'magnet', 'bombShield'].includes(this.type)) {
                lives--;
                combo = 1; // Reset combo when a life is lost
                livesElement.textContent = `Lives: ${lives}`;
                comboElement.textContent = `Combo: x${combo}`;
                if (lives <= 0) gameOver();
            }
            return true; // Remove this line to prevent objects from being removed incorrectly
        }
        return false;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawnObject() {
    const x = Math.random() * (canvas.width - 60);
    const types = ['book', 'lightBulb', 'coffeeMug', 'bomb'];
    
    // Introduce golden objects and power-ups
    if (Math.random() < 0.05) {
        types.push('golden' + types[Math.floor(Math.random() * 3)]);
    }
    if (Math.random() < 0.02) {
        types.push(['slowMotion', 'magnet', 'bombShield'][Math.floor(Math.random() * 3)]);
    }

    const type = types[Math.floor(Math.random() * types.length)];
    objects.push(new GameObject(x, -60, type));
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.02 + (level * 0.005)) spawnObject();

    objects = objects.filter(obj => {
        if (activeMagnet && obj.type !== 'bomb') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const dx = centerX - obj.x;
            const dy = centerY - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            obj.x += dx / distance * 2;
            obj.y += dy / distance * 2;
        }

        obj.draw();
        return !obj.update();
    });

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    particles = particles.filter(particle => particle.size > 0.2);

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (event) => {
    if (!gameRunning) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    objects = objects.filter(obj => {
        if (mouseX > obj.x && mouseX < obj.x + obj.width &&
            mouseY > obj.y && mouseY < obj.y + obj.height) {
            if (obj.type === 'bomb') {
                if (activeBombShield) {
                    activeBombShield = false;
                    return false;
                } else {
                    gameOver();
                }
            } else {
                if (obj.type === 'slowMotion') {
                    activeSlowMotion = true;
                    setTimeout(() => { activeSlowMotion = false; }, 5000);
                } else if (obj.type === 'magnet') {
                    activeMagnet = true;
                    setTimeout(() => { activeMagnet = false; }, 5000);
                } else if (obj.type === 'bombShield') {
                    activeBombShield = true;
                } else {
                    score += obj.points * combo;
                    combo++;
                    objectsFallen++;
                }
                scoreElement.textContent = `Score: ${score}`;
                comboElement.textContent = `Combo: x${combo}`;
                createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.golden ? '#FFD700' : '#FFFFFF');
                return false;
            }
        }
        return true;
    });

    // Level progression
    if (objectsFallen >= 20 * level) {
        level++;
        objectsFallen = 0;
    }
});

function gameOver() {
    gameRunning = false;
    gameOverElement.style.display = 'block';
    saveHighScore(score);
}

function startGame() {
    gameRunning = true;
    score = 0;
    combo = 1;
    lives = 3;
    level = 1;
    objectsFallen = 0;
    objects = [];
    particles = [];
    activeSlowMotion = false;
    activeMagnet = false;
    activeBombShield = false;
    scoreElement.textContent = `Score: ${score}`;
    comboElement.textContent = `Combo: x${combo}`;
    livesElement.textContent = `Lives: ${lives}`;
    gameOverElement.style.display = 'none';
    startScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    gameLoop();
}

function restartGame() {
    startGame();
}

function showMainMenu() {
    startScreen.style.display = 'block';
    gameOverElement.style.display = 'none';
    leaderboardScreen.style.display = 'none';
}

function showLeaderboard() {
    startScreen.style.display = 'none';
    gameOverElement.style.display = 'none';
    leaderboardScreen.style.display = 'block';
    renderLeaderboard();
}

function goToMainMenu() {
    showMainMenu();
}

function saveHighScore(score) {
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 10); // Keep only top 10 scores
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function renderLeaderboard() {
    leaderboardList.innerHTML = '';
    highScores.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score}`;
        leaderboardList.appendChild(li);
    });
}