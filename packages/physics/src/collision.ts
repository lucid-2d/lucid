/**
 * 碰撞检测 — 圆/矩形/线段/点
 */

import { type Vec2, vec2, length, normalize } from './vec2.js';

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

/** Detailed result for line-circle intersection with hit point and distance */
export interface LineCircleHit {
  /** Whether intersection occurred */
  hit: boolean;
  /** Intersection point (closest to line start) */
  point: Vec2;
  /** Distance from line start to intersection point */
  distance: number;
  /** Surface normal at intersection point (points outward from circle) */
  normal: Vec2;
  /** Parameter t along the line segment (0 = start, 1 = end) */
  t: number;
}

const NO_LINE_HIT: LineCircleHit = { hit: false, point: vec2(0, 0), distance: 0, normal: vec2(0, 0), t: 0 };

/**
 * Detailed line-circle intersection — returns hit point, distance, and normal.
 * Use for projectile tracing, raycast, and bot aiming simulation.
 *
 * ```typescript
 * const hit = lineCircleDetailed(shooterPos, targetPos, ballCenter, ballRadius);
 * if (hit.hit) {
 *   console.log('Hit at', hit.point, 'distance', hit.distance);
 * }
 * ```
 */
export function lineCircleDetailed(a: Vec2, b: Vec2, center: Vec2, r: number): LineCircleHit {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const fx = a.x - center.x;
  const fy = a.y - center.y;

  const A = dx * dx + dy * dy;
  if (A < 1e-10) {
    const inCircle = fx * fx + fy * fy < r * r;
    if (!inCircle) return NO_LINE_HIT;
    const n = length(vec2(fx, fy)) > 1e-6 ? normalize(vec2(fx, fy)) : vec2(0, -1);
    return { hit: true, point: vec2(a.x, a.y), distance: 0, normal: n, t: 0 };
  }

  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - r * r;
  const disc = B * B - 4 * A * C;

  if (disc < 0) return NO_LINE_HIT;

  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-B - sqrtDisc) / (2 * A);
  const t2 = (-B + sqrtDisc) / (2 * A);

  // Use the earliest intersection within [0, 1]
  let t = -1;
  if (t1 >= 0 && t1 <= 1) t = t1;
  else if (t2 >= 0 && t2 <= 1) t = t2;
  else return NO_LINE_HIT;

  const px = a.x + t * dx;
  const py = a.y + t * dy;
  const nx = px - center.x;
  const ny = py - center.y;
  const nl = Math.sqrt(nx * nx + ny * ny);
  const normal = nl > 1e-6 ? vec2(nx / nl, ny / nl) : vec2(0, -1);

  return {
    hit: true,
    point: vec2(px, py),
    distance: Math.sqrt((px - a.x) ** 2 + (py - a.y) ** 2),
    normal,
    t,
  };
}

/** A circle target for raycast */
export interface RaycastTarget {
  x: number;
  y: number;
  radius: number;
  /** Optional identifier for the target */
  id?: string;
}

/** Raycast hit result */
export interface RaycastHit {
  /** The target that was hit */
  target: RaycastTarget;
  /** Intersection point */
  point: Vec2;
  /** Distance from ray origin */
  distance: number;
  /** Surface normal */
  normal: Vec2;
}

/**
 * Cast a ray from origin in a direction, find the nearest circle it hits.
 * Essential for projectile trajectory prediction in bot development.
 *
 * ```typescript
 * const balls = chain.map(b => ({ x: b.x, y: b.y, radius: b.r, id: b.id }));
 * const hit = raycast({ x: 195, y: 750 }, { x: 0, y: -1 }, balls, 800);
 * if (hit) console.log('Would hit', hit.target.id, 'at distance', hit.distance);
 * ```
 */
export function raycast(
  origin: Vec2,
  direction: Vec2,
  targets: RaycastTarget[],
  maxDistance = 1000,
): RaycastHit | null {
  const dirLen = Math.sqrt(direction.x ** 2 + direction.y ** 2);
  if (dirLen < 1e-10) return null;

  const end = vec2(
    origin.x + (direction.x / dirLen) * maxDistance,
    origin.y + (direction.y / dirLen) * maxDistance,
  );

  let nearest: RaycastHit | null = null;

  for (const target of targets) {
    const hit = lineCircleDetailed(origin, end, vec2(target.x, target.y), target.radius);
    if (hit.hit && (!nearest || hit.distance < nearest.distance)) {
      nearest = { target, point: hit.point, distance: hit.distance, normal: hit.normal };
    }
  }

  return nearest;
}

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
