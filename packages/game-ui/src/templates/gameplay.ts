/**
 * GameplayTemplate — core gameplay scene.
 *
 * Required: pause (with restart + home), setup
 * Optional: hud, drawBackground
 *
 * Auto-creates: pause IconButton (top-left) + PauseModal (resume+restart+home+settings)
 */

import { UINode } from '@lucid-2d/core';
import { Button, IconButton, Label, Modal, UIColors } from '@lucid-2d/ui';
import { SettingsPanel } from '../settings-panel.js';
import { ACTION_DEFAULTS } from './actions.js';
import type { GameplayConfig, TemplateApp } from './types.js';
import type { TemplateScene } from './template-scene.js';

export function buildGameplay(scene: TemplateScene, config: GameplayConfig, app: TemplateApp): void {
  const w = scene.width;
  const h = scene.height;

  // ── Game area (full screen container for game logic) ──
  const gameArea = new UINode({ id: 'game-area', width: w, height: h });
  scene.addChild(gameArea);
  config.setup(gameArea, app);

  // ── HUD (top area) ──
  if (config.hud) {
    const hudContainer = new UINode({
      id: 'hud',
      width: w,
      height: 44,
      layout: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    });
    hudContainer.x = 0;
    hudContainer.y = 48; // below safe area

    for (const [key, getter] of Object.entries(config.hud)) {
      const lbl = new Label({
        id: `hud-${key}`,
        text: String(getter()),
        fontSize: 16,
        fontWeight: 'bold',
        color: UIColors.text,
        align: 'center',
        width: 100,
        height: 30,
      });
      // Update HUD values on each frame
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
  let paused = false;
  let pauseModal: Modal | null = null;

  const pauseBtn = new IconButton({
    id: 'pause',
    icon: 'pause',
    size: 44,
  });
  pauseBtn.x = 16;
  pauseBtn.y = 44; // safe area
  pauseBtn.$on('tap', () => togglePause());
  scene.addChild(pauseBtn);

  function togglePause(): void {
    if (paused) return; // already showing modal
    paused = true;
    pauseModal = createPauseModal(scene, config, app, () => {
      paused = false;
      pauseModal = null;
    });
    scene.addChild(pauseModal);
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
}

function createPauseModal(
  scene: TemplateScene,
  config: GameplayConfig,
  app: TemplateApp,
  onClose: () => void,
): Modal {
  const modal = new Modal({
    title: '暂停',
    id: 'pause-modal',
    width: 280,
    height: 300,
    screenWidth: scene.width,
    screenHeight: scene.height,
  });

  const bw = 200;
  const bx = (280 - bw) / 2;
  let y = 0;

  // Resume
  const resumeBtn = new Button({
    id: 'resume',
    text: ACTION_DEFAULTS.resume.text,
    variant: 'primary',
    width: bw,
    height: 48,
  });
  resumeBtn.x = bx; resumeBtn.y = y;
  resumeBtn.$on('tap', () => {
    scene.removeChild(modal);
    onClose();
  });
  modal.content.addChild(resumeBtn);
  y += 60;

  // Restart
  const restartBtn = new Button({
    id: 'restart',
    text: ACTION_DEFAULTS.restart.text,
    variant: 'secondary',
    width: bw,
    height: 48,
  });
  restartBtn.x = bx; restartBtn.y = y;
  restartBtn.$on('tap', () => config.pause.restart());
  modal.content.addChild(restartBtn);
  y += 60;

  // Home
  const homeBtn = new Button({
    id: 'home',
    text: ACTION_DEFAULTS.home.text,
    variant: 'secondary',
    width: bw,
    height: 48,
  });
  homeBtn.x = bx; homeBtn.y = y;
  homeBtn.$on('tap', () => config.pause.home());
  modal.content.addChild(homeBtn);
  y += 60;

  // Settings (if provided in pause config)
  if (config.pause.settings) {
    const settingsBtn = new Button({
      id: 'pause-settings',
      text: ACTION_DEFAULTS.settings.text,
      variant: 'ghost',
      width: bw,
      height: 44,
    });
    settingsBtn.x = bx; settingsBtn.y = y;
    settingsBtn.$on('tap', () => {
      // Open settings panel on top of pause modal
      const existing = scene.findById('settings-modal');
      if (existing) { scene.removeChild(existing); return; }
      const panel = new SettingsPanel({
        toggles: config.pause.settings!.toggles,
        links: config.pause.settings!.links,
        version: config.pause.settings!.version,
      });
      panel.id = 'settings-modal';
      panel.$on('toggle', (id: string, val: boolean) => config.pause.settings!.onToggle(id, val));
      panel.$on('close', () => scene.removeChild(panel));
      scene.addChild(panel);
    });
    modal.content.addChild(settingsBtn);
    y += 52;
  }

  // Quit (optional)
  if (config.pause.quit) {
    const quitBtn = new Button({
      id: 'quit',
      text: ACTION_DEFAULTS.quit.text,
      variant: 'danger',
      width: bw,
      height: 44,
    });
    quitBtn.x = bx; quitBtn.y = y;
    quitBtn.$on('tap', () => config.pause.quit!());
    modal.content.addChild(quitBtn);
  }

  modal.fitContent();
  modal.open();
  modal.$on('close', () => {
    scene.removeChild(modal);
    onClose();
  });

  return modal;
}
