/**
 * Test utilities — tests for the test helpers themselves
 */
import { describe, it, expect, vi } from 'vitest';
import { createTestApp, tap, touch, assertTree, generateTestCode } from '../src/test-utils';
import { SceneNode } from '../src/scene';
import { UINode } from '@lucid-2d/core';

// Simple test scene
class TestScene extends SceneNode {
  onEnter() {
    const btn = new UINode({ id: 'btn', width: 100, height: 40 });
    btn.interactive = true;
    btn.$on('touchstart', () => {});
    btn.$on('touchend', () => btn.$emit('tap'));
    btn.x = 50;
    btn.y = 100;
    this.addChild(btn);

    const label = new UINode({ id: 'label', width: 200, height: 24 });
    this.addChild(label);
  }
}

describe('createTestApp', () => {
  it('creates app without DOM', () => {
    const app = createTestApp();
    expect(app).toBeDefined();
    expect(app.root).toBeDefined();
    expect(app.root.id).toBe('root');
  });

  it('has debug mode enabled', () => {
    const app = createTestApp();
    expect(app.debug).toBe(true);
  });

  it('can push scenes and tick', () => {
    const app = createTestApp();
    const scene = new TestScene({ id: 'test' });
    app.router.push(scene);
    app.tick(16);

    expect(app.root.findById('btn')).toBeDefined();
    expect(app.root.findById('label')).toBeDefined();
  });

  it('$inspect works on test app', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    const tree = app.root.$inspect();
    expect(tree).toContain('TestScene#test');
    expect(tree).toContain('UINode#btn');
    expect(tree).toContain('UINode#label');
  });
});

describe('tap', () => {
  it('finds node by id and emits tap', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    const handler = vi.fn();
    app.root.findById('btn')!.$on('tap', handler);

    const result = tap(app, 'btn');
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns false for non-existent node', () => {
    const app = createTestApp();
    expect(tap(app, 'nonexistent')).toBe(false);
  });
});

describe('touch', () => {
  it('dispatches touch at coordinates via hitTest', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    const handler = vi.fn();
    app.root.findById('btn')!.$on('tap', handler);

    // Touch inside button area (btn is at x=50, y=100, w=100, h=40)
    const path = touch(app, 80, 120);
    expect(path).toContain('btn');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns null when no node is hit', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    // Touch outside any interactive node
    const path = touch(app, 0, 0);
    expect(path).toBeNull();
  });

  it('supports start-only touch', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    const startHandler = vi.fn();
    const tapHandler = vi.fn();
    const btn = app.root.findById('btn')!;
    btn.$on('touchstart', startHandler);
    btn.$on('tap', tapHandler);

    touch(app, 80, 120, 'start');
    expect(startHandler).toHaveBeenCalled();
    expect(tapHandler).not.toHaveBeenCalled(); // no touchend = no tap
  });
});

describe('assertTree', () => {
  it('passes when all patterns match', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    expect(() => assertTree(app, `
      TestScene#test
      UINode#btn
      UINode#label
    `)).not.toThrow();
  });

  it('throws with details when pattern is missing', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    expect(() => assertTree(app, `
      TestScene#test
      Button#nonexistent
    `)).toThrow('assertTree failed');
  });

  it('error message includes actual tree', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    try {
      assertTree(app, `Missing#node`);
    } catch (e: any) {
      expect(e.message).toContain('Missing#node');
      expect(e.message).toContain('Actual tree:');
      expect(e.message).toContain('TestScene#test');
    }
  });

  it('ignores empty lines and whitespace', () => {
    const app = createTestApp();
    app.router.push(new TestScene({ id: 'test' }));
    app.tick(16);

    expect(() => assertTree(app, `

      TestScene#test

    `)).not.toThrow();
  });
});

describe('generateTestCode', () => {
  it('generates vitest code from records', () => {
    const records = [
      { t: 0, type: 'touchstart' as const, x: 100, y: 200, path: 'root > test > btn', snapshot: 'UINode#btn (100x40)' },
      { t: 50, type: 'touchend' as const, x: 100, y: 200, path: 'root > test > btn' },
    ];

    const code = generateTestCode(records as any);
    expect(code).toContain("import { createTestApp, tap, touch } from '@lucid-2d/engine'");
    expect(code).toContain("tap(app, 'btn')");
    expect(code).toContain('test(');
  });

  it('uses touch for non-tap interactions', () => {
    const records = [
      { t: 0, type: 'touchstart' as const, x: 150, y: 300, path: 'root > game', snapshot: '' },
      { t: 100, type: 'touchmove' as const, x: 160, y: 310, path: 'root > game' },
      { t: 200, type: 'touchend' as const, x: 170, y: 320, path: 'root > other' },
    ];

    const code = generateTestCode(records as any);
    expect(code).toContain("touch(app, 150, 300, 'start')");
  });

  it('includes timing delays', () => {
    const records = [
      { t: 0, type: 'touchstart' as const, x: 100, y: 200, path: 'root > a', snapshot: '' },
      { t: 0, type: 'touchend' as const, x: 100, y: 200, path: 'root > a' },
      { t: 500, type: 'touchstart' as const, x: 200, y: 300, path: 'root > b', snapshot: '' },
      { t: 500, type: 'touchend' as const, x: 200, y: 300, path: 'root > b' },
    ];

    const code = generateTestCode(records as any);
    expect(code).toContain('app.tick(500)');
  });

  it('skips meta records', () => {
    const records = [
      { t: 0, type: 'meta' as const, x: 0, y: 0, path: '', meta: { seed: 42 } },
      { t: 100, type: 'touchstart' as const, x: 100, y: 200, path: 'root > btn', snapshot: '' },
      { t: 100, type: 'touchend' as const, x: 100, y: 200, path: 'root > btn' },
    ];

    const code = generateTestCode(records as any);
    expect(code).not.toContain('meta');
    expect(code).toContain("tap(app, 'btn')");
  });
});
