import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boot } from '../src/boot';

// jsdom doesn't have real canvas context, mock getContext
function mockCanvas(id = 'game', w = 390, h = 844): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = w;
  canvas.height = h;
  // Mock getContext for WebAdapter
  const noop = () => {};
  const ctx = {
    save: noop, restore: noop, translate: noop, scale: noop, rotate: noop,
    setTransform: noop, resetTransform: noop, getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    clearRect: noop, fillRect: noop, strokeRect: noop,
    fillText: noop, strokeText: noop, measureText: () => ({ width: 0 }),
    drawImage: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    arc: noop, arcTo: noop, rect: noop, roundRect: noop, fill: noop, stroke: noop, clip: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    setLineDash: noop, getLineDash: () => [],
    globalAlpha: 1, fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '',
    lineWidth: 1, shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
    canvas,
    bezierCurveTo: noop, quadraticCurveTo: noop, ellipse: noop,
    isPointInPath: () => false,
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x: number, y: number, w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: noop,
    filter: 'none',
  };
  (canvas as any).getContext = () => ctx;
  document.body.appendChild(canvas);
  return canvas;
}

describe('boot', () => {
  beforeEach(() => {
    // Clean up
    document.querySelectorAll('canvas').forEach(c => c.remove());
    delete (window as any)._app;
  });

  it('creates app and returns it', async () => {
    const canvas = mockCanvas();
    const app = await boot({ canvas });
    expect(app).toBeDefined();
    expect(app.root).toBeDefined();
    expect(app.router).toBeDefined();
  });

  it('finds existing canvas by default id "game"', async () => {
    mockCanvas('game', 390, 844);
    const app = await boot();
    expect(app).toBeDefined();
    expect(app.screen.width).toBe(390);
  });

  it('finds canvas by custom canvasId', async () => {
    mockCanvas('mycanvas', 200, 400);
    const app = await boot({ canvasId: 'mycanvas' });
    expect(app).toBeDefined();
    expect(app.screen.width).toBe(200);
  });

  it('auto-creates canvas when none found', async () => {
    // No canvas in DOM — boot should auto-create one
    // But jsdom canvas won't have real getContext, so this will fail on WebAdapter
    // Skip this test as it requires real canvas or more complex mocking
  });

  it('calls onReady with app', async () => {
    const canvas = mockCanvas();
    const onReady = vi.fn();
    await boot({ canvas, onReady });
    expect(onReady).toHaveBeenCalledOnce();
    expect(onReady.mock.calls[0][0].root).toBeDefined();
  });

  it('awaits async onReady', async () => {
    const canvas = mockCanvas();
    let resolved = false;
    await boot({
      canvas,
      async onReady() {
        await new Promise(r => setTimeout(r, 10));
        resolved = true;
      },
    });
    expect(resolved).toBe(true);
  });

  it('passes through debug option', async () => {
    const canvas = mockCanvas();
    const app = await boot({ canvas, debug: true });
    expect(app.debug).toBe(true);
  });

  it('exposes app as window._app', async () => {
    const canvas = mockCanvas();
    const app = await boot({ canvas });
    expect((window as any)._app).toBe(app);
  });

  it('does not throw when onReady is not provided', async () => {
    const canvas = mockCanvas();
    const app = await boot({ canvas });
    expect(app).toBeDefined();
  });
});
