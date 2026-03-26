/**
 * WeChat Mini Game entry point.
 *
 * boot() auto-detects WX platform — no manual adapter setup needed.
 * assetRoot: 'img/' for relative paths (WX loads from package root).
 */
import { boot } from '@lucid-2d/engine';
// import { createMenuScene } from './scenes/menu.js';

boot({
  assetRoot: 'img/',   // WX assets are relative to package root
  debug: false,        // disable in production
  async onReady(app) {
    // await app.router.push(createMenuScene(app));
  },
});
