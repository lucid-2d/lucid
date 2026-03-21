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

  /** 创建 AnimatedSprite，按帧名称序列播放 */
  createAnimated(frameNames: string[], opts?: Partial<AnimatedSpriteProps>): AnimatedSprite {
    const frames: FrameDef[] = frameNames.map(name => {
      const region = this._regions.get(name);
      if (!region) throw new Error(`Unknown sprite region: ${name}`);
      return { image: this.image, sourceRect: region };
    });
    const firstRegion = this._regions.get(frameNames[0])!;
    return new AnimatedSprite({
      id: opts?.id ?? 'animated',
      width: opts?.width ?? firstRegion.w,
      height: opts?.height ?? firstRegion.h,
      frames,
      ...opts,
    });
  }
}

// ── AnimatedSprite ──

export type PlayMode = 'loop' | 'once' | 'pingpong';

export interface FrameDef {
  /** Image source (Canvas, Image, etc.) */
  image: any;
  /** Optional source rect for sprite sheet cropping */
  sourceRect?: SourceRect;
}

export interface AnimatedSpriteProps extends UINodeOptions {
  /** Array of frames to play */
  frames: (FrameDef | any)[];
  /** Frames per second (default: 12) */
  fps?: number;
  /** Play mode (default: 'loop') */
  mode?: PlayMode;
  /** Auto-play on creation (default: true) */
  autoPlay?: boolean;
  /** Flip all frames horizontally */
  flipX?: boolean;
  /** Flip all frames vertically */
  flipY?: boolean;
}

/**
 * AnimatedSprite — frame sequence animation node.
 *
 * Plays a sequence of images/canvases as animation frames.
 * Useful for: pre-rendered effects, sprite sheet animations,
 * procedural texture playback (rotating planets, fire, water).
 *
 * ```typescript
 * // From an array of canvases (e.g. pre-rendered planet rotation)
 * const planet = new AnimatedSprite({
 *   frames: preRenderedCanvases,
 *   fps: 12, mode: 'loop',
 * });
 *
 * // From a sprite sheet
 * const explosion = sheet.createAnimated(['f1','f2','f3','f4'], { fps: 24, mode: 'once' });
 * ```
 */
export class AnimatedSprite extends UINode {
  private _frames: FrameDef[];
  private _fps: number;
  private _mode: PlayMode;
  private _playing: boolean;
  private _elapsed = 0;
  private _frameIndex = 0;
  private _direction = 1; // 1 = forward, -1 = reverse (for pingpong)
  private _finished = false;
  flipX: boolean;
  flipY: boolean;

  constructor(props: AnimatedSpriteProps) {
    super(props);
    // Normalize frames: accept raw images or FrameDef objects
    this._frames = (props.frames ?? []).map(f =>
      (f && typeof f === 'object' && 'image' in f) ? f : { image: f }
    );
    this._fps = props.fps ?? 12;
    this._mode = props.mode ?? 'loop';
    this._playing = props.autoPlay ?? true;
    this.flipX = props.flipX ?? false;
    this.flipY = props.flipY ?? false;
  }

  /** Current frame index */
  get frameIndex(): number { return this._frameIndex; }
  set frameIndex(v: number) {
    this._frameIndex = Math.max(0, Math.min(v, this._frames.length - 1));
  }

  /** Total number of frames */
  get frameCount(): number { return this._frames.length; }

  /** Whether animation is playing */
  get playing(): boolean { return this._playing; }

  /** Whether a 'once' animation has finished */
  get finished(): boolean { return this._finished; }

  /** Frames per second */
  get fps(): number { return this._fps; }
  set fps(v: number) { this._fps = v; }

  /** Play mode */
  get mode(): PlayMode { return this._mode; }
  set mode(v: PlayMode) { this._mode = v; }

  play(): void {
    this._playing = true;
    this._finished = false;
  }

  pause(): void {
    this._playing = false;
  }

  stop(): void {
    this._playing = false;
    this._frameIndex = 0;
    this._elapsed = 0;
    this._direction = 1;
    this._finished = false;
  }

  /** Reset to first frame and play */
  restart(): void {
    this.stop();
    this.play();
  }

  get $text(): string {
    return `frame=${this._frameIndex + 1}/${this._frames.length}`;
  }

  protected $inspectInfo(): string {
    const state = this._playing ? 'playing' : this._finished ? 'finished' : 'paused';
    return `${state} ${this._fps}fps`;
  }

  $update(dt: number): void {
    super.$update(dt);

    if (!this._playing || this._frames.length === 0) return;

    this._elapsed += dt;
    const frameDuration = 1 / this._fps;

    while (this._elapsed >= frameDuration) {
      this._elapsed -= frameDuration;
      this._advanceFrame();
    }
  }

  private _advanceFrame(): void {
    const last = this._frames.length - 1;

    if (this._mode === 'loop') {
      this._frameIndex = (this._frameIndex + 1) % this._frames.length;
    } else if (this._mode === 'once') {
      if (this._frameIndex < last) {
        this._frameIndex++;
      } else {
        this._playing = false;
        this._finished = true;
        this.$emit('complete');
      }
    } else if (this._mode === 'pingpong') {
      this._frameIndex += this._direction;
      if (this._frameIndex >= last) {
        this._frameIndex = last;
        this._direction = -1;
      } else if (this._frameIndex <= 0) {
        this._frameIndex = 0;
        this._direction = 1;
      }
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    if (this._frames.length === 0) return;
    const frame = this._frames[this._frameIndex];
    if (!frame || !frame.image) return;

    const w = this.width;
    const h = this.height;
    if (w <= 0 || h <= 0) return;

    const needsFlip = this.flipX || this.flipY;
    if (needsFlip) {
      ctx.save();
      ctx.translate(this.flipX ? w : 0, this.flipY ? h : 0);
      ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    }

    const sr = frame.sourceRect;
    if (sr) {
      ctx.drawImage(frame.image, sr.x, sr.y, sr.w, sr.h, 0, 0, w, h);
    } else {
      ctx.drawImage(frame.image, 0, 0, w, h);
    }

    if (needsFlip) {
      ctx.restore();
    }
  }

  /** Create from an array of plain images/canvases */
  static fromImages(images: any[], opts?: Partial<AnimatedSpriteProps>): AnimatedSprite {
    return new AnimatedSprite({
      frames: images.map(img => ({ image: img })),
      ...opts,
    } as AnimatedSpriteProps);
  }
}
