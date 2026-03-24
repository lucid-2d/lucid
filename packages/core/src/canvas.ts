/**
 * Canvas utilities — cross-browser drawing helpers.
 */

/**
 * Draw a rounded rectangle path. Uses native `ctx.roundRect()` when available,
 * falls back to `quadraticCurveTo` for older browsers/WebViews.
 *
 * Only creates the path (beginPath + closePath) — call `ctx.fill()` or `ctx.stroke()` after.
 *
 * ```typescript
 * import { drawRoundRect } from '@lucid-2d/core';
 *
 * drawRoundRect(ctx, 10, 10, 100, 40, 8);
 * ctx.fillStyle = '#4caf50';
 * ctx.fill();
 * ```
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number,
): void {
  // Clamp radius to half the smallest dimension
  r = Math.min(r, w / 2, h / 2);

  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.closePath();
    return;
  }

  // Fallback: quadraticCurveTo
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
