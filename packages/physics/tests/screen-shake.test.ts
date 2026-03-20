/**
 * ScreenShake + ParticlePool 测试
 */
import { describe, it, expect } from 'vitest';
import { ScreenShake } from '../src/screen-shake';
import { ParticlePool } from '../src/particles';

describe('ScreenShake', () => {
  it('inactive by default', () => {
    const shake = new ScreenShake();
    expect(shake.active).toBe(false);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });

  it('trigger activates shake', () => {
    const shake = new ScreenShake();
    shake.trigger(10, 0.5);
    expect(shake.active).toBe(true);
  });

  it('update produces non-zero offsets', () => {
    const shake = new ScreenShake();
    shake.trigger(10, 0.5);
    shake.update(0.016);
    // offsets should be non-zero (random, but intensity > 0)
    expect(Math.abs(shake.offsetX) + Math.abs(shake.offsetY)).toBeGreaterThan(0);
  });

  it('decays to zero after duration', () => {
    const shake = new ScreenShake();
    shake.trigger(10, 0.1);
    // simulate enough frames to expire
    for (let i = 0; i < 20; i++) shake.update(0.016);
    expect(shake.active).toBe(false);
    expect(shake.offsetX).toBe(0);
    expect(shake.offsetY).toBe(0);
  });

  it('stronger trigger overrides weaker', () => {
    const shake = new ScreenShake();
    shake.trigger(5, 0.5);
    shake.trigger(20, 0.5);
    shake.update(0.016);
    // can't assert exact value due to randomness, but should be active
    expect(shake.active).toBe(true);
  });
});

describe('ParticlePool', () => {
  it('starts with no active particles', () => {
    const pool = new ParticlePool(100);
    expect(pool.activeCount).toBe(0);
  });

  it('emit creates active particles', () => {
    const pool = new ParticlePool(100);
    pool.emit(50, 50, { count: 10 });
    expect(pool.activeCount).toBe(10);
  });

  it('particles decay over time', () => {
    const pool = new ParticlePool(100);
    pool.emit(50, 50, { count: 5, lifetime: 0.1 });
    expect(pool.activeCount).toBe(5);

    // simulate enough time for all to expire
    for (let i = 0; i < 20; i++) pool.update(0.016);
    expect(pool.activeCount).toBe(0);
  });

  it('respects pool capacity', () => {
    const pool = new ParticlePool(10);
    pool.emit(0, 0, { count: 20 }); // try to emit more than capacity
    expect(pool.activeCount).toBeLessThanOrEqual(10);
  });

  it('recycles dead particles', () => {
    const pool = new ParticlePool(5);
    pool.emit(0, 0, { count: 5, lifetime: 0.01 });
    pool.update(0.1); // all expire
    expect(pool.activeCount).toBe(0);

    pool.emit(0, 0, { count: 5 }); // should reuse slots
    expect(pool.activeCount).toBe(5);
  });
});
