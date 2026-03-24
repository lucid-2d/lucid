/**
 * WeChat Mini Game entry point.
 *
 * Differences from Web entry (main.ts):
 * - WxAdapter instead of WebAdapter (auto-detected via platform: 'wx')
 * - assetRoot: 'img/' for relative paths (WX loads from package root)
 * - No document.getElementById — WX creates canvas automatically
 */
import { createApp } from '@lucid-2d/engine';
// import { MenuScene } from './scenes/menu.js';

const app = createApp({
  platform: 'wx',
  assetRoot: 'img/',   // WX assets are relative to package root
  debug: false,        // disable in production
  // fixedTimestep: 1/60,
});

// app.router.push(new MenuScene(app));
app.start();
