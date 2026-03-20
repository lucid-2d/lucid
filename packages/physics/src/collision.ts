/**
 * 碰撞检测 — 圆/矩形/线段/点
 */

import { type Vec2, vec2 } from './vec2.js';

export interface CollisionResult {
  hit: boolean;
  normal: Vec2;
  overlap: number;
}

const NO_HIT: CollisionResult = { hit: false, normal: vec2(0, 0), overlap: 0 };

// ── 点检测 ─────────────────────────────────

export function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

export function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

// ── 圆 vs 矩形 ─────────────────────────────

export function circleRect(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number,
): CollisionResult {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= cr) return NO_HIT;

  let normal: Vec2;
  if (dist < 0.001) {
    normal = vec2(0, -1);
  } else {
    normal = vec2(dx / dist, dy / dist);
  }

  return { hit: true, normal, overlap: cr - dist };
}

// ── 圆 vs 圆 ───────────────────────────────

export function circleCircle(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number,
): CollisionResult {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ar + br;

  if (dist >= minDist) return NO_HIT;

  let normal: Vec2;
  if (dist < 0.001) {
    normal = vec2(0, -1);
  } else {
    normal = vec2(dx / dist, dy / dist);
  }

  return { hit: true, normal, overlap: minDist - dist };
}

// ── 线段 vs 圆 ──────────────────────────────

export function lineCircle(a: Vec2, b: Vec2, center: Vec2, r: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - center.x;
  const fy = a.y - center.y;

  const A = dx * dx + dy * dy;
  if (A < 1e-10) {
    return fx * fx + fy * fy < r * r;
  }

  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;

  if (disc < 0) return false;

  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
