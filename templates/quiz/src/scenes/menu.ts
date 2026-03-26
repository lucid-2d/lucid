/**
 * Quiz Menu Scene — using createScene() template
 */
import type { App } from '@lucid-2d/engine';
import { createScene } from '@lucid-2d/game-ui';
import { UIColors } from '@lucid-2d/ui';
import { QuizScene } from './quiz.js';

export function createMenuScene(app: App) {
  return createScene(app, {
    template: 'menu',
    title: 'Quiz Game',
    subtitle: 'Test your knowledge',

    play: () => app.router.replace(new QuizScene(app)),

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
