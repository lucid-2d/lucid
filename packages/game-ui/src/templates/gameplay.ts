/**
 * GameplayTemplate — core gameplay scene.
 *
 * Required: pause (with restart + home), setup
 * Optional: hud, drawBackground
 *
 * Auto-creates: pause IconButton (top-left) + PauseModal (resume+restart+home+settings)
 */

import { UINode } from '@lucid-2d/core';
import { IconButton, Label, UIColors } from '@lucid-2d/ui';
import { PauseModal } from '../pause-modal.js';
import type { GameplayConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildGameplay(scene: TemplateScene, config: GameplayConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;
  const safeTop = app.screen.safeTop || 44;

  // ── Game area (full screen container for game logic) ──
  const gameArea = new UINode({ id: '__game-area', width: w, height: h });
  scene.addChild(gameArea);
  config.setup(gameArea, app);

  // ── HUD (top area) ──
  if (config.hud) {
    const hudContainer = new UINode({
      id: '__hud',
      width: w,
      height: 44,
      layout: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    });
    hudContainer.x = 0;
    hudContainer.y = safeTop + 4;

    for (const [key, slot] of Object.entries(config.hud)) {
      const isObj = typeof slot === 'object' && slot !== null;
      const getter = isObj ? slot.value : slot;
      const style = isObj ? slot.style : undefined;

      const lbl = new Label({
        id: `hud-${key}`,
        text: String(getter()),
        fontSize: style?.fontSize ?? 16,
        fontWeight: (style?.fontWeight ?? 'bold') as any,
        color: style?.color ?? UIColors.text,
        align: 'center',
        width: style?.width ?? 100,
        height: 30,
      });
      const origUpdate = lbl['$update']?.bind(lbl);
      lbl['$update'] = function (dt: number) {
        origUpdate?.(dt);
        const newVal = String(getter());
        if (lbl.text !== newVal) lbl.text = newVal;
      };
      hudContainer.addChild(lbl);
    }
    scene.addChild(hudContainer);
  }

  // ── Pause button (top-left) ──
  const pauseBtn = new IconButton({
    id: 'pause',
    icon: 'pause',
    size: 44,
  });
  pauseBtn.x = 16;
  pauseBtn.y = safeTop;
  scene.addChild(pauseBtn);

  // ── PauseModal (created at build time, hidden until pause tapped) ──
  const pauseModal = new PauseModal({
    resume: () => {
      pauseModal.close();
      pauseModal.visible = false;
    },
    restart: () => config.pause.restart(),
    home: () => config.pause.home(),
    settings: config.pause.settings ? {
      toggles: config.pause.settings.toggles,
      links: config.pause.settings.links,
      version: config.pause.settings.version,
      onToggle: config.pause.settings.onToggle,
      onLink: config.pause.settings.onLink,
    } : undefined,
    quit: config.pause.quit,
    screenWidth: w,
    screenHeight: h,
  });
  pauseModal.visible = false;
  pauseModal.attachTo(scene);
  scene.addChild(pauseModal);

  pauseBtn.$on('tap', () => {
    if (pauseModal.visible) return;
    pauseModal.visible = true;
    pauseModal.open();
  });

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
