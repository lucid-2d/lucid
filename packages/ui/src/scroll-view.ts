import { UINode, type UINodeOptions } from '@lucid-2d/core';

export interface ScrollViewProps extends UINodeOptions {
  width: number;
  height: number;
  /** Pixels of movement before switching from tap to scroll mode (default: 5) */
  scrollThreshold?: number;
}

export class ScrollView extends UINode {
  readonly content: UINode;
  private _scrollY = 0;
  private _contentHeight = 0;

  // Touch state
  private _touchStartY = 0;
  private _touchStartX = 0;
  private _scrollAtStart = 0;
  private _isScrolling = false;
  private _touchActive = false;
  private _scrollThreshold: number;

  constructor(props: ScrollViewProps) {
    super(props);
    this.interactive = true;
    this._scrollThreshold = props.scrollThreshold ?? 5;
    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.addChild(this.content);
  }

  /**
   * Override hitTest: ScrollView always captures touch within its bounds,
   * preventing children from stealing scroll gestures.
   */
  hitTest(wx: number, wy: number): UINode | null {
    if (!this.visible) return null;
    const lx = wx - this.x;
    const ly = wy - this.y;
    if (lx >= 0 && lx <= this.width && ly >= 0 && ly <= this.height) {
      return this; // Always capture — we decide tap vs scroll in touchend
    }
    return null;
  }

  /**
   * Handle touch events internally.
   * Called by the engine's touch bridge via $emit.
   */
  $emit(event: string, ...args: any[]): void {
    if (event === 'touchstart') {
      const e = args[0] as { localX: number; localY: number; worldX: number; worldY: number };
      this._touchStartY = e.localY;
      this._touchStartX = e.localX;
      this._scrollAtStart = this._scrollY;
      this._isScrolling = false;
      this._touchActive = true;
    } else if (event === 'touchmove') {
      if (!this._touchActive) return;
      const e = args[0] as { localX: number; localY: number };
      const dy = this._touchStartY - e.localY;
      if (!this._isScrolling && Math.abs(dy) > this._scrollThreshold) {
        this._isScrolling = true;
      }
      if (this._isScrolling) {
        this._scrollY = this._scrollAtStart + dy;
        this._clamp();
      }
    } else if (event === 'touchend') {
      if (this._touchActive && !this._isScrolling) {
        // Was a tap, not a scroll — find and tap the child underneath
        const e = args[0] as { localX: number; localY: number; worldX: number; worldY: number };
        this._forwardTap(e.localX, e.localY);
      }
      this._touchActive = false;
      this._isScrolling = false;
    }

    // Still emit for external listeners
    super.$emit(event, ...args);
  }

  /** Find the interactive child under the tap point and emit tap on it */
  private _forwardTap(localX: number, localY: number): void {
    // Ensure content.y is in sync with scroll position
    this.content.y = -this._scrollY;
    // hitTestContent uses node positions (content.y = -scrollY handles offset)
    const hit = this._hitTestContent(this.content, localX, localY);
    if (hit && hit !== this) {
      // Compute coordinates local to the hit node
      const nodeLocal = this._toNodeLocal(hit, localX, localY);
      const event = { localX: nodeLocal.x, localY: nodeLocal.y, worldX: localX, worldY: localY };
      hit.$emit('touchstart', event);
      hit.$emit('touchend', event);
    }
  }

  /** Convert ScrollView-local coords to a descendant node's local coords */
  private _toNodeLocal(node: UINode, sx: number, sy: number): { x: number; y: number } {
    // Walk up from node to content, accumulating offsets
    const chain: UINode[] = [];
    let n: UINode | null = node;
    while (n && n !== this) {
      chain.push(n);
      n = n.$parent;
    }
    let x = sx, y = sy;
    for (let i = chain.length - 1; i >= 0; i--) {
      x -= chain[i].x;
      y -= chain[i].y;
    }
    return { x, y };
  }

  /** Recursive hitTest within content (local coordinates) */
  private _hitTestContent(node: UINode, x: number, y: number): UINode | null {
    if (!node.visible) return null;
    const lx = x - node.x;
    const ly = y - node.y;

    // Check children in reverse (top-most first)
    const children = node.$children;
    for (let i = children.length - 1; i >= 0; i--) {
      const hit = this._hitTestContent(children[i], lx, ly);
      if (hit) return hit;
    }

    // Check self
    if (node.interactive && lx >= 0 && lx <= node.width && ly >= 0 && ly <= node.height) {
      return node;
    }
    return null;
  }

  get scrollY(): number { return this._scrollY; }

  get contentHeight(): number { return this._contentHeight; }
  set contentHeight(v: number) {
    this._contentHeight = v;
    this._clamp();
  }

  get maxScrollY(): number {
    return Math.max(0, this._contentHeight - this.height);
  }

  scrollTo(y: number): void {
    this._scrollY = y;
    this._clamp();
  }

  private _clamp(): void {
    this._scrollY = Math.max(0, Math.min(this._scrollY, this.maxScrollY));
    this.content.y = -this._scrollY;
  }

  protected $inspectInfo(): string {
    if (this.maxScrollY <= 0) return '';
    return `scroll=${Math.round(this._scrollY)}/${this.maxScrollY}`;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    // Clip to viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    // Offset content by scrollY
    this.content.y = -this._scrollY;

    ctx.restore();
  }
}
