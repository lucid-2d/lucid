/**
 * 平台检测 + 适配器测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectPlatform, type PlatformAdapter } from '../src/platform/detect';
import { WebAdapter } from '../src/platform/web';
import { createMockCanvas } from './helpers/mock-canvas';

describe('detectPlatform', () => {
  const originalGlobalThis = { ...globalThis };

  afterEach(() => {
    // cleanup mock globals
    delete (globalThis as any).wx;
    delete (globalThis as any).tt;
  });

  it('detects tt when tt.createCanvas exists', () => {
    (globalThis as any).tt = { createCanvas: () => {} };
    expect(detectPlatform()).toBe('tt');
  });

  it('detects wx when wx.createCanvas exists', () => {
    (globalThis as any).wx = { createCanvas: () => {} };
    expect(detectPlatform()).toBe('wx');
  });

  it('detects web when window exists (default in vitest)', () => {
    // vitest runs in node, no wx/tt, but we treat it as web fallback
    expect(detectPlatform()).toBe('web');
  });

  it('prefers tt over wx when both exist', () => {
    (globalThis as any).wx = { createCanvas: () => {} };
    (globalThis as any).tt = { createCanvas: () => {} };
    expect(detectPlatform()).toBe('tt');
  });
});

describe('WebAdapter', () => {
  it('creates with a canvas element', () => {
    const canvas = createMockCanvas();
    const adapter = new WebAdapter(canvas);
    expect(adapter.name).toBe('web');
  });

  it('getScreenInfo returns canvas dimensions', () => {
    const canvas = createMockCanvas(390, 844);
    const adapter = new WebAdapter(canvas);
    const info = adapter.getScreenInfo();
    expect(info.width).toBe(390);
    expect(info.height).toBe(844);
  });

  it('bindTouchEvents registers handlers', () => {
    const canvas = createMockCanvas();
    const adapter = new WebAdapter(canvas);
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    adapter.bindTouchEvents({ onStart, onMove, onEnd });

    // simulate mouse event (use clientX/clientY since WebAdapter converts via getBoundingClientRect)
    const mousedown = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
    canvas.dispatchEvent(mousedown);

    expect(onStart).toHaveBeenCalledWith(100, 200);
  });
});

