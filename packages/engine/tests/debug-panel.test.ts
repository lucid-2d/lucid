import { describe, it, expect, vi } from 'vitest';
import { createApp } from '../src/app';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';
import { tap, touch } from '../src/test-utils';

/** Simple interactive button for tests (no @lucid-2d/ui dependency) */
function createButton(id: string, x: number, y: number, w: number, h: number) {
  const btn = new UINode({ id, x, y, width: w, height: h, interactive: true });
  btn.$on('touchstart', () => { (btn as any)._pressed = true; });
  btn.$on('touchend', () => {
    if ((btn as any)._pressed) btn.$emit('tap');
    (btn as any)._pressed = false;
  });
  return btn;
}

function createMockCanvas(w = 390, h = 844): HTMLCanvasElement {
  const noop = () => {};
  const gradient = { addColorStop: noop };
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
    arc: noop, moveTo: noop, lineTo: noop, closePath: noop,
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    measureText: () => ({ width: 0 }),
    globalAlpha: 1, fillStyle: '', strokeStyle: '',
    font: '', textAlign: '', textBaseline: '',
    lineWidth: 1, setLineDash: noop, getLineDash: () => [],
    shadowBlur: 0, shadowColor: '',
  };
  (canvas as any).getContext = () => mockCtx;
  return canvas;
}

// ── 基础功能 ──

describe('DebugPanel basics', () => {
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
  });

  it('dump() returns full state', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    app.router.push(new SceneNode({ id: 'menu', width: 390, height: 844 }));
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

  it('register() adds custom fields to dump', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });

    app.debugPanel!.register('game', () => ({ hp: 3, gold: 100 }));

    const dump = app.debugPanel!.dump();
    expect(dump.custom.game).toEqual({ hp: 3, gold: 100 });

    const text = app.debugPanel!.dumpText();
    expect(text).toContain('--- Custom ---');
    expect(text).toContain('game:');
  });

  it('renders without errors', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    app.router.push(new SceneNode({ id: 'test' }));
    app.tick(16);
    app.tick(16);
  });
});

// ── 交互测试（防止历史 bug 回归） ──

describe('DebugPanel interaction', () => {
  function createTestSetup() {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    const scene = new SceneNode({ id: 'menu', width: 390, height: 844 });
    app.router.push(scene);
    app.tick(16);
    return { app, scene };
  }

  // Debug button position: bottom-right (sw-44, sh-44) to (sw-8, sh-8) = (346, 800) to (382, 836)
  const btnX = 364; // center of debug button
  const btnY = 818;

  it('tap on debug button opens panel', () => {
    const { app } = createTestSetup();
    const panel = app.debugPanel!;

    expect(panel['_open']).toBe(false);

    // hitTest should find debug panel at button position
    const hit = app.root.hitTest(btnX, btnY);
    expect(hit?.id).toBe('__debug-panel');

    // Tap opens panel
    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);
  });

  it('tap on debug button via touch() with coordinates', () => {
    const { app } = createTestSetup();
    const panel = app.debugPanel!;

    // Use touch() which goes through hitTest
    const hitPath = touch(app, btnX, btnY);
    expect(hitPath).toContain('__debug-panel');
    expect(panel['_open']).toBe(true);
  });

  it('panel is modal: hitTest captures all touches when open', () => {
    const { app, scene } = createTestSetup();
    const panel = app.debugPanel!;

    // Add a button to the scene
    const btn = createButton('game-btn', 100, 400, 200, 50);
    scene.addChild(btn);

    // Open panel
    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);

    // Any touch should be captured by panel (modal), NOT by game-btn
    const hit = app.root.hitTest(200, 425); // game-btn position
    expect(hit?.id).toBe('__debug-panel'); // panel captures, not game-btn
  });

  it('game button NOT triggered when panel is open (no penetration)', () => {
    const { app, scene } = createTestSetup();
    const panel = app.debugPanel!;

    const btn = createButton('game-btn', 100, 400, 200, 50);
    let tapped = false;
    btn.$on('tap', () => { tapped = true; });
    scene.addChild(btn);

    // Verify button works when panel is closed
    touch(app, 200, 425);
    expect(tapped).toBe(true);

    // Reset
    tapped = false;

    // Open panel
    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);

    // Touch at button position — should NOT trigger game button
    touch(app, 200, 425);
    expect(tapped).toBe(false); // NO penetration
  });

  it('close button closes panel', () => {
    const { app } = createTestSetup();
    const panel = app.debugPanel!;

    // Open
    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);

    // [X] button is at top-right of panel: (pw-40 to pw, py to py+30)
    // panel: pad=12, pw=366, py=844-506.4-12=325.6, so [X] ~ (338, 326)
    const closeX = 390 - 12 - 20; // ~358
    const closeY = 844 - 844 * 0.6 - 12 + 15; // ~340
    panel['_handleTap'](closeX, closeY);
    expect(panel['_open']).toBe(false);
  });

  it('tap outside panel closes it', () => {
    const { app } = createTestSetup();
    const panel = app.debugPanel!;

    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);

    // Tap at top of screen (outside panel area)
    panel['_handleTap'](195, 50);
    expect(panel['_open']).toBe(false);
  });

  it('copy button sets copied flag', () => {
    const { app } = createTestSetup();
    const panel = app.debugPanel!;

    tap(app, '__debug-panel');

    // [Copy] button area: (pw-100 to pw-40, py to py+30)
    const copyX = 390 - 12 - 70; // ~308
    const copyY = 844 - 844 * 0.6 - 12 + 15; // ~340
    panel['_handleTap'](copyX, copyY);
    expect(panel['_copied']).toBe(true);
    expect((app as any).__lastDump).toContain('Lucid Debug Dump');
  });

  it('game interaction restores after panel closes', () => {
    const { app, scene } = createTestSetup();
    const panel = app.debugPanel!;

    const btn = createButton('game-btn', 100, 400, 200, 50);
    let tapCount = 0;
    btn.$on('tap', () => { tapCount++; });
    scene.addChild(btn);

    // Open panel
    tap(app, '__debug-panel');
    expect(panel['_open']).toBe(true);

    // Touch game button — blocked
    touch(app, 200, 425);
    expect(tapCount).toBe(0);

    // Close panel
    panel['_handleTap'](195, 50); // tap outside
    expect(panel['_open']).toBe(false);

    // Touch game button — works again
    touch(app, 200, 425);
    expect(tapCount).toBe(1);
  });
});

// ── 场景日志 + 触摸日志 ──

describe('DebugPanel logs', () => {
  it('scene log records push/pop', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });

    app.router.push(new SceneNode({ id: 'menu' }));
    app.router.push(new SceneNode({ id: 'game' }));
    app.router.pop();

    const dump = app.debugPanel!.dump();
    expect(dump.sceneLog).toHaveLength(3);
    expect(dump.sceneLog[0].action).toBe('push');
    expect(dump.sceneLog[0].scene).toBe('menu');
    expect(dump.sceneLog[1].action).toBe('push');
    expect(dump.sceneLog[1].scene).toBe('game');
    expect(dump.sceneLog[2].action).toBe('pop');

    const text = app.debugPanel!.dumpText();
    expect(text).toContain('--- Scene Log ---');
    expect(text).toContain('PUSH menu');
    expect(text).toContain('POP game');
  });

  it('touch log records recent touches', () => {
    const canvas = createMockCanvas();
    const app = createApp({ platform: 'web', canvas, debug: true, debugPanel: true });
    const scene = new SceneNode({ id: 'menu', width: 390, height: 844 });
    const btn = createButton('btn', 100, 100, 80, 40);
    scene.addChild(btn);
    app.router.push(scene);
    app.tick(16);

    // Simulate touches via the framework's touch bridge
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 140, clientY: 120 }));
    canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: 140, clientY: 120 }));

    const dump = app.debugPanel!.dump();
    expect(dump.recentTouches.length).toBeGreaterThan(0);
    expect(dump.recentTouches[0].hit).toBe('btn');

    const text = app.debugPanel!.dumpText();
    expect(text).toContain('--- Recent Touches ---');
    expect(text).toContain('hit: btn');
  });
});
