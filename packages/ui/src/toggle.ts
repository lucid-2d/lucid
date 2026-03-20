import { UINode, type UINodeOptions } from '@lucid/core';

export interface ToggleProps extends UINodeOptions {
  label: string;
  value: boolean;
}

export class Toggle extends UINode {
  private _label: string;
  private _value: boolean;

  constructor(props: ToggleProps) {
    super({ ...props, width: props.width ?? 120, height: props.height ?? 32 });
    this._label = props.label;
    this._value = props.value;
    this.interactive = true;

    this.$on('touchstart', () => { /* pressed state */ });
    this.$on('touchend', () => {
      this._value = !this._value;
      this.$emit('change', this._value);
      this.markDirty();
    });
  }

  get value(): boolean { return this._value; }
  set value(v: boolean) {
    if (this._value === v) return;
    this._value = v;
    this.markDirty();
  }

  get $text() { return this._label; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const trackW = 48, trackH = 26, r = trackH / 2;
    const trackX = this.width - trackW;
    const trackY = (this.height - trackH) / 2;

    // Track
    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, r);
    ctx.fillStyle = this._value ? '#4caf50' : 'rgba(255,255,255,0.2)';
    ctx.fill();

    // Knob
    const knobR = (trackH - 6) / 2;
    const knobX = this._value ? trackX + trackW - 3 - knobR : trackX + 3 + knobR;
    ctx.beginPath();
    ctx.arc(knobX, this.height / 2, knobR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._label, trackX - 8, this.height / 2);
  }
}
