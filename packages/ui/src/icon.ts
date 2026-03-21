/**
 * Icon 组件 — UINode 包装器
 * 底层使用 icon-draw.ts 的 Canvas path 绘制
 */

import { UINode, type UINodeOptions } from '@lucid-2d/core';
import { drawIcon, type IconName, type IconStyle } from './icon-draw.js';
import { UIColors } from './tokens.js';

export type { IconName, IconStyle } from './icon-draw.js';
export { drawIcon, ALL_ICON_NAMES, ALL_ICON_STYLES, setIconStyle, getIconStyle } from './icon-draw.js';

export interface IconProps extends UINodeOptions {
  name: IconName;
  size?: number;
  color?: string;
  style?: IconStyle;
}

export class Icon extends UINode {
  name: IconName;
  iconSize: number;
  color: string;
  iconStyle?: IconStyle;

  constructor(props: IconProps) {
    const sz = props.size ?? 20;
    super({ ...props, width: sz, height: sz });
    this.name = props.name;
    this.iconSize = sz;
    this.color = props.color ?? UIColors.text;
    this.iconStyle = props.style;
  }

  get $text() { return this.name; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    drawIcon(ctx, this.name, this.width / 2, this.height / 2, this.iconSize, this.color, this.iconStyle);
  }
}
