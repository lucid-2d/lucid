/**
 * Tests for simulateSwipe (#63) and waitForScene/waitForNode/waitForCondition (#64)
 */
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import { UINode, SceneNode } from '@lucid-2d/core';
import { createMockCanvas } from './helpers/mock-canvas';

function makeApp() {
  const canvas = createMockCanvas(390, 844);
  return createApp({ platform: 'web', canvas });
}

// ── #63: simulateSwipe ──

describe('simulateSwipe', () => {
  it('generates touchstart → touchmove × N → touchend', () => {
    const app = makeApp();
    const node = new UINode({ id: 'area', width: 390, height: 844 });
    node.interactive = true;
    app.root.addChild(node);

    const events: string[] = [];
    node.$on('touchstart', () => events.push('start'));
    node.$on('touchmove', () => events.push('move'));
    node.$on('touchend', () => events.push('end'));

    app.simulateSwipe(200, 400, 100, 400, 48); // 48ms → 3 steps
    expect(events[0]).toBe('start');
    expect(events[events.length - 1]).toBe('end');
    expect(events.filter(e => e === 'move').length).toBeGreaterThanOrEqual(1);
  });

  it('passes correct start and end coordinates', () => {
    const app = makeApp();
    const node = new UINode({ id: 'area', width: 390, height: 844 });
    node.interactive = true;
    app.root.addChild(node);

    const coords: Array<{ x: number; y: number }> = [];
    node.$on('touchstart', (e: any) => coords.push({ x: e.worldX, y: e.worldY }));
    node.$on('touchend', (e: any) => coords.push({ x: e.worldX, y: e.worldY }));

    app.simulateSwipe(200, 400, 100, 400, 32);
    expect(coords[0]).toEqual({ x: 200, y: 400 });
    expect(coords[coords.length - 1]).toEqual({ x: 100, y: 400 });
  });

  it('ticks the game loop between moves', () => {
    const app = makeApp();
    const node = new UINode({ id: 'area', width: 390, height: 844 });
    node.interactive = true;
    app.root.addChild(node);

    let updateCount = 0;
    const orig = node.onBeforeUpdate;
    node.onBeforeUpdate = () => { updateCount++; };
    app.root.addChild(node);

    app.simulateSwipe(200, 400, 100, 400, 64); // 64ms → 4 steps
    expect(updateCount).toBeGreaterThanOrEqual(4);
  });

  it('defaults to 300ms duration', () => {
    const app = makeApp();
    const node = new UINode({ id: 'area', width: 390, height: 844 });
    node.interactive = true;
    app.root.addChild(node);

    const moves: number[] = [];
    node.$on('touchmove', () => moves.push(1));

    app.simulateSwipe(200, 400, 100, 400); // default 300ms
    expect(moves.length).toBeGreaterThanOrEqual(15); // 300/16 ≈ 19
  });

  it('interpolates move coordinates linearly', () => {
    const app = makeApp();
    const node = new UINode({ id: 'area', width: 390, height: 844 });
    node.interactive = true;
    app.root.addChild(node);

    const xs: number[] = [];
    node.$on('touchmove', (e: any) => xs.push(e.worldX));

    app.simulateSwipe(0, 400, 100, 400, 32); // 32ms → 2 steps
    // Step 1: t=0.5 → x=50, Step 2: t=1.0 → x=100
    expect(xs[0]).toBeCloseTo(50);
    expect(xs[1]).toBeCloseTo(100);
  });
});

// ── #64: waitForScene ──

describe('waitForScene', () => {
  it('resolves immediately when scene already matches', async () => {
    const app = makeApp();
    app.router.push(new SceneNode({ id: 'game', width: 390, height: 844 }));
    await app.waitForScene('game');
    expect(app.router.current?.id).toBe('game');
  });

  it('waits for scene transition', async () => {
    const app = makeApp();

    class MenuScene extends SceneNode {
      private _count = 0;
      constructor(private _app: ReturnType<typeof makeApp>) {
        super({ id: 'menu', width: 390, height: 844 });
      }
      onEnter() {
        this.onBeforeUpdate = () => {
          this._count++;
          if (this._count === 3) {
            this._app.router.replace(new SceneNode({ id: 'game', width: 390, height: 844 }));
          }
        };
      }
    }

    const menu = new MenuScene(app);
    app.router.push(menu);
    app.tick(16); // trigger onEnter

    await app.waitForScene('game');
    expect(app.router.current?.id).toBe('game');
  });

  it('throws on timeout', async () => {
    const app = makeApp();
    app.router.push(new SceneNode({ id: 'menu', width: 390, height: 844 }));

    await expect(
      app.waitForScene('nonexistent', { timeout: 100 })
    ).rejects.toThrow('timed out');
  });
});

// ── #64: waitForNode ──

describe('waitForNode', () => {
  it('resolves when node exists by id', async () => {
    const app = makeApp();
    app.root.addChild(new UINode({ id: 'score', width: 100, height: 30 }));

    const node = await app.waitForNode('#score');
    expect(node.id).toBe('score');
  });

  it('waits for node to appear', async () => {
    const app = makeApp();

    let count = 0;
    const tracker = new UINode({ id: 'tracker', width: 1, height: 1 });
    tracker.onBeforeUpdate = () => {
      count++;
      if (count === 3) {
        app.root.addChild(new UINode({ id: 'delayed', width: 50, height: 50 }));
      }
    };
    app.root.addChild(tracker);

    const node = await app.waitForNode('#delayed');
    expect(node.id).toBe('delayed');
  });

  it('throws on timeout', async () => {
    const app = makeApp();
    await expect(
      app.waitForNode('#nonexistent', { timeout: 100 })
    ).rejects.toThrow('timed out');
  });
});

// ── #64: waitForCondition ──

describe('waitForCondition', () => {
  it('resolves when condition becomes true', async () => {
    const app = makeApp();
    let value = 0;

    const tracker = new UINode({ id: 'tracker', width: 1, height: 1 });
    tracker.onBeforeUpdate = () => { value++; };
    app.root.addChild(tracker);

    await app.waitForCondition(() => value >= 5);
    expect(value).toBeGreaterThanOrEqual(5);
  });

  it('resolves immediately if already true', async () => {
    const app = makeApp();
    await app.waitForCondition(() => true);
  });

  it('throws on timeout', async () => {
    const app = makeApp();
    await expect(
      app.waitForCondition(() => false, { timeout: 100 })
    ).rejects.toThrow('timed out');
  });
});
