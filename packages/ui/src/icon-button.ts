/**
 * IconButton — 圆形图标按钮（从 template icon-button.ts 迁移）
 */

import { UINode, type UINodeOptions } from '@lucid-2d/core';
import { drawIcon, type IconName } from './icon-draw.js';
import { UIColors } from './tokens.js';

export interface IconButtonProps extends UINodeOptions {
  icon: IconName;
  size?: number;
  iconSize?: number;
  color?: string;
  bgColor?: string;
  badge?: number;
  /** Optional text label below the icon — turns into a vertical "icon + text" button */
  label?: string;
  labelSize?: number;
  labelColor?: string;
}

export class IconButton extends UINode {
  icon: IconName;
  iconSize: number;
  color: string;
  bgColor: string;
  badge?: number;
  label?: string;
  labelSize: number;
  labelColor: string;
  pressed = false;

  constructor(props: IconButtonProps) {
    const sz = props.size ?? 40;
    // With label: expand height to fit icon + text
    const hasLabel = !!props.label;
    const labelH = hasLabel ? (props.labelSize ?? 10) + 6 : 0;
    super({ ...props, width: props.width ?? sz, height: props.height ?? (sz + labelH) });
    this.icon = props.icon;
    this.iconSize = props.iconSize ?? sz * 0.45;
    this.color = props.color ?? UIColors.textLight;
    this.bgColor = props.bgColor ?? UIColors.trackBg;
    this.badge = props.badge;
    this.label = props.label;
    this.labelSize = props.labelSize ?? 10;
    this.labelColor = props.labelColor ?? UIColors.textSecondary;
    this.interactive = true;

    this.$on('touchstart', () => { this.pressed = true; });
    this.$on('touchend', () => {
      if (this.pressed) this.$emit('tap');
      this.pressed = false;
    });
  }

  get $text() {
    const base = this.label ?? this.icon;
    return this.badge ? `${base}(${this.badge})` : base;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const iconAreaH = this.label ? this.height - this.labelSize - 6 : this.height;
    const cx = w / 2;
    const iconCy = iconAreaH / 2;

    ctx.save();
    if (this.pressed) {
      ctx.translate(cx, iconCy);
      ctx.scale(0.9, 0.9);
      ctx.translate(-cx, -iconCy);
    }

    // Background circle (centered in icon area)
    const r = Math.min(w, iconAreaH) / 2;
    ctx.beginPath();
    ctx.arc(cx, iconCy, r, 0, Math.PI * 2);
    ctx.fillStyle = this.pressed ? UIColors.textHint : this.bgColor;
    ctx.fill();

    // Icon
    drawIcon(ctx, this.icon, cx, iconCy, this.iconSize, this.color);

    // Badge
    if (this.badge !== undefined && this.badge > 0) {
      const badgeR = 8;
      const bx = cx + r - badgeR + 4;
      const by = iconCy - r + badgeR - 4;
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = UIColors.primary;
      ctx.fill();
      ctx.fillStyle = UIColors.text;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.badge > 99 ? '99+' : String(this.badge), bx, by);
    }

    ctx.restore();

    // Label text below icon
    if (this.label) {
      ctx.fillStyle = this.labelColor;
      ctx.font = `${this.labelSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.label, cx, iconAreaH + 2);
    }
  }
}
