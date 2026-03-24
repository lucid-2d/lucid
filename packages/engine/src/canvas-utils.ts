/**
 * Cross-platform canvas utilities.
 *
 * ```typescript
 * import { createOffscreenCanvas } from '@lucid-2d/engine';
 *
 * const offscreen = createOffscreenCanvas(200, 200);
 * const ctx = offscreen.getContext('2d');
 * // works on Web, WeChat, and Douyin
 * ```
 */

import { detectPlatform } from './platform/detect.js';

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

  // Headless (Node.js with @napi-rs/canvas)
  try {
    const napi = require('@napi-rs/canvas');
    if (napi.createCanvas) {
      return napi.createCanvas(width, height);
    }
  } catch { /* @napi-rs/canvas not available */ }

  // Browser fallback
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }

  throw new Error('[createOffscreenCanvas] No canvas API available (install @napi-rs/canvas for headless)');
}
