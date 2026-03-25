/**
 * boot() — Universal game entry point
 *
 * Auto-detects platform, creates app, starts game loop.
 * Single entry point for Web, WeChat, and Douyin.
 *
 * ```typescript
 * import { boot } from '@lucid-2d/engine';
 *
 * boot({
 *   debug: true,
 *   assetRoot: 'img/',
 *   async onReady(app) {
 *     await app.router.push(new MenuScene(app)); // await if scene has preload()
 *   },
 * });
 * ```
 */

import { createApp, type App, type AppOptions } from './app.js';
import { detectPlatform } from './platform/detect.js';

export interface BootOptions extends Omit<AppOptions, 'platform' | 'canvas' | 'adapter'> {
  /** Canvas element (web only). If not provided, auto-finds by canvasId or creates fullscreen. */
  canvas?: HTMLCanvasElement;
  /** Canvas element id to query from DOM (web only, default: 'game'). */
  canvasId?: string;
  /** Auto-create fullscreen canvas if none found (web only, default: true). */
  autoCanvas?: boolean;
  /**
   * Called after app is created and started. Push your initial scene here.
   * If async, boot() awaits it before resolving.
   */
  onReady?: (app: App) => Promise<void> | void;
}

/**
 * Universal game entry point — auto-detects platform, creates app, starts game loop.
 *
 * Replaces the manual main.ts / main-wx.ts pattern:
 * ```typescript
 * // Before (5 lines):
 * const canvas = document.getElementById('game');
 * const app = createApp({ platform: 'web', canvas, debug: true });
 * app.router.push(new MenuScene(app));
 * app.start();
 * window._app = app;
 *
 * // After (1 call):
 * boot({ debug: true, onReady: (app) => app.router.push(new MenuScene(app)) });
 * ```
 */
export async function boot(options: BootOptions = {}): Promise<App> {
  const platform = detectPlatform();

  let canvas: HTMLCanvasElement | undefined = options.canvas;

  // Web: find or auto-create canvas
  if (platform === 'web' && !canvas && typeof document !== 'undefined') {
    const canvasId = options.canvasId ?? 'game';
    const found = document.getElementById(canvasId);
    if (found) {
      canvas = found as HTMLCanvasElement;
    } else if (options.autoCanvas !== false) {
      canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Auto-created canvas: set CSS size (WebAdapter won't override)
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.style.display = 'block';
      canvas.style.margin = '0';
      document.body.style.margin = '0';
      document.body.style.overflow = 'hidden';
      document.body.appendChild(canvas);
    }
  }

  const { canvasId: _, autoCanvas: __, onReady, ...rest } = options;

  const app = createApp({
    platform,
    ...(platform === 'web' && canvas ? { canvas } : {}),
    ...rest,
  });

  // Enforce template-only scenes in production
  app.router._skipTemplateValidation = false;

  // Expose for AI agent / Playwright debugging
  if (platform === 'web' && typeof window !== 'undefined') {
    (window as any)._app = app;
  }

  // onReady BEFORE start — so preload/push complete before first render frame
  // (avoids first-frame blank when initial scene has async preload)
  if (onReady) {
    await onReady(app);
  }

  app.start();

  return app;
}
