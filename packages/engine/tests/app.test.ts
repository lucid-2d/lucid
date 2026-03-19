/**
 * createApp 测试 — 应用入口 + 游戏循环 + 调试集成
 */
import { describe, it, expect, vi } from 'vitest';
import { createApp, type App } from '../src/app';
import { UINode } from '@lucid/core';
import { SceneNode } from '../src/scene';

describe('createApp', () => {
  it('creates app with web platform by default in test env', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app).toBeDefined();
    expect(app.root).toBeInstanceOf(UINode);
  });

  it('app.root is the top-level node', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app.root.id).toBe('root');
  });

  it('app.screen returns screen info', () => {
    const canvas = createMockCanvas(390, 844);
    const app = createApp({ platform: 'web', canvas });
    expect(app.screen.width).toBe(390);
    expect(app.screen.height).toBe(844);
  });

  it('app.router is a SceneRouter', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app.router).toBeDefined();

    const scene = new SceneNode({ id: 'test' });
    app.router.push(scene);
    expect(app.router.current).toBe(scene);
  });

  it('router is a child of root', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app.root.$children).toContain(app.router);
  });

  it('tick updates and renders the tree', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });

    const scene = new SceneNode({ id: 'test' });
    scene.onBeforeUpdate = vi.fn();
    app.router.push(scene);

    // simulate one frame
    app.tick(16);

    expect(scene.onBeforeUpdate).toHaveBeenCalled();
  });

  it('debug mode enables interaction recorder', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true });
    expect(app.debug).toBe(true);
    expect(app.dumpInteractions()).toEqual([]);
  });

  it('debug mode off by default', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app.debug).toBe(false);
  });

  it('$inspect shows full game state', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    app.router.push(new SceneNode({ id: 'menu' }));

    const out = app.root.$inspect();
    expect(out).toContain('root');
    expect(out).toContain('menu');
  });
});

// ── helpers ───────────────────────────────────

function createMockCanvas(w = 390, h = 844): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getBoundingClientRect = () => ({
    x: 0, y: 0, width: w, height: h,
    top: 0, left: 0, right: w, bottom: h,
    toJSON: () => {},
  });
  // mock getContext
  (canvas as any).getContext = () => ({
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    globalAlpha: 1,
  });
  return canvas;
}
