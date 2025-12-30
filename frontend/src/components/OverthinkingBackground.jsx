import React, { useEffect, useRef } from 'react';

const OverthinkingBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;
        let animationFrameId;

        // Configuration
        const config = {
            mainLineSpeed: 5,        // Fast start
            acceleration: 1.01,      // Accel
            maxSpeed: 15,            // Speed cap
            branchProbBase: 0.02,    // Base probability
            maxDepth: 5,             // Recursion limit
            maxTotalLines: 400,      // HARD LIMIT to prevent crash
            colorBase: '240, 240, 240', // Near White
            colorGlow: '100, 100, 100', // White/Gray Glow
        };

        // State
        let lines = [];
        let fogParticles = [];
        let phase = 'spawn'; 
        let cycleTimer = 0;
        let globalAlpha = 0;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resize);
        resize();

        // --- Classes ---

        class Fog {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = initial ? Math.random() * width : width + Math.random() * 200; 
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.7) * 0.3; // Slower drift
                this.vy = (Math.random() - 0.5) * 0.1;
                this.radius = Math.random() * 400 + 200;
                this.alpha = 0;
                this.targetAlpha = Math.random() * 0.06 + 0.01; 
                // Grayscale Fog
                const shade = Math.floor(Math.random() * 50 + 50); // 50-100 gray
                this.color = `${shade}, ${shade}, ${shade}`; 
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.alpha < this.targetAlpha) this.alpha += 0.0005;
                if (this.x < -this.radius) this.x = width + this.radius;
                if (this.y < -this.radius) this.y = height + this.radius;
                else if (this.y > height + this.radius) this.y = -this.radius;
            }

            draw(ctx) {
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                g.addColorStop(0, `rgba(${this.color}, ${this.alpha})`);
                g.addColorStop(1, `rgba(${this.color}, 0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Dendrite {
            constructor(x, y, angle, depth, speed) {
                this.x = x;
                this.y = y;
                this.angle = angle;
                this.depth = depth;
                this.speed = speed;
                
                this.history = [{x, y}];
                // OPTIMIZATION: Reduced max history significantly (1000 -> 250)
                this.maxHistory = 250; 
                
                this.dead = false; 
                this.width = Math.max(0.5, (3.5 - depth * 0.8)); 
                this.brightness = Math.max(0.3, 1 - depth * 0.15); 
            }

            update(totalLines) {
                if (this.dead) return null;

                const noise = Math.sin(this.history.length * 0.1) * (0.5 + this.depth * 0.2);
                const driftAngle = this.angle + (noise * 0.02);

                this.x += Math.cos(driftAngle) * this.speed;
                this.y += Math.sin(driftAngle) * this.speed;

                if (this.speed < config.maxSpeed) {
                    this.speed *= config.acceleration;
                }

                this.history.push({x: this.x, y: this.y});
                // OPTIMIZATION: Shift history if too long to save memory/draw time
                if (this.history.length > this.maxHistory) {
                     this.history.shift();
                }

                // Stop if off screen
                if (this.x > width + 200 || this.y < -200 || this.y > height + 200) {
                    this.dead = true;
                    return null;
                }

                // Branching Logic
                // OPTIMIZATION: Stop branching if over limit
                // DELAY: Start branching only after ~30% of the screen width
                if (totalLines < config.maxTotalLines && this.depth < config.maxDepth && this.x < width - 100 && this.x > width * 0.30) {
                    let prob = config.branchProbBase;
                    
                    if (this.depth === 0) prob = 0.05; 
                    else prob = 0.02 / (this.depth * 0.5); 

                    if (Math.random() < prob) {
                        return this.branch(); 
                    }
                }
                
                return null;
            }

            branch() {
                const subBranches = [];
                // OPTIMIZATION: Bias towards single branches more often
                const numBranches = Math.random() > 0.8 ? 2 : 1;
                
                for (let i = 0; i < numBranches; i++) {
                    const angleDev = (Math.random() - 0.5) * 1.2; 
                    const newAngle = this.angle + angleDev;
                    const newSpeed = this.speed * (0.9 + Math.random() * 0.1); 
                    
                    subBranches.push(new Dendrite(
                        this.x, this.y, newAngle, this.depth + 1, newSpeed
                    ));
                }
                return subBranches;
            }

            draw(ctx, opacity) {
                if (this.history.length < 3) return;
                
                // SHADING: Gradient from tail (fading) to head (bright)
                const head = this.history[this.history.length - 1];
                const tail = this.history[0];
                
                // Avoid zero-length gradient error
                if (Math.abs(head.x - tail.x) < 1 && Math.abs(head.y - tail.y) < 1) return;

                const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
                const alpha = this.brightness * opacity;
                
                // Tail is transparent/darker
                gradient.addColorStop(0, `rgba(${config.colorBase}, 0)`); 
                // Head is solid
                gradient.addColorStop(1, `rgba(${config.colorBase}, ${alpha})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = this.width;
                
                ctx.beginPath();
                ctx.moveTo(tail.x, tail.y);
                
                // SMOOTHING: Quadratic Bezier Curve
                for (let i = 1; i < this.history.length - 1; i++) {
                    const xc = (this.history[i].x + this.history[i+1].x) / 2;
                    const yc = (this.history[i].y + this.history[i+1].y) / 2;
                    ctx.quadraticCurveTo(this.history[i].x, this.history[i].y, xc, yc);
                }
                ctx.lineTo(head.x, head.y);

                ctx.stroke();

                // OPTIMIZATION: Reduced Glow Frequency
                if (this.depth <= 1 && alpha > 0.3) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(${config.colorGlow}, ${alpha})`;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Init Fog
        for(let i=0; i<10; i++) fogParticles.push(new Fog()); // Reduced fog count

        const spawn = () => {
            lines = [];
            const mainLine = new Dendrite(-50, height / 2, 0, 0, config.mainLineSpeed);
            lines.push(mainLine);
            phase = 'active';
            globalAlpha = 1;
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            ctx.globalCompositeOperation = 'source-over';
            fogParticles.forEach(f => {
                f.update();
                f.draw(ctx);
            });

            if (phase === 'spawn') {
                spawn();
            } else if (phase === 'active') {
                let activeCount = 0;
                let newLines = [];
                
                const currentTotal = lines.length;

                lines.forEach(line => {
                    const branches = line.update(currentTotal + newLines.length);
                    if (!line.dead) activeCount++;
                    if (branches) newLines.push(...branches);
                });
                
                if (newLines.length > 0) lines.push(...newLines);

                // OPTIMIZATION: If we hit a safety limit, force end of growth phase early
                if (lines.length > config.maxTotalLines) {
                     phase = 'hold';
                     cycleTimer = 60; 
                }

                if (activeCount === 0 && lines.length > 0) {
                     phase = 'hold';
                     cycleTimer = 60; // Shorter hold
                }
            } else if (phase === 'hold') {
                cycleTimer--;
                if (cycleTimer <= 0) {
                    phase = 'fade';
                }
            } else if (phase === 'fade') {
                globalAlpha -= 0.02; // Faster fade
                if (globalAlpha <= 0) {
                    globalAlpha = 0;
                    lines = [];
                    phase = 'reset';
                    cycleTimer = 10; 
                }
            } else if (phase === 'reset') {
                cycleTimer--;
                if (cycleTimer <= 0) phase = 'spawn';
            }

            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            lines.forEach(line => line.draw(ctx, globalAlpha));

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }} 
        />
    );
};

export default OverthinkingBackground;
