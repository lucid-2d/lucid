import { describe, it, expect, vi } from 'vitest';
import { TabBar } from '../src/tab-bar';

describe('TabBar', () => {
  const tabs = [
    { key: 'skin', label: '皮肤' },
    { key: 'effect', label: '特效' },
    { key: 'frame', label: '头像框' },
  ];

  it('has initial activeKey', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin' });
    expect(bar.activeKey).toBe('skin');
  });

  it('emits change when activeKey set programmatically', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin' });
    const handler = vi.fn();
    bar.$on('change', handler);
    bar.activeKey = 'effect';
    expect(handler).toHaveBeenCalledWith('effect');
  });

  it('does not emit if same key', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin' });
    const handler = vi.fn();
    bar.$on('change', handler);
    bar.activeKey = 'skin';
    expect(handler).not.toHaveBeenCalled();
  });

  it('$inspect shows active tab', () => {
    const bar = new TabBar({ tabs, activeKey: 'effect', id: 'tabs' });
    const out = bar.$inspect(0);
    expect(out).toContain('active="effect"');
  });

  // ── 新增：触摸切换 ──

  it('tap on second tab emits change', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin', width: 390, height: 40 });
    const handler = vi.fn();
    bar.$on('change', handler);

    // tab 宽度 = 390/3 = 130, 第二个 tab 中心 x = 130 + 65 = 195
    bar.$emit('touchstart', { localX: 195, localY: 20, worldX: 195, worldY: 20 });
    bar.$emit('touchend', { localX: 195, localY: 20, worldX: 195, worldY: 20 });

    expect(handler).toHaveBeenCalledWith('effect');
    expect(bar.activeKey).toBe('effect');
  });

  it('tap on already active tab does not emit', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin', width: 390, height: 40 });
    const handler = vi.fn();
    bar.$on('change', handler);

    // 第一个 tab 中心 x = 65
    bar.$emit('touchstart', { localX: 65, localY: 20, worldX: 65, worldY: 20 });
    bar.$emit('touchend', { localX: 65, localY: 20, worldX: 65, worldY: 20 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('tap on third tab works', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin', width: 390, height: 40 });
    const handler = vi.fn();
    bar.$on('change', handler);

    // 第三个 tab x = 260 + 65 = 325
    bar.$emit('touchstart', { localX: 325, localY: 20, worldX: 325, worldY: 20 });
    bar.$emit('touchend', { localX: 325, localY: 20, worldX: 325, worldY: 20 });

    expect(handler).toHaveBeenCalledWith('frame');
  });

  // ── 新增：下划线动画 ──

  it('underline animates on tab change (uses $animate)', () => {
    const bar = new TabBar({ tabs, activeKey: 'skin', width: 390, height: 40 });
    bar.activeKey = 'effect';

    // 动画开始后 lineX 应该在变化中
    bar.$update(0.1); // 100ms
    // lineX 应该在向目标移动（不验证精确值，验证它不是初始值）
    expect(bar.lineX).toBeGreaterThan(0);
  });
});
