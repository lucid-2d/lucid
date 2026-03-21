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
}

export class IconButton extends UINode {
  icon: IconName;
  iconSize: number;
  color: string;
  bgColor: string;
  badge?: number;
  pressed = false;

  constructor(props: IconButtonProps) {
    const sz = props.size ?? 40;
    super({ ...props, width: sz, height: sz });
    this.icon = props.icon;
    this.iconSize = props.iconSize ?? sz * 0.45;
    this.color = props.color ?? UIColors.textLight;
    this.bgColor = props.bgColor ?? UIColors.trackBg;
    this.badge = props.badge;
    this.interactive = true;

    this.$on('touchstart', () => { this.pressed = true; });
    this.$on('touchend', () => {
      if (this.pressed) this.$emit('tap');
      this.pressed = false;
    });
  }

  get $text() {
    return this.badge ? `${this.icon}(${this.badge})` : this.icon;
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const sz = this.width;
    const cx = sz / 2, cy = sz / 2;

    ctx.save();
    if (this.pressed) {
      ctx.translate(cx, cy);
      ctx.scale(0.9, 0.9);
      ctx.translate(-cx, -cy);
    }

    // Background circle
    ctx.beginPath();
    ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.pressed ? UIColors.textHint : this.bgColor;
    ctx.fill();

    // Icon
    drawIcon(ctx, this.icon, cx, cy, this.iconSize, this.color);

    // Badge
    if (this.badge !== undefined && this.badge > 0) {
      const badgeR = 8;
      const bx = sz - badgeR + 2;
      const by = badgeR - 2;
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
  }
}
