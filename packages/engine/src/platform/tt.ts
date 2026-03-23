/**
 * 抖音小游戏平台适配器
 *
 * API 与微信小游戏几乎一致，全局对象从 wx 换成 tt
 */

import type { PlatformAdapter, ScreenInfo } from './detect.js';

declare const tt: any;

/** Polyfill missing Canvas 2D methods */
function _polyfillCtx(ctx: any): void {
  if (!ctx.roundRect) {
    ctx.roundRect = function (x: number, y: number, w: number, h: number, radii?: number | number[]) {
      const r = typeof radii === 'number' ? radii : Array.isArray(radii) ? radii[0] ?? 0 : 0;
      const radius = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };
  }
}

/** Polyfill missing globals for Douyin Mini Game */
function _polyfillGlobals(): void {
  const g = globalThis as any;
  if (typeof g.Image === 'undefined' && typeof tt !== 'undefined') {
    g.Image = function () { return tt.createImage(); };
  }
  if (typeof g.performance === 'undefined') {
    g.performance = { now: () => Date.now() };
  }
}

export class TtAdapter implements PlatformAdapter {
  readonly name = 'tt' as const;
  private canvas: any;
  private ctx: CanvasRenderingContext2D;
  private screenInfo: ScreenInfo;

  constructor() {
    this.canvas = tt.createCanvas();
    const info = tt.getSystemInfoSync();
    const dpr = info.pixelRatio || 1;
    const logicW = info.screenWidth;
    const logicH = info.screenHeight;

    this.canvas.width = logicW * dpr;
    this.canvas.height = logicH * dpr;

    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);

    _polyfillCtx(this.ctx);
    _polyfillGlobals();

    const safeArea = info.safeArea || { top: 0, bottom: logicH };
    this.screenInfo = {
      width: logicW,
      height: logicH,
      dpr,
      safeTop: safeArea.top,
      safeBottom: safeArea.bottom,
    };
  }

  getScreenInfo(): ScreenInfo { return this.screenInfo; }
  getCanvas() { return this.canvas; }
  getCtx() { return this.ctx; }

  bindTouchEvents(handlers: {
    onStart: (x: number, y: number) => void;
    onMove: (x: number, y: number) => void;
    onEnd: (x: number, y: number) => void;
  }): void {
    tt.onTouchStart((e: any) => {
      const t = e.touches[0];
      if (t) handlers.onStart(t.clientX, t.clientY);
    });
    tt.onTouchMove((e: any) => {
      const t = e.touches[0];
      if (t) handlers.onMove(t.clientX, t.clientY);
    });
    tt.onTouchEnd((e: any) => {
      const t = e.changedTouches[0];
      if (t) handlers.onEnd(t.clientX, t.clientY);
    });
  }

  requestAnimationFrame(cb: (t: number) => void): number {
    // 抖音小游戏的 requestAnimationFrame 是全局函数
    return (globalThis as any).requestAnimationFrame(cb);
  }

  cancelAnimationFrame(id: number): void {
    (globalThis as any).cancelAnimationFrame(id);
  }
}
