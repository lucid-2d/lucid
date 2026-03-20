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
import type { InteractionRecord } from '@lucid/core';

// ── Mock Canvas ──

function createMockCanvas(w = 390, h = 844): any {
  // Minimal canvas stub — works in any JS environment (Node/browser)
  const mockCtx = {
    save() {}, restore() {}, translate() {}, scale() {},
    clearRect() {}, setTransform() {},
    fillRect() {}, fillText() {}, strokeRect() {}, strokeText() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    arc() {}, rect() {}, roundRect() {},
    fill() {}, stroke() {}, clip() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    measureText() { return { width: 0 }; },
    drawImage() {},
    setLineDash() {}, getLineDash() { return []; },
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt',
    lineJoin: 'miter', font: '', textAlign: 'start', textBaseline: 'alphabetic',
    shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
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

// ── createTestApp ──

/**
 * Create a headless test app with mock canvas. No DOM required.
 *
 * ```typescript
 * const app = createTestApp();
 * app.router.push(new MyScene(app));
 * app.tick(16);
 * ```
 */
export function createTestApp(opts?: Partial<AppOptions>): App {
  const canvas = createMockCanvas(
    opts?.canvas?.width ?? 390,
    opts?.canvas?.height ?? 844,
  );
  return createApp({
    platform: 'web',
    canvas,
    debug: true,
    ...opts,
    // Always override canvas with mock
  });
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
    `import { createTestApp, tap, touch } from '@lucid/engine';`,
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
