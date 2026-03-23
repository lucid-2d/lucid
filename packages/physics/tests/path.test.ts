import { describe, it, expect, vi } from 'vitest';
import { BezierPath } from '../src/path';

describe('BezierPath', () => {
  it('creates empty path', () => {
    const path = new BezierPath();
    expect(path.length).toBe(0);
    expect(path.pointCount).toBe(0);
    expect(path.built).toBe(false);
  });

  it('builds a straight line', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    expect(path.built).toBe(true);
    expect(path.length).toBeCloseTo(100, 0);
  });

  it('getPointAtT returns endpoints', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 200, y: 0 });
    path.build();

    const start = path.getPointAtT(0);
    expect(start.x).toBeCloseTo(0, 0);
    expect(start.y).toBeCloseTo(0, 0);

    const end = path.getPointAtT(1);
    expect(end.x).toBeCloseTo(200, 0);
    expect(end.y).toBeCloseTo(0, 0);
  });

  it('getPointAtT returns midpoint', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    const mid = path.getPointAtT(0.5);
    expect(mid.x).toBeCloseTo(50, 0);
  });

  it('getPointAtDistance interpolates correctly', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    const p = path.getPointAtDistance(25);
    expect(p.x).toBeCloseTo(25, 0);
    expect(p.y).toBeCloseTo(0, 0);
  });

  it('angle is correct for horizontal line', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    const p = path.getPointAtT(0.5);
    expect(p.angle).toBeCloseTo(0, 1); // pointing right
  });

  it('angle is correct for vertical line', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 0, y: 100 });
    path.build();

    const p = path.getPointAtT(0.5);
    expect(p.angle).toBeCloseTo(Math.PI / 2, 1); // pointing down
  });

  it('cubic bezier has curved path', () => {
    const path = new BezierPath();
    path.addCubic(
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
    );
    path.build();

    // Path should be longer than straight-line distance (100)
    expect(path.length).toBeGreaterThan(100);

    // Midpoint should be offset from the straight line
    const mid = path.getPointAtT(0.5);
    expect(mid.y).toBeGreaterThan(30); // curved away from straight line
  });

  it('quadratic bezier works', () => {
    const path = new BezierPath();
    path.addQuadratic(
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    );
    path.build();

    expect(path.length).toBeGreaterThan(100);
    const mid = path.getPointAtT(0.5);
    expect(mid.x).toBeCloseTo(50, 0);
    expect(mid.y).toBeGreaterThan(30);
  });

  it('multiple segments chain together', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.addLine({ x: 100, y: 0 }, { x: 100, y: 100 });
    path.build();

    expect(path.length).toBeCloseTo(200, 0);

    const corner = path.getPointAtDistance(100);
    expect(corner.x).toBeCloseTo(100, 0);
    expect(corner.y).toBeCloseTo(0, 0);

    const end = path.getPointAtDistance(200);
    expect(end.x).toBeCloseTo(100, 0);
    expect(end.y).toBeCloseTo(100, 0);
  });

  it('clamps out-of-range values', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    const before = path.getPointAtDistance(-50);
    expect(before.x).toBeCloseTo(0, 0);

    const after = path.getPointAtDistance(999);
    expect(after.x).toBeCloseTo(100, 0);

    expect(path.getPointAtT(-1).x).toBeCloseTo(0, 0);
    expect(path.getPointAtT(2).x).toBeCloseTo(100, 0);
  });

  it('returns default point for unbuilt path', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    // not built

    const p = path.getPointAtT(0.5);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  it('fluent API chains', () => {
    const path = new BezierPath()
      .addLine({ x: 0, y: 0 }, { x: 50, y: 0 })
      .addCubic({ x: 50, y: 0 }, { x: 75, y: 50 }, { x: 75, y: 50 }, { x: 100, y: 0 })
      .build();

    expect(path.length).toBeGreaterThan(50);
    expect(path.built).toBe(true);
  });

  it('drawDebug calls ctx methods', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build();

    const ctx = {
      save: vi.fn(), restore: vi.fn(),
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
      strokeStyle: '', lineWidth: 1,
    } as any;

    path.drawDebug(ctx);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('custom samples per segment', () => {
    const path = new BezierPath();
    path.addLine({ x: 0, y: 0 }, { x: 100, y: 0 });
    path.build(10); // only 10 samples

    expect(path.pointCount).toBe(11); // 0..10 inclusive
  });
});
