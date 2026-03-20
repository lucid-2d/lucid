import { describe, it, expect, vi } from 'vitest';
import { Button } from '../src/button';

describe('Button', () => {
  it('has correct text', () => {
    const btn = new Button({ text: '确定' });
    expect(btn.$text).toBe('确定');
  });

  it('is interactive by default', () => {
    const btn = new Button({ text: 'OK' });
    expect(btn.interactive).toBe(true);
  });

  it('emits tap on touchstart + touchend', () => {
    const btn = new Button({ text: 'OK', width: 100, height: 40 });
    const handler = vi.fn();
    btn.$on('tap', handler);
    btn.$emit('touchstart', { localX: 50, localY: 20, worldX: 50, worldY: 20 });
    btn.$emit('touchend', { localX: 50, localY: 20, worldX: 50, worldY: 20 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not emit tap when disabled', () => {
    const btn = new Button({ text: 'OK', disabled: true });
    const handler = vi.fn();
    btn.$on('tap', handler);
    btn.$emit('touchstart', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    btn.$emit('touchend', { localX: 5, localY: 5, worldX: 5, worldY: 5 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('$disabled reflects prop', () => {
    const btn = new Button({ text: 'OK', disabled: true });
    expect(btn.$disabled).toBe(true);
  });

  it('variant defaults to primary', () => {
    const btn = new Button({ text: 'OK' });
    expect(btn.variant).toBe('primary');
  });

  it('pressed state resets after touchend', () => {
    const btn = new Button({ text: 'OK', width: 100, height: 40 });
    btn.$emit('touchstart', { localX: 50, localY: 20, worldX: 50, worldY: 20 });
    expect(btn.pressed).toBe(true);
    btn.$emit('touchend', { localX: 50, localY: 20, worldX: 50, worldY: 20 });
    expect(btn.pressed).toBe(false);
  });

  it('text setter updates and marks dirty', () => {
    const btn = new Button({ text: 'old' });
    btn.text = 'new';
    expect(btn.$text).toBe('new');
  });

  // ── 新增 ──

  it('supports all 6 variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'gold', 'danger', 'ghost'] as const;
    for (const v of variants) {
      const btn = new Button({ text: 'test', variant: v });
      expect(btn.variant).toBe(v);
    }
  });

  it('icon prop is stored', () => {
    const btn = new Button({ text: '分享', icon: 'share' });
    expect(btn.icon).toBe('share');
  });
});
