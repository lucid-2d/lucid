import { UINode, type UINodeOptions } from '@lucid/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';

export interface ButtonProps extends UINodeOptions {
  text: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: string;
}

export class Button extends UINode {
  private _text: string;
  variant: ButtonVariant;
  private _disabled: boolean;
  pressed = false;
  icon?: string;

  constructor(props: ButtonProps) {
    super({ ...props, width: props.width ?? 160, height: props.height ?? 44 });
    this._text = props.text;
    this.variant = props.variant ?? 'primary';
    this._disabled = props.disabled ?? false;
    this.icon = props.icon;
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

    // 按 variant 绘制背景（参照 template 的渐变实现）
    switch (this.variant) {
      case 'primary': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#e94560');
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
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      }
      case 'gold': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#d97706');
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
      case 'danger': {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#e94560');
        grad.addColorStop(1, '#d32f4f');
        ctx.fillStyle = grad;
        ctx.fill();
        break;
      }
      case 'ghost':
        // 无背景
        break;
    }

    // 文字颜色
    const textColors: Record<ButtonVariant, string> = {
      primary: '#ffffff',
      secondary: '#ffffff',
      outline: 'rgba(255,255,255,0.8)',
      gold: '#1a1a2e',
      danger: '#ffffff',
      ghost: 'rgba(255,255,255,0.6)',
    };

    ctx.fillStyle = textColors[this.variant];
    ctx.font = `bold ${h >= 44 ? 16 : 14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._text, w / 2, h / 2);

    ctx.restore();
  }
}
