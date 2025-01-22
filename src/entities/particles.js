class SlashEffect {
    constructor(points, color = '#fff') {
        this.points = points;
        this.color = color;
        this.opacity = 1;
        this.fadeSpeed = 0.03;
        this.thickness = 3;
        this.glow = 15;
    }

    update() {
        this.opacity -= this.fadeSpeed;
        return this.opacity > 0;
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        ctx.save();
        
        // Set up line style
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.opacity;

        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.glow;
        
        // Draw the slash
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        
        // Create smooth curve through points
        for (let i = 1; i < this.points.length - 1; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(
                this.points[i].x,
                this.points[i].y,
                xc,
                yc
            );
        }
        
        if (this.points.length > 1) {
            const last = this.points[this.points.length - 1];
            ctx.lineTo(last.x, last.y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
}

class HitEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 20;
        this.maxRadius = 40;
        this.opacity = 1;
        this.fadeSpeed = 0.05;
        this.expansionSpeed = 2;
    }

    update() {
        this.radius = Math.min(this.radius + this.expansionSpeed, this.maxRadius);
        this.opacity -= this.fadeSpeed;
        return this.opacity > 0;
    }

    draw(ctx) {
        ctx.save();
        
        // Main ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = this.opacity;
        
        // Add glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Draw expanding circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, `${this.color}33`); // 33 is 20% opacity in hex
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
    }
}

// Export both effect classes
window.SlashEffect = SlashEffect;
window.HitEffect = HitEffect;