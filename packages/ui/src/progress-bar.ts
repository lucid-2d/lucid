import { UINode, type UINodeOptions } from '@lucid/core';

export interface ProgressBarProps extends UINodeOptions {
  width: number;
  height: number;
  value?: number;
  color?: string;
}

export class ProgressBar extends UINode {
  private _value = 0;
  color: string;

  constructor(props: ProgressBarProps) {
    super(props);
    this._value = Math.max(0, Math.min(1, props.value ?? 0));
    this.color = props.color ?? '#4caf50';
  }

  get value(): number { return this._value; }
  set value(v: number) {
    this._value = Math.max(0, Math.min(1, v));
    this.markDirty();
  }

  $inspect(depth?: number): string {
    const base = super.$inspect(depth);
    const first = base.split('\n')[0];
    return first + ` ${Math.round(this._value * 100)}%` +
      (depth === 0 ? '' : '\n' + base.split('\n').slice(1).join('\n')).replace(/\n$/, '');
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height, r = h / 2;

    // Track
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    // Fill
    if (this._value > 0) {
      const fillW = Math.max(h, w * this._value); // min width = height (full capsule)
      ctx.beginPath();
      ctx.roundRect(0, 0, fillW, h, r);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
}
