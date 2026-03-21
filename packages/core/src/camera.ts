/**
 * Camera — viewport for scrolling/zooming worlds.
 *
 * Transforms the canvas context so scenes larger than the screen
 * render correctly. Supports follow-target, smooth lerp, zoom, and bounds.
 *
 * ```typescript
 * const camera = new Camera({ viewWidth: 390, viewHeight: 844 });
 * camera.follow(player, { smooth: 0.1 });
 *
 * // In render:
 * camera.update(dt);
 * camera.apply(ctx);
 * scene.$render(ctx);
 * camera.restore(ctx);
 * ```
 */

export interface CameraOptions {
  /** Viewport width (screen) */
  viewWidth: number;
  /** Viewport height (screen) */
  viewHeight: number;
  /** World bounds (optional, limits camera movement) */
  worldWidth?: number;
  worldHeight?: number;
}

export interface FollowOptions {
  /** Lerp factor 0..1 (0 = no movement, 1 = instant snap, 0.1 = smooth) */
  smooth?: number;
  /** Offset from target center */
  offsetX?: number;
  offsetY?: number;
  /** Dead zone — camera won't move if target is within this radius of center */
  deadZone?: number;
}

export class Camera {
  /** Camera center position in world coordinates */
  x = 0;
  y = 0;

  /** Zoom level (1 = normal, 2 = zoomed in 2x) */
  zoom = 1;

  /** Viewport size */
  viewWidth: number;
  viewHeight: number;

  /** World bounds (0 = unbounded) */
  worldWidth: number;
  worldHeight: number;

  private _target: { x: number; y: number } | null = null;
  private _followOpts: FollowOptions = {};

  constructor(opts: CameraOptions) {
    this.viewWidth = opts.viewWidth;
    this.viewHeight = opts.viewHeight;
    this.worldWidth = opts.worldWidth ?? 0;
    this.worldHeight = opts.worldHeight ?? 0;
    this.x = this.viewWidth / 2;
    this.y = this.viewHeight / 2;
  }

  /** Move camera center to world position */
  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this._clamp();
  }

  /** Move camera by delta */
  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this._clamp();
  }

  /** Follow a target object (anything with x, y properties) */
  follow(target: { x: number; y: number } | null, opts?: FollowOptions): void {
    this._target = target;
    this._followOpts = opts ?? {};
  }

  /** Update camera (call each frame for smooth follow) */
  update(dt: number): void {
    if (!this._target) return;

    const targetX = this._target.x + (this._followOpts.offsetX ?? 0);
    const targetY = this._target.y + (this._followOpts.offsetY ?? 0);

    const smooth = this._followOpts.smooth ?? 1;
    const deadZone = this._followOpts.deadZone ?? 0;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > deadZone) {
      if (smooth >= 1) {
        this.x = targetX;
        this.y = targetY;
      } else {
        // Frame-rate independent lerp
        const factor = 1 - Math.pow(1 - smooth, dt * 60);
        this.x += dx * factor;
        this.y += dy * factor;
      }
    }

    this._clamp();
  }

  /** Apply camera transform to canvas context (call before rendering) */
  apply(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // Translate so camera center is at screen center, then scale
    const hw = this.viewWidth / 2;
    const hh = this.viewHeight / 2;
    ctx.translate(hw, hh);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  /** Restore canvas context (call after rendering) */
  restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  /** Convert screen coordinates to world coordinates */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const hw = this.viewWidth / 2;
    const hh = this.viewHeight / 2;
    return {
      x: (sx - hw) / this.zoom + this.x,
      y: (sy - hh) / this.zoom + this.y,
    };
  }

  /** Convert world coordinates to screen coordinates */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const hw = this.viewWidth / 2;
    const hh = this.viewHeight / 2;
    return {
      x: (wx - this.x) * this.zoom + hw,
      y: (wy - this.y) * this.zoom + hh,
    };
  }

  /** Visible world rect (for culling) */
  get visibleRect(): { x: number; y: number; width: number; height: number } {
    const hw = (this.viewWidth / 2) / this.zoom;
    const hh = (this.viewHeight / 2) / this.zoom;
    return {
      x: this.x - hw,
      y: this.y - hh,
      width: hw * 2,
      height: hh * 2,
    };
  }

  /** Check if a world-space rect is visible on screen */
  isVisible(wx: number, wy: number, ww: number, wh: number): boolean {
    const r = this.visibleRect;
    return wx + ww > r.x && wx < r.x + r.width &&
           wy + wh > r.y && wy < r.y + r.height;
  }

  /** AI-readable state summary */
  $inspect(): string {
    const parts = [`Camera at(${Math.round(this.x)},${Math.round(this.y)})`];
    if (this.zoom !== 1) parts.push(`zoom=${this.zoom}`);
    if (this._target) parts.push('following');
    const r = this.visibleRect;
    parts.push(`visible(${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)})`);
    return parts.join(' ');
  }

  private _clamp(): void {
    if (this.worldWidth <= 0 || this.worldHeight <= 0) return;

    const hw = (this.viewWidth / 2) / this.zoom;
    const hh = (this.viewHeight / 2) / this.zoom;

    // Clamp so camera doesn't show area outside world bounds
    this.x = Math.max(hw, Math.min(this.worldWidth - hw, this.x));
    this.y = Math.max(hh, Math.min(this.worldHeight - hh, this.y));
  }
}
