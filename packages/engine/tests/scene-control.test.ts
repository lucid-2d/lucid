/**
 * Scene control tests — renderOneFrame, simulateTouch, $presets
 */
import { describe, it, expect, vi } from 'vitest';
import { createTestApp, tap } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { createOffscreenCanvas } from '../src/canvas-utils';
import { UINode } from '@lucid-2d/core';

// ── Test scene with presets ──

class TestScene extends SceneNode {
  paused = false;
  dead = false;
  transitionText = '';

  constructor() {
    super({ id: 'game', width: 390, height: 844 });
  }

  $presets() {
    return {
      gameplay: { label: 'Normal gameplay', setup: () => {} },
      paused: { label: '暂停', setup: (s: SceneNode) => { (s as TestScene).paused = true; } },
      death: { label: '死亡', setup: (s: SceneNode) => { (s as TestScene).dead = true; } },
      transition: {
        label: '转场',
        setup: (s: SceneNode) => { (s as TestScene).transitionText = '叙事文案...'; },
      },
    };
  }

  onEnter() {
    const btn = new UINode({ id: 'play-btn', x: 100, y: 400, width: 200, height: 50, interactive: true });
    this.addChild(btn);
  }
}

// ── $presets ──

describe('SceneNode.$presets', () => {
  it('default returns null', () => {
    const scene = new SceneNode({ id: 'test' });
    expect(scene.$presets()).toBeNull();
  });

  it('subclass can declare presets', () => {
    const scene = new TestScene();
    const presets = scene.$presets()!;
    expect(Object.keys(presets)).toEqual(['gameplay', 'paused', 'death', 'transition']);
    expect(presets.paused.label).toBe('暂停');
  });

  it('preset setup mutates scene state', () => {
    const scene = new TestScene();
    const presets = scene.$presets()!;

    presets.death.setup(scene);
    expect(scene.dead).toBe(true);

    presets.paused.setup(scene);
    expect(scene.paused).toBe(true);

    presets.transition.setup(scene);
    expect(scene.transitionText).toBe('叙事文案...');
  });
});

// ── app.listPresets / app.applyPreset ──

describe('App.applyPreset', () => {
  it('listPresets returns preset names', () => {
    const app = createTestApp();
    app.router.push(new TestScene());
    app.tick(16);

    expect(app.listPresets()).toEqual(['gameplay', 'paused', 'death', 'transition']);
  });

  it('listPresets returns [] when scene has no presets', () => {
    const app = createTestApp();
    app.router.push(new SceneNode({ id: 'plain' }));
    expect(app.listPresets()).toEqual([]);
  });

  it('listPresets returns [] when no scene', () => {
    const app = createTestApp();
    expect(app.listPresets()).toEqual([]);
  });

  it('applyPreset applies the preset', () => {
    const app = createTestApp();
    const scene = new TestScene();
    app.router.push(scene);
    app.tick(16);

    expect(app.applyPreset('death')).toBe(true);
    expect(scene.dead).toBe(true);
  });

  it('applyPreset returns false for unknown preset', () => {
    const app = createTestApp();
    app.router.push(new TestScene());
    app.tick(16);

    expect(app.applyPreset('nonexistent')).toBe(false);
  });

  it('applyPreset returns false when no scene', () => {
    const app = createTestApp();
    expect(app.applyPreset('death')).toBe(false);
  });
});

// ── app.renderOneFrame ──

describe('App.renderOneFrame', () => {
  it('renders without advancing game logic', () => {
    const app = createTestApp();
    let updateCount = 0;

    class CountScene extends SceneNode {
      constructor() { super({ id: 'count', width: 390, height: 844 }); }
      $update(dt: number) {
        super.$update(dt);
        if (dt > 0) updateCount++;
      }
    }

    app.router.push(new CountScene());
    app.tick(16); // first tick, triggers $update
    const countAfterTick = updateCount;

    app.renderOneFrame(); // should NOT trigger $update
    expect(updateCount).toBe(countAfterTick);
  });

  it('can be called after setting timeScale=0', () => {
    const app = createTestApp();
    app.router.push(new TestScene());
    app.tick(16);

    app.timeScale = 0;
    // Should not throw — this was the original bug
    expect(() => app.renderOneFrame()).not.toThrow();
  });
});

// ── app.simulateTouch ──

describe('App.simulateTouch', () => {
  it('triggers tap on the hit node', () => {
    const app = createTestApp();
    const scene = new TestScene();
    app.router.push(scene);
    app.tick(16);

    const handler = vi.fn();
    const btn = app.root.findById('play-btn')!;
    btn.$on('touchstart', handler);

    const hit = app.simulateTouch(200, 425);
    expect(hit).toBe(btn);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns null on miss', () => {
    const app = createTestApp();
    app.router.push(new TestScene());
    app.tick(16);

    // Touch far away from the button
    const hit = app.simulateTouch(0, 0);
    expect(hit).toBeNull();
  });

  it('emits both touchstart and touchend', () => {
    const app = createTestApp();
    const scene = new TestScene();
    app.router.push(scene);
    app.tick(16);

    const startHandler = vi.fn();
    const endHandler = vi.fn();
    const btn = app.root.findById('play-btn')!;
    btn.$on('touchstart', startHandler);
    btn.$on('touchend', endHandler);

    app.simulateTouch(200, 425);
    expect(startHandler).toHaveBeenCalledOnce();
    expect(endHandler).toHaveBeenCalledOnce();
  });
});

// ── Full screenshot workflow ──

describe('Screenshot workflow (integration)', () => {
  it('preset → renderOneFrame → capture works end-to-end', () => {
    const app = createTestApp();
    const scene = new TestScene();
    app.router.push(scene);
    app.tick(16);

    // Apply preset
    expect(app.applyPreset('death')).toBe(true);
    expect(scene.dead).toBe(true);

    // Render one frame (no logic advance)
    app.renderOneFrame();

    // In real usage with render:true, would call app.saveImage() here
    // With mock canvas, just verify no throw
  });

  it('simulateTouch → renderOneFrame workflow', () => {
    const app = createTestApp();
    const scene = new TestScene();
    app.router.push(scene);
    app.tick(16);

    // Simulate interaction
    const tapHandler = vi.fn();
    app.root.findById('play-btn')!.$on('touchend', tapHandler);

    app.simulateTouch(200, 425);
    expect(tapHandler).toHaveBeenCalledOnce();

    // Render result
    app.renderOneFrame();
  });
});

// ── app.settle ──

describe('App.settle', () => {
  it('runs multiple frames yielding to event loop', async () => {
    const app = createTestApp();
    let updateCount = 0;

    class CountScene extends SceneNode {
      constructor() { super({ id: 'count', width: 390, height: 844 }); }
      $update(dt: number) {
        super.$update(dt);
        if (dt > 0) updateCount++;
      }
    }

    app.router.push(new CountScene());
    await app.settle(10);
    expect(updateCount).toBe(10);
  });

  it('allows async callbacks to complete between frames', async () => {
    const app = createTestApp();
    let asyncDone = false;

    class AsyncScene extends SceneNode {
      constructor() { super({ id: 'async', width: 390, height: 844 }); }
      onEnter() {
        // Simulate async work (image loading, fetch, etc.)
        setTimeout(() => { asyncDone = true; }, 10);
      }
    }

    app.router.push(new AsyncScene());
    expect(asyncDone).toBe(false);

    await app.settle(10);
    expect(asyncDone).toBe(true);
  });
});

// ── createOffscreenCanvas headless ──

describe('createOffscreenCanvas headless', () => {
  it('works in Node.js with @napi-rs/canvas', () => {
    const canvas = createOffscreenCanvas(200, 100);
    expect(canvas).toBeDefined();
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    // Should be able to draw
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 200, 100);
  });
});
