/**
 * 微信小游戏平台适配器
 *
 * wx.createCanvas() + wx.onTouchStart + wx.getSystemInfoSync
 */

import type { PlatformAdapter, ScreenInfo } from './detect.js';

declare const wx: any;

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

/** Polyfill missing globals for WeChat Mini Game */
function _polyfillGlobals(): void {
  const g = globalThis as any;
  // Image constructor
  if (typeof g.Image === 'undefined' && typeof wx !== 'undefined') {
    g.Image = function () { return wx.createImage(); };
  }
  // performance.now (iOS 微信小游戏没有 performance 对象)
  if (typeof g.performance === 'undefined') {
    g.performance = { now: () => Date.now() };
  }
}

export class WxAdapter implements PlatformAdapter {
  readonly name = 'wx' as const;
  private canvas: any;
  private ctx: CanvasRenderingContext2D;
  private screenInfo: ScreenInfo;

  constructor() {
    this.canvas = wx.createCanvas();
    const info = wx.getSystemInfoSync();
    const dpr = info.pixelRatio || 1;
    const logicW = info.screenWidth;
    const logicH = info.screenHeight;

    // 高清适配
    this.canvas.width = logicW * dpr;
    this.canvas.height = logicH * dpr;

    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);

    // Canvas 2D API polyfills for WeChat Mini Game
    _polyfillCtx(this.ctx);
    _polyfillGlobals();

    // 安全区域
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
    wx.onTouchStart((e: any) => {
      const t = e.touches[0];
      if (t) handlers.onStart(t.clientX, t.clientY);
    });
    wx.onTouchMove((e: any) => {
      const t = e.touches[0];
      if (t) handlers.onMove(t.clientX, t.clientY);
    });
    wx.onTouchEnd((e: any) => {
      const t = e.changedTouches[0];
      if (t) handlers.onEnd(t.clientX, t.clientY);
    });
  }

  requestAnimationFrame(cb: (t: number) => void): number {
    // 微信小游戏的 requestAnimationFrame 是全局函数，不在 canvas 上
    return (globalThis as any).requestAnimationFrame(cb);
  }

  cancelAnimationFrame(id: number): void {
    (globalThis as any).cancelAnimationFrame(id);
  }
}
