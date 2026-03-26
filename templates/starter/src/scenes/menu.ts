/**
 * Menu Scene — game entry screen using createScene() template
 */
import type { App } from '@lucid-2d/engine';
import { createScene } from '@lucid-2d/game-ui';
import { UIColors } from '@lucid-2d/ui';
import { GameScene } from './game.js';

export function createMenuScene(app: App) {
  return createScene(app, {
    template: 'menu',
    title: 'My Game',
    subtitle: 'A Lucid game',

    play: () => app.router.replace(new GameScene(app)),

    settings: {
      toggles: [
        { id: 'sound', label: 'Sound', value: true },
      ],
      onToggle: (id, value) => console.log(`[settings] ${id} = ${value}`),
    },

    privacy: {
      content: 'This game does not collect personal data.',
    },

    drawBackground: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, UIColors.bgTop);
      grad.addColorStop(1, UIColors.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  });
}
