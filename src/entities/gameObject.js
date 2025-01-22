class GameObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 60;
        this.height = 60;
        this.speed = Math.random() * 2 + 1;
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        this.points = this.getPoints();
        
        // Glow properties
        this.glowIntensity = 1;
        this.glowDirection = 1;
        this.glowColor = this.getGlowColor();
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

    getGlowColor() {
        const colors = {
            book: '#4a90e2',              // Blue glow
            lightBulb: '#f1c40f',         // Yellow glow
            coffeeMug: '#9b59b6',         // Purple glow
            goldenBook: '#ffd700',        // Golden glow
            goldenLightBulb: '#ffd700',   // Golden glow
            goldenCoffeeMug: '#ffd700',   // Golden glow
            bomb: '#e74c3c'               // Red glow
        };
        return colors[this.type] || '#ffffff';
    }

    draw(ctx) {
        ctx.save();
        
        // Update glow effect
        this.updateGlow();

        // Apply glow effect
        ctx.shadowBlur = 15 * this.glowIntensity;
        ctx.shadowColor = this.glowColor;
        
        // Special glow for bombs
        if (this.type === 'bomb') {
            // Add pulsing danger effect
            const dangerGlow = 10 + Math.sin(Date.now() / 200) * 5;
            ctx.shadowBlur = dangerGlow;
            // Add second layer of glow for more intensity
            ctx.shadowBlur += 10;
        }

        // Draw object with translation and rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (sprites[this.type]) {
            ctx.drawImage(
                sprites[this.type],
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        }

        // Add extra glow for golden objects
        if (this.type.startsWith('golden')) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.restore();
    }

    updateGlow() {
        // Update glow intensity for pulsing effect
        this.glowIntensity += 0.05 * this.glowDirection;
        if (this.glowIntensity >= 1.5 || this.glowIntensity <= 0.5) {
            this.glowDirection *= -1;
        }
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;

        if (this.y > window.innerHeight + this.height) {
            if (this.type !== 'bomb' && !this.type.startsWith('golden')) {
                if (game.lives > 0) {
                    game.lives--;
                    game.combo = 1;
                    game.updateLives();
                    game.updateCombo();
                    if (game.lives <= 0) {
                        game.gameOver();
                    }
                }
            }
            return true;
        }
        return false;
    }
}