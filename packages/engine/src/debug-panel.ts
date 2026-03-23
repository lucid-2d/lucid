/**
 * DebugPanel — Built-in debug overlay for AI-assisted game development.
 *
 * One-button access to full game state dump. No code needed from game developers.
 *
 * ```typescript
 * const app = createApp({ debug: true, debugPanel: true });
 * // Floating debug button appears in bottom-right corner
 * // Tap → panel shows: scene tree, FPS, router depth, entities
 * // "Copy" button → full state dump to clipboard (paste to AI for analysis)
 * ```
 */

import { UINode } from '@lucid-2d/core';
import type { App } from './app.js';

interface DebugDump {
  timestamp: string;
  fps: number;
  timeScale: number;
  fixedTimestep: number;
  routerDepth: number;
  currentScene: string;
  tree: string;
  interactions: number;
}

export class DebugPanel extends UINode {
  private _app: App;
  private _open = false;
  private _dump: DebugDump | null = null;
  private _copied = false;
  private _copiedTimer = 0;

  constructor(app: App) {
    super({ id: '__debug-panel', width: 0, height: 0, interactive: true });
    this._app = app;
    this._initEvents();
  }

  /** Generate a full state dump */
  dump(): DebugDump {
    const app = this._app;
    return {
      timestamp: new Date().toISOString(),
      fps: app.fps,
      timeScale: app.timeScale,
      fixedTimestep: app.fixedTimestep,
      routerDepth: app.router.depth,
      currentScene: app.router.current?.id ?? '(none)',
      tree: app.root.$inspect(),
      interactions: app.dumpInteractions().length,
    };
  }

  /** Format dump as AI-friendly text */
  dumpText(): string {
    const d = this.dump();
    return [
      `=== Lucid Debug Dump ===`,
      `Time: ${d.timestamp}`,
      `FPS: ${d.fps} | TimeScale: ${d.timeScale} | FixedTimestep: ${d.fixedTimestep}`,
      `Router: depth=${d.routerDepth} current=${d.currentScene}`,
      `Interactions recorded: ${d.interactions}`,
      ``,
      `--- Scene Tree ---`,
      d.tree,
    ].join('\n');
  }

  $update(dt: number): void {
    super.$update(dt);
    if (this._copiedTimer > 0) {
      this._copiedTimer -= dt;
      if (this._copiedTimer <= 0) this._copied = false;
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const app = this._app;
    const sw = app.screen.width;
    const sh = app.screen.height;

    if (this._open) {
      this._drawPanel(ctx, sw, sh);
    } else {
      this._drawButton(ctx, sw, sh);
    }
  }

  private _drawButton(ctx: CanvasRenderingContext2D, sw: number, sh: number): void {
    const bw = 36, bh = 36;
    const bx = sw - bw - 8;
    const by = sh - bh - 8;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('D', bx + bw / 2, by + bh / 2);
    ctx.restore();
  }

  private _drawPanel(ctx: CanvasRenderingContext2D, sw: number, sh: number): void {
    const pad = 12;
    const pw = sw - pad * 2;
    const ph = sh * 0.6;
    const px = pad;
    const py = sh - ph - pad;

    // Background
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Title bar
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Lucid Debug', px + 12, py + 10);

    // Close button
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('[X]', px + pw - 12, py + 10);

    // Copy button
    const copyText = this._copied ? 'Copied!' : '[Copy]';
    ctx.fillStyle = this._copied ? '#4caf50' : '#6c5ce7';
    ctx.fillText(copyText, px + pw - 60, py + 10);

    // Dump content
    if (this._dump) {
      ctx.fillStyle = '#ccc';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      const lines = [
        `FPS: ${this._dump.fps}  TimeScale: ${this._dump.timeScale}  FixedDt: ${this._dump.fixedTimestep}`,
        `Router: depth=${this._dump.routerDepth}  scene=${this._dump.currentScene}`,
        `Interactions: ${this._dump.interactions}`,
        '',
        '--- Tree ---',
        ...this._dump.tree.split('\n'),
      ];

      const lineHeight = 14;
      const maxLines = Math.floor((ph - 40) / lineHeight);
      for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
        const line = lines[i].length > 60 ? lines[i].substring(0, 57) + '...' : lines[i];
        ctx.fillText(line, px + 12, py + 32 + i * lineHeight);
      }
      if (lines.length > maxLines) {
        ctx.fillStyle = '#888';
        ctx.fillText(`... ${lines.length - maxLines} more lines`, px + 12, py + 32 + maxLines * lineHeight);
      }
    }

    ctx.restore();
  }

  hitTest(wx: number, wy: number): UINode | null {
    const app = this._app;
    const sw = app.screen.width;
    const sh = app.screen.height;

    if (this._open) {
      const pad = 12;
      const pw = sw - pad * 2;
      const ph = sh * 0.6;
      const px = pad;
      const py = sh - ph - pad;

      if (wx >= px && wx <= px + pw && wy >= py && wy <= py + ph) {
        return this;
      }
      return null;
    } else {
      // Debug button hit area
      const bw = 36, bh = 36;
      const bx = sw - bw - 8;
      const by = sh - bh - 8;
      if (wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh) {
        return this;
      }
      return null;
    }
  }

  private _handleTap(wx: number, wy: number): void {
    const app = this._app;
    const sw = app.screen.width;
    const sh = app.screen.height;

    if (!this._open) {
      // Open panel
      this._open = true;
      this._dump = this.dump();
      return;
    }

    const pad = 12;
    const pw = sw - pad * 2;
    const py = sh - sh * 0.6 - pad;

    // Close button area (top right of panel)
    if (wx >= pad + pw - 40 && wy >= py && wy <= py + 30) {
      this._open = false;
      return;
    }

    // Copy button area
    if (wx >= pad + pw - 100 && wx < pad + pw - 40 && wy >= py && wy <= py + 30) {
      this._copyToClipboard();
      return;
    }
  }

  private _copyToClipboard(): void {
    const text = this.dumpText();

    // Try modern clipboard API first, fallback to execCommand for Safari
    let copied = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {}, () => {});
        copied = true;
      }
    } catch {}

    if (!copied && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length); // iOS Safari needs this
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }

    this._copied = true;
    this._copiedTimer = 2;
    // Also store on app for programmatic access
    (this._app as any).__lastDump = text;
  }

  // Wire up touch events in constructor — no need to wait for mount
  private _initEvents(): void {
    this.$on('touchend', (e: any) => {
      this._handleTap(e.worldX ?? 0, e.worldY ?? 0);
    });
  }
}

/**
 * Create and attach a DebugPanel to the app.
 * Called internally by createApp when debugPanel: true.
 */
export function attachDebugPanel(app: App): DebugPanel {
  const panel = new DebugPanel(app);
  app.root.addChild(panel);
  return panel;
}
