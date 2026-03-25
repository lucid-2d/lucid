/**
 * ShopTemplate — shop scene (skin or coin).
 * Required: back
 * Delegates to ShopPanel / CoinShopPanel.
 */

import { UINode } from '@lucid-2d/core';
import { IconButton, UIColors } from '@lucid-2d/ui';
import { ShopPanel } from '../shop-panel.js';
import { CoinShopPanel } from '../coin-shop-panel.js';
import type { ShopConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildShop(scene: TemplateScene, config: ShopConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Back button ──
  const backBtn = new IconButton({ id: 'back', icon: 'back', size: 44 });
  backBtn.x = 16;
  backBtn.y = 44;
  backBtn.$on('tap', () => config.back());
  scene.addChild(backBtn);

  // ── Shop panel ──
  if (config.variant === 'skin' && config.items) {
    const panel = new ShopPanel({
      tabs: config.tabs ?? [{ key: 'all', label: '全部' }],
      items: config.items,
    });
    panel.y = 0;
    panel.$on('close', () => config.back());
    if (config.onPurchase) panel.$on('purchase', (item: any) => config.onPurchase!(item));
    if (config.onEquip) panel.$on('equip', (item: any) => config.onEquip!(item));
    scene.addChild(panel);
  } else if (config.variant === 'coin' && config.coinItems) {
    const panel = new CoinShopPanel({ coins: config.coins ?? 0, items: config.coinItems });
    panel.y = 0;
    panel.$on('close', () => config.back());
    if (config.onCoinPurchase) panel.$on('purchase', (item: any) => config.onCoinPurchase!(item));
    scene.addChild(panel);
  }

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
