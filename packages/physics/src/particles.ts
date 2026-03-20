/**
 * ParticlePool — 对象池粒子系统
 *
 * 预分配固定数量粒子，避免 GC。
 * 不包含渲染逻辑（渲染由调用方根据粒子数据自行绘制）。
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
}

export interface EmitOptions {
  count?: number;
  speed?: number;
  radius?: number;
  lifetime?: number;
  color?: string;
  gravity?: number;
  spread?: number;
  baseAngle?: number;
}

export class ParticlePool {
  private pool: Particle[];
  private _activeCount = 0;

  constructor(capacity: number) {
    this.pool = Array.from({ length: capacity }, () => this.createParticle());
  }

  get activeCount(): number { return this._activeCount; }
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

      emitted++;
    }

    this.recount();
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
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
    }
    this.recount();
  }

  private recount(): void {
    this._activeCount = 0;
    for (const p of this.pool) {
      if (p.active) this._activeCount++;
    }
  }

  private createParticle(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, radius: 0,
      color: '', active: false, gravity: 0,
      rotation: 0, rotSpeed: 0,
    };
  }
}
