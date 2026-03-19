/**
 * $animate 动画系统测试
 */
import { describe, it, expect } from 'vitest';
import { UINode } from '../src/node';

describe('$animate', () => {
  it('interpolates property over time (linear)', () => {
    const node = new UINode();
    node.alpha = 0;
    node.$animate({ alpha: 1 }, { duration: 1000, easing: 'linear' });

    node.$update(0.5);  // 500ms
    expect(node.alpha).toBeCloseTo(0.5, 1);

    node.$update(0.5);  // 1000ms total
    expect(node.alpha).toBeCloseTo(1, 1);
  });

  it('snaps to target when duration elapsed', () => {
    const node = new UINode();
    node.x = 0;
    node.$animate({ x: 100 }, { duration: 200, easing: 'linear' });

    node.$update(0.3);  // 300ms > 200ms
    expect(node.x).toBe(100);  // exactly target, not overshot
  });

  it('resolves promise when done', async () => {
    const node = new UINode();
    node.x = 0;
    const anim = node.$animate({ x: 100 }, { duration: 100, easing: 'linear' });

    node.$update(0.2);
    await expect(anim.finished).resolves.toBeUndefined();
  });

  it('new animation on same property cancels old one', () => {
    const node = new UINode();
    node.x = 0;
    node.$animate({ x: 100 }, { duration: 1000, easing: 'linear' });
    node.$update(0.5);  // x ≈ 50

    const mid = node.x;
    expect(mid).toBeCloseTo(50, 0);

    // new animation from current position
    node.$animate({ x: 0 }, { duration: 1000, easing: 'linear' });
    node.$update(0.5);
    expect(node.x).toBeLessThan(mid);  // moving back
  });

  it('delay waits before starting', () => {
    const node = new UINode();
    node.alpha = 0;
    node.$animate({ alpha: 1 }, { duration: 200, delay: 100, easing: 'linear' });

    node.$update(0.05);  // 50ms — still in delay
    expect(node.alpha).toBe(0);

    node.$update(0.1);   // 150ms — delay passed, 50ms into animation (25%)
    expect(node.alpha).toBeCloseTo(0.25, 1);
  });

  it('animates multiple properties simultaneously', () => {
    const node = new UINode();
    node.x = 0;
    node.y = 0;
    node.$animate({ x: 100, y: 200 }, { duration: 1000, easing: 'linear' });

    node.$update(0.5);
    expect(node.x).toBeCloseTo(50, 0);
    expect(node.y).toBeCloseTo(100, 0);
  });

  it('stop() freezes at current value', () => {
    const node = new UINode();
    node.x = 0;
    const anim = node.$animate({ x: 100 }, { duration: 1000, easing: 'linear' });

    node.$update(0.5);
    anim.stop();
    const frozenX = node.x;

    node.$update(0.5);
    expect(node.x).toBe(frozenX);  // no further movement
  });

  it('finish() jumps to target', () => {
    const node = new UINode();
    node.x = 0;
    const anim = node.$animate({ x: 100 }, { duration: 1000, easing: 'linear' });

    node.$update(0.1);  // 10%
    anim.finish();
    expect(node.x).toBe(100);
  });

  it('default easing is easeOutCubic', () => {
    const node = new UINode();
    node.x = 0;
    node.$animate({ x: 100 }, { duration: 1000 });

    node.$update(0.5);
    // easeOutCubic at t=0.5: 1 - (1-0.5)^3 = 0.875
    expect(node.x).toBeCloseTo(87.5, 0);
  });

  it('no active animations after completion', () => {
    const node = new UINode();
    node.x = 0;
    node.$animate({ x: 100 }, { duration: 100, easing: 'linear' });
    node.$update(0.2);
    // should not throw or behave oddly on subsequent updates
    node.$update(0.1);
    node.$update(0.1);
    expect(node.x).toBe(100);
  });
});
