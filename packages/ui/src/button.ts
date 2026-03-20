import { UINode, type UINodeOptions } from '@lucid/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost';

export interface ButtonProps extends UINodeOptions {
  text: string;
  variant?: ButtonVariant;
  disabled?: boolean;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: '#e94560', text: '#ffffff' },
  secondary: { bg: 'rgba(17,138,178,0.25)', text: '#ffffff', border: 'rgba(17,138,178,0.5)' },
  outline:   { bg: 'transparent', text: 'rgba(255,255,255,0.8)', border: 'rgba(255,255,255,0.3)' },
  gold:      { bg: '#f59e0b', text: '#1a1a2e' },
  danger:    { bg: '#e94560', text: '#ffffff' },
  ghost:     { bg: 'transparent', text: 'rgba(255,255,255,0.6)' },
};

export class Button extends UINode {
  private _text: string;
  variant: ButtonVariant;
  private _disabled: boolean;
  pressed = false;

  constructor(props: ButtonProps) {
    super({ ...props, width: props.width ?? 160, height: props.height ?? 44 });
    this._text = props.text;
    this.variant = props.variant ?? 'primary';
    this._disabled = props.disabled ?? false;
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
    const colors = VARIANT_COLORS[this.variant];

    ctx.save();
    if (this.pressed) {
      ctx.translate(w / 2, h / 2);
      ctx.scale(0.95, 0.95);
      ctx.translate(-w / 2, -h / 2);
    }
    if (this._disabled) ctx.globalAlpha *= 0.4;

    // Background
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    if (colors.bg !== 'transparent') {
      ctx.fillStyle = colors.bg;
      ctx.fill();
    }
    if (colors.border) {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${h >= 44 ? 16 : 14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._text, w / 2, h / 2);

    ctx.restore();
  }
}
