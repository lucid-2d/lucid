/**
 * 碰撞检测测试
 */
import { describe, it, expect } from 'vitest';
import {
  circleRect, circleCircle, lineCircle, pointInRect, pointInCircle,
} from '../src/collision';
import { vec2 } from '../src/vec2';

describe('pointInRect', () => {
  it('inside', () => {
    expect(pointInRect(50, 50, 0, 0, 100, 100)).toBe(true);
  });
  it('outside', () => {
    expect(pointInRect(150, 50, 0, 0, 100, 100)).toBe(false);
  });
  it('on edge', () => {
    expect(pointInRect(100, 50, 0, 0, 100, 100)).toBe(true);
  });
});

describe('pointInCircle', () => {
  it('inside', () => {
    expect(pointInCircle(51, 50, 50, 50, 10)).toBe(true);
  });
  it('outside', () => {
    expect(pointInCircle(100, 100, 50, 50, 10)).toBe(false);
  });
});

describe('circleRect', () => {
  it('detects collision', () => {
    const r = circleRect(50, 50, 10, 0, 0, 100, 100);
    expect(r.hit).toBe(true);
  });

  it('no collision when apart', () => {
    const r = circleRect(200, 200, 10, 0, 0, 100, 100);
    expect(r.hit).toBe(false);
  });

  it('returns normal pointing away from rect', () => {
    // Circle above rect, touching top edge
    const r = circleRect(50, -5, 10, 0, 0, 100, 100);
    expect(r.hit).toBe(true);
    expect(r.normal.y).toBeLessThan(0); // normal points up
  });

  it('returns overlap depth', () => {
    // Circle centered on rect edge
    const r = circleRect(50, -5, 10, 0, 0, 100, 100);
    expect(r.hit).toBe(true);
    expect(r.overlap).toBeGreaterThan(0);
  });
});

describe('circleCircle', () => {
  it('detects overlap', () => {
    const r = circleCircle(0, 0, 10, 15, 0, 10);
    expect(r.hit).toBe(true);
    expect(r.overlap).toBeCloseTo(5);
  });

  it('no overlap when apart', () => {
    const r = circleCircle(0, 0, 10, 30, 0, 10);
    expect(r.hit).toBe(false);
  });

  it('returns normal from a to b', () => {
    const r = circleCircle(0, 0, 10, 20, 0, 10);
    // barely not touching (distance = 20, radii sum = 20)
    // exact edge: use distance = 19
    const r2 = circleCircle(0, 0, 10, 19, 0, 10);
    expect(r2.hit).toBe(true);
    expect(r2.normal.x).toBeGreaterThan(0); // points from a toward b
  });
});

describe('lineCircle', () => {
  it('detects intersection', () => {
    // Horizontal line through circle center
    expect(lineCircle(vec2(-100, 0), vec2(100, 0), vec2(0, 0), 10)).toBe(true);
  });

  it('no intersection when line misses', () => {
    expect(lineCircle(vec2(-100, 50), vec2(100, 50), vec2(0, 0), 10)).toBe(false);
  });

  it('no intersection when circle is past line segment', () => {
    // Line segment far to the left, circle at origin
    expect(lineCircle(vec2(-200, 0), vec2(-100, 0), vec2(0, 0), 10)).toBe(false);
  });

  it('handles degenerate (zero-length) segment', () => {
    // Point inside circle
    expect(lineCircle(vec2(0, 0), vec2(0, 0), vec2(0, 0), 10)).toBe(true);
    // Point outside circle
    expect(lineCircle(vec2(50, 50), vec2(50, 50), vec2(0, 0), 10)).toBe(false);
  });
});
