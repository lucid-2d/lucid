/**
 * Badge / RedDot / Tag — 角标和标签组件（从 template badge.ts 迁移）
 */

import { UINode, type UINodeOptions } from '@lucid/core';

// ── RedDot ──────────────────────────────────

export class RedDot extends UINode {
  constructor(props?: UINodeOptions) {
    super({ ...props, width: 8, height: 8 });
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(4, 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
  }
}

// ── Badge（数字角标）────────────────────────

export interface BadgeProps extends UINodeOptions {
  count: number;
}

export class Badge extends UINode {
  count: number;

  constructor(props: BadgeProps) {
    super({ ...props, width: 18, height: 18 });
    this.count = props.count;
  }

  get $text() { return String(this.count); }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const text = this.count > 99 ? '99+' : String(this.count);
    ctx.font = 'bold 10px sans-serif';
    const tw = ctx.measureText(text).width;
    const w = Math.max(18, tw + 10);
    const h = 18;
    const r = h / 2;

    ctx.beginPath();
    ctx.roundRect(-w / 2 + 9, 0, w, h, r);
    ctx.fillStyle = '#e94560';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 9, h / 2);
  }
}

// ── Tag（标签）────────────────────────────────

export interface TagProps extends UINodeOptions {
  text: string;
  bgColor?: string;
  textColor?: string;
}

export class Tag extends UINode {
  private _text: string;
  bgColor: string;
  textColor: string;

  constructor(props: TagProps) {
    super({ ...props, width: 48, height: 22 });
    this._text = props.text;
    this.bgColor = props.bgColor ?? '#e94560';
    this.textColor = props.textColor ?? '#ffffff';
  }

  get $text() { return this._text; }

  protected draw(ctx: CanvasRenderingContext2D): void {
    ctx.font = '11px sans-serif';
    const tw = ctx.measureText(this._text).width;
    const w = tw + 14;
    const h = 22;
    const r = 4;

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, r);
    ctx.fillStyle = this.bgColor;
    ctx.fill();

    ctx.fillStyle = this.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._text, w / 2, h / 2);
  }
}
