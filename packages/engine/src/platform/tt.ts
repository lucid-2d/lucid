/**
 * 抖音小游戏平台适配器
 *
 * API 与微信小游戏几乎一致，全局对象从 wx 换成 tt
 */

import type { PlatformAdapter, ScreenInfo } from './detect.js';

declare const tt: any;

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
    return this.canvas.requestAnimationFrame(cb);
  }

  cancelAnimationFrame(id: number): void {
    this.canvas.cancelAnimationFrame(id);
  }
}
