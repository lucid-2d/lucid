/**
 * Game entry point — boot() auto-detects platform (Web / WeChat / Douyin)
 */
import { boot } from '@lucid-2d/engine';
import { createMenuScene } from './scenes/menu.js';

boot({
  debug: true,
  async onReady(app) {
    await app.router.push(createMenuScene(app));
  },
});
