/**
 * Cross-platform canvas utilities.
 *
 * ```typescript
 * import { createOffscreenCanvas } from '@lucid-2d/engine';
 *
 * const offscreen = createOffscreenCanvas(200, 200);
 * const ctx = offscreen.getContext('2d');
 * // works on Web, WeChat, Douyin, and headless (via registerHeadlessCanvas)
 * ```
 */

import { detectPlatform } from './platform/detect.js';

// ── Headless canvas factory (injected by testing entry, never bundled in production) ──

let _headlessCanvasFactory: ((w: number, h: number) => any) | null = null;

/**
 * Register a factory for creating offscreen canvases in headless (Node.js) mode.
 * Called by `createTestApp()` in `@lucid-2d/engine/testing` — never imported by production code.
 */
export function registerHeadlessCanvas(factory: (w: number, h: number) => any): void {
  _headlessCanvasFactory = factory;
}

/**
 * Create an offscreen canvas for pre-rendering (textures, thumbnails, etc.)
 * Automatically uses the correct API for each platform.
 */
export function createOffscreenCanvas(width: number, height: number): any {
  const platform = detectPlatform();

  if (platform === 'wx') {
    const wx = (globalThis as any).wx;
    if (wx.createOffscreenCanvas) {
      return wx.createOffscreenCanvas({ type: '2d', width, height });
    }
    // Fallback: use a regular canvas
    const c = wx.createCanvas();
    c.width = width;
    c.height = height;
    return c;
  }

  if (platform === 'tt') {
    const tt = (globalThis as any).tt;
    if (tt.createOffscreenCanvas) {
      return tt.createOffscreenCanvas({ type: '2d', width, height });
    }
    const c = tt.createCanvas();
    c.width = width;
    c.height = height;
    return c;
  }

  // Web
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  // Headless (factory registered by createTestApp via testing entry)
  if (_headlessCanvasFactory) {
    return _headlessCanvasFactory(width, height);
  }

  // Browser fallback
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  throw new Error('[createOffscreenCanvas] No canvas API available (install @napi-rs/canvas for headless)');
}
