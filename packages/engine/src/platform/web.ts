/**
 * Web 浏览器平台适配器
 *
 * 支持 touch（移动端）+ mouse（PC 端 fallback）
 */

import type { PlatformAdapter, ScreenInfo } from './detect.js';

export class WebAdapter implements PlatformAdapter {
  readonly name = 'web' as const;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private logicW: number;
  private logicH: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    // 逻辑尺寸 = CSS 尺寸
    this.logicW = canvas.width;
    this.logicH = canvas.height;

    // 物理像素 = 逻辑 × DPR（高清适配核心）
    canvas.width = this.logicW * this.dpr;
    canvas.height = this.logicH * this.dpr;
    // CSS 尺寸保持逻辑像素
    canvas.style.width = this.logicW + 'px';
    canvas.style.height = this.logicH + 'px';

    this.ctx = canvas.getContext('2d')!;
    // 缩放坐标系，后续所有绘制使用逻辑像素
    this.ctx.scale(this.dpr, this.dpr);
  }

  getScreenInfo(): ScreenInfo {
    return {
      width: this.logicW,
      height: this.logicH,
      dpr: this.dpr,
      safeTop: 0,
      safeBottom: this.logicH,
    };
  }

  getCanvas() { return this.canvas; }
  getCtx() { return this.ctx; }

  bindTouchEvents(handlers: {
    onStart: (x: number, y: number) => void;
    onMove: (x: number, y: number) => void;
    onEnd: (x: number, y: number) => void;
  }): void {
    // Touch events (mobile)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      handlers.onStart(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      handlers.onMove(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      handlers.onEnd(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    // Mouse events (PC fallback)
    let mouseDown = false;
    this.canvas.addEventListener('mousedown', (e) => {
      mouseDown = true;
      handlers.onStart(e.offsetX, e.offsetY);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (mouseDown) handlers.onMove(e.offsetX, e.offsetY);
    });
    this.canvas.addEventListener('mouseup', (e) => {
      if (mouseDown) {
        mouseDown = false;
        handlers.onEnd(e.offsetX, e.offsetY);
      }
    });
  }

  requestAnimationFrame(cb: (t: number) => void): number {
    return window.requestAnimationFrame(cb);
  }

  cancelAnimationFrame(id: number): void {
    window.cancelAnimationFrame(id);
  }
}
