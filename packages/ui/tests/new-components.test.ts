/**
 * Tests for newly added components: Icon, IconButton, Badge, Tag, Toast, Tokens
 */
import { describe, it, expect, vi } from 'vitest';
import { Icon } from '../src/icon';
import { IconButton } from '../src/icon-button';
import { RedDot, Badge, Tag } from '../src/badge';
import { Toast } from '../src/toast';
import { UIColors, UILayout, ButtonSizes, ToastConfig } from '../src/tokens';
import { getTheme, setTheme } from '../src/theme';

describe('Theme', () => {
  it('getTheme returns default values', () => {
    const t = getTheme();
    expect(t.colors.primary).toBe('#e94560');
    expect(t.typography.family).toBe('sans-serif');
  });
});

describe('Tokens', () => {
  it('UIColors reads from theme', () => {
    expect(UIColors.primary).toBe('#e94560');
    expect(UIColors.accent).toBe('#ffd166');
  });

  it('UILayout has constants', () => {
    expect(UILayout.panelRadius).toBe(12);
    expect(UILayout.minTouchSize).toBe(44);
  });

  it('ButtonSizes has 5 sizes', () => {
    expect(Object.keys(ButtonSizes)).toHaveLength(5);
    expect(ButtonSizes.md.height).toBe(48);
  });

  it('ToastConfig has durations', () => {
    expect(ToastConfig.durations.reward).toBe(2.5);
  });
});

describe('Icon', () => {
  it('stores name and size', () => {
    const icon = new Icon({ name: 'star', size: 24, color: '#ffd166' });
    expect(icon.name).toBe('star');
    expect(icon.iconSize).toBe(24);
    expect(icon.width).toBe(24);
  });
});

describe('IconButton', () => {
  it('is interactive and emits tap', () => {
    const btn = new IconButton({ icon: 'settings', size: 40 });
    expect(btn.interactive).toBe(true);

    const handler = vi.fn();
    btn.$on('tap', handler);
    btn.$emit('touchstart', {});
    btn.$emit('touchend', {});
    expect(handler).toHaveBeenCalledOnce();
  });

  it('supports badge', () => {
    const btn = new IconButton({ icon: 'mission', badge: 3 });
    expect(btn.badge).toBe(3);
  });
});

describe('RedDot', () => {
  it('has 8x8 size', () => {
    const dot = new RedDot();
    expect(dot.width).toBe(8);
  });
});

describe('Badge', () => {
  it('stores count', () => {
    const badge = new Badge({ count: 5 });
    expect(badge.count).toBe(5);
    expect(badge.$text).toBe('5');
  });
});

describe('Tag', () => {
  it('stores text and color', () => {
    const tag = new Tag({ text: '限时', bgColor: '#4caf50' });
    expect(tag.$text).toBe('限时');
    expect(tag.bgColor).toBe('#4caf50');
  });
});

describe('Toast', () => {
  it('starts inactive', () => {
    expect(Toast.isActive).toBe(false);
  });

  it('show activates', () => {
    Toast.show('success', 'test');
    expect(Toast.isActive).toBe(true);
  });

  it('expires after duration', () => {
    Toast.show('success', 'test');
    Toast.update(3); // > 1.8s
    expect(Toast.isActive).toBe(false);
  });

  it('reward has longer duration', () => {
    Toast.show('reward', '+100');
    Toast.update(2.0); // < 2.5s
    expect(Toast.isActive).toBe(true);
    Toast.update(1.0);
    expect(Toast.isActive).toBe(false);
  });
});
