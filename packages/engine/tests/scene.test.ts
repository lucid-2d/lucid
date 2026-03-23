/**
 * SceneNode 测试 — 场景 = 路由 = UINode
 */
import { describe, it, expect, vi } from 'vitest';
import { SceneNode, SceneRouter } from '../src/scene';
import { UINode } from '@lucid-2d/core';

describe('SceneNode', () => {
  it('is a UINode', () => {
    const scene = new SceneNode({ id: 'menu' });
    expect(scene).toBeInstanceOf(UINode);
  });

  it('has onEnter/onExit lifecycle', () => {
    const scene = new SceneNode({ id: 'menu' });
    scene.onEnter = vi.fn();
    scene.onExit = vi.fn();

    scene.onEnter();
    expect(scene.onEnter).toHaveBeenCalledOnce();
  });
});

describe('SceneRouter', () => {
  it('push adds scene and calls onEnter', () => {
    const router = new SceneRouter();
    const scene = new SceneNode({ id: 'menu' });
    scene.onEnter = vi.fn();

    router.push(scene);
    expect(router.current).toBe(scene);
    expect(scene.onEnter).toHaveBeenCalledOnce();
  });

  it('push pauses previous scene', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu' });
    const b = new SceneNode({ id: 'play' });
    a.onPause = vi.fn();

    router.push(a);
    router.push(b);
    expect(a.onPause).toHaveBeenCalledOnce();
    expect(router.current).toBe(b);
  });

  it('pop removes scene and calls onExit', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu' });
    const b = new SceneNode({ id: 'play' });
    b.onExit = vi.fn();
    a.onResume = vi.fn();

    router.push(a);
    router.push(b);
    router.pop();

    expect(b.onExit).toHaveBeenCalledOnce();
    expect(a.onResume).toHaveBeenCalledOnce();
    expect(router.current).toBe(a);
  });

  it('pop on empty stack does nothing', () => {
    const router = new SceneRouter();
    expect(() => router.pop()).not.toThrow();
    expect(router.current).toBeUndefined();
  });

  it('replace swaps top scene', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu' });
    const b = new SceneNode({ id: 'play' });
    a.onExit = vi.fn();
    b.onEnter = vi.fn();

    router.push(a);
    router.replace(b);

    expect(a.onExit).toHaveBeenCalledOnce();
    expect(b.onEnter).toHaveBeenCalledOnce();
    expect(router.current).toBe(b);
    expect(router.depth).toBe(1);
  });

  it('scenes are added as children of router node', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu' });
    const b = new SceneNode({ id: 'shop' });

    router.push(a);
    router.push(b);

    // router itself is a UINode, scenes are its children
    expect(router.$children).toContain(a);
    expect(router.$children).toContain(b);
  });

  it('pop removes scene from children', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu' });
    const b = new SceneNode({ id: 'shop' });

    router.push(a);
    router.push(b);
    router.pop();

    expect(router.$children).not.toContain(b);
    expect(router.$children).toContain(a);
  });

  it('$inspect shows scene stack', () => {
    const router = new SceneRouter();
    router.push(new SceneNode({ id: 'menu' }));
    router.push(new SceneNode({ id: 'shop' }));

    const out = router.$inspect();
    expect(out).toContain('menu');
    expect(out).toContain('shop');
  });

  it('depth returns stack size', () => {
    const router = new SceneRouter();
    expect(router.depth).toBe(0);
    router.push(new SceneNode({ id: 'a' }));
    expect(router.depth).toBe(1);
    router.push(new SceneNode({ id: 'b' }));
    expect(router.depth).toBe(2);
    router.pop();
    expect(router.depth).toBe(1);
  });
});

// ── hitTest isolation ──

describe('SceneRouter hitTest isolation', () => {
  it('hitTest only targets top scene', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu', width: 390, height: 844 });
    const b = new SceneNode({ id: 'map', width: 390, height: 844 });

    const btn = new UINode({ id: 'start', x: 100, y: 100, width: 100, height: 50, interactive: true });
    a.addChild(btn);

    router.push(a);
    // btn is hittable in scene A
    expect(router.hitTest(150, 125)?.id).toBe('start');

    // Push scene B on top — scene A is paused
    router.push(b);
    // btn should NOT be hittable through scene B
    expect(router.hitTest(150, 125)).toBeNull();
  });

  it('hitTest finds nodes in top scene', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu', width: 390, height: 844 });
    const b = new SceneNode({ id: 'map', width: 390, height: 844 });

    const mapBtn = new UINode({ id: 'node-1', x: 50, y: 50, width: 80, height: 80, interactive: true });
    b.addChild(mapBtn);

    router.push(a);
    router.push(b);

    expect(router.hitTest(70, 70)?.id).toBe('node-1');
  });

  it('pop restores hitTest to previous scene', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'menu', width: 390, height: 844 });
    const b = new SceneNode({ id: 'map', width: 390, height: 844 });

    const btn = new UINode({ id: 'start', x: 100, y: 100, width: 100, height: 50, interactive: true });
    a.addChild(btn);

    router.push(a);
    router.push(b);
    expect(router.hitTest(150, 125)).toBeNull(); // blocked

    router.pop();
    expect(router.hitTest(150, 125)?.id).toBe('start'); // restored
  });
});

// ── Transitions ──

describe('SceneRouter transitions', () => {
  it('push with fade transition', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b, { type: 'fade', duration: 1000 });

    expect(router.transitioning).toBe(true);
    // New scene starts transparent
    expect(b.alpha).toBe(0);
  });

  it('fade transition progresses over time', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b, { type: 'fade', duration: 1000 });

    // Halfway
    router.$update(0.5);
    expect(b.alpha).toBeCloseTo(0.5);
    expect(a.alpha).toBeCloseTo(0.5);
  });

  it('fade transition completes and restores alpha', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b, { type: 'fade', duration: 500 });

    router.$update(0.6); // past duration
    expect(router.transitioning).toBe(false);
    expect(b.alpha).toBe(1);
    expect(a.alpha).toBe(1); // restored
  });

  it('replace with slideLeft transition', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.replace(b, { type: 'slideLeft', duration: 1000 });

    expect(router.transitioning).toBe(true);
    // New scene starts off-screen right
    expect(b.x).toBe(390);
    // Old scene is still in children during transition
    expect(router.$children).toContain(a);
  });

  it('slideLeft transition removes old scene when complete', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.replace(b, { type: 'slideLeft', duration: 500 });

    router.$update(0.6);
    expect(router.transitioning).toBe(false);
    expect(router.$children).not.toContain(a);
    expect(b.x).toBe(0); // restored
  });

  it('no transition (type=none) is instant', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a' });
    const b = new SceneNode({ id: 'b' });

    router.push(a);
    router.push(b, { type: 'none' });

    expect(router.transitioning).toBe(false);
  });

  it('default transition applies to all operations', () => {
    const router = new SceneRouter();
    router.defaultTransition = { type: 'fade', duration: 200 };

    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b); // uses default
    expect(router.transitioning).toBe(true);
  });

  it('per-call transition overrides default', () => {
    const router = new SceneRouter();
    router.defaultTransition = { type: 'fade', duration: 200 };

    const a = new SceneNode({ id: 'a' });
    const b = new SceneNode({ id: 'b' });

    router.push(a);
    router.push(b, { type: 'none' }); // override
    expect(router.transitioning).toBe(false);
  });

  it('pop with slideRight transition', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b);
    router.pop({ type: 'slideRight', duration: 500 });

    expect(router.transitioning).toBe(true);
    router.$update(0.6);
    expect(router.transitioning).toBe(false);
    expect(router.$children).not.toContain(b);
  });

  it('custom transition calls render function', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });
    const renderFn = vi.fn();

    router.push(a);
    router.push(b, { type: 'custom', duration: 1000, render: renderFn });

    expect(router.transitioning).toBe(true);

    // Simulate render by calling $render
    const ctx = {
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      globalAlpha: 1,
    } as any;
    router.$update(0.5);
    router.$render(ctx);

    expect(renderFn).toHaveBeenCalled();
    const [rCtx, progress, oldScene, newScene] = renderFn.mock.calls[0];
    expect(rCtx).toBe(ctx);
    expect(progress).toBeCloseTo(0.5);
    expect(oldScene).toBe(a);
    expect(newScene).toBe(b);
  });

  it('custom transition completes and restores state', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b, { type: 'custom', duration: 500, render: () => {} });

    router.$update(0.6);
    expect(router.transitioning).toBe(false);
    expect(b.alpha).toBe(1); // restored
    expect(a.alpha).toBe(1); // restored
  });

  it('slideUp and slideDown work', () => {
    const router = new SceneRouter();
    const a = new SceneNode({ id: 'a', width: 390, height: 844 });
    const b = new SceneNode({ id: 'b', width: 390, height: 844 });

    router.push(a);
    router.push(b, { type: 'slideUp', duration: 400 });
    expect(b.y).toBe(844); // starts from bottom

    router.$update(0.5); // complete
    expect(router.transitioning).toBe(false);
    expect(b.y).toBe(0);
  });
});
