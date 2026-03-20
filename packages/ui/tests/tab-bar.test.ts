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

  it('emits change when activeKey set', () => {
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
});
