/**
 * 碰撞检测测试
 */
import { describe, it, expect } from 'vitest';
import {
  circleRect, circleCircle, lineCircle, lineCircleDetailed, raycast,
  pointInRect, pointInCircle,
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

describe('lineCircleDetailed', () => {
  it('returns hit point and distance', () => {
    const hit = lineCircleDetailed(vec2(-100, 0), vec2(100, 0), vec2(0, 0), 10);
    expect(hit.hit).toBe(true);
    expect(hit.point.x).toBeCloseTo(-10);
    expect(hit.point.y).toBeCloseTo(0);
    expect(hit.distance).toBeCloseTo(90);
    expect(hit.t).toBeCloseTo(0.45); // (-100 + 90) / 200
  });

  it('returns outward normal', () => {
    const hit = lineCircleDetailed(vec2(-100, 0), vec2(100, 0), vec2(0, 0), 10);
    expect(hit.hit).toBe(true);
    expect(hit.normal.x).toBeCloseTo(-1);
    expect(hit.normal.y).toBeCloseTo(0);
  });

  it('no hit when line misses', () => {
    const hit = lineCircleDetailed(vec2(-100, 50), vec2(100, 50), vec2(0, 0), 10);
    expect(hit.hit).toBe(false);
  });

  it('no hit when circle is past segment', () => {
    const hit = lineCircleDetailed(vec2(-200, 0), vec2(-100, 0), vec2(0, 0), 10);
    expect(hit.hit).toBe(false);
  });

  it('diagonal line hitting circle', () => {
    const hit = lineCircleDetailed(vec2(0, 0), vec2(100, 100), vec2(50, 50), 10);
    expect(hit.hit).toBe(true);
    expect(hit.distance).toBeGreaterThan(0);
    expect(hit.distance).toBeLessThan(100);
  });
});

describe('raycast', () => {
  const targets = [
    { x: 0, y: -50, radius: 10, id: 'near' },
    { x: 0, y: -150, radius: 10, id: 'far' },
    { x: 100, y: 0, radius: 10, id: 'aside' },
  ];

  it('finds nearest hit along ray', () => {
    const hit = raycast(vec2(0, 0), vec2(0, -1), targets);
    expect(hit).not.toBeNull();
    expect(hit!.target.id).toBe('near');
    expect(hit!.distance).toBeCloseTo(40); // 50 - radius 10
  });

  it('ignores targets not in ray direction', () => {
    const hit = raycast(vec2(0, 0), vec2(0, 1), targets); // shooting downward
    expect(hit).toBeNull();
  });

  it('respects maxDistance', () => {
    const hit = raycast(vec2(0, 0), vec2(0, -1), targets, 30);
    expect(hit).toBeNull(); // nearest is at distance 40
  });

  it('returns null for empty targets', () => {
    expect(raycast(vec2(0, 0), vec2(0, -1), [])).toBeNull();
  });

  it('returns hit point and normal', () => {
    const hit = raycast(vec2(0, 0), vec2(0, -1), targets);
    expect(hit!.point.y).toBeCloseTo(-40);
    expect(hit!.normal.y).toBeCloseTo(1); // normal points toward ray origin
  });
});
