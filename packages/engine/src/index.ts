/**
 * @lucid/engine — 游戏引擎层
 */

export { createApp, type App, type AppOptions, type ReplayStep } from './app.js';
export { SceneNode, SceneRouter, type TransitionType, type TransitionOptions } from './scene.js';
export { detectPlatform, type PlatformName, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
export { WebAdapter } from './platform/web.js';
export { WxAdapter } from './platform/wx.js';
export { TtAdapter } from './platform/tt.js';
export { loadImage } from './image-loader.js';
export { createTestApp, tap, touch, assertTree, generateTestCode, type TestApp, type TestAppOptions } from './test-utils.js';
export { AudioManager, createAudio, createMockAudio, type AudioManagerOptions, type AudioAdapter, type AudioHandle } from './audio.js';
export { Keyboard } from './keyboard.js';
export { AssetLoader, type AssetEntry } from './asset-loader.js';
