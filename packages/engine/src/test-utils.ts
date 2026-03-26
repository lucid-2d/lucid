/**
 * Test Utilities — AI-friendly testing helpers for Lucid games
 *
 * - createTestApp(): one-line headless app creation
 * - tap(app, id): simulate tap by node id
 * - touch(app, x, y): simulate touch at coordinates
 * - assertTree(app, pattern): fuzzy pattern matching on $inspect output
 * - generateTestCode(records): convert recorded interactions to vitest code
 */

import { createApp, type App, type AppOptions } from './app.js';
import type { InteractionRecord } from '@lucid-2d/core';
import { detectPlatform, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
import { registerHeadlessCanvas } from './canvas-utils.js';
import { createRequire as _nodeCreateRequire } from 'module';

// Universal require that works in both CJS and ESM (test-utils is Node.js-only)
const _cjsRequire: NodeRequire = typeof require !== 'undefined'
  ? require
  : _nodeCreateRequire(process.cwd() + '/__lucid.cjs');

// Cache @napi-rs/canvas module — native binary load is expensive (~5-8s cold),
// caching ensures it's only paid once per worker process.
let _napiCanvas: any = null;
function getNapiCanvas(): any {
  if (!_napiCanvas) {
    // Try normal require first
    try {
      _napiCanvas = _cjsRequire('@napi-rs/canvas');
    } catch {
      // Fallback: resolve from the game project's cwd (for tsx/ts-node scripts
      // where tsconfig paths point to Lucid source but @napi-rs/canvas is in the game's node_modules)
      try {
        const resolved = _cjsRequire.resolve('@napi-rs/canvas', { paths: [process.cwd()] });
        _napiCanvas = _cjsRequire(resolved);
      } catch {
        throw new Error(
          '[lucid] @napi-rs/canvas is required for headless rendering.\n' +
          'Install it: pnpm add -D @napi-rs/canvas'
        );
      }
    }
  }
  return _napiCanvas;
}

// ── System CJK font auto-detection ──

let _cjkFontsRegistered = false;

/** Well-known CJK font paths per platform */
const CJK_FONT_CANDIDATES: Array<{ path: string; family: string }> = [
  // macOS
  { path: '/System/Library/Fonts/STHeiti Medium.ttc', family: 'sans-serif' },
  { path: '/System/Library/Fonts/Hiragino Sans GB.ttc', family: 'sans-serif' },
  { path: '/System/Library/Fonts/Supplemental/Songti.ttc', family: 'serif' },
  { path: '/Library/Fonts/Arial Unicode.ttf', family: 'sans-serif' },
  // Linux (common distro paths)
  { path: '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', family: 'sans-serif' },
  { path: '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', family: 'sans-serif' },
  { path: '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc', family: 'sans-serif' },
  { path: '/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc', family: 'sans-serif' },
  // Windows
  { path: 'C:\\Windows\\Fonts\\msyh.ttc', family: 'sans-serif' },
  { path: 'C:\\Windows\\Fonts\\simhei.ttf', family: 'sans-serif' },
];

const LUCID_CJK_FAMILY = 'LucidCJK';

function registerSystemCJKFonts(napiCanvas: any): void {
  if (_cjkFontsRegistered) return;
  _cjkFontsRegistered = true;

  const fs = _cjsRequire('fs');
  const GlobalFonts = napiCanvas.GlobalFonts;
  if (!GlobalFonts?.registerFromPath) return;

  for (const { path } of CJK_FONT_CANDIDATES) {
    try {
      if (fs.existsSync(path)) {
        // Register as dedicated family — avoids conflicts with built-in fonts
        // (e.g. built-in "Courier New" has no CJK, registering over it won't help)
        GlobalFonts.registerFromPath(path, LUCID_CJK_FAMILY);
        break;
      }
    } catch { /* skip */ }
  }
}

/**
 * Patch ctx.font setter to auto-append CJK fallback.
 * @napi-rs/canvas has no browser-like automatic font fallback,
 * so `ctx.font = '20px "Courier New"'` would show □□□ for Chinese.
 * This patches it to `'20px "Courier New", LucidCJK'`.
 */
function patchCtxCJKFallback(ctx: any): void {
  const proto = Object.getPrototypeOf(ctx);
  const origDesc = Object.getOwnPropertyDescriptor(proto, 'font');
  if (!origDesc?.set) return;

  Object.defineProperty(ctx, 'font', {
    get() { return origDesc.get!.call(this); },
    set(value: string) {
      if (typeof value === 'string' && !value.includes(LUCID_CJK_FAMILY)) {
        value = value + ', ' + LUCID_CJK_FAMILY;
      }
      origDesc.set!.call(this, value);
    },
    configurable: true,
  });
}

// ── Mock Canvas ──

function createMockCanvas(w = 390, h = 844): any {
  // Full Canvas 2D API stub — all methods are no-ops, works in any JS environment
  // width/height use LOGICAL pixels (matching real canvas element behavior).
  // WebAdapter reads canvas.width as logical size and multiplies by DPR for physical buffer.
  const noop = () => {};
  const gradient = { addColorStop: noop };
  const mockCtx = {
    // State
    save: noop, restore: noop,
    // Transform
    translate: noop, scale: noop, rotate: noop, transform: noop, setTransform: noop,
    resetTransform: noop, getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },
    // Compositing
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    // Drawing
    clearRect: noop, fillRect: noop, strokeRect: noop,
    fillText: noop, strokeText: noop, measureText() { return { width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }; },
    drawImage: noop,
    // Path
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    bezierCurveTo: noop, quadraticCurveTo: noop,
    arc: noop, arcTo: noop, ellipse: noop, rect: noop, roundRect: noop,
    fill: noop, stroke: noop, clip: noop, isPointInPath() { return false; }, isPointInStroke() { return false; },
    // Gradient / Pattern
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    createConicGradient() { return gradient; },
    createPattern() { return null; },
    // Line
    setLineDash: noop, getLineDash() { return []; }, lineDashOffset: 0,
    lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', miterLimit: 10,
    // Text
    font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic',
    direction: 'ltr', fontKerning: 'auto',
    // Shadow
    shadowBlur: 0, shadowColor: 'rgba(0,0,0,0)', shadowOffsetX: 0, shadowOffsetY: 0,
    // Fill / Stroke style
    fillStyle: '#000', strokeStyle: '#000',
    // Pixel manipulation
    createImageData(w: number, h: number) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    getImageData(x: number, y: number, w: number, h: number) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData: noop,
    // Filter
    filter: 'none',
    // Canvas ref
    canvas: null as any,
  };

  return {
    width: w,
    height: h,
    style: { width: '', height: '' },
    getContext: () => mockCtx,
    getBoundingClientRect: () => ({
      x: 0, y: 0, width: w, height: h,
      top: 0, left: 0, right: w, bottom: h,
      toJSON: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb: any) => setTimeout(cb, 16),
    cancelAnimationFrame: (id: any) => clearTimeout(id),
  };
}

// ── Headless Adapter ──

// Reuse native canvas instances to avoid Skia panic when multiple createTestApp
// calls create/destroy canvases in the same worker thread (#28).
const _canvasCache = new Map<string, { canvas: any; ctx: any }>();

function getOrCreateCanvas(w: number, h: number, napiCanvas: any): { canvas: any; ctx: any } {
  const key = `${w}x${h}`;
  let cached = _canvasCache.get(key);
  if (!cached) {
    const canvas = napiCanvas.createCanvas(w * 2, h * 2);
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    patchCtxCJKFallback(ctx);
    cached = { canvas, ctx };
    _canvasCache.set(key, cached);
  }
  // Clear for fresh use
  const { canvas, ctx } = cached;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w * 2, h * 2);
  ctx.restore();
  return cached;
}

class HeadlessAdapter implements PlatformAdapter {
  readonly name = 'web' as const;
  private canvas: any;
  private ctx: any;
  private w: number;
  private h: number;

  constructor(w: number, h: number, napiCanvas: any) {
    this.w = w;
    this.h = h;
    const cached = getOrCreateCanvas(w, h, napiCanvas);
    this.canvas = cached.canvas;
    this.ctx = cached.ctx;

    // Polyfill globalThis.Image for headless — mirrors wx/tt polyfill pattern
    // so game code using `new Image()` or `loadImage()` works without changes
    if (napiCanvas.Image) {
      (globalThis as any).Image = napiCanvas.Image;
    }
  }

  getScreenInfo(): ScreenInfo {
    return { width: this.w, height: this.h, dpr: 2, safeTop: 0, safeBottom: 0 };
  }

  getCanvas() { return this.canvas; }
  getCtx() { return this.ctx; }
  bindTouchEvents() {}
  requestAnimationFrame(cb: (t: number) => void) { return setTimeout(cb, 16) as any; }
  cancelAnimationFrame(id: number) { clearTimeout(id); }
}

// ── createTestApp ──

export interface FontConfig {
  /** Font family name (e.g. 'sans-serif', 'MyFont') */
  family: string;
  /** Absolute path to the font file (.ttf/.ttc/.otf) */
  path: string;
}

export interface TestAppOptions extends Partial<AppOptions> {
  /** Enable headless canvas rendering (requires @napi-rs/canvas) */
  render?: boolean;
  /** Canvas width in logical pixels (default: 390) */
  width?: number;
  /** Canvas height in logical pixels (default: 844) */
  height?: number;
  /**
   * Register custom fonts for headless rendering.
   * System CJK fonts (PingFang/STHeiti/Noto) are auto-detected;
   * use this for custom game fonts.
   *
   * ```typescript
   * createTestApp({
   *   render: true,
   *   fonts: [{ family: 'GameFont', path: './assets/fonts/myfont.ttf' }],
   * });
   * ```
   */
  fonts?: FontConfig[];
  /**
   * Root directory for resolving relative asset paths in headless mode.
   * When set, `new Image().src = 'sprites/ship.png'` auto-resolves to
   * `{assetRoot}/sprites/ship.png` so @napi-rs/canvas can load from filesystem.
   *
   * ```typescript
   * createTestApp({
   *   render: true,
   *   assetRoot: path.join(__dirname, '../public'),
   * });
   * ```
   */
  assetRoot?: string;
}

export interface TestApp extends App {
  /** Export canvas as PNG Buffer (render mode only) */
  toImage(): Buffer;
  /** Save canvas as PNG file (render mode only) */
  saveImage(path: string): void;
}

/**
 * Create a headless test app. No DOM required.
 *
 * ```typescript
 * // Logic-only (no rendering, fast)
 * const app = createTestApp();
 *
 * // With real canvas rendering (requires @napi-rs/canvas)
 * const app = createTestApp({ render: true });
 * app.tick(16);
 * app.saveImage('screenshot.png');
 * ```
 */
export function createTestApp(opts?: TestAppOptions): TestApp {
  const w = opts?.width ?? 390;
  const h = opts?.height ?? 844;
  const renderMode = opts?.render ?? false;

  let canvasRef: any = null;

  let app: App;

  if (renderMode) {
    const napiCanvas = getNapiCanvas();

    // Auto-register system CJK fonts (once per process)
    registerSystemCJKFonts(napiCanvas);

    // Register custom fonts
    if (opts?.fonts) {
      const GlobalFonts = napiCanvas.GlobalFonts;
      for (const { family, path } of opts.fonts) {
        GlobalFonts.registerFromPath(path, family);
      }
    }

    // Register headless canvas factory for createOffscreenCanvas
    // (injected here so @napi-rs/canvas never appears in main engine code)
    registerHeadlessCanvas((cw, ch) => {
      const canvas = napiCanvas.createCanvas(cw, ch);
      patchCtxCJKFallback(canvas.getContext('2d'));
      return canvas;
    });

    const adapter = new HeadlessAdapter(w, h, napiCanvas);
    canvasRef = adapter.getCanvas();

    // assetRoot: patch globalThis.Image to resolve relative paths
    // Must be AFTER HeadlessAdapter (which sets the base Image polyfill)
    const assetRoot = opts?.assetRoot;
    if (assetRoot) {
      const nodePath = require('path');
      const NapiImage = napiCanvas.Image;
      (globalThis as any).Image = function HeadlessImage(w?: number, h?: number) {
        const img = w != null ? new NapiImage(w, h) : new NapiImage();
        const srcDesc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(img), 'src')!;
        Object.defineProperty(img, 'src', {
          get() { return srcDesc.get!.call(img); },
          set(value: string | Buffer) {
            if (typeof value === 'string' && !nodePath.isAbsolute(value) && !value.startsWith('data:') && !value.startsWith('http')) {
              value = nodePath.resolve(assetRoot, value);
            }
            srcDesc.set!.call(img, value);
          },
          configurable: true,
        });
        return img;
      };
    }

    app = createApp({
      adapter,
      debug: true,
      ...opts,
    });
  } else {
    const canvas = createMockCanvas(w, h);

    // Stub globalThis.Image for non-render mode so game code using
    // `new Image()` or `loadImage()` in preload() doesn't crash.
    // Returns a mock image that immediately triggers onload.
    // Always install (even if jsdom provides Image, it can't load from filesystem).
    {
      (globalThis as any).Image = function MockImage() {
        const img: any = { width: 1, height: 1, src: '', onload: null, onerror: null };
        return new Proxy(img, {
          set(target, prop, value) {
            target[prop] = value;
            if (prop === 'src' && value) {
              // Auto-trigger onload on next microtask (simulates async image load)
              Promise.resolve().then(() => target.onload?.());
            }
            return true;
          },
        });
      };
    }

    app = createApp({
      platform: 'web',
      canvas,
      debug: true,
      ...opts,
    });
  }

  // createTestApp skips template validation (already true by default, createApp sets false)
  app.router._skipTemplateValidation = true;

  const testApp = app as TestApp;

  testApp.toImage = () => {
    if (!canvasRef) {
      throw new Error('[lucid] toImage() requires render mode: createTestApp({ render: true })');
    }
    return canvasRef.toBuffer('image/png');
  };

  testApp.saveImage = (path: string) => {
    const fs = _cjsRequire('fs');
    fs.writeFileSync(path, testApp.toImage());
  };

  return testApp;
}

// ── tap ──

/**
 * Simulate a tap on a node found by id.
 * Emits touchstart + touchend, triggering the node's tap handler.
 *
 * ```typescript
 * tap(app, 'play-btn');
 * ```
 */
export function tap(app: App, nodeId: string): boolean {
  const node = app.root.findById(nodeId);
  if (!node) return false;

  const event = { x: 0, y: 0, localX: 0, localY: 0, worldX: 0, worldY: 0 };
  node.$emit('touchstart', event);
  node.$emit('touchend', event);
  return true;
}

// ── touch ──

/**
 * Simulate a touch at world coordinates. Uses hitTest to find the target node.
 *
 * ```typescript
 * touch(app, 200, 400);            // full tap (start + end)
 * touch(app, 200, 400, 'start');   // only touchstart
 * ```
 */
export function touch(app: App, x: number, y: number, type?: 'start' | 'end' | 'move'): string | null {
  const node = app.root.hitTest(x, y);
  if (!node) return null;

  const local = node.worldToLocal(x, y);
  const event = { x, y, localX: local.x, localY: local.y, worldX: x, worldY: y };

  if (!type || type === 'start') {
    node.$emit('touchstart', event);
  }
  if (type === 'move') {
    node.$emit('touchmove', event);
  }
  if (!type || type === 'end') {
    node.$emit('touchend', event);
  }

  return node.$path();
}

// ── assertTree ──

/**
 * Assert that the app's $inspect output contains all pattern lines.
 * Each non-empty line in the pattern is checked as a substring (trimmed).
 * Throws if any line is missing.
 *
 * ```typescript
 * assertTree(app, `
 *   MenuScene#menu
 *     Button#play "开始"
 * `);
 * ```
 */
export function assertTree(app: App, pattern: string): void {
  const tree = app.root.$inspect();
  const patternLines = pattern
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const missing: string[] = [];
  for (const line of patternLines) {
    if (!tree.includes(line)) {
      missing.push(line);
    }
  }

  if (missing.length > 0) {
    const msg = [
      `assertTree failed. Missing ${missing.length} pattern(s):`,
      ...missing.map(l => `  - "${l}"`),
      '',
      'Actual tree:',
      tree,
    ].join('\n');
    throw new Error(msg);
  }
}

// ── generateTestCode ──

/**
 * Convert recorded interactions to vitest test code.
 *
 * ```typescript
 * const records = app.dumpInteractions();
 * const code = generateTestCode(records);
 * console.log(code); // paste into a .test.ts file
 * ```
 */
export function generateTestCode(records: InteractionRecord[]): string {
  const lines: string[] = [
    `import { createTestApp, tap, touch } from '@lucid-2d/engine/testing';`,
    ``,
    `test('recorded interaction', () => {`,
    `  const app = createTestApp();`,
    `  // TODO: app.router.push(new YourScene(app));`,
    `  app.tick(16);`,
    ``,
  ];

  let prevT = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.type === 'meta') continue;

    const dt = r.t - prevT;
    prevT = r.t;

    // Only generate for touchstart (tap = start + end pair)
    if (r.type !== 'touchstart') continue;

    // Check if next record is touchend at same path (= tap)
    const next = records[i + 1];
    const isTap = next && next.type === 'touchend' && next.path === r.path;

    const comment = r.snapshot ? ` // ${r.snapshot}` : '';
    const pathParts = r.path.split(' > ');
    const nodeId = pathParts[pathParts.length - 1];

    if (dt > 0) {
      lines.push(`  app.tick(${dt});`);
    }

    if (isTap) {
      lines.push(`  tap(app, '${nodeId}');${comment}`);
      i++; // skip touchend
    } else {
      lines.push(`  touch(app, ${Math.round(r.x)}, ${Math.round(r.y)}, 'start');${comment}`);
    }
  }

  lines.push(`});`);
  lines.push(``);

  return lines.join('\n');
}

// ── imageDiff ──

export interface ImageDiffResult {
  /** Total pixels compared */
  totalPixels: number;
  /** Number of pixels that differ */
  diffPixels: number;
  /** Percentage of pixels that differ (0..1) */
  diffPercent: number;
  /** Whether images are identical */
  identical: boolean;
  /** Whether images have same dimensions */
  sameDimensions: boolean;
}

/**
 * Compare two PNG buffers pixel-by-pixel.
 * Requires @napi-rs/canvas (render mode).
 *
 * ```typescript
 * const before = app.toImage();
 * tap(app, 'btn');
 * app.tick(16);
 * const after = app.toImage();
 * const diff = await imageDiff(before, after);
 * expect(diff.diffPercent).toBeGreaterThan(0); // something changed
 * ```
 */
export async function imageDiff(a: Buffer, b: Buffer, threshold = 0): Promise<ImageDiffResult> {
  const napiCanvas = getNapiCanvas();

  const [imgA, imgB] = await Promise.all([
    napiCanvas.loadImage(a),
    napiCanvas.loadImage(b),
  ]);

  const sameDimensions = imgA.width === imgB.width && imgA.height === imgB.height;
  if (!sameDimensions) {
    return {
      totalPixels: Math.max(imgA.width * imgA.height, imgB.width * imgB.height),
      diffPixels: Math.max(imgA.width * imgA.height, imgB.width * imgB.height),
      diffPercent: 1,
      identical: false,
      sameDimensions: false,
    };
  }

  const w = imgA.width, h = imgA.height;
  const canvasA = napiCanvas.createCanvas(w, h);
  const ctxA = canvasA.getContext('2d');
  ctxA.drawImage(imgA, 0, 0);
  const dataA = ctxA.getImageData(0, 0, w, h).data;

  const canvasB = napiCanvas.createCanvas(w, h);
  const ctxB = canvasB.getContext('2d');
  ctxB.drawImage(imgB, 0, 0);
  const dataB = ctxB.getImageData(0, 0, w, h).data;

  const totalPixels = w * h;
  let diffPixels = 0;

  for (let i = 0; i < dataA.length; i += 4) {
    const dr = Math.abs(dataA[i] - dataB[i]);
    const dg = Math.abs(dataA[i + 1] - dataB[i + 1]);
    const db = Math.abs(dataA[i + 2] - dataB[i + 2]);
    const da = Math.abs(dataA[i + 3] - dataB[i + 3]);
    if (dr + dg + db + da > threshold) {
      diffPixels++;
    }
  }

  return {
    totalPixels,
    diffPixels,
    diffPercent: diffPixels / totalPixels,
    identical: diffPixels === 0,
    sameDimensions: true,
  };
}

/**
 * Assert that two images differ by at least / at most a percentage.
 *
 * ```typescript
 * assertImageChanged(before, after);               // just changed
 * assertImageChanged(before, after, 0.01, 0.5);    // 1%-50% changed
 * ```
 */
export async function assertImageChanged(
  before: Buffer,
  after: Buffer,
  minDiff = 0.001,
  maxDiff = 1,
): Promise<void> {
  const result = await imageDiff(before, after);
  if (result.diffPercent < minDiff) {
    throw new Error(
      `assertImageChanged failed: images are too similar (${(result.diffPercent * 100).toFixed(2)}% diff, expected > ${(minDiff * 100).toFixed(2)}%)`
    );
  }
  if (result.diffPercent > maxDiff) {
    throw new Error(
      `assertImageChanged failed: images differ too much (${(result.diffPercent * 100).toFixed(2)}% diff, expected < ${(maxDiff * 100).toFixed(2)}%)`
    );
  }
}
