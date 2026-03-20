import { describe, it, expect, vi } from 'vitest';
import { ResultPanel } from '../src/result-panel';
import { Button } from '@lucid/ui';

describe('ResultPanel', () => {
  const baseProps = {
    title: '游戏结束',
    score: 12800,
    isNewBest: true,
    stats: [
      { icon: 'shield', label: '关卡', value: '12' },
      { icon: 'block', label: '方块', value: '3456' },
    ],
    buttons: [
      { id: 'retry', label: '再来一次', variant: 'primary' as const },
      { id: 'menu', label: '返回菜单', variant: 'outline' as const },
    ],
  };

  it('has correct title', () => {
    const panel = new ResultPanel(baseProps);
    expect(panel.$text).toBe('游戏结束');
  });

  it('creates stat nodes', () => {
    const panel = new ResultPanel(baseProps);
    expect(panel.findById('stat-0')).not.toBeNull();
    expect(panel.findById('stat-1')).not.toBeNull();
  });

  it('creates buttons', () => {
    const panel = new ResultPanel(baseProps);
    const buttons = panel.findByType(Button);
    expect(buttons).toHaveLength(2);
    expect(buttons[0].$text).toBe('再来一次');
    expect(buttons[1].$text).toBe('返回菜单');
  });

  it('emits action with button id on tap', () => {
    const panel = new ResultPanel(baseProps);
    const handler = vi.fn();
    panel.$on('action', handler);

    panel.findById('btn-retry')!.$emit('tap');
    expect(handler).toHaveBeenCalledWith('retry');
  });

  it('addButton inserts at position', () => {
    const panel = new ResultPanel(baseProps);
    panel.addButton({ id: 'revive', label: '复活', variant: 'gold' }, 0);

    const buttons = panel.findByType(Button);
    expect(buttons[0].$text).toBe('复活');
    expect(buttons).toHaveLength(3);
  });

  it('addButton at end by default', () => {
    const panel = new ResultPanel(baseProps);
    panel.addButton({ id: 'share', label: '分享', variant: 'secondary' });

    const buttons = panel.findByType(Button);
    expect(buttons[buttons.length - 1].$text).toBe('分享');
  });

  it('$inspect shows score', () => {
    const panel = new ResultPanel(baseProps);
    expect(panel.$inspect()).toContain('12800');
  });

  it('$inspect shows NEW BEST when applicable', () => {
    const panel = new ResultPanel(baseProps);
    expect(panel.$inspect()).toContain('NEW');
  });
});
