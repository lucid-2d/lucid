import { describe, it, expect } from 'vitest';
import { resolveEasing, type EasingName } from '../src/easing';

const ALL_NAMES: EasingName[] = [
  'linear',
  'easeIn', 'easeOut', 'easeInOut',
  'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
  'easeInBack', 'easeOutBack', 'easeInOutBack',
  'easeOutBounce', 'easeOutElastic',
];

describe('easing', () => {
  describe('resolveEasing', () => {
    it('resolves all named easings', () => {
      for (const name of ALL_NAMES) {
        const fn = resolveEasing(name);
        expect(typeof fn).toBe('function');
      }
    });

    it('passes through custom functions', () => {
      const custom = (t: number) => t * t * t;
      expect(resolveEasing(custom)).toBe(custom);
    });
  });

  describe('boundary values', () => {
    for (const name of ALL_NAMES) {
      it(`${name}: f(0) ≈ 0`, () => {
        const fn = resolveEasing(name);
        expect(fn(0)).toBeCloseTo(0, 5);
      });

      it(`${name}: f(1) ≈ 1`, () => {
        const fn = resolveEasing(name);
        expect(fn(1)).toBeCloseTo(1, 5);
      });
    }
  });

  describe('linear', () => {
    it('returns input unchanged', () => {
      const fn = resolveEasing('linear');
      expect(fn(0)).toBe(0);
      expect(fn(0.25)).toBe(0.25);
      expect(fn(0.5)).toBe(0.5);
      expect(fn(0.75)).toBe(0.75);
      expect(fn(1)).toBe(1);
    });
  });

  describe('easeIn', () => {
    it('starts slow (below linear)', () => {
      const fn = resolveEasing('easeIn');
      expect(fn(0.25)).toBeLessThan(0.25);
      expect(fn(0.5)).toBeLessThan(0.5);
    });
  });

  describe('easeOut', () => {
    it('starts fast (above linear)', () => {
      const fn = resolveEasing('easeOut');
      expect(fn(0.25)).toBeGreaterThan(0.25);
      expect(fn(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe('easeInOut', () => {
    it('symmetric around midpoint', () => {
      const fn = resolveEasing('easeInOut');
      expect(fn(0.5)).toBeCloseTo(0.5, 5);
      // First half slow, second half fast
      expect(fn(0.25)).toBeLessThan(0.25);
      expect(fn(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('easeOutBounce', () => {
    it('output stays in [0, 1] range', () => {
      const fn = resolveEasing('easeOutBounce');
      for (let t = 0; t <= 1; t += 0.05) {
        const v = fn(t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1.001);
      }
    });
  });

  describe('easeOutElastic', () => {
    it('overshoots past 1 (elastic effect)', () => {
      const fn = resolveEasing('easeOutElastic');
      // Elastic functions overshoot — at least one sample should exceed 1
      let hasOvershoot = false;
      for (let t = 0.1; t < 1; t += 0.01) {
        if (fn(t) > 1) { hasOvershoot = true; break; }
      }
      expect(hasOvershoot).toBe(true);
    });
  });

  describe('easeInBack', () => {
    it('goes negative (overshoot at start)', () => {
      const fn = resolveEasing('easeInBack');
      // Back easing overshoots below 0 at the start
      let hasNegative = false;
      for (let t = 0.01; t < 0.5; t += 0.01) {
        if (fn(t) < 0) { hasNegative = true; break; }
      }
      expect(hasNegative).toBe(true);
    });
  });

  describe('easeOutBack', () => {
    it('overshoots past 1', () => {
      const fn = resolveEasing('easeOutBack');
      let hasOvershoot = false;
      for (let t = 0.5; t < 1; t += 0.01) {
        if (fn(t) > 1) { hasOvershoot = true; break; }
      }
      expect(hasOvershoot).toBe(true);
    });
  });
});
