import { describe, it, expect, vi } from 'vitest';
import { ParticlePool, ParticleEmitter, ParticlePresets } from '../src/particles';

describe('ParticlePool', () => {
  it('creates with given capacity', () => {
    const pool = new ParticlePool(100);
    expect(pool.capacity).toBe(100);
    expect(pool.activeCount).toBe(0);
  });

  it('emit activates particles', () => {
    const pool = new ParticlePool(50);
    pool.emit(100, 200, { count: 10 });
    expect(pool.activeCount).toBe(10);
  });

  it('update moves particles and decreases life', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 1, speed: 100, lifetime: 1 });
    const p = pool.particles.find(p => p.active)!;
    const startX = p.x;

    pool.update(0.1);
    expect(p.x).not.toBe(startX);
    expect(p.life).toBeLessThan(1);
  });

  it('particles deactivate when life expires', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 5, lifetime: 0.1 });
    expect(pool.activeCount).toBe(5);

    pool.update(0.2);
    expect(pool.activeCount).toBe(0);
  });

  it('gravity affects vy', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 1, speed: 0, gravity: 500, lifetime: 1 });
    const p = pool.particles.find(p => p.active)!;
    pool.update(0.1);
    expect(p.vy).toBeGreaterThan(0);
  });

  it('friction slows particles', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 1, speed: 100, friction: 5, lifetime: 1, baseAngle: 0, spread: 0 });
    const p = pool.particles.find(p => p.active)!;
    const startVx = p.vx;
    pool.update(0.1);
    expect(Math.abs(p.vx)).toBeLessThan(Math.abs(startVx));
  });

  it('clear deactivates all particles', () => {
    const pool = new ParticlePool(20);
    pool.emit(0, 0, { count: 15 });
    expect(pool.activeCount).toBe(15);
    pool.clear();
    expect(pool.activeCount).toBe(0);
  });

  it('draw calls ctx.arc for active particles', () => {
    const pool = new ParticlePool(10);
    pool.emit(100, 200, { count: 3, lifetime: 1 });
    const ctx = {
      globalAlpha: 1, fillStyle: '',
      beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    } as any;
    pool.draw(ctx);
    expect(ctx.arc).toHaveBeenCalledTimes(3);
  });

  it('custom drawParticle overrides default rendering', () => {
    const drawFn = vi.fn();
    const pool = new ParticlePool(10, { drawParticle: drawFn });
    pool.emit(100, 200, { count: 3, lifetime: 1 });
    const ctx = { globalAlpha: 1 } as any;
    pool.draw(ctx);
    expect(drawFn).toHaveBeenCalledTimes(3);
    // Each call receives (ctx, particle, t)
    expect(drawFn.mock.calls[0][0]).toBe(ctx);
    expect(drawFn.mock.calls[0][1].active).toBe(true);
    expect(typeof drawFn.mock.calls[0][2]).toBe('number');
  });

  it('active returns only active particles', () => {
    const pool = new ParticlePool(20);
    pool.emit(0, 0, { count: 5, lifetime: 1 });
    const active = pool.active;
    expect(active).toHaveLength(5);
    for (const p of active) {
      expect(p.active).toBe(true);
    }
  });

  it('draw handles alpha and scale over lifetime', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 1, lifetime: 1, alpha: 0.8, scaleStart: 2, scaleEnd: 0 });
    pool.update(0.5); // halfway through life

    const ctx = {
      globalAlpha: 1, fillStyle: '',
      beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    } as any;
    pool.draw(ctx);
    // Alpha should be faded (0.8 * 0.5 = 0.4)
    expect(ctx.globalAlpha).toBe(1); // restored after draw
    expect(ctx.arc).toHaveBeenCalledOnce();
  });
});

describe('ParticleEmitter', () => {
  it('emits particles at specified rate', () => {
    const pool = new ParticlePool(100);
    const emitter = new ParticleEmitter(pool, {
      rate: 10, speed: 50, lifetime: 1, color: '#fff',
    });
    emitter.x = 100;
    emitter.y = 200;

    // 10 particles/sec × 0.5s = 5 particles
    emitter.update(0.5);
    expect(pool.activeCount).toBe(5);
  });

  it('stop prevents emission', () => {
    const pool = new ParticlePool(100);
    const emitter = new ParticleEmitter(pool, { rate: 100 });
    emitter.stop();
    emitter.update(1);
    expect(pool.activeCount).toBe(0);
  });

  it('start resumes emission', () => {
    const pool = new ParticlePool(100);
    const emitter = new ParticleEmitter(pool, { rate: 10 });
    emitter.stop();
    emitter.start();
    emitter.update(0.5);
    expect(pool.activeCount).toBeGreaterThan(0);
  });

  it('follows emitter position', () => {
    const pool = new ParticlePool(100);
    const emitter = new ParticleEmitter(pool, { rate: 10, speed: 0, lifetime: 1 });
    emitter.x = 300;
    emitter.y = 400;
    emitter.update(0.2);

    const active = pool.particles.filter(p => p.active);
    for (const p of active) {
      expect(p.x).toBe(300);
      expect(p.y).toBe(400);
    }
  });
});

describe('ParticlePresets', () => {
  it('explosion returns EmitOptions', () => {
    const opts = ParticlePresets.explosion();
    expect(opts.count).toBe(20);
    expect(opts.speed).toBe(150);
  });

  it('explosion accepts overrides', () => {
    const opts = ParticlePresets.explosion({ color: '#ff0000', count: 50 });
    expect(opts.color).toBe('#ff0000');
    expect(opts.count).toBe(50);
  });

  it('smoke returns EmitterConfig with rate', () => {
    const config = ParticlePresets.smoke();
    expect(config.rate).toBe(15);
    expect(config.gravity).toBeLessThan(0); // upward
  });

  it('fire returns EmitterConfig', () => {
    const config = ParticlePresets.fire();
    expect(config.rate).toBe(30);
    expect(config.gravity).toBeLessThan(0);
  });

  it('sparkle returns EmitOptions', () => {
    const opts = ParticlePresets.sparkle();
    expect(opts.count).toBe(12);
    expect(opts.color).toBe('#ffffff');
  });

  it('trail returns EmitterConfig', () => {
    const config = ParticlePresets.trail();
    expect(config.rate).toBe(40);
  });

  it('presets work with pool.emit', () => {
    const pool = new ParticlePool(100);
    pool.emit(100, 200, ParticlePresets.explosion());
    expect(pool.activeCount).toBe(20);
  });

  it('presets work with ParticleEmitter', () => {
    const pool = new ParticlePool(100);
    const emitter = new ParticleEmitter(pool, ParticlePresets.fire());
    emitter.update(0.5);
    expect(pool.activeCount).toBeGreaterThan(0);
  });
});
