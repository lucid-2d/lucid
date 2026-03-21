/**
 * ParticlePool + ParticleEmitter — object-pooled particle system with built-in rendering.
 *
 * ```typescript
 * const pool = new ParticlePool(200);
 * pool.emit(x, y, { count: 20, speed: 100, color: '#ff0' });
 *
 * // Continuous emitter
 * const emitter = new ParticleEmitter(pool, {
 *   rate: 30, speed: 50, lifetime: 0.8,
 *   color: '#f80', gravity: 200,
 * });
 * emitter.x = 195; emitter.y = 400;
 *
 * // In game loop:
 * emitter.update(dt);
 * pool.update(dt);
 * pool.draw(ctx);
 * ```
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  active: boolean;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  /** Alpha at birth (fades to 0 over lifetime) */
  alpha: number;
  /** Scale at birth (shrinks to scaleEnd over lifetime) */
  scaleStart: number;
  scaleEnd: number;
  /** Velocity damping per second (0 = no damping, 1 = full stop) */
  friction: number;
}

export interface EmitOptions {
  count?: number;
  speed?: number;
  radius?: number;
  lifetime?: number;
  color?: string;
  gravity?: number;
  /** Emission cone angle in radians (default: 2π = full circle) */
  spread?: number;
  /** Center angle of emission cone (default: random) */
  baseAngle?: number;
  /** Starting alpha (default: 1) */
  alpha?: number;
  /** Scale at start (default: 1) */
  scaleStart?: number;
  /** Scale at end of life (default: 0) */
  scaleEnd?: number;
  /** Velocity damping (default: 0) */
  friction?: number;
}

export class ParticlePool {
  private pool: Particle[];
  private _activeCount = 0;

  constructor(capacity: number) {
    this.pool = Array.from({ length: capacity }, () => this._createParticle());
  }

  get activeCount(): number { return this._activeCount; }
  get capacity(): number { return this.pool.length; }
  get particles(): readonly Particle[] { return this.pool; }

  emit(x: number, y: number, opts: EmitOptions = {}): void {
    const count = opts.count ?? 10;
    const speed = opts.speed ?? 80;
    const radius = opts.radius ?? 3;
    const lifetime = opts.lifetime ?? 0.6;
    const color = opts.color ?? '#ffffff';
    const gravity = opts.gravity ?? 0;
    const spread = opts.spread ?? Math.PI * 2;
    const baseAngle = opts.baseAngle ?? Math.random() * Math.PI * 2;
    const alpha = opts.alpha ?? 1;
    const scaleStart = opts.scaleStart ?? 1;
    const scaleEnd = opts.scaleEnd ?? 0;
    const friction = opts.friction ?? 0;

    let emitted = 0;
    for (const p of this.pool) {
      if (emitted >= count) break;
      if (p.active) continue;

      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const spd = speed * (0.5 + Math.random() * 0.5);

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = lifetime;
      p.maxLife = lifetime;
      p.radius = radius * (0.5 + Math.random() * 0.5);
      p.color = color;
      p.active = true;
      p.gravity = gravity;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 6;
      p.alpha = alpha;
      p.scaleStart = scaleStart;
      p.scaleEnd = scaleEnd;
      p.friction = friction;

      emitted++;
    }

    this._recount();
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      if (p.friction > 0) {
        const decay = 1 - p.friction * dt;
        p.vx *= decay;
        p.vy *= decay;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
    }
    this._recount();
  }

  /** Built-in circle renderer with fade + scale */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      const t = 1 - p.life / p.maxLife; // 0 → 1 over lifetime
      const currentAlpha = p.alpha * (1 - t);
      const currentScale = p.scaleStart + (p.scaleEnd - p.scaleStart) * t;
      const r = p.radius * currentScale;

      if (r <= 0 || currentAlpha <= 0) continue;

      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** AI-readable state summary */
  $inspect(): string {
    return `ParticlePool ${this._activeCount}/${this.pool.length} active`;
  }

  /** Clear all active particles */
  clear(): void {
    for (const p of this.pool) p.active = false;
    this._activeCount = 0;
  }

  private _recount(): void {
    this._activeCount = 0;
    for (const p of this.pool) {
      if (p.active) this._activeCount++;
    }
  }

  private _createParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, radius: 0,
      color: '', active: false, gravity: 0,
      rotation: 0, rotSpeed: 0,
      alpha: 1, scaleStart: 1, scaleEnd: 0, friction: 0,
    };
  }
}

// ── ParticleEmitter ──

export interface EmitterConfig extends EmitOptions {
  /** Particles per second (default: 20) */
  rate?: number;
}

/**
 * Continuous particle emitter — spawns particles at a steady rate.
 *
 * Attach to a position and call update(dt) each frame.
 */
export class ParticleEmitter {
  x = 0;
  y = 0;
  active = true;

  private _pool: ParticlePool;
  private _config: EmitterConfig;
  private _accumulator = 0;

  constructor(pool: ParticlePool, config: EmitterConfig = {}) {
    this._pool = pool;
    this._config = config;
  }

  get config(): EmitterConfig { return this._config; }
  set config(c: EmitterConfig) { this._config = c; }

  update(dt: number): void {
    if (!this.active) return;

    const rate = this._config.rate ?? 20;
    this._accumulator += dt * rate;

    while (this._accumulator >= 1) {
      this._accumulator -= 1;
      this._pool.emit(this.x, this.y, { ...this._config, count: 1 });
    }
  }

  start(): void { this.active = true; }
  stop(): void { this.active = false; }
}

// ── Presets ──

export const ParticlePresets = {
  /** Quick burst explosion */
  explosion: (overrides?: Partial<EmitOptions>): EmitOptions => ({
    count: 20, speed: 150, radius: 4, lifetime: 0.5,
    color: '#ffaa00', gravity: 100, spread: Math.PI * 2,
    scaleEnd: 0, ...overrides,
  }),

  /** Upward smoke puff */
  smoke: (overrides?: Partial<EmitterConfig>): EmitterConfig => ({
    rate: 15, count: 1, speed: 30, radius: 6, lifetime: 1.2,
    color: '#888888', gravity: -20, spread: 0.6,
    baseAngle: -Math.PI / 2, alpha: 0.6,
    scaleStart: 0.5, scaleEnd: 2, friction: 0.5,
    ...overrides,
  }),

  /** Sparkle / glitter */
  sparkle: (overrides?: Partial<EmitOptions>): EmitOptions => ({
    count: 12, speed: 60, radius: 2, lifetime: 0.8,
    color: '#ffffff', gravity: 0, spread: Math.PI * 2,
    scaleStart: 1, scaleEnd: 0, ...overrides,
  }),

  /** Fire emitter config */
  fire: (overrides?: Partial<EmitterConfig>): EmitterConfig => ({
    rate: 30, count: 1, speed: 40, radius: 5, lifetime: 0.6,
    color: '#ff4400', gravity: -80, spread: 0.4,
    baseAngle: -Math.PI / 2, alpha: 0.8,
    scaleStart: 1, scaleEnd: 0, friction: 0.3,
    ...overrides,
  }),

  /** Movement trail */
  trail: (overrides?: Partial<EmitterConfig>): EmitterConfig => ({
    rate: 40, count: 1, speed: 10, radius: 3, lifetime: 0.3,
    color: '#6c5ce7', gravity: 0, spread: Math.PI * 2,
    alpha: 0.6, scaleStart: 1, scaleEnd: 0,
    ...overrides,
  }),
} as const;
