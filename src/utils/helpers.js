// Math utilities
const MathUtils = {
    lerp: (start, end, t) => {
        return start * (1 - t) + end * t;
    },

    clamp: (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    },

    randomRange: (min, max) => {
        return Math.random() * (max - min) + min;
    },

    randomInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    angle: (x1, y1, x2, y2) => {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // Easing functions for smooth animations
    easing: {
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    }
};

// Animation utilities
const AnimationUtils = {
    async animate(duration, updateFn, easingFn = MathUtils.easing.easeInOutQuad) {
        const startTime = performance.now();
        
        return new Promise(resolve => {
            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easingFn(progress);
                
                updateFn(eased);
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(update);
        });
    },

    createSpriteAnimation(frameCount, frameWidth, frameHeight) {
        return {
            currentFrame: 0,
            frameCount,
            frameWidth,
            frameHeight,
            frameDuration: 100, // ms per frame
            lastFrameTime: 0,
            
            update(currentTime) {
                if (currentTime - this.lastFrameTime > this.frameDuration) {
                    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
                    this.lastFrameTime = currentTime;
                }
            },
            
            getFrameRect() {
                return {
                    x: this.currentFrame * this.frameWidth,
                    y: 0,
                    width: this.frameWidth,
                    height: this.frameHeight
                };
            }
        };
    }
};

// Visual effects utilities
const EffectUtils = {
    createGlowFilter(color, blur = 20) {
        return {
            dropShadow: true,
            shadowColor: color,
            shadowBlur: blur,
            shadowOffsetX: 0,
            shadowOffsetY: 0
        };
    },

    createRippleEffect(x, y, color = '#ffffff') {
        const ripple = {
            x,
            y,
            radius: 0,
            maxRadius: 100,
            alpha: 1,
            color,
            
            update() {
                this.radius += 2;
                this.alpha = MathUtils.clamp(1 - (this.radius / this.maxRadius), 0, 1);
                return this.alpha > 0;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        return ripple;
    }
};

// Collision detection utilities
const CollisionUtils = {
    pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    },

    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.width ||
                r2.x + r2.width < r1.x ||
                r2.y > r1.y + r1.height ||
                r2.y + r2.height < r1.y);
    },

    lineIntersectsRect(x1, y1, x2, y2, rect) {
        const left = this.lineIntersect(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.height);
        const right = this.lineIntersect(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height);
        const top = this.lineIntersect(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y);
        const bottom = this.lineIntersect(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height);
        
        return left || right || top || bottom;
    },

    lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((x2 - x1) * (y4 - y3)) - ((y2 - y1) * (x4 - x3));
        if (denominator === 0) return false;
        
        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
        
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }
};

// Performance utilities
const PerformanceUtils = {
    // FPS calculation
    fps: {
        frames: 0,
        lastTime: performance.now(),
        value: 0,
        
        update() {
            this.frames++;
            const now = performance.now();
            const delta = now - this.lastTime;
            
            if (delta >= 1000) {
                this.value = Math.round((this.frames * 1000) / delta);
                this.frames = 0;
                this.lastTime = now;
            }
            
            return this.value;
        }
    },

    // Object pooling for frequently created/destroyed objects
    createObjectPool(factory, initialSize = 50) {
        const pool = [];
        const active = new Set();
        
        // Initialize pool
        for (let i = 0; i < initialSize; i++) {
            pool.push(factory());
        }
        
        return {
            get() {
                const obj = pool.pop() || factory();
                active.add(obj);
                return obj;
            },
            
            release(obj) {
                if (active.delete(obj)) {
                    pool.push(obj);
                }
            },
            
            getActiveCount() {
                return active.size;
            },
            
            getPoolSize() {
                return pool.length;
            }
        };
    }
};

// Debug utilities
const DebugUtils = {
    enabled: false,
    
    log(...args) {
        if (this.enabled) {
            console.log('[Debug]', ...args);
        }
    },
    
    drawCollisionBox(ctx, obj) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        ctx.restore();
    },
    
    drawHitbox(ctx, points) {
        if (!this.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 1;
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
};

// Export utilities
const Utils = {
    Math: MathUtils,
    Animation: AnimationUtils,
    Effect: EffectUtils,
    Collision: CollisionUtils,
    Performance: PerformanceUtils,
    Debug: DebugUtils
};