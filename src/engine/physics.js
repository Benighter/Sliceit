class PhysicsEngine {
    constructor() {
        this.gravity = 0.2;
        this.terminalVelocity = 10;
        this.magnetForce = 0.5;
        this.timeScale = 1;
        
        // Collision grid for optimization
        this.gridSize = 50;
        this.grid = {};
        
        // Physics objects
        this.bodies = new Set();
    }

    update() {
        // Update time scale for slow motion effect
        this.timeScale = game.powerups.slowMotion.active ? 
            CONFIG.POWERUPS.SLOW_MOTION.SLOW_FACTOR : 1;

        // Clear collision grid
        this.grid = {};

        // Update all physics bodies
        this.bodies.forEach(body => {
            this.updateBody(body);
        });

        // Check collisions
        this.checkCollisions();
    }

    updateBody(body) {
        // Skip if body is static
        if (body.isStatic) return;

        // Apply gravity
        body.velocityY += this.gravity * this.timeScale;

        // Apply magnet effect
        if (game.powerups.magnet.active && !body.isHazard) {
            this.applyMagnetForce(body);
        }

        // Apply forces
        body.x += body.velocityX * this.timeScale;
        body.y += body.velocityY * this.timeScale;

        // Limit velocity
        const speed = Math.sqrt(body.velocityX * body.velocityX + body.velocityY * body.velocityY);
        if (speed > this.terminalVelocity) {
            const factor = this.terminalVelocity / speed;
            body.velocityX *= factor;
            body.velocityY *= factor;
        }

        // Update rotation
        body.rotation += body.rotationSpeed * this.timeScale;

        // Keep within bounds
        this.keepInBounds(body);

        // Add to collision grid
        this.addToGrid(body);
    }

    applyMagnetForce(body) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = centerX - (body.x + body.width / 2);
        const dy = centerY - (body.y + body.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const force = this.magnetForce * (1 - Math.min(distance / 300, 1));
            body.velocityX += (dx / distance) * force;
            body.velocityY += (dy / distance) * force;
        }
    }

    keepInBounds(body) {
        // Left and right bounds
        if (body.x < 0) {
            body.x = 0;
            body.velocityX = Math.abs(body.velocityX) * 0.8;
        } else if (body.x + body.width > canvas.width) {
            body.x = canvas.width - body.width;
            body.velocityX = -Math.abs(body.velocityX) * 0.8;
        }

        // Top bound only (allow falling off bottom)
        if (body.y < 0) {
            body.y = 0;
            body.velocityY = Math.abs(body.velocityY) * 0.8;
        }
    }

    addToGrid(body) {
        const gridX1 = Math.floor(body.x / this.gridSize);
        const gridY1 = Math.floor(body.y / this.gridSize);
        const gridX2 = Math.floor((body.x + body.width) / this.gridSize);
        const gridY2 = Math.floor((body.y + body.height) / this.gridSize);

        for (let x = gridX1; x <= gridX2; x++) {
            for (let y = gridY1; y <= gridY2; y++) {
                const key = `${x},${y}`;
                if (!this.grid[key]) {
                    this.grid[key] = new Set();
                }
                this.grid[key].add(body);
            }
        }
    }

    getPotentialCollisions(body) {
        const gridX1 = Math.floor(body.x / this.gridSize);
        const gridY1 = Math.floor(body.y / this.gridSize);
        const gridX2 = Math.floor((body.x + body.width) / this.gridSize);
        const gridY2 = Math.floor((body.y + body.height) / this.gridSize);

        const potentialCollisions = new Set();

        for (let x = gridX1; x <= gridX2; x++) {
            for (let y = gridY1; y <= gridY2; y++) {
                const key = `${x},${y}`;
                if (this.grid[key]) {
                    this.grid[key].forEach(other => {
                        if (other !== body) {
                            potentialCollisions.add(other);
                        }
                    });
                }
            }
        }

        return potentialCollisions;
    }

    checkCollisions() {
        this.bodies.forEach(body => {
            if (body.isStatic) return;

            const potentialCollisions = this.getPotentialCollisions(body);
            potentialCollisions.forEach(other => {
                if (this.checkCollision(body, other)) {
                    this.resolveCollision(body, other);
                }
            });
        });
    }

    checkCollision(body1, body2) {
        // AABB collision check
        return !(
            body1.x + body1.width < body2.x ||
            body1.x > body2.x + body2.width ||
            body1.y + body1.height < body2.y ||
            body1.y > body2.y + body2.height
        );
    }

    resolveCollision(body1, body2) {
        // Handle special cases
        if (body1.isHazard || body2.isHazard) {
            if (game.powerups.shield.active) {
                // Destroy hazard object
                this.bodies.delete(body1.isHazard ? body1 : body2);
                game.powerups.shield.active = false;
            } else {
                game.gameOver();
            }
            return;
        }

        // Basic elastic collision
        const dx = (body2.x + body2.width/2) - (body1.x + body1.width/2);
        const dy = (body2.y + body2.height/2) - (body1.y + body1.height/2);
        const angle = Math.atan2(dy, dx);

        // Calculate new velocities
        const speed1 = Math.sqrt(body1.velocityX * body1.velocityX + body1.velocityY * body1.velocityY);
        const speed2 = Math.sqrt(body2.velocityX * body2.velocityX + body2.velocityY * body2.velocityY);

        const direction1 = Math.atan2(body1.velocityY, body1.velocityX);
        const direction2 = Math.atan2(body2.velocityY, body2.velocityX);

        const newVelX1 = speed2 * Math.cos(direction2 - angle) * Math.cos(angle);
        const newVelY1 = speed2 * Math.cos(direction2 - angle) * Math.sin(angle);
        const newVelX2 = speed1 * Math.cos(direction1 - angle) * Math.cos(angle);
        const newVelY2 = speed1 * Math.cos(direction1 - angle) * Math.sin(angle);

        body1.velocityX = newVelX1;
        body1.velocityY = newVelY1;
        body2.velocityX = newVelX2;
        body2.velocityY = newVelY2;
    }

    addBody(body) {
        this.bodies.add(body);
    }

    removeBody(body) {
        this.bodies.delete(body);
    }

    clear() {
        this.bodies.clear();
        this.grid = {};
    }
}

// Create global physics engine instance
const physics = new PhysicsEngine();