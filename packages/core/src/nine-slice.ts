/**
 * NineSlice — 九宫格切图 UINode
 *
 * 将一张图片按九宫格切割，四角不拉伸、四边单向拉伸、中心双向拉伸，
 * 适合可变尺寸的 UI 面板、按钮背景、气泡框。
 *
 * ```
 *  ┌──────┬─────────────┬──────┐
 *  │ TL   │    Top      │  TR  │  ← top inset
 *  ├──────┼─────────────┼──────┤
 *  │ Left │   Center    │Right │
 *  ├──────┼─────────────┼──────┤
 *  │ BL   │   Bottom    │  BR  │  ← bottom inset
 *  └──────┴─────────────┴──────┘
 *       left            right
 *       inset           inset
 * ```
 *
 * ```typescript
 * const panel = new NineSlice({
 *   image: panelImg,
 *   insets: [12, 12, 12, 12],  // [top, right, bottom, left]
 *   width: 300, height: 200,
 * });
 * ```
 */

import { UINode, type UINodeOptions } from './node.js';

export interface NineSliceProps extends UINodeOptions {
  /** Source image */
  image: any;
  /** Insets: [top, right, bottom, left] in source image pixels */
  insets: [number, number, number, number];
}

export class NineSlice extends UINode {
  image: any;
  insets: [number, number, number, number];

  constructor(props: NineSliceProps) {
    super(props);
    this.image = props.image;
    this.insets = props.insets;
  }

  get $text(): string {
    return `9slice [${this.insets.join(',')}]`;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;
    const w = this.width;
    const h = this.height;
    if (w <= 0 || h <= 0) return;

    const img = this.image;
    const iw = img.width as number;
    const ih = img.height as number;
    const [top, right, bottom, left] = this.insets;

    // Source regions
    const sw = iw - left - right;   // center width in source
    const sh = ih - top - bottom;   // center height in source

    // Dest regions
    const dw = Math.max(0, w - left - right);   // center width in dest
    const dh = Math.max(0, h - top - bottom);   // center height in dest

    // 9 draws: corners + edges + center
    // Top-left
    if (left > 0 && top > 0)
      ctx.drawImage(img, 0, 0, left, top, 0, 0, left, top);
    // Top-center
    if (sw > 0 && top > 0 && dw > 0)
      ctx.drawImage(img, left, 0, sw, top, left, 0, dw, top);
    // Top-right
    if (right > 0 && top > 0)
      ctx.drawImage(img, iw - right, 0, right, top, w - right, 0, right, top);

    // Middle-left
    if (left > 0 && sh > 0 && dh > 0)
      ctx.drawImage(img, 0, top, left, sh, 0, top, left, dh);
    // Middle-center
    if (sw > 0 && sh > 0 && dw > 0 && dh > 0)
      ctx.drawImage(img, left, top, sw, sh, left, top, dw, dh);
    // Middle-right
    if (right > 0 && sh > 0 && dh > 0)
      ctx.drawImage(img, iw - right, top, right, sh, w - right, top, right, dh);

    // Bottom-left
    if (left > 0 && bottom > 0)
      ctx.drawImage(img, 0, ih - bottom, left, bottom, 0, h - bottom, left, bottom);
    // Bottom-center
    if (sw > 0 && bottom > 0 && dw > 0)
      ctx.drawImage(img, left, ih - bottom, sw, bottom, left, h - bottom, dw, bottom);
    // Bottom-right
    if (right > 0 && bottom > 0)
      ctx.drawImage(img, iw - right, ih - bottom, right, bottom, w - right, h - bottom, right, bottom);
  }
}
