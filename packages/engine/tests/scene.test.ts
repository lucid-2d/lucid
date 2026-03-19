/**
 * SceneNode 测试 — 场景 = 路由 = UINode
 */
import { describe, it, expect, vi } from 'vitest';
import { SceneNode, SceneRouter } from '../src/scene';
import { UINode } from '@lucid/core';

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
