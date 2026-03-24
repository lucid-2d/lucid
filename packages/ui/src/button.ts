import { UINode, type UINodeOptions } from '@lucid-2d/core';
import { UIColors } from './tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';

export interface ButtonProps extends UINodeOptions {
  text: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: string;
  fontSize?: number;
}

export class Button extends UINode {
  private _text: string;
  variant: ButtonVariant;
  private _disabled: boolean;
  pressed = false;
  icon?: string;
  fontSize?: number;

  constructor(props: ButtonProps) {
    super({ ...props, width: props.width ?? 160, height: props.height ?? 44 });
    this._text = props.text;
    this.variant = props.variant ?? 'primary';
    this._disabled = props.disabled ?? false;
    this.icon = props.icon;
    this.fontSize = props.fontSize;
    this.interactive = true;

    this.$on('touchstart', () => {
      if (!this._disabled) this.pressed = true;
    });

    this.$on('touchend', () => {
      if (this.pressed && !this._disabled) {
        this.$emit('tap');
      }
      this.pressed = false;
    });
  }

  get text(): string { return this._text; }
  set text(v: string) {
    if (this._text === v) return;
    this._text = v;
    this.markDirty();
  }

  get disabled(): boolean { return this._disabled; }
  set disabled(v: boolean) { this._disabled = v; }

  get $text() { return this._text; }
  get $disabled() { return this._disabled; }
  get $highlighted() { return this.pressed; }
  protected $inspectInfo(): string {
    return this.variant !== 'primary' ? this.variant : '';
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width, h = this.height;
    const r = Math.min(h / 2, 10);

    ctx.save();

    // 按下缩放
    if (this.pressed) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(0.95, 0.95);
      ctx.translate(-w / 2, -h / 2);
    }
    if (this._disabled) ctx.globalAlpha *= 0.4;

    // 绘制圆角路径
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);

    // 按 variant 绘制背景
    switch (this.variant) {
      case 'primary': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, UIColors.primary);
        grad.addColorStop(1, '#c73a52');
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
      case 'secondary': {
        ctx.fillStyle = 'rgba(17,138,178,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(17,138,178,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
      case 'outline': {
        ctx.strokeStyle = UIColors.textHint;
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
      case 'gold': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, UIColors.goldStart);
        grad.addColorStop(1, UIColors.goldEnd);
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
      case 'danger': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, UIColors.dangerStart);
        grad.addColorStop(1, UIColors.dangerEnd);
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
      case 'ghost':
        break;
    }

    // 文字颜色
    const textColors: Record<ButtonVariant, string> = {
      primary: UIColors.text,
      secondary: UIColors.text,
      outline: UIColors.textLight,
      gold: '#1a1a2e',
      danger: UIColors.text,
      ghost: UIColors.textMuted,
    };

    ctx.fillStyle = textColors[this.variant];
    const fs = this.fontSize ?? (h >= 44 ? 16 : 14);
    ctx.font = `bold ${fs}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._text, w / 2, h / 2);

    ctx.restore();
  }
}
