/**
 * Vec2 — 2D 向量工具库
 *
 * 纯函数，不可变。合并 template + star-drift 全部向量运算。
 */

export interface Vec2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vec2 { return { x, y }; }

export function add(a: Vec2, b: Vec2): Vec2 { return { x: a.x + b.x, y: a.y + b.y }; }
export function sub(a: Vec2, b: Vec2): Vec2 { return { x: a.x - b.x, y: a.y - b.y }; }
export function scale(v: Vec2, s: number): Vec2 { return { x: v.x * s, y: v.y * s }; }
export function negate(v: Vec2): Vec2 { return { x: -v.x, y: -v.y }; }

export function length(v: Vec2): number { return Math.sqrt(v.x * v.x + v.y * v.y); }
export function lengthSq(v: Vec2): number { return v.x * v.x + v.y * v.y; }

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dot(a: Vec2, b: Vec2): number { return a.x * b.x + a.y * b.y; }
export function cross(a: Vec2, b: Vec2): number { return a.x * b.y - a.y * b.x; }

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function angle(v: Vec2): number { return Math.atan2(v.y, v.x); }
export function fromAngle(rad: number): Vec2 { return { x: Math.cos(rad), y: Math.sin(rad) }; }

/** 逆时针旋转 90° */
export function perp(v: Vec2): Vec2 { return { x: -v.y, y: v.x }; }

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** 反射：v 关于法线 n 的反射向量 */
export function reflect(v: Vec2, n: Vec2): Vec2 {
  const d = 2 * dot(v, n);
  return { x: v.x - d * n.x, y: v.y - d * n.y };
}
