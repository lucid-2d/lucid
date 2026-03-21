import { describe, it, expect, vi } from 'vitest';
import { NineSlice } from '../src/nine-slice';

function mockImage(w = 48, h = 48) {
  return { width: w, height: h };
}

function stubCtx() {
  return {
    drawImage: vi.fn(),
    globalAlpha: 1,
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
  } as any;
}

describe('NineSlice', () => {
  it('creates with image and insets', () => {
    const ns = new NineSlice({
      image: mockImage(), insets: [10, 10, 10, 10],
      width: 200, height: 100,
    });
    expect(ns.width).toBe(200);
    expect(ns.height).toBe(100);
    expect(ns.insets).toEqual([10, 10, 10, 10]);
  });

  it('draws 9 regions', () => {
    const ns = new NineSlice({
      image: mockImage(48, 48), insets: [12, 12, 12, 12],
      width: 200, height: 100,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);
    // 9 drawImage calls: 4 corners + 4 edges + 1 center
    expect(ctx.drawImage).toHaveBeenCalledTimes(9);
  });

  it('corners are not stretched', () => {
    const img = mockImage(48, 48);
    const ns = new NineSlice({
      image: img, insets: [12, 12, 12, 12],
      width: 200, height: 100,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);

    // Top-left corner: source (0,0,12,12) → dest (0,0,12,12) — same size
    const tl = ctx.drawImage.mock.calls[0];
    expect(tl).toEqual([img, 0, 0, 12, 12, 0, 0, 12, 12]);

    // Top-right corner
    const tr = ctx.drawImage.mock.calls[2];
    expect(tr).toEqual([img, 36, 0, 12, 12, 188, 0, 12, 12]);

    // Bottom-left corner
    const bl = ctx.drawImage.mock.calls[6];
    expect(bl).toEqual([img, 0, 36, 12, 12, 0, 88, 12, 12]);

    // Bottom-right corner
    const br = ctx.drawImage.mock.calls[8];
    expect(br).toEqual([img, 36, 36, 12, 12, 188, 88, 12, 12]);
  });

  it('center is stretched to fill', () => {
    const img = mockImage(48, 48);
    const ns = new NineSlice({
      image: img, insets: [12, 12, 12, 12],
      width: 200, height: 100,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);

    // Center: source (12,12,24,24) → dest (12,12,176,76)
    const center = ctx.drawImage.mock.calls[4];
    expect(center).toEqual([img, 12, 12, 24, 24, 12, 12, 176, 76]);
  });

  it('does not draw if image is null', () => {
    const ns = new NineSlice({
      image: null, insets: [10, 10, 10, 10],
      width: 100, height: 100,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('does not draw if size is 0', () => {
    const ns = new NineSlice({
      image: mockImage(), insets: [10, 10, 10, 10],
      width: 0, height: 100,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);
    expect(ctx.drawImage).not.toHaveBeenCalled();
  });

  it('$text shows inset info', () => {
    const ns = new NineSlice({
      image: mockImage(), insets: [8, 12, 8, 12],
      width: 100, height: 50,
    });
    expect(ns.$text).toBe('9slice [8,12,8,12]');
  });

  it('handles asymmetric insets', () => {
    const img = mockImage(60, 40);
    const ns = new NineSlice({
      image: img, insets: [8, 16, 12, 10],
      width: 300, height: 150,
    });
    const ctx = stubCtx();
    ns['draw'](ctx);
    expect(ctx.drawImage).toHaveBeenCalledTimes(9);

    // Top-left: source (0,0,10,8) → dest (0,0,10,8)
    expect(ctx.drawImage.mock.calls[0]).toEqual([img, 0, 0, 10, 8, 0, 0, 10, 8]);
  });
});
