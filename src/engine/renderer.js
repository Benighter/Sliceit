class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.effects = [];
        this.sliceTrails = [];
        this.backgroundParticles = [];
        
        // Visual settings
        this.settings = {
            trails: {
                maxPoints: 10,
                fadeSpeed: 0.1,
                thickness: 3,
                color: '#ffffff'
            },
            background: {
                color: '#1a1a2e',
                particleCount: 50,
                particleSpeed: 0.5
            },
            powerups: {
                glowIntensity: 20,
                pulseSpeed: 0.02
            }
        };

        this.initializeBackground();
    }

    initializeBackground() {
        // Create background particles
        for (let i = 0; i < this.settings.background.particleCount; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * this.settings.background.particleSpeed,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    clear() {
        this.ctx.fillStyle = this.settings.background.color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(gameState) {
        this.clear();
        this.renderBackground();
        
        // Render game elements based on state
        switch (gameState) {
            case CONFIG.STATES.PLAYING:
                this.renderGameplay(game);
                break;
            case CONFIG.STATES.PAUSED:
                this.renderPausedState(game);
                break;
            case CONFIG.STATES.MENU:
                this.renderMenuState();
                break;
        }
        
        // Always render effects on top
        this.renderEffects();
    }

    renderBackground() {
        // Update and render background particles
        this.backgroundParticles.forEach(particle => {
            // Update position
            particle.y += particle.speed;
            if (particle.y > this.canvas.height) {
                particle.y = 0;
                particle.x = Math.random() * this.canvas.width;
            }

            // Render particle
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderGameplay(game) {
        // Render game objects
        game.objects.forEach(obj => {
            this.renderGameObject(obj);
        });

        // Render particles
        game.particles.forEach(particle => {
            particle.draw(this.ctx);
        });

        // Render slice trails
        this.renderSliceTrails();

        // Render active power-up effects
        this.renderPowerupEffects(game.powerups);
    }

    renderGameObject(obj) {
        this.ctx.save();
        
        // Set up transformations
        this.ctx.translate(obj.x + obj.width/2, obj.y + obj.height/2);
        this.ctx.rotate(obj.rotation);
        
        // Apply special effects based on object type
        if (obj.isSpecial) {
            this.ctx.shadowColor = 'gold';
            this.ctx.shadowBlur = 20 * obj.glowIntensity;
        } else if (obj.isPowerup) {
            this.ctx.shadowColor = 'white';
            this.ctx.shadowBlur = 15;
            this.ctx.scale(obj.pulseScale, obj.pulseScale);
        }
        
        // Draw the object
        if (sprites[obj.type]) {
            this.ctx.drawImage(
                sprites[obj.type],
                -obj.width/2,
                -obj.height/2,
                obj.width,
                obj.height
            );
        }
        
        this.ctx.restore();

        // Debug hitboxes if enabled
        if (Utils.Debug.enabled) {
            Utils.Debug.drawCollisionBox(this.ctx, obj);
        }
    }

    renderSliceTrails() {
        this.sliceTrails.forEach((trail, index) => {
            if (trail.points.length < 2) return;
            
            const gradient = this.ctx.createLinearGradient(
                trail.points[0].x,
                trail.points[0].y,
                trail.points[trail.points.length - 1].x,
                trail.points[trail.points.length - 1].y
            );
            
            gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${trail.opacity})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = this.settings.trails.thickness;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(trail.points[0].x, trail.points[0].y);
            
            for (let i = 1; i < trail.points.length - 1; i++) {
                const xc = (trail.points[i].x + trail.points[i + 1].x) / 2;
                const yc = (trail.points[i].y + trail.points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(
                    trail.points[i].x,
                    trail.points[i].y,
                    xc,
                    yc
                );
            }
            
            this.ctx.stroke();
            
            // Update trail opacity
            trail.opacity -= this.settings.trails.fadeSpeed;
            if (trail.opacity <= 0) {
                this.sliceTrails.splice(index, 1);
            }
        });
    }

    renderPowerupEffects(powerups) {
        Object.entries(powerups).forEach(([type, status]) => {
            if (!status.active) return;

            switch (type) {
                case 'slowMotion':
                    this.renderSlowMotionEffect();
                    break;
                case 'magnet':
                    this.renderMagnetEffect();
                    break;
                case 'shield':
                    this.renderShieldEffect();
                    break;
            }
        });
    }

    renderSlowMotionEffect() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    renderMagnetEffect() {
        this.ctx.save();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 100;
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    renderShieldEffect() {
        this.ctx.save();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 150;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add shield shimmer
        const shimmerAngle = performance.now() / 1000;
        const shimmerGradient = this.ctx.createLinearGradient(
            centerX + Math.cos(shimmerAngle) * radius,
            centerY + Math.sin(shimmerAngle) * radius,
            centerX + Math.cos(shimmerAngle + Math.PI) * radius,
            centerY + Math.sin(shimmerAngle + Math.PI) * radius
        );
        
        shimmerGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        shimmerGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
        shimmerGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        this.ctx.strokeStyle = shimmerGradient;
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderPausedState(game) {
        // Render the game state with a blur effect
        this.ctx.filter = 'blur(5px)';
        this.renderGameplay(game);
        this.ctx.filter = 'none';
        
        // Add pause overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderMenuState() {
        // Render animated background
        const time = performance.now() / 1000;
        for (let i = 0; i < 5; i++) {
            const hue = (time * 20 + i * 30) % 360;
            this.ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.1)`;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(
                this.canvas.width / 2,
                this.canvas.height / 2,
                100 + i * 50 + Math.sin(time + i) * 20,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
        }
    }

    addSliceTrail(points) {
        this.sliceTrails.push({
            points: points.slice(),
            opacity: 1
        });
        
        // Limit the number of trails
        if (this.sliceTrails.length > 3) {
            this.sliceTrails.shift();
        }
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    renderEffects() {
        this.effects = this.effects.filter(effect => {
            if (effect.update()) {
                effect.draw(this.ctx);
                return true;
            }
            return false;
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.initializeBackground();
    }
}

// Create global renderer instance
const renderer = new Renderer(canvas);