import { UINode, type UINodeOptions } from '@lucid/core';
import { UIColors } from './tokens.js';

export interface ToggleProps extends UINodeOptions {
  label: string;
  value: boolean;
  accentColor?: string;
}

export class Toggle extends UINode {
  private _label: string;
  private _value: boolean;
  private _accentColor: string;

  /** 动画进度 0~1（0=OFF, 1=ON），用于绘制滑块位置和颜色插值 */
  progress: number;

  constructor(props: ToggleProps) {
    super({ ...props, width: props.width ?? 160, height: props.height ?? 32 });
    this._label = props.label;
    this._value = props.value;
    this._accentColor = props.accentColor ?? UIColors.success;
    this.progress = props.value ? 1 : 0;
    this.interactive = true;

    this.$on('touchend', () => {
      this._value = !this._value;
      this.$emit('change', this._value);
      this.$animate({ progress: this._value ? 1 : 0 }, { duration: 200, easing: 'easeOut' });
    });
  }

  get value(): boolean { return this._value; }
  set value(v: boolean) {
    if (this._value === v) return;
    this._value = v;
    this.$animate({ progress: v ? 1 : 0 }, { duration: 200, easing: 'easeOut' });
  }

  get $text() { return this._label; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const trackW = 48, trackH = 26;
    const r = trackH / 2;
    const trackX = this.width - trackW;
    const trackY = (this.height - trackH) / 2;
    const t = this.progress;

    // Label
    ctx.fillStyle = UIColors.textLight;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._label, 0, this.height / 2);

    // 轨道颜色插值（OFF灰 → ON accent）
    const offR = 255, offG = 255, offB = 255, offA = 0.2;
    const hex = this._accentColor.replace('#', '');
    const onR = parseInt(hex.substring(0, 2), 16) || 76;
    const onG = parseInt(hex.substring(2, 4), 16) || 175;
    const onB = parseInt(hex.substring(4, 6), 16) || 80;
    const cr = Math.round(offR + (onR - offR) * t);
    const cg = Math.round(offG + (onG - offG) * t);
    const cb = Math.round(offB + (onB - offB) * t);
    const ca = offA + (1 - offA) * t;

    ctx.beginPath();
    ctx.roundRect(trackX, trackY, trackW, trackH, r);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${ca})`;
    ctx.fill();

    // 滑块位置插值
    const knobR = (trackH - 6) / 2;
    const knobPad = 3;
    const knobOffX = trackX + knobPad + knobR;
    const knobOnX = trackX + trackW - knobPad - knobR;
    const knobCx = knobOffX + (knobOnX - knobOffX) * t;
    const knobCy = this.height / 2;

    // 滑块阴影
    ctx.beginPath();
    ctx.arc(knobCx, knobCy, knobR + 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fill();

    // 滑块本体
    ctx.beginPath();
    ctx.arc(knobCx, knobCy, knobR, 0, Math.PI * 2);
    ctx.fillStyle = UIColors.text;
    ctx.fill();
  }
}
