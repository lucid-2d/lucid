import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

function createMockCanvas(w = 390, h = 844): HTMLCanvasElement {
  const noop = () => {};
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getBoundingClientRect = () => ({
    x: 0, y: 0, width: w, height: h,
    top: 0, left: 0, right: w, bottom: h,
    toJSON: () => {},
  });
  const mockCtx = {
    save: noop, restore: noop, translate: noop, scale: noop, rotate: noop,
    clearRect: noop, setTransform: noop, fillRect: noop, fillText: noop,
    strokeRect: noop, beginPath: noop, roundRect: noop, fill: noop, stroke: noop,
    arc: noop, moveTo: noop, lineTo: noop,
    measureText: () => ({ width: 0 }),
    globalAlpha: 1, fillStyle: '', strokeStyle: '',
    font: '', textAlign: '', textBaseline: '',
    lineWidth: 1, setLineDash: noop, getLineDash: () => [],
  };
  (canvas as any).getContext = () => mockCtx;
  return canvas;
}

describe('DebugPanel', () => {
  it('debugPanel: true creates panel on root', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    expect(app.debugPanel).not.toBeNull();
    expect(app.root.findById('__debug-panel')).toBeTruthy();
  });

  it('debugPanel: false (default) does not create panel', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas });
    expect(app.debugPanel).toBeNull();
    expect(app.root.findById('__debug-panel')).toBeNull();
  });

  it('dump() returns full state', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });

    const scene = new SceneNode({ id: 'menu', width: 390, height: 844 });
    app.router.push(scene);
    app.tick(16);

    const dump = app.debugPanel!.dump();
    expect(dump.routerDepth).toBe(1);
    expect(dump.currentScene).toBe('menu');
    expect(dump.tree).toContain('menu');
    expect(dump.timestamp).toBeTruthy();
  });

  it('dumpText() returns AI-friendly text', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });

    app.router.push(new SceneNode({ id: 'game' }));
    app.tick(16);

    const text = app.debugPanel!.dumpText();
    expect(text).toContain('Lucid Debug Dump');
    expect(text).toContain('Router: depth=1 current=game');
    expect(text).toContain('--- Scene Tree ---');
  });

  it('panel renders without errors', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    app.router.push(new SceneNode({ id: 'test' }));

    // Should not throw
    app.tick(16);
    app.tick(16);
  });
});
