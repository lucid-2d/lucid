import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../src/toggle';

describe('Toggle', () => {
  it('initial value', () => {
    const t = new Toggle({ label: '音效', value: true });
    expect(t.value).toBe(true);
    expect(t.$text).toBe('音效');
  });

  it('emits change on tap', () => {
    const t = new Toggle({ label: '音效', value: true });
    const handler = vi.fn();
    t.$on('change', handler);
    t.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    t.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    expect(handler).toHaveBeenCalledWith(false);
    expect(t.value).toBe(false);
  });

  it('toggles back', () => {
    const t = new Toggle({ label: '音效', value: false });
    t.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    t.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    expect(t.value).toBe(true);
  });

  it('is interactive', () => {
    const t = new Toggle({ label: '音效', value: true });
    expect(t.interactive).toBe(true);
  });

  // ── 新增：动画 ──

  it('animates progress on toggle (ON→OFF)', () => {
    const t = new Toggle({ label: '音效', value: true });
    expect(t.progress).toBeCloseTo(1); // starts at ON position

    t.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    t.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });

    // progress 正在动画中（还没到 0）
    t.$update(0.05); // 50ms
    expect(t.progress).toBeGreaterThan(0);
    expect(t.progress).toBeLessThan(1);

    // 动画结束后
    t.$update(0.5);
    expect(t.progress).toBeCloseTo(0, 1);
  });

  it('animates progress on toggle (OFF→ON)', () => {
    const t = new Toggle({ label: '音效', value: false });
    expect(t.progress).toBeCloseTo(0);

    t.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    t.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });

    t.$update(0.05);
    expect(t.progress).toBeGreaterThan(0);
  });
});
