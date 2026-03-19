/**
 * 平台检测 + 适配器接口
 */

export type PlatformName = 'wx' | 'tt' | 'web';

export interface ScreenInfo {
  width: number;
  height: number;
  dpr: number;
  safeTop: number;
  safeBottom: number;
}

export interface PlatformAdapter {
  readonly name: PlatformName;
  getScreenInfo(): ScreenInfo;
  getCanvas(): any;
  getCtx(): CanvasRenderingContext2D;
  bindTouchEvents(handlers: {
    onStart: (x: number, y: number) => void;
    onMove: (x: number, y: number) => void;
    onEnd: (x: number, y: number) => void;
  }): void;
  requestAnimationFrame(cb: (t: number) => void): number;
  cancelAnimationFrame(id: number): void;
}

/** 自动检测当前平台 */
export function detectPlatform(): PlatformName {
  if (typeof (globalThis as any).tt !== 'undefined' &&
      typeof (globalThis as any).tt.createCanvas === 'function') return 'tt';
  if (typeof (globalThis as any).wx !== 'undefined' &&
      typeof (globalThis as any).wx.createCanvas === 'function') return 'wx';
  return 'web';
}
