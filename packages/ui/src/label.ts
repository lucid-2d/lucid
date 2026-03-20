import { UINode, type UINodeOptions } from '@lucid/core';

export interface LabelProps extends UINodeOptions {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export class Label extends UINode {
  private _text: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';

  constructor(props: LabelProps) {
    super(props);
    this._text = props.text;
    this.fontSize = props.fontSize ?? 16;
    this.fontWeight = props.fontWeight ?? 'normal';
    this.color = props.color ?? '#ffffff';
    this.align = props.align ?? 'left';
    this.interactive = false;
  }

  get text(): string { return this._text; }
  set text(v: string) {
    if (this._text === v) return;
    this._text = v;
    this.markDirty();
  }

  get $text() { return this._text; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontWeight} ${this.fontSize}px sans-serif`;
    ctx.textAlign = this.align;
    ctx.textBaseline = 'middle';
    const x = this.align === 'center' ? this.width / 2 : this.align === 'right' ? this.width : 0;

    const lines = this._text.split('\n');
    if (lines.length === 1) {
      ctx.fillText(this._text, x, this.height / 2);
    } else {
      const lineH = this.fontSize * 1.4;
      const totalH = lines.length * lineH;
      const startY = (this.height - totalH) / 2 + lineH / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, startY + i * lineH);
      }
    }
  }
}
