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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  getScreenInfo(): ScreenInfo {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
      safeTop: 0,
      safeBottom: this.canvas.height,
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
