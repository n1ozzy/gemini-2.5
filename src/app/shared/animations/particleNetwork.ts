interface ParticleConfig {
  particleCount: number;
  particleColor: string;
  lineColor: string;
  particleRadius: number;
  maxSpeed: number;
  connectionDistance: number;
  mouseInteractionDistance: number;
  mouseRepelForce: number;
}

interface MousePosition {
  x: number | null;
  y: number | null;
  radius: number;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  originalX: number;
  originalY: number;
  density: number;

  constructor(
    config: ParticleConfig,
    canvasWidth: number,
    canvasHeight: number,
    x?: number,
    y?: number
  ) {
    this.radius = config.particleRadius;
    this.x = x ?? Math.random() * (canvasWidth - this.radius * 2) + this.radius;
    this.y =
      y ?? Math.random() * (canvasHeight - this.radius * 2) + this.radius;
    this.vx = (Math.random() - 0.5) * config.maxSpeed * 2;
    this.vy = (Math.random() - 0.5) * config.maxSpeed * 2;
    this.originalX = this.x;
    this.originalY = this.y;
    this.density = Math.random() * 30 + 1;
  }

  draw(ctx: CanvasRenderingContext2D, config: ParticleConfig): void {
    ctx.fillStyle = config.particleColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update(
    config: ParticleConfig,
    mouse: MousePosition,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.x + this.radius > canvasWidth || this.x - this.radius < 0) {
      this.vx *= -1;

      this.x = Math.max(
        this.radius,
        Math.min(canvasWidth - this.radius, this.x)
      );
    }
    if (this.y + this.radius > canvasHeight || this.y - this.radius < 0) {
      this.vy *= -1;

      this.y = Math.max(
        this.radius,
        Math.min(canvasHeight - this.radius, this.y)
      );
    }

    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;

      const distance = Math.hypot(dx, dy);

      if (distance < mouse.radius && distance > 0) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;

        const forceFactor = (mouse.radius - distance) / mouse.radius;
        const force = forceFactor * config.mouseRepelForce * this.density;

        this.vx -= forceDirectionX * force;
        this.vy -= forceDirectionY * force;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }
}

export class ParticleNetwork {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: ParticleConfig;
  private particles: Particle[] = [];
  private mouse: MousePosition;
  private animationFrameId: number | null = null;

  private static readonly defaultConfig: ParticleConfig = {
    particleCount: 100,
    particleColor: 'rgba(200, 200, 255, 0.7)',
    lineColor: 'rgba(200, 200, 255, 0.15)',
    particleRadius: 2,
    maxSpeed: 0.8,
    connectionDistance: 120,
    mouseInteractionDistance: 150,
    mouseRepelForce: 0.05,
  };

  constructor(canvasId: string, options?: Partial<ParticleConfig>) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement || !(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error(
        `Canvas element with ID '${canvasId}' not found or is not a canvas.`
      );
    }
    this.canvas = canvasElement;

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context.');
    }
    this.ctx = context;

    this.config = { ...ParticleNetwork.defaultConfig, ...options };

    this.mouse = {
      x: null,
      y: null,
      radius: this.config.mouseInteractionDistance,
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);

    this.setup();
    this.initParticles();
    this.addEventListeners();
    this.animate();
  }

  private setup(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.mouse.radius = this.config.mouseInteractionDistance;
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(
        new Particle(this.config, this.canvas.width, this.canvas.height)
      );
    }
  }

  private connectParticles(): void {
    let opacityValue: number;
    const baseLineColor = this.config.lineColor.substring(
      0,
      this.config.lineColor.lastIndexOf(',')
    );
    const baseParticleColor = this.config.particleColor.substring(
      0,
      this.config.particleColor.lastIndexOf(',')
    );

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (distance < this.config.connectionDistance) {
          opacityValue = 1 - distance / this.config.connectionDistance;
          this.ctx.strokeStyle = `${baseLineColor}, ${opacityValue})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const distanceMouse = Math.hypot(
          p1.x - this.mouse.x,
          p1.y - this.mouse.y
        );
        const mouseConnectionRadius =
          this.config.mouseInteractionDistance / 1.5;

        if (distanceMouse < mouseConnectionRadius) {
          opacityValue = 1 - distanceMouse / mouseConnectionRadius;

          this.ctx.strokeStyle = `${baseParticleColor}, ${opacityValue * 0.5})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();
        }
      }
    }
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      particle.update(
        this.config,
        this.mouse,
        this.canvas.width,
        this.canvas.height
      );
      particle.draw(this.ctx, this.config);
    });

    this.connectParticles();

    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  private handleMouseOut(): void {
    this.mouse.x = null;
    this.mouse.y = null;
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.mouse.radius = this.config.mouseInteractionDistance;
  }

  private addEventListeners(): void {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseout', this.handleMouseOut);
    window.addEventListener('resize', this.handleResize);
  }

  private removeEventListeners(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseout', this.handleMouseOut);
    window.removeEventListener('resize', this.handleResize);
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public start(): void {
    if (!this.animationFrameId) {
      this.animate();
    }
  }

  public destroy(): void {
    this.stop();
    this.removeEventListeners();
    this.particles = [];

    console.log('ParticleNetwork instance destroyed.');
  }
}
