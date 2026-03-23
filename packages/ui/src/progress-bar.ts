import { UINode, type UINodeOptions } from '@lucid-2d/core';
import { UIColors } from './tokens.js';

export interface ColorStop {
  /** Value threshold (0..1) */
  at: number;
  /** Color at this threshold */
  color: string;
}

export interface ProgressBarProps extends UINodeOptions {
  width: number;
  height: number;
  value?: number;
  color?: string;
  /** Value-based color stops (overrides color) */
  colorStops?: ColorStop[];
  /** Overlay label text (e.g. "23/50") */
  label?: string;
  /** Label color (default: white) */
  labelColor?: string;
  /** Label font size (default: auto based on height) */
  labelFontSize?: number;
}

export class ProgressBar extends UINode {
  private _value = 0;
  color: string;
  colorStops?: ColorStop[];
  label?: string;
  labelColor: string;
  labelFontSize?: number;

  constructor(props: ProgressBarProps) {
    super(props);
    this._value = Math.max(0, Math.min(1, props.value ?? 0));
    this.color = props.color ?? UIColors.success;
    this.colorStops = props.colorStops;
    this.label = props.label;
    this.labelColor = props.labelColor ?? '#ffffff';
    this.labelFontSize = props.labelFontSize;
  }

  get value(): number { return this._value; }
  set value(v: number) {
    this._value = Math.max(0, Math.min(1, v));
    this.markDirty();
  }

  get $text() {
    if (this.label) return `${Math.round(this._value * 100)}% "${this.label}"`;
    return `${Math.round(this._value * 100)}%`;
  }

  /** Resolve fill color based on value and colorStops */
  private _resolveColor(): string {
    if (!this.colorStops || this.colorStops.length === 0) return this.color;

    const stops = this.colorStops.sort((a, b) => a.at - b.at);
    // Find the stop at or below current value
    let resolved = stops[0].color;
    for (const stop of stops) {
      if (this._value >= stop.at) resolved = stop.color;
      else break;
    }
    return resolved;
  }

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
      ctx.fillStyle = this._resolveColor();
      ctx.fill();
    }

    // Label overlay
    if (this.label) {
      const fontSize = this.labelFontSize ?? Math.max(10, Math.round(h * 0.6));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = this.labelColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.label, w / 2, h / 2);
    }
  }
}
