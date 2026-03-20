/**
 * Vec2 向量运算测试
 */
import { describe, it, expect } from 'vitest';
import {
  vec2, add, sub, scale, length, lengthSq, normalize, dot, cross,
  distance, distanceSq, angle, fromAngle, perp, lerp, reflect,
} from '../src/vec2';

describe('Vec2', () => {
  it('vec2 creates a vector', () => {
    const v = vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('add', () => {
    const r = add(vec2(1, 2), vec2(3, 4));
    expect(r).toEqual({ x: 4, y: 6 });
  });

  it('sub', () => {
    const r = sub(vec2(5, 7), vec2(2, 3));
    expect(r).toEqual({ x: 3, y: 4 });
  });

  it('scale', () => {
    const r = scale(vec2(3, 4), 2);
    expect(r).toEqual({ x: 6, y: 8 });
  });

  it('length', () => {
    expect(length(vec2(3, 4))).toBeCloseTo(5);
  });

  it('lengthSq', () => {
    expect(lengthSq(vec2(3, 4))).toBe(25);
  });

  it('normalize', () => {
    const n = normalize(vec2(3, 4));
    expect(length(n)).toBeCloseTo(1);
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  it('normalize zero vector returns zero', () => {
    const n = normalize(vec2(0, 0));
    expect(n).toEqual({ x: 0, y: 0 });
  });

  it('dot product', () => {
    expect(dot(vec2(1, 0), vec2(0, 1))).toBe(0);     // perpendicular
    expect(dot(vec2(2, 3), vec2(4, 5))).toBe(23);
  });

  it('cross product (2D scalar)', () => {
    expect(cross(vec2(1, 0), vec2(0, 1))).toBe(1);
    expect(cross(vec2(0, 1), vec2(1, 0))).toBe(-1);
  });

  it('distance', () => {
    expect(distance(vec2(0, 0), vec2(3, 4))).toBeCloseTo(5);
  });

  it('distanceSq', () => {
    expect(distanceSq(vec2(0, 0), vec2(3, 4))).toBe(25);
  });

  it('angle returns atan2', () => {
    expect(angle(vec2(1, 0))).toBeCloseTo(0);
    expect(angle(vec2(0, 1))).toBeCloseTo(Math.PI / 2);
    expect(angle(vec2(-1, 0))).toBeCloseTo(Math.PI);
  });

  it('fromAngle creates unit vector', () => {
    const v = fromAngle(0);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);

    const v2 = fromAngle(Math.PI / 2);
    expect(v2.x).toBeCloseTo(0);
    expect(v2.y).toBeCloseTo(1);
  });

  it('perp rotates 90 degrees CCW', () => {
    const p = perp(vec2(1, 0));
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  it('lerp interpolates', () => {
    const r = lerp(vec2(0, 0), vec2(10, 20), 0.5);
    expect(r).toEqual({ x: 5, y: 10 });
  });

  it('lerp at 0 returns a, at 1 returns b', () => {
    const a = vec2(1, 2);
    const b = vec2(3, 4);
    expect(lerp(a, b, 0)).toEqual(a);
    expect(lerp(a, b, 1)).toEqual(b);
  });

  it('reflect off horizontal surface', () => {
    // Ball going down-right, hits floor (normal = up)
    const v = vec2(1, 1);       // velocity
    const n = vec2(0, -1);      // floor normal (pointing up)
    const r = reflect(v, n);
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(-1);
  });

  it('reflect off vertical wall', () => {
    const v = vec2(1, 1);
    const n = vec2(-1, 0);      // right wall normal (pointing left)
    const r = reflect(v, n);
    expect(r.x).toBeCloseTo(-1);
    expect(r.y).toBeCloseTo(1);
  });
});
