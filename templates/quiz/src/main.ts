/**
 * Quiz Game — entry point
 */
import { boot } from '@lucid-2d/engine';
import { createMenuScene } from './scenes/menu.js';

boot({
  debug: true,
  async onReady(app) {
    await app.router.push(createMenuScene(app));
  },
});
