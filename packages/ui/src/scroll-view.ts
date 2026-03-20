import { UINode, type UINodeOptions } from '@lucid/core';

export interface ScrollViewProps extends UINodeOptions {
  width: number;
  height: number;
}

export class ScrollView extends UINode {
  readonly content: UINode;
  private _scrollY = 0;
  private _contentHeight = 0;

  constructor(props: ScrollViewProps) {
    super(props);
    this.content = new UINode({ id: (props.id ?? '') + '-content' });
    this.addChild(this.content);
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
    const scrollInfo = this.maxScrollY > 0 ? ` scroll=${this._scrollY}/${this.maxScrollY}` : '';
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
