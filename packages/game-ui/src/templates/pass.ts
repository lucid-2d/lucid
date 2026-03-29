/**
 * PassTemplate — battle pass scene.
 * Required: back, rewards
 * Delegates to BattlePassPanel.
 */

import { UINode } from '@lucid-2d/core';
import { IconButton } from '@lucid-2d/ui';
import { BattlePassPanel } from '../battle-pass-panel.js';
import type { PassConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildPass(scene: TemplateScene, config: PassConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Back button ──
  const safeTop = app.screen.safeTop || 44;
  const backBtn = new IconButton({ id: 'back', icon: 'back', size: 44 });
  backBtn.x = 16;
  backBtn.y = safeTop;
  backBtn.$on('tap', () => config.back());
  scene.addChild(backBtn);

  // ── Battle pass panel ──
  const panel = new BattlePassPanel({
    currentLevel: config.currentLevel,
    currentXP: config.currentXP,
    xpToNext: config.xpToNext,
    isPremium: config.isPremium,
    rewards: config.rewards,
    seasonName: config.seasonName,
  });
  panel.$on('close', () => config.back());
  if (config.onClaim) panel.$on('claimReward', (level: number, type: string) => config.onClaim!(level, type as 'free' | 'paid'));
  if (config.onBuyPremium) panel.$on('buyPremium', () => config.onBuyPremium!());
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

  // ── Foreground draw (after children) ──
  if (config.drawForeground) {
    const fg = config.drawForeground;
    const origRender = scene.$render.bind(scene);
    scene.$render = function (ctx: CanvasRenderingContext2D) {
      origRender(ctx);
      ctx.save();
      ctx.translate(scene.x, scene.y);
      fg(ctx, w, h);
      ctx.restore();
    };
  }
}
