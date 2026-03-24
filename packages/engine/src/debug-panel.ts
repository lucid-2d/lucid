/**
 * DebugPanel — Built-in debug overlay for AI-assisted game development.
 *
 * ```typescript
 * const app = createApp({ debug: true, debugPanel: true });
 *
 * // Register custom debug fields
 * app.debugPanel.register('game', () => ({
 *   hp: player.hp, gold: player.gold, wave: currentWave,
 * }));
 *
 * // Tap "D" button → panel shows full state
 * // [Copy] → clipboard dump includes: tree + scene log + touch log + custom fields
 * ```
 */

import { UINode } from '@lucid-2d/core';
import type { App } from './app.js';
import type { SceneLogEntry } from './scene.js';

interface DebugDump {
  timestamp: string;
  fps: number;
  timeScale: number;
  fixedTimestep: number;
  routerDepth: number;
  currentScene: string;
  tree: string;
  sceneLog: SceneLogEntry[];
  recentTouches: any[];
  custom: Record<string, any>;
}

export class DebugPanel extends UINode {
  private _app: App;
  private _open = false;
  private _dump: DebugDump | null = null;
  private _copied = false;
  private _copiedTimer = 0;
  private _providers = new Map<string, () => any>();

  constructor(app: App) {
    super({ id: '__debug-panel', width: app.screen.width, height: app.screen.height, interactive: true });
    this._app = app;
    this._initEvents();
  }

  /** Register a custom debug data provider */
  register(key: string, provider: () => any): void {
    this._providers.set(key, provider);
  }

  /** Unregister a custom provider */
  unregister(key: string): void {
    this._providers.delete(key);
  }

  /** Generate a full state dump */
  dump(): DebugDump {
    const app = this._app;

    // Collect custom fields
    const custom: Record<string, any> = {};
    for (const [key, fn] of this._providers) {
      try { custom[key] = fn(); } catch { custom[key] = '(error)'; }
    }

    return {
      timestamp: new Date().toISOString(),
      fps: app.fps,
      timeScale: app.timeScale,
      fixedTimestep: app.fixedTimestep,
      routerDepth: app.router.depth,
      currentScene: app.router.current?.id ?? '(none)',
      tree: app.root.$inspect(),
      sceneLog: [...app.router.log],
      recentTouches: [...((app as any).__touchLog ?? [])],
      custom,
    };
  }

  /** Format dump as AI-friendly text */
  dumpText(): string {
    const d = this.dump();
    const lines = [
      `=== Lucid Debug Dump ===`,
      `Time: ${d.timestamp}`,
      `FPS: ${d.fps} | TimeScale: ${d.timeScale} | FixedTimestep: ${d.fixedTimestep}`,
      `Router: depth=${d.routerDepth} current=${d.currentScene}`,
    ];

    // Scene log
    if (d.sceneLog.length > 0) {
      lines.push('', '--- Scene Log ---');
      for (const e of d.sceneLog) {
        lines.push(`  [${e.time}] ${e.action.toUpperCase()} ${e.scene} → depth=${e.depth}`);
      }
    }

    // Recent touches
    if (d.recentTouches.length > 0) {
      lines.push('', '--- Recent Touches ---');
      for (const t of d.recentTouches) {
        lines.push(`  [${t.time}] (${t.x}, ${t.y}) → hit: ${t.hit} scene: ${t.scene}`);
      }
    }

    // Custom fields
    const customKeys = Object.keys(d.custom);
    if (customKeys.length > 0) {
      lines.push('', '--- Custom ---');
      for (const key of customKeys) {
        const val = d.custom[key];
        if (typeof val === 'object') {
          lines.push(`  ${key}: ${JSON.stringify(val)}`);
        } else {
          lines.push(`  ${key}: ${val}`);
        }
      }
    }

    lines.push('', '--- Scene Tree ---', d.tree);
    return lines.join('\n');
  }

  $update(dt: number): void {
    super.$update(dt);
    if (this._copiedTimer > 0) {
      this._copiedTimer -= dt;
      if (this._copiedTimer <= 0) this._copied = false;
    }
  }

  protected draw(ctx: CanvasRenderingContext2D): void {
    const sw = this._app.screen.width;
    const sh = this._app.screen.height;
    if (this._open) this._drawPanel(ctx, sw, sh);
    else this._drawButton(ctx, sw, sh);
  }

  private _drawButton(ctx: CanvasRenderingContext2D, sw: number, sh: number): void {
    const bw = 36, bh = 36, bx = sw - bw - 8, by = sh - bh - 8;
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
    const pad = 12, pw = sw - pad * 2, ph = sh * 0.6, px = pad, py = sh - ph - pad;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Title
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Lucid Debug', px + 12, py + 10);

    // Buttons
    ctx.textAlign = 'right';
    ctx.fillStyle = '#888';
    ctx.fillText('[X]', px + pw - 12, py + 10);
    ctx.fillStyle = this._copied ? '#4caf50' : '#6c5ce7';
    ctx.fillText(this._copied ? 'Copied!' : '[Copy]', px + pw - 60, py + 10);

    // Content
    if (this._dump) {
      ctx.fillStyle = '#ccc';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';

      const text = this.dumpText();
      const allLines = text.split('\n');
      const lineHeight = 14;
      const maxLines = Math.floor((ph - 40) / lineHeight);

      for (let i = 0; i < Math.min(allLines.length, maxLines); i++) {
        const line = allLines[i].length > 60 ? allLines[i].substring(0, 57) + '...' : allLines[i];
        ctx.fillText(line, px + 12, py + 32 + i * lineHeight);
      }
      if (allLines.length > maxLines) {
        ctx.fillStyle = '#888';
        ctx.fillText(`... ${allLines.length - maxLines} more lines`, px + 12, py + 32 + maxLines * lineHeight);
      }
    }
    ctx.restore();
  }

  hitTest(wx: number, wy: number): UINode | null {
    const sw = this._app.screen.width, sh = this._app.screen.height;
    if (this._open) {
      // Modal: capture ALL touches when panel is open (prevent penetration)
      return this;
    }
    const bw = 36, bh = 36, bx = sw - bw - 8, by = sh - bh - 8;
    if (wx >= bx && wx <= bx + bw && wy >= by && wy <= by + bh) return this;
    return null;
  }

  private _handleTap(wx: number, wy: number): void {
    const sw = this._app.screen.width, sh = this._app.screen.height;
    if (!this._open) {
      this._open = true;
      this._dump = this.dump();
      return;
    }

    const pad = 12, pw = sw - pad * 2, ph = sh * 0.6, px = pad, py = sh - ph - pad;

    // Tap outside panel → close
    if (wx < px || wx > px + pw || wy < py || wy > py + ph) {
      this._open = false;
      return;
    }

    // [X] close button
    if (wx >= pad + pw - 40 && wy >= py && wy <= py + 30) { this._open = false; return; }
    // [Copy] button
    if (wx >= pad + pw - 100 && wx < pad + pw - 40 && wy >= py && wy <= py + 30) { this._copyToClipboard(); return; }
  }

  private _copyToClipboard(): void {
    const text = this.dumpText();
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
        ta.setSelectionRange(0, text.length);
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    this._copied = true;
    this._copiedTimer = 2;
    (this._app as any).__lastDump = text;
  }

  private _initEvents(): void {
    this.$on('touchend', (e: any) => {
      this._handleTap(e.worldX ?? 0, e.worldY ?? 0);
    });
  }
}

export function attachDebugPanel(app: App): DebugPanel {
  const panel = new DebugPanel(app);
  app.root.addChild(panel);
  return panel;
}
