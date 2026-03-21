import { UINode, type UINodeOptions, drawText, wrapText, measureWrappedText } from '@lucid/core';

export interface LabelProps extends UINodeOptions {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  /** Enable auto line-wrapping (default: false) */
  wrap?: boolean;
  /** Line height multiplier (default: 1.4) */
  lineHeight?: number;
  /** Max visible lines, truncates with ellipsis (requires wrap) */
  maxLines?: number;
  /** Vertical alignment (default: 'middle') */
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export class Label extends UINode {
  private _text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  wrap: boolean;
  lineHeight: number;
  maxLines?: number;
  verticalAlign: 'top' | 'middle' | 'bottom';

  // ── AI-visible rendering results ──
  /** Number of rendered lines (updated after each draw) */
  lineCount = 1;
  /** Whether text was truncated by maxLines */
  truncated = false;
  /** Actual rendered lines (updated after each draw) */
  renderedLines: string[] = [];

  constructor(props: LabelProps) {
    super(props);
    this._text = props.text;
    this.fontSize = props.fontSize ?? 16;
    this.fontWeight = props.fontWeight ?? 'normal';
    this.color = props.color ?? '#ffffff';
    this.align = props.align ?? 'left';
    this.wrap = props.wrap ?? false;
    this.lineHeight = props.lineHeight ?? 1.4;
    this.maxLines = props.maxLines;
    this.verticalAlign = props.verticalAlign ?? 'middle';
    this.interactive = false;
  }

  get text(): string { return this._text; }
  set text(v: string) {
    if (this._text === v) return;
    this._text = v;
    this.markDirty();
  }

  get $text() { return this._text; }

  protected $inspectInfo(): string {
    if (!this.wrap) return '';
    const parts: string[] = [];
    if (this.lineCount > 1) parts.push(`${this.lineCount}lines`);
    if (this.truncated) parts.push('truncated');
    return parts.join(' ');
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontWeight} ${this.fontSize}px sans-serif`;

    if (this.wrap && this.width > 0) {
      const result = drawText(ctx, this._text, {
        maxWidth: this.width,
        height: this.height || 9999,
        fontSize: this.fontSize,
        lineHeightMultiplier: this.lineHeight,
        align: this.align,
        verticalAlign: this.verticalAlign,
        maxLines: this.maxLines,
      });
      this.lineCount = result.lines.length;
      this.truncated = result.truncated;
      this.renderedLines = result.lines;
    } else {
      // Original single-line behavior
      ctx.textAlign = this.align;
      ctx.textBaseline = 'middle';
      const x = this.align === 'center' ? this.width / 2 : this.align === 'right' ? this.width : 0;

      const lines = this._text.split('\n');
      this.lineCount = lines.length;
      this.truncated = false;
      this.renderedLines = lines;

      if (lines.length === 1) {
        ctx.fillText(this._text, x, this.height / 2);
      } else {
        const lineH = this.fontSize * this.lineHeight;
        const totalH = lines.length * lineH;
        const startY = (this.height - totalH) / 2 + lineH / 2;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], x, startY + i * lineH);
        }
      }
    }
  }

  /**
   * Measure wrapped content height. Useful for auto-sizing.
   * Call after setting font on ctx (or use in onLayout).
   */
  measureHeight(ctx: CanvasRenderingContext2D): number {
    ctx.font = `${this.fontWeight} ${this.fontSize}px sans-serif`;
    const lineH = this.fontSize * this.lineHeight;
    const m = measureWrappedText(ctx, this._text, this.width, lineH);
    return m.height;
  }
}
