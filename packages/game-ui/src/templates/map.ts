/**
 * MapTemplate — level/world map scene.
 * Required: back, setup
 */

import { UINode } from '@lucid-2d/core';
import { IconButton, Label, UIColors } from '@lucid-2d/ui';
import type { MapConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildMap(scene: TemplateScene, config: MapConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Header ──
  const safeTop = app.screen.safeTop || 44;
  const backBtn = new IconButton({ id: 'back', icon: 'back', size: 44 });
  backBtn.x = 16;
  backBtn.y = safeTop;
  backBtn.$on('tap', () => config.back());
  scene.addChild(backBtn);

  if (config.title) {
    const title = new Label({
      id: 'map-title',
      text: config.title,
      fontSize: 20,
      fontWeight: 'bold',
      color: UIColors.text,
      align: 'center',
      width: w,
      height: 30,
    });
    title.y = safeTop + 6;
    scene.addChild(title);
  }

  // ── Map area (custom content) ──
  const headerH = safeTop + 50;
  const mapArea = new UINode({ id: 'map-area', width: w, height: h - headerH });
  mapArea.y = headerH;
  scene.addChild(mapArea);
  config.setup(mapArea, app);

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
