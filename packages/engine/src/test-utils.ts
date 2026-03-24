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

// Cache @napi-rs/canvas module — native binary load is expensive (~5-8s cold),
// caching ensures it's only paid once per worker process.
let _napiCanvas: any = null;
function getNapiCanvas(): any {
  if (!_napiCanvas) {
    try {
      _napiCanvas = require('@napi-rs/canvas');
    } catch {
      throw new Error(
        '[lucid] @napi-rs/canvas is required for headless rendering.\n' +
        'Install it: pnpm add -D @napi-rs/canvas'
      );
    }
  }
  return _napiCanvas;
}

// ── Mock Canvas ──

function createMockCanvas(w = 390, h = 844): any {
  // Full Canvas 2D API stub — all methods are no-ops, works in any JS environment
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
    width: w * 2,
    height: h * 2,
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

class HeadlessAdapter implements PlatformAdapter {
  readonly name = 'web' as const;
  private canvas: any;
  private ctx: any;
  private w: number;
  private h: number;

  constructor(w: number, h: number, napiCanvas: any) {
    this.w = w;
    this.h = h;
    this.canvas = napiCanvas.createCanvas(w * 2, h * 2);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(2, 2); // DPR=2
  }

  getScreenInfo(): ScreenInfo {
    return { width: this.w, height: this.h, dpr: 2, safeTop: 0, safeBottom: this.h };
  }

  getCanvas() { return this.canvas; }
  getCtx() { return this.ctx; }
  bindTouchEvents() {}
  requestAnimationFrame(cb: (t: number) => void) { return setTimeout(cb, 16) as any; }
  cancelAnimationFrame(id: number) { clearTimeout(id); }
}

// ── createTestApp ──

export interface TestAppOptions extends Partial<AppOptions> {
  /** Enable headless canvas rendering (requires @napi-rs/canvas) */
  render?: boolean;
  /** Canvas width in logical pixels (default: 390) */
  width?: number;
  /** Canvas height in logical pixels (default: 844) */
  height?: number;
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
    const adapter = new HeadlessAdapter(w, h, napiCanvas);
    canvasRef = adapter.getCanvas();
    app = createApp({
      adapter,
      debug: true,
      ...opts,
    });
  } else {
    const canvas = createMockCanvas(w, h);
    app = createApp({
      platform: 'web',
      canvas,
      debug: true,
      ...opts,
    });
  }

  const testApp = app as TestApp;

  testApp.toImage = () => {
    if (!canvasRef) {
      throw new Error('[lucid] toImage() requires render mode: createTestApp({ render: true })');
    }
    return canvasRef.toBuffer('image/png');
  };

  testApp.saveImage = (path: string) => {
    const fs = require('fs');
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

  const event = { localX: 0, localY: 0, worldX: 0, worldY: 0 };
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
  const event = { localX: local.x, localY: local.y, worldX: x, worldY: y };

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
