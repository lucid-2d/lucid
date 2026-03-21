import { describe, it, expect, vi } from 'vitest';
import { Camera } from '../src/camera';

describe('Camera', () => {
  it('initializes at center of viewport', () => {
    const cam = new Camera({ viewWidth: 390, viewHeight: 844 });
    expect(cam.x).toBe(195);
    expect(cam.y).toBe(422);
  });

  it('moveTo sets position', () => {
    const cam = new Camera({ viewWidth: 390, viewHeight: 844 });
    cam.moveTo(500, 300);
    expect(cam.x).toBe(500);
    expect(cam.y).toBe(300);
  });

  it('moveBy adds delta', () => {
    const cam = new Camera({ viewWidth: 390, viewHeight: 844 });
    cam.moveTo(100, 100);
    cam.moveBy(50, -20);
    expect(cam.x).toBe(150);
    expect(cam.y).toBe(80);
  });

  it('zoom defaults to 1', () => {
    const cam = new Camera({ viewWidth: 390, viewHeight: 844 });
    expect(cam.zoom).toBe(1);
  });
});

describe('Camera bounds', () => {
  it('clamps to world bounds', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100, worldWidth: 200, worldHeight: 200 });
    cam.moveTo(0, 0); // would show area outside world
    expect(cam.x).toBe(50); // clamped: viewWidth/2
    expect(cam.y).toBe(50);
  });

  it('clamps at far edge', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100, worldWidth: 200, worldHeight: 200 });
    cam.moveTo(999, 999);
    expect(cam.x).toBe(150); // worldWidth - viewWidth/2
    expect(cam.y).toBe(150);
  });

  it('no clamping without world bounds', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(-500, -500);
    expect(cam.x).toBe(-500);
    expect(cam.y).toBe(-500);
  });
});

describe('Camera follow', () => {
  it('instant follow (smooth=1)', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    const target = { x: 300, y: 400 };
    cam.follow(target, { smooth: 1 });
    cam.update(0.016);
    expect(cam.x).toBe(300);
    expect(cam.y).toBe(400);
  });

  it('smooth follow moves toward target', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(0, 0);
    const target = { x: 100, y: 0 };
    cam.follow(target, { smooth: 0.1 });
    cam.update(0.016);
    expect(cam.x).toBeGreaterThan(0);
    expect(cam.x).toBeLessThan(100);
  });

  it('smooth follow converges over time', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(0, 0);
    const target = { x: 100, y: 0 };
    cam.follow(target, { smooth: 0.1 });

    for (let i = 0; i < 300; i++) cam.update(0.016);
    expect(cam.x).toBeCloseTo(100, 0);
  });

  it('dead zone prevents small movements', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(50, 50);
    const target = { x: 52, y: 50 }; // 2px away
    cam.follow(target, { smooth: 1, deadZone: 10 });
    cam.update(0.016);
    expect(cam.x).toBe(50); // didn't move, within dead zone
  });

  it('follow with offset', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    const target = { x: 200, y: 300 };
    cam.follow(target, { smooth: 1, offsetX: 10, offsetY: -20 });
    cam.update(0.016);
    expect(cam.x).toBe(210);
    expect(cam.y).toBe(280);
  });

  it('follow null stops following', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(50, 50);
    cam.follow({ x: 200, y: 200 }, { smooth: 1 });
    cam.follow(null);
    cam.update(0.016);
    expect(cam.x).toBe(50); // didn't move
  });
});

describe('Camera coordinate conversion', () => {
  it('screenToWorld at zoom=1', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    const w = cam.screenToWorld(50, 50); // screen center
    expect(w.x).toBe(200);
    expect(w.y).toBe(300);
  });

  it('screenToWorld at zoom=2', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    cam.zoom = 2;
    const w = cam.screenToWorld(50, 50);
    expect(w.x).toBe(200);
    expect(w.y).toBe(300);

    // Top-left of screen
    const tl = cam.screenToWorld(0, 0);
    expect(tl.x).toBe(175); // 200 - 50/2
    expect(tl.y).toBe(275);
  });

  it('worldToScreen is inverse of screenToWorld', () => {
    const cam = new Camera({ viewWidth: 390, viewHeight: 844 });
    cam.moveTo(500, 600);
    cam.zoom = 1.5;

    const world = { x: 450, y: 550 };
    const screen = cam.worldToScreen(world.x, world.y);
    const back = cam.screenToWorld(screen.x, screen.y);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});

describe('Camera visibility', () => {
  it('visibleRect matches viewport at zoom=1', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    const r = cam.visibleRect;
    expect(r.x).toBe(150);
    expect(r.y).toBe(250);
    expect(r.width).toBe(100);
    expect(r.height).toBe(100);
  });

  it('visibleRect shrinks with zoom', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    cam.zoom = 2;
    const r = cam.visibleRect;
    expect(r.width).toBe(50);
    expect(r.height).toBe(50);
  });

  it('isVisible checks overlap', () => {
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    // visibleRect: 150-250, 250-350
    expect(cam.isVisible(160, 260, 20, 20)).toBe(true);  // inside
    expect(cam.isVisible(0, 0, 10, 10)).toBe(false);     // outside
    expect(cam.isVisible(245, 345, 20, 20)).toBe(true);   // partial overlap
  });
});

describe('Camera apply/restore', () => {
  it('calls ctx.save and transforms', () => {
    const ctx = {
      save: vi.fn(), restore: vi.fn(),
      translate: vi.fn(), scale: vi.fn(),
    } as any;
    const cam = new Camera({ viewWidth: 100, viewHeight: 100 });
    cam.moveTo(200, 300);
    cam.apply(ctx);
    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.translate).toHaveBeenCalledTimes(2);
    expect(ctx.scale).toHaveBeenCalledOnce();

    cam.restore(ctx);
    expect(ctx.restore).toHaveBeenCalledOnce();
  });
});
