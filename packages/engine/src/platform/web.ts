/**
 * Web 浏览器平台适配器
 *
 * 支持 touch（移动端）+ mouse（PC 端 fallback）
 * 坐标自动处理 CSS→逻辑像素缩放（移动端视口缩放时 rect ≠ logicSize）
 */

import type { PlatformAdapter, ScreenInfo } from './detect.js';

/** Detect safe area insets via CSS env variables (notch/dynamic island) */
function _detectSafeArea(): { top: number; bottom: number } {
  if (typeof document === 'undefined') return { top: 0, bottom: 0 };
  try {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-9999px;top:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
    document.body.appendChild(el);
    const style = getComputedStyle(el);
    const top = parseInt(style.paddingTop) || 0;
    const bottom = parseInt(style.paddingBottom) || 0;
    document.body.removeChild(el);
    return { top, bottom };
  } catch {
    return { top: 0, bottom: 0 };
  }
}

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
    // CSS 尺寸由开发者控制（响应式 CSS / boot 自动创建时设置）
    // 不设置 inline style，避免覆盖开发者的 CSS 规则

    this.ctx = canvas.getContext('2d')!;
    // 缩放坐标系，后续所有绘制使用逻辑像素
    this.ctx.scale(this.dpr, this.dpr);
  }

  getScreenInfo(): ScreenInfo {
    const safe = _detectSafeArea();
    return {
      width: this.logicW,
      height: this.logicH,
      dpr: this.dpr,
      safeTop: safe.top,
      safeBottom: this.logicH - safe.bottom,
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
