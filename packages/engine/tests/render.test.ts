/**
 * Headless rendering tests — verify createTestApp({ render: true })
 * produces real PNG output via @napi-rs/canvas.
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, tap } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';
import fs from 'fs';
import path from 'path';

// Simple scene with colored background and positioned elements
class ColorScene extends SceneNode {
  onEnter() {
    const box = new UINode({ id: 'box', width: 100, height: 100 });
    box.x = 50;
    box.y = 50;
    this.addChild(box);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 390, 844);
  }
}

class ButtonScene extends SceneNode {
  clicked = false;

  onEnter() {
    const btn = new UINode({ id: 'btn', width: 200, height: 50 });
    btn.x = 95;
    btn.y = 400;
    btn.interactive = true;
    btn.$on('touchstart', () => {});
    btn.$on('touchend', () => btn.$emit('tap'));
    btn.$on('tap', () => { this.clicked = true; });
    this.addChild(btn);
  }

  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f1a2e';
    ctx.fillRect(0, 0, 390, 844);

    // Draw button background
    ctx.fillStyle = this.clicked ? '#4caf50' : '#6c5ce7';
    ctx.fillRect(95, 400, 200, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.clicked ? 'Clicked!' : 'Click Me', 195, 425);
  }
}

describe('Headless rendering', () => {
  it('creates app with real canvas in render mode', () => {
    const app = createTestApp({ render: true });
    expect(app).toBeDefined();
    expect(app.root).toBeDefined();
    expect(typeof app.toImage).toBe('function');
    expect(typeof app.saveImage).toBe('function');
  });

  it('polyfills globalThis.Image in render mode', () => {
    createTestApp({ render: true });
    // @napi-rs/canvas Image should be available globally
    expect(typeof (globalThis as any).Image).not.toBe('undefined');
    const img = new (globalThis as any).Image();
    expect(img).toBeDefined();
  });

  it('toImage returns a valid PNG buffer', () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'color' }));
    app.tick(16);

    const buf = app.toImage();
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(100);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // P
    expect(buf[2]).toBe(0x4e); // N
    expect(buf[3]).toBe(0x47); // G
  });

  it('saveImage writes a PNG file', () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'color' }));
    app.tick(16);

    const outPath = path.join(__dirname, '__test-output.png');
    try {
      app.saveImage(outPath);
      expect(fs.existsSync(outPath)).toBe(true);
      const stat = fs.statSync(outPath);
      expect(stat.size).toBeGreaterThan(100);
    } finally {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  });

  it('renders differently after state change', () => {
    const app = createTestApp({ render: true });
    const scene = new ButtonScene({ id: 'btn-scene' });
    app.router.push(scene);
    app.tick(16);

    const before = app.toImage();
    expect(scene.clicked).toBe(false);

    // Tap button
    tap(app, 'btn');
    app.tick(16);

    const after = app.toImage();
    expect(scene.clicked).toBe(true);

    // Images should differ (button color changes)
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  it('toImage throws in non-render mode', () => {
    const app = createTestApp(); // no render
    expect(() => app.toImage()).toThrow('render mode');
  });

  it('supports custom width/height', () => {
    const app = createTestApp({ render: true, width: 200, height: 400 });
    expect(app.screen.width).toBe(200);
    expect(app.screen.height).toBe(400);

    app.tick(16);
    const buf = app.toImage();
    expect(buf.length).toBeGreaterThan(0);
  });

  it('debugOverlay draws extra info on canvas', () => {
    const app = createTestApp({ render: true });
    app.router.push(new ButtonScene({ id: 'btn-scene' }));
    app.tick(16);

    const withoutOverlay = app.toImage();

    app.debugOverlay = true;
    app.tick(16);
    const withOverlay = app.toImage();

    // Overlay should produce different image (node borders + labels)
    expect(Buffer.compare(withoutOverlay, withOverlay)).not.toBe(0);
  });

  it('debugOverlay can be toggled at runtime', () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'color' }));
    app.tick(16);

    expect(app.debugOverlay).toBe(false);
    app.debugOverlay = true;
    expect(app.debugOverlay).toBe(true);
    app.debugOverlay = false;
    expect(app.debugOverlay).toBe(false);
  });

  it('$inspect works the same in render mode', () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'color' }));
    app.tick(16);

    const tree = app.root.$inspect();
    expect(tree).toContain('ColorScene#color');
    expect(tree).toContain('UINode#box');
  });
});
