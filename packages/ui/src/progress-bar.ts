import { UINode, type UINodeOptions } from '@lucid-2d/core';
import { UIColors } from './tokens.js';

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
    this.color = props.color ?? UIColors.success;
  }

  get value(): number { return this._value; }
  set value(v: number) {
    this._value = Math.max(0, Math.min(1, v));
    this.markDirty();
  }

  get $text() { return `${Math.round(this._value * 100)}%`; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height, r = h / 2;

    // Track
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.fillStyle = UIColors.trackBg;
    ctx.fill();

    // Fill
    if (this._value > 0) {
      const fillW = Math.max(h, w * this._value);
      ctx.beginPath();
      ctx.roundRect(0, 0, fillW, h, r);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }
}
