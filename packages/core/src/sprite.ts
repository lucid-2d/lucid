/**
 * Sprite — 图片/精灵 UINode
 *
 * 将图片资源渲染为 UINode，支持：
 * - 完整图片绘制
 * - 精灵合集裁剪（sourceRect）
 * - AI 可见（$inspect 输出图片信息）
 * - 布局系统兼容（width/height/flex 等）
 */

import { UINode, type UINodeOptions } from './node.js';

// ── Types ──

/** 源图裁剪区域 */
export interface SourceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteProps extends UINodeOptions {
  /** 图片对象（loadImage 返回的，或 new Image() 创建的） */
  image: any;
  /** 可选：从图集中裁剪的区域 */
  sourceRect?: SourceRect;
  /** 水平翻转 */
  flipX?: boolean;
  /** 垂直翻转 */
  flipY?: boolean;
}

// ── Sprite ──

export class Sprite extends UINode {
  image: any;
  sourceRect?: SourceRect;
  flipX: boolean;
  flipY: boolean;

  constructor(props: SpriteProps) {
    super(props);
    this.image = props.image;
    this.sourceRect = props.sourceRect;
    this.flipX = props.flipX ?? false;
    this.flipY = props.flipY ?? false;
  }

  get $text(): string {
    const sr = this.sourceRect;
    if (sr) return `src=${sr.w}x${sr.h}@(${sr.x},${sr.y})`;
    return 'image';
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;
    const w = this.width;
    const h = this.height;
    if (w <= 0 || h <= 0) return;

    const needsFlip = this.flipX || this.flipY;
    if (needsFlip) {
      ctx.save();
      ctx.translate(this.flipX ? w : 0, this.flipY ? h : 0);
      ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    }

    const sr = this.sourceRect;
    if (sr) {
      ctx.drawImage(this.image, sr.x, sr.y, sr.w, sr.h, 0, 0, w, h);
    } else {
      ctx.drawImage(this.image, 0, 0, w, h);
    }

    if (needsFlip) {
      ctx.restore();
    }
  }
}

// ── SpriteSheet ──

export interface SpriteSheetRegions {
  [name: string]: SourceRect;
}

/**
 * SpriteSheet — 精灵图集管理
 *
 * 管理一张大图中的命名区域，可快速创建 Sprite 节点。
 */
export class SpriteSheet {
  readonly image: any;
  private _regions: Map<string, SourceRect>;

  constructor(image: any, regions: SpriteSheetRegions) {
    this.image = image;
    this._regions = new Map(Object.entries(regions));
  }

  /** 获取命名区域 */
  getRegion(name: string): SourceRect | undefined {
    return this._regions.get(name);
  }

  /** 所有区域名称 */
  get regionNames(): string[] {
    return [...this._regions.keys()];
  }

  /** 从均匀网格自动生成区域 */
  static fromGrid(
    image: any,
    cols: number,
    rows: number,
    cellWidth: number,
    cellHeight: number,
    names?: string[],
  ): SpriteSheet {
    const regions: SpriteSheetRegions = {};
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const name = names?.[idx] ?? `${r}_${c}`;
        regions[name] = { x: c * cellWidth, y: r * cellHeight, w: cellWidth, h: cellHeight };
        idx++;
      }
    }
    return new SpriteSheet(image, regions);
  }

  /** 创建一个指向指定区域的 Sprite */
  createSprite(regionName: string, opts?: Partial<UINodeOptions> & { flipX?: boolean; flipY?: boolean }): Sprite {
    const region = this._regions.get(regionName);
    if (!region) throw new Error(`Unknown sprite region: ${regionName}`);
    return new Sprite({
      id: opts?.id ?? regionName,
      width: opts?.width ?? region.w,
      height: opts?.height ?? region.h,
      image: this.image,
      sourceRect: region,
      flipX: opts?.flipX,
      flipY: opts?.flipY,
      ...opts,
    });
  }
}
