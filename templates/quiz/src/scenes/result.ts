/**
 * Quiz Result Scene — using createScene() template
 */
import type { App } from '@lucid-2d/engine';
import { createScene } from '@lucid-2d/game-ui';
import { UIColors } from '@lucid-2d/ui';
import { QuizScene } from './quiz.js';
import { createMenuScene } from './menu.js';

export function createResultScene(app: App, score: number, total: number) {
  return createScene(app, {
    template: 'result',
    title: 'Quiz Complete!',
    score,
    stats: [
      { icon: 'check', label: 'Questions', value: String(total) },
    ],

    restart: () => app.router.replace(new QuizScene(app)),
    home: () => app.router.replace(createMenuScene(app)),

    drawBackground: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, UIColors.bgTop);
      grad.addColorStop(1, UIColors.bgBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  });
}
