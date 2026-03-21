/**
 * imageDiff / assertImageChanged tests
 */
import { describe, it, expect } from 'vitest';
import { createTestApp, tap, imageDiff, assertImageChanged } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid/core';

class ColorScene extends SceneNode {
  color = '#ff0000';
  onEnter() {
    const btn = new UINode({ id: 'btn', width: 100, height: 40 });
    btn.interactive = true;
    btn.x = 50; btn.y = 50;
    btn.$on('touchstart', () => {});
    btn.$on('touchend', () => btn.$emit('tap'));
    btn.$on('tap', () => { this.color = '#0000ff'; });
    this.addChild(btn);
  }
  protected draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, 390, 844);
  }
}

describe('imageDiff', () => {
  it('identical images return 0 diff', async () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'c' }));
    app.tick(16);
    const a = app.toImage();
    const b = app.toImage();
    const result = await imageDiff(a, b);
    expect(result.identical).toBe(true);
    expect(result.diffPercent).toBe(0);
    expect(result.sameDimensions).toBe(true);
  });

  it('different images return positive diff', async () => {
    const app = createTestApp({ render: true });
    const scene = new ColorScene({ id: 'c' });
    app.router.push(scene);
    app.tick(16);
    const before = app.toImage();

    scene.color = '#00ff00';
    app.tick(16);
    const after = app.toImage();

    const result = await imageDiff(before, after);
    expect(result.identical).toBe(false);
    expect(result.diffPercent).toBeGreaterThan(0);
  });

  it('tap causes visual change', async () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'c' }));
    app.tick(16);
    const before = app.toImage();

    tap(app, 'btn');
    app.tick(16);
    const after = app.toImage();

    const result = await imageDiff(before, after);
    expect(result.identical).toBe(false);
    expect(result.diffPercent).toBeGreaterThan(0.5);
  });
});

describe('assertImageChanged', () => {
  it('passes when images differ', async () => {
    const app = createTestApp({ render: true });
    const scene = new ColorScene({ id: 'c' });
    app.router.push(scene);
    app.tick(16);
    const before = app.toImage();
    scene.color = '#00ff00';
    app.tick(16);
    const after = app.toImage();

    await assertImageChanged(before, after);
  });

  it('throws when images are identical', async () => {
    const app = createTestApp({ render: true });
    app.router.push(new ColorScene({ id: 'c' }));
    app.tick(16);
    const a = app.toImage();
    await expect(assertImageChanged(a, a)).rejects.toThrow('too similar');
  });

  it('respects min/max diff range', async () => {
    const app = createTestApp({ render: true });
    const scene = new ColorScene({ id: 'c' });
    app.router.push(scene);
    app.tick(16);
    const before = app.toImage();
    scene.color = '#00ff00';
    app.tick(16);
    const after = app.toImage();

    await expect(assertImageChanged(before, after, 0.001, 0.01)).rejects.toThrow('too much');
  });
});
