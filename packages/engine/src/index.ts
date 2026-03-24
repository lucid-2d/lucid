/**
 * @lucid/engine — 游戏引擎层
 */

export { createApp, type App, type AppOptions, type ReplayStep } from './app.js';
export { SceneNode, SceneRouter, type TransitionType, type TransitionOptions, type SceneLogEntry, type ScenePreset } from './scene.js';
export { detectPlatform, type PlatformName, type PlatformAdapter, type ScreenInfo } from './platform/detect.js';
export { WebAdapter } from './platform/web.js';
export { WxAdapter } from './platform/wx.js';
export { TtAdapter } from './platform/tt.js';
export { loadImage } from './image-loader.js';
export { createOffscreenCanvas } from './canvas-utils.js';
// Test utilities moved to '@lucid-2d/engine/testing' to avoid bundling @napi-rs/canvas in production
export { AudioManager, createAudio, createMockAudio, type AudioManagerOptions, type AudioAdapter, type AudioHandle } from './audio.js';
export { Keyboard } from './keyboard.js';
export { AssetLoader, type AssetEntry } from './asset-loader.js';
export { batchSimulate, type SimulationConfig, type SimulationResult, type BatchResult } from './simulate.js';
export { DebugPanel, attachDebugPanel } from './debug-panel.js';
export { timeSlice, type TimeSliceOptions } from './time-slice.js';
