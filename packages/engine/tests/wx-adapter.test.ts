/**
 * WxAdapter / TtAdapter 测试 — mock 小游戏全局 API
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('WxAdapter', () => {
  let origWx: any;

  beforeEach(() => {
    origWx = (globalThis as any).wx;
    const mockCtx = {
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      scale: vi.fn(), clearRect: vi.fn(), setTransform: vi.fn(),
      fillRect: vi.fn(), fillText: vi.fn(),
      globalAlpha: 1, fillStyle: '', font: '', textAlign: '', textBaseline: '',
    };
    const mockCanvas = {
      width: 0, height: 0,
      getContext: () => mockCtx,
      requestAnimationFrame: vi.fn((cb: any) => setTimeout(cb, 16)),
      cancelAnimationFrame: vi.fn(),
    };
    (globalThis as any).wx = {
      createCanvas: () => mockCanvas,
      getSystemInfoSync: () => ({
        screenWidth: 375, screenHeight: 667,
        pixelRatio: 2,
        safeArea: { top: 44, bottom: 623 },
      }),
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    };
  });

  afterEach(() => {
    if (origWx !== undefined) (globalThis as any).wx = origWx;
    else delete (globalThis as any).wx;
  });

  it('creates adapter with correct screen info', async () => {
    const { WxAdapter } = await import('../src/platform/wx');
    const adapter = new WxAdapter();
    const info = adapter.getScreenInfo();
    expect(info.width).toBe(375);
    expect(info.height).toBe(667);
    expect(info.dpr).toBe(2);
    expect(info.safeTop).toBe(44);
    expect(adapter.name).toBe('wx');
  });

  it('binds touch events via wx global', async () => {
    const { WxAdapter } = await import('../src/platform/wx');
    const adapter = new WxAdapter();
    const handlers = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn() };
    adapter.bindTouchEvents(handlers);

    expect((globalThis as any).wx.onTouchStart).toHaveBeenCalledOnce();
    expect((globalThis as any).wx.onTouchMove).toHaveBeenCalledOnce();
    expect((globalThis as any).wx.onTouchEnd).toHaveBeenCalledOnce();
  });

  it('touch handler extracts coordinates', async () => {
    const { WxAdapter } = await import('../src/platform/wx');
    const adapter = new WxAdapter();
    const handlers = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn() };
    adapter.bindTouchEvents(handlers);

    // 模拟触摸回调
    const startCb = (globalThis as any).wx.onTouchStart.mock.calls[0][0];
    startCb({ touches: [{ clientX: 100, clientY: 200 }] });
    expect(handlers.onStart).toHaveBeenCalledWith(100, 200);
  });
});

describe('TtAdapter', () => {
  let origTt: any;

  beforeEach(() => {
    origTt = (globalThis as any).tt;
    const mockCtx = {
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      scale: vi.fn(), clearRect: vi.fn(), setTransform: vi.fn(),
      fillRect: vi.fn(), fillText: vi.fn(),
      globalAlpha: 1, fillStyle: '', font: '', textAlign: '', textBaseline: '',
    };
    const mockCanvas = {
      width: 0, height: 0,
      getContext: () => mockCtx,
      requestAnimationFrame: vi.fn((cb: any) => setTimeout(cb, 16)),
      cancelAnimationFrame: vi.fn(),
    };
    (globalThis as any).tt = {
      createCanvas: () => mockCanvas,
      getSystemInfoSync: () => ({
        screenWidth: 390, screenHeight: 844,
        pixelRatio: 3,
        safeArea: { top: 47, bottom: 810 },
      }),
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    };
  });

  afterEach(() => {
    if (origTt !== undefined) (globalThis as any).tt = origTt;
    else delete (globalThis as any).tt;
  });

  it('creates adapter with correct screen info', async () => {
    const { TtAdapter } = await import('../src/platform/tt');
    const adapter = new TtAdapter();
    const info = adapter.getScreenInfo();
    expect(info.width).toBe(390);
    expect(info.height).toBe(844);
    expect(info.dpr).toBe(3);
    expect(adapter.name).toBe('tt');
  });
});
