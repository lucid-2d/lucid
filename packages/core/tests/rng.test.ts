import { describe, it, expect } from 'vitest';
import { SeededRNG } from '../src/rng';

describe('SeededRNG', () => {
  it('produces deterministic sequence from same seed', () => {
    const a = new SeededRNG(12345);
    const b = new SeededRNG(12345);
    for (let i = 0; i < 20; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = new SeededRNG(111);
    const b = new SeededRNG(222);
    const same = Array.from({ length: 10 }, () => a.next() === b.next());
    expect(same.some(v => !v)).toBe(true); // at least one differs
  });

  it('next returns values in [0, 1)', () => {
    const rng = new SeededRNG(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int returns values in [min, max]', () => {
    const rng = new SeededRNG(99);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick selects from array', () => {
    const rng = new SeededRNG(77);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('pick is deterministic', () => {
    const a = new SeededRNG(55);
    const b = new SeededRNG(55);
    const items = ['x', 'y', 'z', 'w'];
    for (let i = 0; i < 10; i++) {
      expect(a.pick(items)).toBe(b.pick(items));
    }
  });

  it('shuffle returns same-length deterministic array', () => {
    const a = new SeededRNG(33);
    const b = new SeededRNG(33);
    const arr = [1, 2, 3, 4, 5];
    expect(a.shuffle(arr)).toEqual(b.shuffle(arr));
    expect(a.shuffle(arr)).toHaveLength(5);
  });

  it('shuffle does not mutate original', () => {
    const rng = new SeededRNG(33);
    const arr = [1, 2, 3];
    rng.shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('seed is readable for recording', () => {
    const rng = new SeededRNG(12345);
    expect(rng.seed).toBe(12345);
  });

  it('auto-generates seed if not provided', () => {
    const rng = new SeededRNG();
    expect(typeof rng.seed).toBe('number');
    expect(rng.seed).toBeGreaterThan(0);
  });

  it('fork creates independent child with deterministic seed', () => {
    const a = new SeededRNG(100);
    const b = new SeededRNG(100);
    const childA = a.fork();
    const childB = b.fork();
    expect(childA.seed).toBe(childB.seed);
    expect(childA.next()).toBe(childB.next());
  });
});
