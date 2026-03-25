/**
 * ListTemplate — list scene (leaderboard).
 * Required: back, entries
 * Delegates to LeaderboardPanel.
 */

import { UINode } from '@lucid-2d/core';
import { IconButton } from '@lucid-2d/ui';
import { LeaderboardPanel } from '../leaderboard-panel.js';
import type { ListConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildList(scene: TemplateScene, config: ListConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Back button ──
  const backBtn = new IconButton({ id: 'back', icon: 'back', size: 44 });
  backBtn.x = 16;
  backBtn.y = 44;
  backBtn.$on('tap', () => config.back());
  scene.addChild(backBtn);

  // ── Leaderboard panel ──
  const panel = new LeaderboardPanel({
    entries: config.entries,
    tabs: config.tabs,
    myEntry: config.myEntry,
  });
  panel.$on('close', () => config.back());
  scene.addChild(panel);

  // ── Background ──
  if (config.drawBackground) {
    const bg = config.drawBackground;
    const origDraw = scene['draw']?.bind(scene);
    scene['draw'] = function (ctx: CanvasRenderingContext2D) {
      bg(ctx, w, h);
      origDraw?.(ctx);
    };
  }
}
