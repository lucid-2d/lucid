/**
 * BezierPath — smooth curve with distance-based point lookup.
 *
 * Common in games: Zuma ball chains, tower defense enemy routes,
 * runner tracks, bullet trajectories, motion paths.
 *
 * ```typescript
 * const path = new BezierPath();
 * path.addCubic(
 *   { x: 0, y: 400 },    // start
 *   { x: 100, y: 100 },  // control 1
 *   { x: 300, y: 100 },  // control 2
 *   { x: 400, y: 400 },  // end
 * );
 * path.build();
 *
 * const { x, y, angle } = path.getPointAtDistance(150);
 * const { x, y, angle } = path.getPointAtT(0.5);
 * ```
 */

import { type Vec2 } from './vec2.js';

export interface PathPoint {
  x: number;
  y: number;
  /** Tangent angle in radians */
  angle: number;
  /** Cumulative distance from path start */
  distance: number;
}

interface CubicSegment {
  type: 'cubic';
  p0: Vec2; p1: Vec2; p2: Vec2; p3: Vec2;
}

interface QuadSegment {
  type: 'quad';
  p0: Vec2; p1: Vec2; p2: Vec2;
}

type Segment = CubicSegment | QuadSegment;

export class BezierPath {
  private _segments: Segment[] = [];
  private _points: PathPoint[] = [];
  private _length = 0;
  private _built = false;

  /** Total path length (after build) */
  get length(): number { return this._length; }

  /** Number of sampled points (after build) */
  get pointCount(): number { return this._points.length; }

  /** Whether build() has been called */
  get built(): boolean { return this._built; }

  /** Add a cubic bezier segment (4 control points) */
  addCubic(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): this {
    this._segments.push({ type: 'cubic', p0, p1, p2, p3 });
    this._built = false;
    return this;
  }

  /** Add a quadratic bezier segment (3 control points) */
  addQuadratic(p0: Vec2, p1: Vec2, p2: Vec2): this {
    this._segments.push({ type: 'quad', p0, p1, p2 });
    this._built = false;
    return this;
  }

  /** Add a straight line segment */
  addLine(p0: Vec2, p1: Vec2): this {
    // Line as degenerate cubic
    const t1 = { x: p0.x + (p1.x - p0.x) / 3, y: p0.y + (p1.y - p0.y) / 3 };
    const t2 = { x: p0.x + (p1.x - p0.x) * 2 / 3, y: p0.y + (p1.y - p0.y) * 2 / 3 };
    return this.addCubic(p0, t1, t2, p1);
  }

  /**
   * Build sampled lookup table for distance-based queries.
   * @param samplesPerSegment Number of sample points per segment (default: 100)
   */
  build(samplesPerSegment = 100): this {
    this._points = [];
    this._length = 0;

    for (const seg of this._segments) {
      const startIdx = this._points.length;

      for (let i = 0; i <= samplesPerSegment; i++) {
        // Skip first point of subsequent segments (avoid duplicates)
        if (i === 0 && startIdx > 0) continue;

        const t = i / samplesPerSegment;
        const pos = this._evalSegment(seg, t);
        const tan = this._evalTangent(seg, t);
        const angle = Math.atan2(tan.y, tan.x);

        if (this._points.length > 0) {
          const prev = this._points[this._points.length - 1];
          const dx = pos.x - prev.x;
          const dy = pos.y - prev.y;
          this._length += Math.sqrt(dx * dx + dy * dy);
        }

        this._points.push({ x: pos.x, y: pos.y, angle, distance: this._length });
      }
    }

    this._built = true;
    return this;
  }

  /** Get point at a normalized parameter t (0..1 along entire path) */
  getPointAtT(t: number): PathPoint {
    if (!this._built || this._points.length === 0) {
      return { x: 0, y: 0, angle: 0, distance: 0 };
    }
    t = Math.max(0, Math.min(1, t));
    return this.getPointAtDistance(t * this._length);
  }

  /** Get point at a specific distance along the path */
  getPointAtDistance(dist: number): PathPoint {
    if (!this._built || this._points.length === 0) {
      return { x: 0, y: 0, angle: 0, distance: 0 };
    }

    dist = Math.max(0, Math.min(this._length, dist));

    // Binary search for the segment containing dist
    let lo = 0, hi = this._points.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this._points[mid].distance <= dist) lo = mid;
      else hi = mid;
    }

    const a = this._points[lo];
    const b = this._points[hi];

    if (a.distance === b.distance) return a;

    // Lerp between the two points
    const f = (dist - a.distance) / (b.distance - a.distance);
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      angle: a.angle + _shortAngleDist(a.angle, b.angle) * f,
      distance: dist,
    };
  }

  /** Get all sampled points (for debug rendering) */
  get points(): readonly PathPoint[] {
    return this._points;
  }

  /** Draw the path for debugging */
  drawDebug(ctx: CanvasRenderingContext2D, color = '#888', lineWidth = 1): void {
    if (this._points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(this._points[0].x, this._points[0].y);
    for (let i = 1; i < this._points.length; i++) {
      ctx.lineTo(this._points[i].x, this._points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Bezier math ──

  private _evalSegment(seg: Segment, t: number): Vec2 {
    if (seg.type === 'cubic') {
      const u = 1 - t;
      return {
        x: u * u * u * seg.p0.x + 3 * u * u * t * seg.p1.x + 3 * u * t * t * seg.p2.x + t * t * t * seg.p3.x,
        y: u * u * u * seg.p0.y + 3 * u * u * t * seg.p1.y + 3 * u * t * t * seg.p2.y + t * t * t * seg.p3.y,
      };
    } else {
      const u = 1 - t;
      return {
        x: u * u * seg.p0.x + 2 * u * t * seg.p1.x + t * t * seg.p2.x,
        y: u * u * seg.p0.y + 2 * u * t * seg.p1.y + t * t * seg.p2.y,
      };
    }
  }

  private _evalTangent(seg: Segment, t: number): Vec2 {
    if (seg.type === 'cubic') {
      const u = 1 - t;
      return {
        x: 3 * u * u * (seg.p1.x - seg.p0.x) + 6 * u * t * (seg.p2.x - seg.p1.x) + 3 * t * t * (seg.p3.x - seg.p2.x),
        y: 3 * u * u * (seg.p1.y - seg.p0.y) + 6 * u * t * (seg.p2.y - seg.p1.y) + 3 * t * t * (seg.p3.y - seg.p2.y),
      };
    } else {
      const u = 1 - t;
      return {
        x: 2 * u * (seg.p1.x - seg.p0.x) + 2 * t * (seg.p2.x - seg.p1.x),
        y: 2 * u * (seg.p1.y - seg.p0.y) + 2 * t * (seg.p2.y - seg.p1.y),
      };
    }
  }
}

/** Shortest angle difference (handles wrapping) */
function _shortAngleDist(from: number, to: number): number {
  const diff = ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return diff;
}
