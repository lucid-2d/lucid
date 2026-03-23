/**
 * Web 浏览器平台适配器
 *
 * 支持 touch（移动端）+ mouse（PC 端 fallback）
 * 坐标自动处理 CSS→逻辑像素缩放（移动端视口缩放时 rect ≠ logicSize）
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

  /** Convert CSS pixel coordinates to logical game coordinates */
  private _toLogic(cssX: number, cssY: number, rect: DOMRect): { x: number; y: number } {
    return {
      x: (cssX - rect.left) * (this.logicW / rect.width),
      y: (cssY - rect.top) * (this.logicH / rect.height),
    };
  }

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
      const p = this._toLogic(t.clientX, t.clientY, rect);
      handlers.onStart(p.x, p.y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const p = this._toLogic(t.clientX, t.clientY, rect);
      handlers.onMove(p.x, p.y);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const p = this._toLogic(t.clientX, t.clientY, rect);
      handlers.onEnd(p.x, p.y);
    }, { passive: false });

    // Mouse events (PC fallback)
    let mouseDown = false;
    this.canvas.addEventListener('mousedown', (e) => {
      mouseDown = true;
      const rect = this.canvas.getBoundingClientRect();
      const p = this._toLogic(e.clientX, e.clientY, rect);
      handlers.onStart(p.x, p.y);
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      const rect = this.canvas.getBoundingClientRect();
      const p = this._toLogic(e.clientX, e.clientY, rect);
      handlers.onMove(p.x, p.y);
    });
    this.canvas.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const rect = this.canvas.getBoundingClientRect();
      const p = this._toLogic(e.clientX, e.clientY, rect);
      handlers.onEnd(p.x, p.y);
    });
  }

  requestAnimationFrame(cb: (t: number) => void): number {
    return window.requestAnimationFrame(cb);
  }

  cancelAnimationFrame(id: number): void {
    window.cancelAnimationFrame(id);
  }
}
