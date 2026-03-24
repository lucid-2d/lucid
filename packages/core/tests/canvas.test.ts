import { describe, it, expect, vi } from 'vitest';
import { drawRoundRect } from '../src/canvas';

function mockCtx(hasRoundRect = true) {
  const ctx: any = {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    roundRect: hasRoundRect ? vi.fn() : undefined,
  };
  return ctx;
}

describe('drawRoundRect', () => {
  it('uses native roundRect when available', () => {
    const ctx = mockCtx(true);
    drawRoundRect(ctx, 10, 20, 100, 50, 8);
    expect(ctx.roundRect).toHaveBeenCalledWith(10, 20, 100, 50, 8);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it('falls back to quadraticCurveTo when roundRect not available', () => {
    const ctx = mockCtx(false);
    drawRoundRect(ctx, 10, 20, 100, 50, 8);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(4); // 4 corners
    expect(ctx.lineTo).toHaveBeenCalledTimes(4); // 4 edges
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it('clamps radius to half smallest dimension', () => {
    const ctx = mockCtx(true);
    drawRoundRect(ctx, 0, 0, 20, 10, 100); // r=100 >> w/2=10, h/2=5
    expect(ctx.roundRect).toHaveBeenCalledWith(0, 0, 20, 10, 5); // clamped to h/2
  });

  it('handles zero radius', () => {
    const ctx = mockCtx(true);
    drawRoundRect(ctx, 0, 0, 100, 50, 0);
    expect(ctx.roundRect).toHaveBeenCalledWith(0, 0, 100, 50, 0);
  });

  it('fallback handles zero radius', () => {
    const ctx = mockCtx(false);
    drawRoundRect(ctx, 0, 0, 100, 50, 0);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });
});
