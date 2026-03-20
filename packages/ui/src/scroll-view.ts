import { UINode, type UINodeOptions } from '@lucid/core';

export interface ScrollViewProps extends UINodeOptions {
  width: number;
  height: number;
}

export class ScrollView extends UINode {
  readonly content: UINode;
  private _scrollY = 0;
  private _contentHeight = 0;

  // 触摸滚动状态
  private _touchStartY = 0;
  private _scrollAtStart = 0;
  private _dragging = false;

  constructor(props: ScrollViewProps) {
    super(props);
    this.interactive = true;
    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.addChild(this.content);

    this.$on('touchstart', (e: any) => {
      this._touchStartY = e.localY;
      this._scrollAtStart = this._scrollY;
      this._dragging = true;
    });

    this.$on('touchmove', (e: any) => {
      if (!this._dragging) return;
      const dy = this._touchStartY - e.localY;
      this._scrollY = this._scrollAtStart + dy;
      this._clamp();
    });

    this.$on('touchend', () => {
      this._dragging = false;
    });
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
  }

  /** $inspect 显示滚动位置 */
  $inspect(depth?: number): string {
    const base = super.$inspect(depth);
    const first = base.split('\n')[0];
    const scrollInfo = this.maxScrollY > 0 ? ` scroll=${Math.round(this._scrollY)}/${this.maxScrollY}` : '';
    return first + scrollInfo +
      (depth === 0 ? '' : '\n' + base.split('\n').slice(1).join('\n')).replace(/\n$/, '');
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
