/**
 * ResultTemplate — game over / victory scene.
 *
 * Required: restart or home (at least one)
 * Optional: share, ad, revive, stats, countdown, doubleReward, rankChange
 */

import { UINode, CountdownTimer } from '@lucid-2d/core';
import { Button, Label, UIColors } from '@lucid-2d/ui';
import { ACTION_DEFAULTS } from './actions.js';
import type { ResultConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildResult(scene: TemplateScene, config: ResultConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Title ──
  const title = new Label({
    id: 'result-title',
    text: config.title,
    fontSize: 28,
    fontWeight: 'bold',
    color: UIColors.text,
    align: 'center',
    width: w,
    height: 40,
  });
  title.y = Math.round(h * 0.12);
  scene.addChild(title);

  // ── Score ──
  const scoreLabel = new Label({
    id: 'score',
    text: String(config.score),
    fontSize: 56,
    fontWeight: 'bold',
    color: UIColors.primary,
    align: 'center',
    width: w,
    height: 70,
  });
  scoreLabel.y = Math.round(h * 0.2);
  scene.addChild(scoreLabel);

  // ── New best indicator ──
  let indicatorBottomY = Math.round(h * 0.2) + 72;

  if (config.isNewBest) {
    const bestLabel = new Label({
      id: 'new-best',
      text: 'NEW BEST!',
      fontSize: 16,
      fontWeight: 'bold',
      color: UIColors.accent,
      align: 'center',
      width: w,
      height: 24,
    });
    bestLabel.y = indicatorBottomY;
    scene.addChild(bestLabel);
    indicatorBottomY += 28;
  }

  // ── Rank change ──
  if (config.rankChange) {
    const { from, to } = config.rankChange;
    const improved = to < from;
    const arrow = improved ? '↑' : (to > from ? '↓' : '');
    const color = improved ? '#4caf50' : (to > from ? UIColors.primary : UIColors.textSecondary);
    const text = `排名 #${from} → #${to} ${arrow}`;

    const rankLabel = new Label({
      id: 'rank-change',
      text,
      fontSize: 14,
      fontWeight: 'bold',
      color,
      align: 'center',
      width: w,
      height: 22,
    });
    rankLabel.y = indicatorBottomY;
    scene.addChild(rankLabel);
  }

  // ── Stats (2-column grid) ──
  if (config.stats && config.stats.length > 0) {
    const statsY = Math.round(h * 0.38);
    const cardW = 170;
    const cardH = 70;
    const gap = 10;

    for (let i = 0; i < config.stats.length; i++) {
      const stat = config.stats[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const card = new UINode({ id: `stat-${i}`, width: cardW, height: cardH });
      card.x = col === 0 ? Math.round(w / 2 - cardW - gap / 2) : Math.round(w / 2 + gap / 2);
      card.y = statsY + row * (cardH + gap);

      const lbl = new Label({
        text: stat.label,
        fontSize: 12,
        color: UIColors.textSecondary,
        align: 'center',
        width: cardW,
        height: 18,
      });
      lbl.y = 8;
      card.addChild(lbl);

      const val = new Label({
        text: typeof stat.value === 'function' ? stat.value() : stat.value,
        fontSize: 22,
        fontWeight: 'bold',
        color: UIColors.text,
        align: 'center',
        width: cardW,
        height: 30,
      });
      val.y = 30;
      card.addChild(val);

      scene.addChild(card);
    }
  }

  // ── Action buttons (bottom area) ──
  const bw = 200;
  const bx = Math.round((w - bw) / 2);
  let by = Math.round(h * 0.68);
  const bGap = 14;

  // Revive (gold, prominent) — with optional countdown
  let reviveBtn: Button | undefined;
  if (config.revive) {
    const reviveText = config.revive.text ?? ACTION_DEFAULTS.revive.text;
    reviveBtn = new Button({
      id: 'revive',
      text: config.countdown != null ? `${reviveText} (${config.countdown}s)` : reviveText,
      variant: 'gold',
      width: bw,
      height: 48,
    });
    reviveBtn.x = bx; reviveBtn.y = by;
    reviveBtn.$on('tap', () => config.revive!.onTap());
    scene.addChild(reviveBtn);
    by += 48 + bGap;
  }

  // Double reward (gold)
  if (config.doubleReward) {
    const drBtn = new Button({
      id: 'double-reward',
      text: config.doubleReward.text ?? ACTION_DEFAULTS['double-reward'].text,
      variant: 'gold',
      width: bw,
      height: 48,
    });
    drBtn.x = bx; drBtn.y = by;
    drBtn.$on('tap', () => config.doubleReward!.onTap());
    scene.addChild(drBtn);
    by += 48 + bGap;
  }

  // Ad reward
  if (config.ad) {
    const adBtn = new Button({
      id: 'ad',
      text: config.ad.text ?? ACTION_DEFAULTS.ad.text,
      variant: 'gold',
      width: bw,
      height: 48,
    });
    adBtn.x = bx; adBtn.y = by;
    adBtn.$on('tap', () => config.ad!.onTap());
    scene.addChild(adBtn);
    by += 48 + bGap;
  }

  // Restart
  if (config.restart) {
    const restartBtn = new Button({
      id: 'restart',
      text: ACTION_DEFAULTS.restart.text,
      variant: 'primary',
      width: bw,
      height: 48,
    });
    restartBtn.x = bx; restartBtn.y = by;
    restartBtn.$on('tap', () => config.restart!());
    scene.addChild(restartBtn);
    by += 48 + bGap;
  }

  // Home
  if (config.home) {
    const homeBtn = new Button({
      id: 'home',
      text: ACTION_DEFAULTS.home.text,
      variant: 'secondary',
      width: bw,
      height: 48,
    });
    homeBtn.x = bx; homeBtn.y = by;
    homeBtn.$on('tap', () => config.home!());
    scene.addChild(homeBtn);
    by += 48 + bGap;
  }

  // Share
  if (config.share) {
    const shareBtn = new Button({
      id: 'share',
      text: ACTION_DEFAULTS.share.text,
      variant: 'outline',
      width: bw,
      height: 44,
    });
    shareBtn.x = bx; shareBtn.y = by;
    shareBtn.$on('tap', () => config.share!());
    scene.addChild(shareBtn);
  }

  // ── Countdown timer (revive button) ──
  // Note: engine $update(dt) passes dt in seconds (dtMs / 1000)
  if (config.countdown != null && config.countdown > 0 && reviveBtn) {
    const baseText = config.revive!.text ?? ACTION_DEFAULTS.revive.text;
    const timer = new CountdownTimer(config.countdown); // seconds
    let lastSec = config.countdown;

    const origUpdate = scene.$update.bind(scene);
    scene.$update = function (dt: number) {
      origUpdate(dt);
      if (timer.finished) return;
      timer.update(dt);
      const secs = Math.ceil(timer.remaining);
      if (secs !== lastSec) {
        lastSec = secs;
        reviveBtn!.text = secs > 0 ? `${baseText} (${secs}s)` : baseText;
      }
      if (timer.finished) {
        reviveBtn!.visible = false;
        scene.$emit('countdown-expired');
      }
    };
  }

  // ── Background draw ──
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
