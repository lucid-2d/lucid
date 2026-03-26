/**
 * Tests for icon-draw.ts — icon registry, style management, drawIcon dispatch
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  drawIcon, setIconStyle, getIconStyle,
  ALL_ICON_NAMES, ALL_ICON_STYLES,
  type IconName, type IconStyle,
} from '../src/icon-draw';

// Minimal canvas context mock
function createMockCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    arcTo: noop,
    quadraticCurveTo: noop,
    bezierCurveTo: noop,
    ellipse: noop,
    rect: noop,
    roundRect: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    fillText: noop,
    strokeText: noop,
    clip: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    setTransform: noop,
    resetTransform: noop,
    drawImage: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: noop,
    measureText: () => ({ width: 0 }),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'round',
    lineJoin: 'round',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    canvas: { width: 100, height: 100 },
  } as unknown as CanvasRenderingContext2D;
}

describe('icon-draw', () => {
  beforeEach(() => {
    setIconStyle('filled');
  });

  describe('ALL_ICON_NAMES', () => {
    const expectedNames: IconName[] = [
      'pause', 'play', 'home', 'back', 'close', 'settings',
      'share', 'retry', 'gift', 'lock', 'unlock', 'check', 'plus',
      'trophy', 'crown', 'star', 'coin', 'diamond', 'heart',
      'shield', 'lightning', 'clock', 'block', 'fire', 'medal',
      'sound-on', 'sound-off', 'vibrate', 'ad-video', 'checkin',
      'mission', 'achievement', 'battle-pass',
    ];

    it('contains all expected icon names', () => {
      for (const name of expectedNames) {
        expect(ALL_ICON_NAMES).toContain(name);
      }
    });

    it('has at least 30 icons registered', () => {
      expect(ALL_ICON_NAMES.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('setIconStyle / getIconStyle', () => {
    it('default style is filled', () => {
      expect(getIconStyle()).toBe('filled');
    });

    it('can set and get style', () => {
      for (const style of ALL_ICON_STYLES) {
        setIconStyle(style);
        expect(getIconStyle()).toBe(style);
      }
    });
  });

  describe('drawIcon', () => {
    it('calls ctx.save and ctx.restore for filled style', () => {
      const ctx = createMockCtx();
      drawIcon(ctx, 'play', 50, 50, 24, '#fff');
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('draws all icons without throwing (filled)', () => {
      const ctx = createMockCtx();
      for (const name of ALL_ICON_NAMES) {
        expect(() => drawIcon(ctx, name, 50, 50, 24, '#fff', 'filled')).not.toThrow();
      }
    });

    it('draws all icons without throwing (glow)', () => {
      const ctx = createMockCtx();
      for (const name of ALL_ICON_NAMES) {
        expect(() => drawIcon(ctx, name, 50, 50, 24, '#fff', 'glow')).not.toThrow();
      }
    });

    it('draws all icons without throwing (duotone)', () => {
      const ctx = createMockCtx();
      for (const name of ALL_ICON_NAMES) {
        expect(() => drawIcon(ctx, name, 50, 50, 24, '#fff', 'duotone')).not.toThrow();
      }
    });

    it('respects global style when no style param given', () => {
      const ctx = createMockCtx();
      setIconStyle('glow');
      // Should not throw — uses glow renderer
      drawIcon(ctx, 'star', 50, 50, 24, '#ffd166');
      expect(ctx.save).toHaveBeenCalled();
    });

    it('style param overrides global style', () => {
      const ctx = createMockCtx();
      setIconStyle('filled');
      // Explicitly request glow
      drawIcon(ctx, 'star', 50, 50, 24, '#ffd166', 'glow');
      // Should still work (glow uses shadow properties)
      expect(ctx.save).toHaveBeenCalled();
    });

    it('handles unknown icon name gracefully', () => {
      const ctx = createMockCtx();
      // Should not throw — ICON_REGISTRY returns undefined, drawIcon returns early
      expect(() => drawIcon(ctx, 'nonexistent' as IconName, 50, 50, 24, '#fff')).not.toThrow();
      // save/restore should NOT be called since we return early
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('works with different sizes', () => {
      const ctx = createMockCtx();
      expect(() => drawIcon(ctx, 'heart', 50, 50, 8, '#f00')).not.toThrow();
      expect(() => drawIcon(ctx, 'heart', 50, 50, 48, '#f00')).not.toThrow();
      expect(() => drawIcon(ctx, 'heart', 50, 50, 128, '#f00')).not.toThrow();
    });
  });
});
