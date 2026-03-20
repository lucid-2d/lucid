/**
 * @lucid/engine — 游戏引擎层
 */

export { createApp, type App, type AppOptions, type ReplayStep } from './app.js';
export { SceneNode, SceneRouter } from './scene.js';
export { detectPlatform, type PlatformName, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
export { WebAdapter } from './platform/web.js';
